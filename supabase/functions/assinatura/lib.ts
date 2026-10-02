// KORbuild Match — assinatura do plano pelo Mercado Pago (lógica testável).
//
// POST {acao: 'assinar'}  (usuário logado, empresa) → cria a assinatura no Mercado Pago e devolve o link do checkout.
// POST {acao: 'cancelar'} (usuário logado, empresa) → cancela a assinatura.
// POST .../webhook        (Mercado Pago)            → confere a assinatura do aviso e atualiza o plano da empresa.

export type Banco = {
  usuarioDoToken: (token: string) => Promise<{ id: string; email: string } | null>;
  empresaDoDono: (uid: string) => Promise<{ id: string; dono: string; nome: string } | null>;
  plano: () => Promise<{ preco: number | null; moeda: string } | null>;
  assinatura: (empresaId: string) => Promise<Record<string, unknown> | null>;
  salvarAssinatura: (empresaId: string, dados: Record<string, unknown>) => Promise<void>;
  avisar: (uid: string, titulo: string, texto: string) => Promise<void>;
};

export type Config = {
  banco: Banco;
  mpToken: string;
  mpApi: string;               // https://api.mercadopago.com
  mpWebhookSecret: string;     // "Assinatura secreta" das notificações do Mercado Pago
  site: string;                // https://korbuildmatch.com
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
        // Sem cobrança durante o período grátis: a primeira cobrança é no fim dele.
        const gratisAte = atual?.gratis_ate ? new Date(String(atual.gratis_ate)) : null;
        const inicio = gratisAte && gratisAte > new Date() ? gratisAte : new Date(Date.now() + 5 * 60000);
        const pre = await mp('POST', '/preapproval', {
          reason: 'KORbuild Match · plano Essencial',
          external_reference: empresa.id,
          payer_email: usuario.email,
          back_url: cfg.site.replace(/\/+$/, '') + '/app/plano.html?assinatura=retorno',
          status: 'pending',
          auto_recurring: { frequency: 1, frequency_type: 'months', transaction_amount: Number(plano.preco), currency_id: plano.moeda, start_date: inicio.toISOString() },
        });
        await cfg.banco.salvarAssinatura(empresa.id, { mp_preapproval_id: pre.id, mp_status: pre.status || 'pending' });
        return json({ url: pre.init_point });
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
