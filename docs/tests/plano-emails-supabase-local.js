/*
 * KORbuild Match — etapa 6, parte 2: assinatura (Mercado Pago) e e-mails de aviso, de ponta a ponta.
 * Roda as Edge Functions DE VERDADE (supabase/functions/<nome>/index.ts) no Deno, contra o "Supabase local"
 * (PostgreSQL com o esquema e o RLS reais + PostgREST + login simulado), com um Mercado Pago simulado
 * e um servidor de e-mail simulado. Não toca no projeto real, no Mercado Pago nem na Hostinger.
 *
 *   python3 -m http.server 8765                 (na raiz do repositório)
 *   (cd supabase/tests/local && npm install)
 *   POSTGREST_BIN=/caminho/postgrest DENO_BIN=/caminho/deno node docs/tests/plano-emails-supabase-local.js
 */
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const { spawn } = require('child_process');
const http = require('http');
const crypto = require('crypto');
const path = require('path');
const local = require('../../supabase/tests/local/servidor.js');
const { SMTPServer } = require('../../supabase/tests/local/node_modules/smtp-server');
const SB = 'https://gbdmtgephszxhaprpiss.supabase.co';
const B = 'http://localhost:8765/app/';
const RAIZ = path.resolve(__dirname, '..', '..');
const DENO = process.env.DENO_BIN || 'deno';
const PORTA_API = 3002, PORTA_MP = 3003, PORTA_SMTP = 2525, PORTA_FUNCAO = 8000;
const SEGREDO_MP = 's3gredo-webhook', SEGREDO_CRON = 'cron-local-123';

// ---------- Mercado Pago simulado ----------
const mp = { pedidos: [], status: 'pending', criado: null };
const servidorMp = http.createServer((req, res) => {
  let corpo = '';
  req.on('data', c => { corpo += c; });
  req.on('end', () => {
    const dados = corpo ? JSON.parse(corpo) : null;
    mp.pedidos.push({ metodo: req.method, url: req.url, auth: req.headers.authorization, corpo: dados });
    res.setHeader('content-type', 'application/json');
    if (req.method === 'POST' && req.url === '/preapproval') {
      mp.criado = dados; mp.status = 'pending';
      res.writeHead(201); return res.end(JSON.stringify({ id: 'pre_1', status: 'pending', init_point: 'http://localhost:8765/app/plano.html?assinatura=retorno' }));
    }
    if (req.url === '/preapproval/pre_1') {
      if (req.method === 'PUT') mp.status = dados.status;
      return res.end(JSON.stringify({ id: 'pre_1', status: mp.status, external_reference: mp.criado && mp.criado.external_reference,
        next_payment_date: mp.status === 'authorized' ? mp.criado.auto_recurring.start_date : null }));
    }
    res.writeHead(404); res.end('{}');
  });
});

// ---------- E-mail simulado ----------
const emails = [];
const smtp = new SMTPServer({ authOptional: true, disabledCommands: ['STARTTLS'], logger: false,
  onData(stream, sessao, cb) { let raw = ''; stream.on('data', c => { raw += c; }); stream.on('end', () => { emails.push({ para: sessao.envelope.rcptTo.map(r => r.address), raw }); cb(); }); } });

function funcao(nome, env) {
  const p = spawn(DENO, ['run', '-A', path.join(RAIZ, 'supabase/functions', nome, 'index.ts')], {
    env: Object.assign({}, process.env, { SUPABASE_URL: 'http://localhost:' + PORTA_API, SUPABASE_SERVICE_ROLE_KEY: local.chaveServico(), SITE_URL: 'http://localhost:8765' }, env),
    stdio: ['ignore', 'ignore', process.env.DBG ? 'inherit' : 'ignore']
  });
  return new Promise((resolve, reject) => {
    let n = 0;
    const t = setInterval(async () => {
      try { await fetch('http://localhost:' + PORTA_FUNCAO + '/'); clearInterval(t); resolve(p); }
      catch (e) { if (++n > 150) { clearInterval(t); reject(new Error('função ' + nome + ' não subiu')); } }
    }, 200);
  });
}
function parar(p) { return new Promise(r => { p.on('exit', r); p.kill(); }); }
function assinarWebhook(dataId, requestId) {
  const ts = String(Math.floor(Date.now() / 1000));
  const v1 = crypto.createHmac('sha256', SEGREDO_MP).update('id:' + dataId + ';request-id:' + requestId + ';ts:' + ts + ';').digest('hex');
  return 'ts=' + ts + ',v1=' + v1;
}

(async () => {
  await local.iniciar();
  await local.abrirPorta(PORTA_API);
  await new Promise(r => servidorMp.listen(PORTA_MP, r));
  await new Promise(r => smtp.listen(PORTA_SMTP, r));
  const b = await chromium.launch();
  const errs = []; let pass = 0, fail = 0;
  function L(ok, m) { if (process.env.DBG) console.log(ok ? 'ok ' : 'XX ', m); if (ok) pass++; else { fail++; console.log('FAIL', m); } }
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'pt-BR' });
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await local.rotear(ctx, SB, { funcoes: 'http://localhost:' + PORTA_FUNCAO });
  const pe = await ctx.newPage();
  pe.on('pageerror', e => errs.push(e.message));
  const te = s => pe.textContent(s).then(x => (x || '').replace(/\s+/g, ' ').trim()).catch(() => '');
  const sql = local.sql;

  // Empresa com uma vaga aberta (o período grátis começa)
  await pe.goto(B + 'cadastro.html?como=empresa'); await pe.waitForSelector('#cad-form');
  await pe.fill('#cad-nome', 'Padaria Aurora'); await pe.fill('#cad-email', 'rh@aurora.com.br'); await pe.selectOption('#cad-pais', 'BR');
  await pe.fill('#cad-setor', 'Alimentação'); await pe.fill('#cad-senha', 'senha-forte-1'); await pe.check('#cad-termos'); await pe.click('#cad-btn');
  await pe.waitForSelector('#email-titulo');
  local.confirmar('rh@aurora.com.br');
  await pe.goto(B + 'inicio.html' + local.linkComSessao('rh@aurora.com.br')); await pe.waitForSelector('#ola');
  const emp = (await sql('select * from empresas'))[0];
  await sql(`insert into vagas (empresa_id, titulo, tipo, status, modelo) values ($1, 'Suporte ao cliente', 'integral', 'aberta', 'remoto')`, [emp.id]);
  const gratisAte = (await sql('select gratis_ate from assinaturas'))[0].gratis_ate;

  let fn = await funcao('assinatura', { MP_API_URL: 'http://localhost:' + PORTA_MP, MP_ACCESS_TOKEN: 'TEST-TOKEN', MP_WEBHOOK_SECRET: SEGREDO_MP });

  // Sem preço definido
  await pe.goto(B + 'plano.html'); await pe.waitForSelector('#plano-acao');
  L(/Em definição/.test(await te('#plano-preco')) && await pe.isDisabled('#assinar'), 'plano: sem preço, assinar fica desligado');
  await sql("update planos set preco = 149.90 where id = 'essencial'");
  await pe.reload(); await pe.waitForSelector('#assinar:not([disabled])');
  L(/R\$ 149,90/.test(await te('#plano-preco')) && /primeira cobrança só acontece no fim do período grátis/.test(await te('#plano-acao')), 'plano: preço do banco e primeira cobrança no fim do grátis');

  // Assinar → Mercado Pago → volta
  await pe.click('#assinar'); await pe.waitForURL(/assinatura=retorno/); await pe.waitForSelector('#plano-situacao');
  L(/Recebemos o retorno do Mercado Pago/.test(await te('#content')), 'assinar: volta do checkout com aviso de confirmação');
  const pedido = mp.pedidos.find(p => p.metodo === 'POST');
  L(pedido && pedido.auth === 'Bearer TEST-TOKEN' && pedido.corpo.external_reference === emp.id && pedido.corpo.payer_email === 'rh@aurora.com.br' &&
    pedido.corpo.auto_recurring.transaction_amount === 149.9 && pedido.corpo.auto_recurring.currency_id === 'BRL' &&
    new Date(pedido.corpo.auto_recurring.start_date).getTime() === new Date(gratisAte).getTime(), 'assinar: pedido certo ao Mercado Pago (empresa, e-mail, R$ 149,90, início no fim do grátis)');
  let a = (await sql('select * from assinaturas'))[0];
  L(a.mp_preapproval_id === 'pre_1' && a.mp_status === 'pending' && a.status === 'gratis', 'assinar: assinatura pendente registrada');

  // Webhook do Mercado Pago
  let r = await fetch('http://localhost:' + PORTA_FUNCAO + '/assinatura/webhook', { method: 'POST', headers: { 'content-type': 'application/json', 'x-signature': 'ts=1,v1=errado', 'x-request-id': 'req-1' },
    body: JSON.stringify({ type: 'subscription_preapproval', data: { id: 'pre_1' } }) });
  L(r.status === 401, 'webhook: assinatura inválida é recusada');
  mp.status = 'authorized';
  r = await fetch('http://localhost:' + PORTA_FUNCAO + '/assinatura/webhook', { method: 'POST',
    headers: { 'content-type': 'application/json', 'x-signature': assinarWebhook('pre_1', 'req-2'), 'x-request-id': 'req-2' },
    body: JSON.stringify({ type: 'subscription_preapproval', data: { id: 'pre_1' } }) });
  L(r.status === 200, 'webhook: aviso válido aceito');
  a = (await sql('select * from assinaturas'))[0];
  L(a.status === 'ativa' && a.mp_status === 'authorized' && !!a.proximo_pagamento, 'webhook: plano ativo, com a próxima cobrança');
  L((await sql("select count(*)::int n from notificacoes where categoria = 'plano' and titulo = 'Plano Essencial ativo'"))[0].n === 1, 'webhook: empresa avisada do plano ativo');
  await pe.waitForSelector('#cancelar', { timeout: 12000 });
  L(/Assinatura confirmada/.test(await te('#content')) && /Plano Essencial ativo/.test(await te('#plano-situacao')) && /Próxima cobrança/.test(await te('#plano-acao')), 'plano: a tela confirma sozinha depois do retorno');

  // Profissional não assina
  r = await fetch('http://localhost:' + PORTA_FUNCAO + '/assinatura', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ acao: 'assinar' }) });
  L(r.status === 401, 'assinar: sem login é recusado');

  // Cancelar
  await pe.click('#cancelar'); await pe.click('#cancelar-sim'); await pe.waitForSelector('#assinar');
  a = (await sql('select * from assinaturas'))[0];
  L(a.status === 'gratis' && a.mp_status === 'cancelled' && mp.status === 'cancelled', 'cancelar: cancelada no Mercado Pago, volta ao período grátis que ainda resta');
  await parar(fn);

  // ---------- E-mails de aviso ----------
  fn = await funcao('enviar-avisos', { CRON_SECRET: SEGREDO_CRON, SMTP_HOST: 'localhost', SMTP_PORT: String(PORTA_SMTP), SMTP_USER: '', EMAIL_FROM: 'KORbuild Match <no-reply@getkolbuild.com>' });
  const ctx2 = await b.newContext(); await local.rotear(ctx2, SB);
  // Um profissional se candidata (aviso para a empresa); avisos ficam "antigos" o bastante para o e-mail
  const pp = await ctx2.newPage();
  await pp.goto(B + 'cadastro.html'); await pp.waitForSelector('#cad-form');
  await pp.fill('#cad-nome', 'João Silva'); await pp.fill('#cad-email', 'joao@exemplo.com'); await pp.selectOption('#cad-pais', 'BR');
  await pp.fill('#cad-cidade', 'Valinhos'); await pp.waitForSelector('#cad-cidade-lista [role=option]'); await pp.press('#cad-cidade', 'ArrowDown'); await pp.press('#cad-cidade', 'Enter');
  await pp.fill('#cad-senha', 'senha-forte-1'); await pp.check('#cad-termos'); await pp.click('#cad-btn'); await pp.waitForSelector('#email-titulo');
  const joao = local.usuario('joao@exemplo.com');
  const vaga = (await sql('select id from vagas'))[0];
  await sql("insert into candidaturas (vaga_id, profissional_id) values ($1, $2)", [vaga.id, joao.id]);
  await sql("update candidaturas set status = 'conversa'");
  await sql("update notificacoes set criado_em = now() - interval '10 minutes'");

  r = await fetch('http://localhost:' + PORTA_FUNCAO + '/enviar-avisos', { method: 'POST' });
  L(r.status === 401 && emails.length === 0, 'e-mails: sem o segredo do agendamento, nada é enviado');
  r = await fetch('http://localhost:' + PORTA_FUNCAO + '/enviar-avisos', { method: 'POST', headers: { 'x-cron-secret': SEGREDO_CRON } });
  const res = await r.json();
  L(r.status === 200 && res.enviados === 2 && res.falhas === 0, 'e-mails: um e-mail por pessoa (empresa e profissional): ' + JSON.stringify(res));
  const paraEmpresa = emails.find(e => e.para.includes('rh@aurora.com.br')), paraJoao = emails.find(e => e.para.includes('joao@exemplo.com'));
  const decod = s => s.replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/g, (m, h) => String.fromCharCode(parseInt(h, 16)));
  L(!!paraEmpresa && /no-reply@getkolbuild\.com/.test(paraEmpresa.raw) && /Voc=C3=AA tem 2 avisos|Você tem 2 avisos|=\?UTF-8\?/.test(paraEmpresa.raw) &&
    /http:\/\/localhost:8765\/app\/candidatos\.html\?vaga=/.test(decod(paraEmpresa.raw)), 'e-mails: empresa recebe os 2 avisos (plano e candidatura) com o link certo, pela Hostinger');
  L(!!paraJoao && /quer conversar/.test(decod(paraJoao.raw)), 'e-mails: profissional recebe o aviso de conversa');
  L((await sql('select count(*)::int n from notificacoes where email_em is null'))[0].n === 0, 'e-mails: avisos marcados como enviados');
  r = await fetch('http://localhost:' + PORTA_FUNCAO + '/enviar-avisos', { method: 'POST', headers: { 'x-cron-secret': SEGREDO_CRON } });
  L((await r.json()).enviados === 0 && emails.length === 2, 'e-mails: rodar de novo não repete');

  // Aviso já visto no app não vai por e-mail; preferência "Por e-mail" desligada também não
  await sql("insert into notificacao_prefs (user_id, categoria, push, email) values ($1, 'candidaturas', true, false)", [joao.id]);
  await sql("update candidaturas set status = 'nao'");
  await sql("update notificacoes set criado_em = now() - interval '10 minutes' where email_em is null");
  r = await fetch('http://localhost:' + PORTA_FUNCAO + '/enviar-avisos', { method: 'POST', headers: { 'x-cron-secret': SEGREDO_CRON } });
  L((await r.json()).enviados === 0 && emails.length === 2, 'e-mails: respeita "Por e-mail" desligado');
  await parar(fn);

  console.log('RESUMO:', pass, '/', pass + fail, 'passaram'); console.log('page errors:', errs);
  await b.close(); servidorMp.close(); smtp.close(); await local.parar();
})().catch(async e => { console.error('ERRO', e.message); try { await local.parar(); } catch (x) {} process.exit(1); });
