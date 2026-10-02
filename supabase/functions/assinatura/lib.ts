// KORbuild Match — assinatura do plano pelo Mercado Pago (lógica testável).
//
// POST {acao: 'assinar'}  (usuário logado, empresa) → cria a assinatura no Mercado Pago e devolve o link do checkout.
// POST {acao: 'cancelar'} (usuário logado, empresa) → cancela a assinatura.
// POST .../webhook        (Mercado Pago)            → confere a assinatura do aviso e atualiza o plano da empresa.
// POST .../cotacao        (pg_cron, x-cron-secret)  → guarda a cotação PTAX do dólar e atualiza o valor em reais
//                                                      das assinaturas com cobrança nos próximos dias.
//
// O preço do plano fica em dólar (tabela planos); o Mercado Pago cobra em reais, pela cotação do dia.

export type Banco = {
  usuarioDoToken: (token: string) => Promise<{ id: string; email: string } | null>;
  empresaDoDono: (uid: string) => Promise<{ id: string; dono: string; nome: string } | null>;
  plano: () => Promise<{ preco: number | null; moeda: string } | null>;
  cotacao: (par: string) => Promise<Cotacao | null>;            // a mais recente
  salvarCotacao: (par: string, c: Cotacao) => Promise<void>;
  paraReajustar: (ate: string) => Promise<Record<string, unknown>[]>;  // assinaturas autorizadas com cobrança até essa data
  assinatura: (empresaId: string) => Promise<Record<string, unknown> | null>;
  salvarAssinatura: (empresaId: string, dados: Record<string, unknown>) => Promise<void>;
  avisar: (uid: string, titulo: string, texto: string) => Promise<void>;
};

export type Cotacao = { taxa: number; data: string };

export type Config = {
  banco: Banco;
  mpToken: string;
  mpApi: string;               // https://api.mercadopago.com
  mpWebhookSecret: string;     // "Assinatura secreta" das notificações do Mercado Pago
  site: string;                // https://korbuildmatch.com
  cronSecret: string;          // mesmo CRON_SECRET do agendamento
  ptaxApi: string;             // https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata
  fetch?: typeof fetch;
};

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
  'access-control-allow-methods': 'POST, OPTIONS',
};
function json(corpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(corpo), { status, headers: { ...CORS, 'content-type': 'application/json' } });
}

// Situação local a partir do status do Mercado Pago. Sem assinatura ativa, volta ao grátis (se ainda houver
// período grátis) ou fica encerrada.
export function statusLocal(mpStatus: string, gratisAte: string | null, agora = new Date()): string | null {
  if (mpStatus === 'authorized') return 'ativa';
  if (mpStatus === 'cancelled' || mpStatus === 'paused') return gratisAte && new Date(gratisAte) > agora ? 'gratis' : 'encerrada';
  return null;  // pending: não muda
}

// Confere o cabeçalho x-signature do Mercado Pago: HMAC-SHA256 de "id:<data.id>;request-id:<x-request-id>;ts:<ts>;".
export async function assinaturaValida(segredo: string, xSignature: string | null, xRequestId: string | null, dataId: string): Promise<boolean> {
  if (!segredo) return true;  // sem segredo configurado, não confere (configure em produção)
  if (!xSignature) return false;
  const partes: Record<string, string> = {};
  xSignature.split(',').forEach((p) => { const [k, v] = p.split('=').map((x) => x.trim()); if (k && v) partes[k] = v; });
  if (!partes.ts || !partes.v1) return false;
  let manifesto = 'id:' + dataId.toLowerCase() + ';';
  if (xRequestId) manifesto += 'request-id:' + xRequestId + ';';
  manifesto += 'ts:' + partes.ts + ';';
  const chave = await crypto.subtle.importKey('raw', new TextEncoder().encode(segredo), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', chave, new TextEncoder().encode(manifesto)));
  const hex = Array.from(sig).map((b) => b.toString(16).padStart(2, '0')).join('');
  return hex === partes.v1;
}

// Preço do plano em reais. Em BRL, é o próprio preço; em outra moeda, precisa da cotação.
export function valorEmReais(preco: number, moeda: string, cotacao: Cotacao | null): number | null {
  if (moeda === 'BRL') return Math.round(preco * 100) / 100;
  if (!cotacao) return null;
  return Math.round(preco * cotacao.taxa * 100) / 100;
}

function mmddaaaa(d: Date): string {
  return String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0') + '-' + d.getUTCFullYear();
}

// Cotação de venda PTAX mais recente dos últimos 10 dias (cobre fim de semana, feriado e a manhã,
// antes de o Banco Central publicar a do dia). Só dólar (CotacaoDolarPeriodo).
export async function buscarPtax(api: string, f: typeof fetch, agora = new Date()): Promise<Cotacao> {
  const ini = new Date(agora.getTime() - 10 * 86400000);
  const url = api.replace(/\/+$/, '') + '/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)' +
    "?@dataInicial='" + mmddaaaa(ini) + "'&@dataFinalCotacao='" + mmddaaaa(agora) + "'&$format=json";
  const r = await f(url);
  if (!r.ok) throw new Error('Banco Central respondeu ' + r.status);
  const corpo = await r.json().catch(() => null) as { value?: { cotacaoVenda: number; dataHoraCotacao: string }[] } | null;
  const linhas = (corpo?.value ?? []).filter((x) => typeof x.cotacaoVenda === 'number' && x.cotacaoVenda > 0);
  if (!linhas.length) throw new Error('Banco Central sem cotação nos últimos 10 dias');
  const ult = linhas.reduce((a, b) => (a.dataHoraCotacao > b.dataHoraCotacao ? a : b));
  return { taxa: ult.cotacaoVenda, data: ult.dataHoraCotacao.slice(0, 10) };
}

export function criarHandler(cfg: Config): (req: Request) => Promise<Response> {
  const f = cfg.fetch ?? fetch;
  async function mp(metodo: string, caminho: string, corpo?: unknown) {
    const r = await f(cfg.mpApi.replace(/\/+$/, '') + caminho, {
      method: metodo,
      headers: { authorization: 'Bearer ' + cfg.mpToken, 'content-type': 'application/json' },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
    const dados = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error('Mercado Pago ' + r.status + ': ' + (dados.message || JSON.stringify(dados)));
    return dados;
  }

  const par = (moeda: string) => moeda + '/BRL';

  // Cotação guardada; se não houver uma recente (até 4 dias), busca no Banco Central e guarda.
  async function cotacaoAtual(moeda: string): Promise<Cotacao | null> {
    if (moeda === 'BRL') return null;
    const salva = await cfg.banco.cotacao(par(moeda));
    if (salva && Date.now() - new Date(salva.data + 'T00:00:00Z').getTime() <= 4 * 86400000) return salva;
    if (moeda !== 'USD') return salva;
    try {
      const nova = await buscarPtax(cfg.ptaxApi, f);
      await cfg.banco.salvarCotacao(par(moeda), nova);
      return nova;
    } catch (e) {
      console.error(e);
      return salva;  // melhor a última conhecida do que nenhuma
    }
  }

  // Agendamento diário: guarda a cotação e reajusta o valor em reais de quem é cobrado nos próximos 3 dias.
  async function rotinaCotacao(req: Request): Promise<Response> {
    if (!cfg.cronSecret || req.headers.get('x-cron-secret') !== cfg.cronSecret) return json({ erro: 'Não autorizado' }, 401);
    const plano = await cfg.banco.plano();
    const moeda = plano?.moeda || 'USD';
    let cotacao: Cotacao | null = null;
    if (moeda === 'USD') {
      cotacao = await buscarPtax(cfg.ptaxApi, f);
      await cfg.banco.salvarCotacao(par(moeda), cotacao);
    } else if (moeda !== 'BRL') {
      cotacao = await cfg.banco.cotacao(par(moeda));
    }
    const valor = plano && plano.preco ? valorEmReais(Number(plano.preco), moeda, cotacao) : null;
    let reajustadas = 0;
    const falhas: string[] = [];
    if (valor) {
      const ate = new Date(Date.now() + 3 * 86400000).toISOString();
      for (const a of await cfg.banco.paraReajustar(ate)) {
        if (Number(a.valor_cobrado) === valor) continue;
        try {
          await mp('PUT', '/preapproval/' + encodeURIComponent(String(a.mp_preapproval_id)), {
            auto_recurring: { transaction_amount: valor, currency_id: 'BRL' },
          });
          await cfg.banco.salvarAssinatura(String(a.empresa_id), { valor_cobrado: valor, cotacao_usada: cotacao?.taxa ?? null, cotacao_data: cotacao?.data ?? null });
          reajustadas++;
        } catch (e) {
          console.error(e);
          falhas.push(String(a.empresa_id));
        }
      }
    }
    return json({ ok: true, cotacao, valor, reajustadas, falhas });
  }

  async function webhook(req: Request, url: URL): Promise<Response> {
    let corpo: Record<string, any> = {};
    try { corpo = await req.json(); } catch (_) { /* aviso só pela URL */ }
    const tipo = corpo.type || corpo.topic || url.searchParams.get('type') || url.searchParams.get('topic') || '';
    const dataId = String((corpo.data && corpo.data.id) || url.searchParams.get('data.id') || url.searchParams.get('id') || '');
    if (!dataId) return json({ ok: true, ignorado: 'sem id' });
    if (!(await assinaturaValida(cfg.mpWebhookSecret, req.headers.get('x-signature'), req.headers.get('x-request-id'), dataId))) {
      return json({ erro: 'Assinatura do aviso inválida' }, 401);
    }
    if (!/preapproval/.test(tipo)) return json({ ok: true, ignorado: tipo });  // pagamentos de cada mês: nada a fazer aqui
    const pre = await mp('GET', '/preapproval/' + encodeURIComponent(dataId));
    const empresaId = pre.external_reference;
    if (!empresaId) return json({ ok: true, ignorado: 'sem empresa' });
    const atual = await cfg.banco.assinatura(empresaId);
    const novo = statusLocal(pre.status, (atual?.gratis_ate as string) ?? null);
    const dados: Record<string, unknown> = { mp_preapproval_id: pre.id, mp_status: pre.status, proximo_pagamento: pre.next_payment_date ?? null };
    if (novo) dados.status = novo;
    await cfg.banco.salvarAssinatura(empresaId, dados);
    if (novo === 'ativa' && atual?.status !== 'ativa' && atual?.dono) {
      await cfg.banco.avisar(String(atual.dono), 'Plano Essencial ativo', 'Assinatura confirmada pelo Mercado Pago. Obrigado!');
    }
    return json({ ok: true, status: novo ?? pre.status });
  }

  return async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
    const url = new URL(req.url);
    try {
      if (url.pathname.endsWith('/webhook')) return await webhook(req, url);
      if (url.pathname.endsWith('/cotacao')) return await rotinaCotacao(req);
      if (req.method !== 'POST') return json({ erro: 'Use POST' }, 405);

      const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
      const usuario = token ? await cfg.banco.usuarioDoToken(token) : null;
      if (!usuario) return json({ erro: 'Entre na sua conta para continuar.' }, 401);
      const empresa = await cfg.banco.empresaDoDono(usuario.id);
      if (!empresa) return json({ erro: 'Só contas de empresa têm plano.' }, 403);
      const corpo = await req.json().catch(() => ({}));
      const atual = await cfg.banco.assinatura(empresa.id);

      if (corpo.acao === 'assinar') {
        const plano = await cfg.banco.plano();
        if (!plano || !plano.preco) return json({ erro: 'O preço do plano ainda não foi definido.' }, 400);
        if (atual && atual.status === 'ativa' && atual.mp_status === 'authorized') return json({ erro: 'Sua assinatura já está ativa.' }, 400);
        const cotacao = await cotacaoAtual(plano.moeda);
        const valor = valorEmReais(Number(plano.preco), plano.moeda, cotacao);
        if (!valor) return json({ erro: 'A cotação do dólar está indisponível agora. Tente de novo em instantes.' }, 503);
        // Sem cobrança durante o período grátis: a primeira cobrança é no fim dele.
        const gratisAte = atual?.gratis_ate ? new Date(String(atual.gratis_ate)) : null;
        const inicio = gratisAte && gratisAte > new Date() ? gratisAte : new Date(Date.now() + 5 * 60000);
        const pre = await mp('POST', '/preapproval', {
          reason: 'KORbuild Match · plano Essencial',
          external_reference: empresa.id,
          payer_email: usuario.email,
          back_url: cfg.site.replace(/\/+$/, '') + '/app/plano.html?assinatura=retorno',
          status: 'pending',
          auto_recurring: { frequency: 1, frequency_type: 'months', transaction_amount: valor, currency_id: 'BRL', start_date: inicio.toISOString() },
        });
        await cfg.banco.salvarAssinatura(empresa.id, {
          mp_preapproval_id: pre.id, mp_status: pre.status || 'pending',
          valor_cobrado: valor, cotacao_usada: cotacao?.taxa ?? null, cotacao_data: cotacao?.data ?? null,
        });
        return json({ url: pre.init_point, valor, moeda: 'BRL', cotacao });
      }

      if (corpo.acao === 'cancelar') {
        if (!atual || !atual.mp_preapproval_id) return json({ erro: 'Não há assinatura para cancelar.' }, 400);
        const pre = await mp('PUT', '/preapproval/' + encodeURIComponent(String(atual.mp_preapproval_id)), { status: 'cancelled' });
        const novo = statusLocal('cancelled', (atual.gratis_ate as string) ?? null);
        await cfg.banco.salvarAssinatura(empresa.id, { mp_status: pre.status || 'cancelled', status: novo, proximo_pagamento: null });
        return json({ ok: true, status: novo });
      }

      return json({ erro: 'Ação desconhecida.' }, 400);
    } catch (e) {
      console.error(e);
      return json({ erro: 'Não foi possível falar com o Mercado Pago agora. Tente de novo em instantes.', detalhe: e instanceof Error ? e.message : String(e) }, 502);
    }
  };
}
