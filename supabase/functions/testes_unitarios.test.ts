// Testes das Edge Functions (sem rede): deno test supabase/functions/testes_unitarios.test.ts
import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@1';
import { montarEmail, processar, criarHandler as handlerAvisos } from './enviar-avisos/lib.ts';
import { assinaturaValida, statusLocal, criarHandler as handlerAssinatura } from './assinatura/lib.ts';

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
    mpToken: 'TOKEN', mpApi: 'https://mp.test', mpWebhookSecret: '', site: 'https://korbuildmatch.com',
    fetch: (async (url: string, init: RequestInit) => {
      chamadas.push({ metodo: String(init.method), url, corpo: init.body ? JSON.parse(String(init.body)) : null });
      return new Response(JSON.stringify({ id: 'pre_1', status: 'pending', init_point: 'https://mp.test/checkout/pre_1' }), { status: 201 });
    }) as typeof fetch,
    banco: {
      usuarioDoToken: async (t) => (t === 'tok-empresa' ? { id: 'u-emp', email: 'rh@aurora.com.br' } : t === 'tok-prof' ? { id: 'u-prof', email: 'j@x.com' } : null),
      empresaDoDono: async (uid) => (uid === 'u-emp' ? { id: 'emp-1', dono: 'u-emp', nome: 'Padaria Aurora' } : null),
      plano: async () => ({ preco, moeda: 'BRL' }),
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
  assertEquals(salvo[0], { mp_preapproval_id: 'pre_1', mp_status: 'pending' });
});
