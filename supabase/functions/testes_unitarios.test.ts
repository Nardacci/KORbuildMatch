// Testes das Edge Functions (sem rede): deno test supabase/functions/testes_unitarios.test.ts
import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@1';
import { montarEmail, processar, criarHandler as handlerAvisos } from './enviar-avisos/lib.ts';
import { assinaturaValida, buscarPtax, statusLocal, valorEmReais, criarHandler as handlerAssinatura } from './assinatura/lib.ts';

const pendente = {
  user_id: 'u1', email: 'joao@exemplo.com', nome: 'João Silva',
  avisos: [
    { id: 1, categoria: 'mensagens', titulo: 'Nova mensagem de Padaria <Aurora>', texto: 'Pode começar segunda?', link: 'conversa.html?id=abc' },
    { id: 2, categoria: 'candidaturas', titulo: 'Padaria Aurora quer conversar com você', texto: null, link: 'candidaturas.html' },
  ],
};

Deno.test('e-mail: assunto, saudação, links absolutos e texto escapado', () => {
  const e = montarEmail(pendente, 'https://korbuildmatch.com/');
  assertEquals(e.to, 'joao@exemplo.com');
  assertEquals(e.subject, 'Você tem 2 avisos no KORbuild Match');
  assertStringIncludes(e.html, 'Olá, João!');
  assertStringIncludes(e.html, 'https://korbuildmatch.com/app/conversa.html?id=abc');
  assertStringIncludes(e.html, 'Padaria &lt;Aurora&gt;');
  assert(!e.html.includes('<Aurora>'));
  assertStringIncludes(e.text, '• Padaria Aurora quer conversar com você');
  assertStringIncludes(e.html, 'notificacoes.html#prefs');
});

Deno.test('e-mail: um aviso só usa o título no assunto e o botão leva direto ao assunto', () => {
  const e = montarEmail({ ...pendente, avisos: [pendente.avisos[0]] }, 'https://korbuildmatch.com');
  assertEquals(e.subject, 'Nova mensagem de Padaria <Aurora> · KORbuild Match');
  assertStringIncludes(e.html, 'Abrir no KORbuild Match');
});

Deno.test('envio: marca só quem recebeu; falha de um não para os outros', async () => {
  const marcados: number[][] = [];
  const r = await processar({
    cronSecret: 'x', site: 'https://k.com',
    listar: async () => [pendente, { ...pendente, user_id: 'u2', email: 'falha@x.com', avisos: [{ id: 9, categoria: 'mensagens', titulo: 'T', texto: null, link: null }] }],
    enviar: async (e) => { if (e.to === 'falha@x.com') throw new Error('SMTP recusou'); },
    marcar: async (ids) => { marcados.push(ids); },
  });
  assertEquals(r, { pessoas: 2, enviados: 1, falhas: 1 });
  assertEquals(marcados, [[1, 2]]);
});

Deno.test('envio: sem o segredo do agendamento, recusa', async () => {
  const h = handlerAvisos({ cronSecret: 'segredo', site: '', listar: async () => [], enviar: async () => {}, marcar: async () => {} });
  assertEquals((await h(new Request('http://x/enviar-avisos', { method: 'POST' }))).status, 401);
  assertEquals((await h(new Request('http://x/enviar-avisos', { method: 'POST', headers: { 'x-cron-secret': 'errado' } }))).status, 401);
  assertEquals((await h(new Request('http://x/enviar-avisos', { method: 'POST', headers: { 'x-cron-secret': 'segredo' } }))).status, 200);
});

async function assinar(segredo: string, manifesto: string) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(segredo), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(manifesto)))).map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.test('webhook: confere a assinatura do Mercado Pago', async () => {
  const v1 = await assinar('s3gredo', 'id:pre_123;request-id:req-1;ts:1700000000;');
  assert(await assinaturaValida('s3gredo', 'ts=1700000000,v1=' + v1, 'req-1', 'pre_123'));
  assert(!(await assinaturaValida('s3gredo', 'ts=1700000000,v1=' + v1, 'req-2', 'pre_123')));
  assert(!(await assinaturaValida('s3gredo', null, 'req-1', 'pre_123')));
});

Deno.test('status: autorizada ativa; cancelada volta ao grátis ou encerra', () => {
  const futuro = new Date(Date.now() + 86400000).toISOString(), passado = new Date(Date.now() - 86400000).toISOString();
  assertEquals(statusLocal('authorized', passado), 'ativa');
  assertEquals(statusLocal('cancelled', futuro), 'gratis');
  assertEquals(statusLocal('cancelled', passado), 'encerrada');
  assertEquals(statusLocal('pending', futuro), null);
});

Deno.test('assinar: exige login de empresa e preço definido; cobra só depois do grátis', async () => {
  const chamadas: { metodo: string; url: string; corpo: any }[] = [];
  const salvo: Record<string, unknown>[] = [];
  let preco: number | null = null;
  const gratisAte = new Date(Date.now() + 10 * 86400000).toISOString();
  const h = handlerAssinatura({
    mpToken: 'TOKEN', mpApi: 'https://mp.test', mpWebhookSecret: '', site: 'https://korbuildmatch.com', cronSecret: '', ptaxApi: 'https://bcb.test',
    fetch: (async (url: string, init: RequestInit) => {
      chamadas.push({ metodo: String(init.method), url, corpo: init.body ? JSON.parse(String(init.body)) : null });
      return new Response(JSON.stringify({ id: 'pre_1', status: 'pending', init_point: 'https://mp.test/checkout/pre_1' }), { status: 201 });
    }) as typeof fetch,
    banco: {
      usuarioDoToken: async (t) => (t === 'tok-empresa' ? { id: 'u-emp', email: 'rh@aurora.com.br' } : t === 'tok-prof' ? { id: 'u-prof', email: 'j@x.com' } : null),
      empresaDoDono: async (uid) => (uid === 'u-emp' ? { id: 'emp-1', dono: 'u-emp', nome: 'Padaria Aurora' } : null),
      plano: async () => ({ preco, moeda: 'BRL' }),
      cotacao: async () => null, salvarCotacao: async () => {}, paraReajustar: async () => [],
      assinatura: async () => ({ status: 'gratis', gratis_ate: gratisAte }),
      salvarAssinatura: async (_id, d) => { salvo.push(d); },
      avisar: async () => {},
    },
  });
  const pedir = (tok: string | null, acao = 'assinar') => h(new Request('http://x/assinatura', {
    method: 'POST', headers: { 'content-type': 'application/json', ...(tok ? { authorization: 'Bearer ' + tok } : {}) }, body: JSON.stringify({ acao }) }));
  assertEquals((await pedir(null)).status, 401);
  assertEquals((await pedir('tok-prof')).status, 403);
  const semPreco = await pedir('tok-empresa');
  assertEquals(semPreco.status, 400);
  assertStringIncludes((await semPreco.json()).erro, 'preço');
  preco = 149.9;
  const ok = await pedir('tok-empresa');
  assertEquals(ok.status, 200);
  assertEquals((await ok.json()).url, 'https://mp.test/checkout/pre_1');
  const c = chamadas[0];
  assertEquals([c.metodo, c.url], ['POST', 'https://mp.test/preapproval']);
  assertEquals(c.corpo.external_reference, 'emp-1');
  assertEquals(c.corpo.auto_recurring.transaction_amount, 149.9);
  assertEquals(c.corpo.auto_recurring.currency_id, 'BRL');
  assertEquals(c.corpo.auto_recurring.start_date, gratisAte);
  assertEquals(c.corpo.back_url, 'https://korbuildmatch.com/app/plano.html?assinatura=retorno');
  assertEquals(salvo[0], { mp_preapproval_id: 'pre_1', mp_status: 'pending', valor_cobrado: 149.9, cotacao_usada: null, cotacao_data: null });
});

const PTAX = { value: [
  { cotacaoCompra: 5.40, cotacaoVenda: 5.4012, dataHoraCotacao: '2026-09-30 13:05:11.1' },
  { cotacaoCompra: 5.46, cotacaoVenda: 5.4721, dataHoraCotacao: '2026-10-01 13:04:02.5' },
  { cotacaoCompra: 5.42, cotacaoVenda: 5.4300, dataHoraCotacao: '2026-09-29 13:06:40.0' },
] };

Deno.test('cotação: pega a venda PTAX mais recente do período e converte com centavos', async () => {
  let pedida = '';
  const c = await buscarPtax('https://bcb.test/', (async (u: string) => { pedida = u; return new Response(JSON.stringify(PTAX)); }) as typeof fetch, new Date('2026-10-02T12:00:00Z'));
  assertEquals(c, { taxa: 5.4721, data: '2026-10-01' });
  assertStringIncludes(pedida, "https://bcb.test/CotacaoDolarPeriodo(");
  assertStringIncludes(pedida, "@dataInicial='09-22-2026'&@dataFinalCotacao='10-02-2026'");
  assertEquals(valorEmReais(79, 'USD', c), 432.3);
  assertEquals(valorEmReais(79, 'USD', null), null);
  assertEquals(valorEmReais(149.9, 'BRL', null), 149.9);
});

function cenarioDolar(cotacaoSalva: { taxa: number; data: string } | null, assinaturas: Record<string, unknown>[] = []) {
  const chamadas: { metodo: string; url: string; corpo: any }[] = [];
  const salvo: { id: string; d: Record<string, unknown> }[] = [];
  const cotacoes: { taxa: number; data: string }[] = [];
  const h = handlerAssinatura({
    mpToken: 'TOKEN', mpApi: 'https://mp.test', mpWebhookSecret: '', site: 'https://korbuildmatch.com', cronSecret: 'cron', ptaxApi: 'https://bcb.test',
    fetch: (async (url: string, init?: RequestInit) => {
      if (url.startsWith('https://bcb.test')) return new Response(JSON.stringify(PTAX));
      chamadas.push({ metodo: String(init?.method), url, corpo: init?.body ? JSON.parse(String(init.body)) : null });
      return new Response(JSON.stringify({ id: 'pre_1', status: 'pending', init_point: 'https://mp.test/checkout/pre_1' }), { status: 201 });
    }) as typeof fetch,
    banco: {
      usuarioDoToken: async () => ({ id: 'u-emp', email: 'rh@aurora.com.br' }),
      empresaDoDono: async () => ({ id: 'emp-1', dono: 'u-emp', nome: 'Padaria Aurora' }),
      plano: async () => ({ preco: 79, moeda: 'USD' }),
      cotacao: async () => cotacaoSalva,
      salvarCotacao: async (_p, c) => { cotacoes.push(c); },
      paraReajustar: async () => assinaturas,
      assinatura: async () => ({ status: 'encerrada', gratis_ate: null }),
      salvarAssinatura: async (id, d) => { salvo.push({ id, d }); },
      avisar: async () => {},
    },
  });
  return { h, chamadas, salvo, cotacoes };
}

Deno.test('assinar em dólar: busca a cotação do dia e cobra em reais', async () => {
  const { h, chamadas, salvo, cotacoes } = cenarioDolar(null);
  const r = await h(new Request('http://x/assinatura', { method: 'POST', headers: { authorization: 'Bearer t' }, body: JSON.stringify({ acao: 'assinar' }) }));
  assertEquals(r.status, 200);
  assertEquals(cotacoes, [{ taxa: 5.4721, data: '2026-10-01' }]);
  assertEquals(chamadas[0].corpo.auto_recurring.transaction_amount, 432.3);
  assertEquals(chamadas[0].corpo.auto_recurring.currency_id, 'BRL');
  assertEquals(salvo[0].d.valor_cobrado, 432.3);
  assertEquals(salvo[0].d.cotacao_usada, 5.4721);
});

Deno.test('assinar em dólar: com cotação recente guardada, não chama o Banco Central', async () => {
  const hoje = new Date().toISOString().slice(0, 10);
  const { h, chamadas, cotacoes } = cenarioDolar({ taxa: 5, data: hoje });
  await h(new Request('http://x/assinatura', { method: 'POST', headers: { authorization: 'Bearer t' }, body: JSON.stringify({ acao: 'assinar' }) }));
  assertEquals(cotacoes.length, 0);
  assertEquals(chamadas[0].corpo.auto_recurring.transaction_amount, 395);
});

Deno.test('rotina da cotação: exige o segredo, guarda a cotação e reajusta só quem mudou', async () => {
  const { h, chamadas, salvo, cotacoes } = cenarioDolar(null, [
    { empresa_id: 'emp-1', mp_preapproval_id: 'pre_A', valor_cobrado: 420 },
    { empresa_id: 'emp-2', mp_preapproval_id: 'pre_B', valor_cobrado: 432.3 },
  ]);
  assertEquals((await h(new Request('http://x/assinatura/cotacao', { method: 'POST' }))).status, 401);
  const r = await h(new Request('http://x/assinatura/cotacao', { method: 'POST', headers: { 'x-cron-secret': 'cron' } }));
  const j = await r.json();
  assertEquals([r.status, j.valor, j.reajustadas], [200, 432.3, 1]);
  assertEquals(cotacoes.length, 1);
  assertEquals(chamadas.map((c) => [c.metodo, c.url]), [['PUT', 'https://mp.test/preapproval/pre_A']]);
  assertEquals(chamadas[0].corpo, { auto_recurring: { transaction_amount: 432.3, currency_id: 'BRL' } });
  assertEquals(salvo, [{ id: 'emp-1', d: { valor_cobrado: 432.3, cotacao_usada: 5.4721, cotacao_data: '2026-10-01' } }]);
});
