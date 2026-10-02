/*
 * KORbuild Match — "Supabase local" mínimo para testar as telas do app/ de ponta a ponta.
 *
 *   • PostgreSQL 16 com o esquema real (supabase/migrations) e as regras de acesso (RLS) de verdade;
 *   • PostgREST 12 (o mesmo motor da API do Supabase) na frente do banco;
 *   • login simulado (/auth/v1): cria o usuário em auth.users (o gatilho de cadastro roda de verdade)
 *     e emite tokens JWT que o PostgREST aceita.
 *
 * Uso (ver docs/tests/vagas-supabase-local.js):
 *   const local = require('../../supabase/tests/local/servidor.js');
 *   await local.iniciar();              // recria o banco "korapi" e sobe o PostgREST
 *   await local.rotear(contextoPlaywright, 'https://<projeto>.supabase.co');
 *   ...
 *   await local.parar();
 *
 * Precisa: psql/PostgreSQL acessível (PGHOST, PGPORT), o binário do PostgREST (POSTGREST_BIN) e
 * `npm install` nesta pasta (pacote pg).
 */
const { execFileSync, spawn } = require('child_process');
const crypto = require('crypto');
const path = require('path');
const { Pool } = require('pg');

const RAIZ = path.resolve(__dirname, '..', '..', '..');
const PGHOST = process.env.PGHOST || '/tmp';
const PGPORT = process.env.PGPORT || '5433';
const BANCO = process.env.KOR_BANCO || 'korapi';
const PORTA_API = Number(process.env.KOR_PORTA_API || 3001);
const SEGREDO = 'segredo-local-de-teste-com-mais-de-32-caracteres';
const POSTGREST_BIN = process.env.POSTGREST_BIN || 'postgrest';

let pool = null, proc = null;
const usuarios = {};  // email -> { id, email, senha, meta, confirmado }

function psql(args) {
  return execFileSync('psql', ['-h', PGHOST, '-p', PGPORT, '-U', 'postgres', '-q', '-v', 'ON_ERROR_STOP=1'].concat(args),
    { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
}

function b64url(x) { return Buffer.from(typeof x === 'string' ? x : JSON.stringify(x)).toString('base64url'); }
function jwt(payload) {
  const corpo = b64url({ alg: 'HS256', typ: 'JWT' }) + '.' + b64url(payload);
  return corpo + '.' + crypto.createHmac('sha256', SEGREDO).update(corpo).digest('base64url');
}

function userJson(u) {
  return { id: u.id, aud: 'authenticated', role: 'authenticated', email: u.email,
    email_confirmed_at: u.confirmado ? new Date().toISOString() : null, user_metadata: u.meta,
    app_metadata: { provider: 'email' }, identities: [{}], created_at: u.criado };
}
function sessao(u) {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const access = jwt({ sub: u.id, role: 'authenticated', aud: 'authenticated', email: u.email, exp });
  u.refresh = 'r-' + crypto.randomUUID();
  return { access_token: access, token_type: 'bearer', expires_in: 3600, expires_at: exp, refresh_token: u.refresh, user: userJson(u) };
}
function erro(status, code, msg) { return { status, body: { code: status, error_code: code, msg } }; }
function uidDoToken(h) {
  const t = (h.authorization || '').replace(/^Bearer /, '');
  if (t.split('.').length !== 3) return null;
  try { return JSON.parse(Buffer.from(t.split('.')[1], 'base64url').toString()).sub; } catch (e) { return null; }
}

async function auth(method, rota, q, body, h) {
  if (rota === '/auth/v1/signup') {
    const existente = usuarios[body.email];
    if (existente) return { status: 200, body: Object.assign(userJson(existente), { identities: [] }) };
    if (!body.password || body.password.length < 8) return erro(422, 'weak_password', 'Password should be at least 8 characters');
    const u = { id: crypto.randomUUID(), email: body.email, senha: body.password, meta: body.data || {}, confirmado: false,
      criado: new Date().toISOString(), redirect: q.get('redirect_to') };
    await pool.query('insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)', [u.id, u.email, u.meta]);
    usuarios[u.email] = u;
    return { status: 200, body: userJson(u) };
  }
  if (rota === '/auth/v1/token') {
    if (q.get('grant_type') === 'password') {
      const u = usuarios[body.email];
      if (!u || u.senha !== body.password) return erro(400, 'invalid_credentials', 'Invalid login credentials');
      if (!u.confirmado) return erro(400, 'email_not_confirmed', 'Email not confirmed');
      return { status: 200, body: sessao(u) };
    }
    const u = Object.values(usuarios).find(x => x.refresh === body.refresh_token);
    return u ? { status: 200, body: sessao(u) } : erro(400, 'refresh_token_not_found', 'Invalid Refresh Token');
  }
  if (rota === '/auth/v1/resend' || rota === '/auth/v1/recover') return { status: 200, body: {} };
  if (rota === '/auth/v1/user') {
    const u = Object.values(usuarios).find(x => x.id === uidDoToken(h));
    if (!u) return erro(401, 'bad_jwt', 'invalid JWT');
    if (method === 'PUT') {
      if (body.password) u.senha = body.password;
      if (body.data) Object.assign(u.meta, body.data);
    }
    return { status: 200, body: userJson(u) };
  }
  if (rota === '/auth/v1/logout') return { status: 204, body: null };
  return erro(404, 'not_found', 'não simulado: ' + rota);
}

async function iniciar() {
  psql(['-c', 'drop database if exists ' + BANCO, '-c', 'create database ' + BANCO]);
  psql(['-d', BANCO, '-f', path.join(RAIZ, 'supabase/tests/supabase_local_stub.sql')]);
  require('fs').readdirSync(path.join(RAIZ, 'supabase/migrations')).sort().forEach(f => {
    psql(['-d', BANCO, '-f', path.join(RAIZ, 'supabase/migrations', f)]);
  });
  pool = new Pool({ host: PGHOST, port: Number(PGPORT), user: 'postgres', database: BANCO });
  proc = spawn(POSTGREST_BIN, [], {
    env: Object.assign({}, process.env, {
      PGRST_DB_URI: 'postgres://authenticator:authenticator@localhost:' + PGPORT + '/' + BANCO,
      PGRST_DB_SCHEMAS: 'public', PGRST_DB_ANON_ROLE: 'anon', PGRST_JWT_SECRET: SEGREDO,
      PGRST_SERVER_PORT: String(PORTA_API), PGRST_DB_CHANNEL_ENABLED: 'false', PGRST_LOG_LEVEL: 'error'
    }), stdio: ['ignore', 'ignore', 'ignore']
  });
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch('http://localhost:' + PORTA_API + '/'); if (r.ok) return; } catch (e) { /* subindo */ }
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error('PostgREST não subiu');
}

const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'access-control-expose-headers': '*' };
function ehJwt(h) { return (h.authorization || '').replace(/^Bearer /, '').split('.').length === 3; }

// Atende um pedido como a API do Supabase (/auth/v1, /rest/v1 e, se configurado, /functions/v1).
async function atender(method, url, h, corpo, opcoes) {
  const u = new URL(url);
  if (method === 'OPTIONS') return { status: 200, headers: CORS, body: '' };
  if (u.pathname.startsWith('/auth/v1')) {
    let body = null; try { body = corpo ? JSON.parse(corpo) : null; } catch (e) { /* sem corpo */ }
    const r = await auth(method, u.pathname, u.searchParams, body, h);
    return { status: r.status, headers: Object.assign({ 'content-type': 'application/json', 'x-supabase-api-version': '2024-01-01' }, CORS), body: r.body == null ? '' : JSON.stringify(r.body) };
  }
  if (u.pathname.startsWith('/rest/v1')) {
    const headers = {};
    ['accept', 'content-type', 'prefer', 'range', 'range-unit', 'accept-profile', 'content-profile'].forEach(k => { if (h[k]) headers[k] = h[k]; });
    if (ehJwt(h)) headers.authorization = h.authorization;  // a chave publicável não é JWT: vira "anon", como no Supabase
    const r = await fetch('http://localhost:' + PORTA_API + u.pathname.replace('/rest/v1', '') + u.search,
      { method, headers, body: ['GET', 'HEAD'].includes(method) ? undefined : corpo });
    const out = Object.assign({}, CORS);
    ['content-type', 'content-range', 'preference-applied'].forEach(k => { if (r.headers.get(k)) out[k] = r.headers.get(k); });
    return { status: r.status, headers: out, body: Buffer.from(await r.arrayBuffer()) };
  }
  if (u.pathname.startsWith('/functions/v1/') && opcoes && opcoes.funcoes) {
    const headers = {};
    ['authorization', 'content-type', 'x-signature', 'x-request-id', 'apikey'].forEach(k => { if (h[k]) headers[k] = h[k]; });
    const r = await fetch(opcoes.funcoes + u.pathname.replace('/functions/v1', '') + u.search,
      { method, headers, body: ['GET', 'HEAD'].includes(method) ? undefined : corpo });
    return { status: r.status, headers: Object.assign({ 'content-type': r.headers.get('content-type') || 'application/json' }, CORS), body: Buffer.from(await r.arrayBuffer()) };
  }
  return { status: 404, headers: CORS, body: 'não simulado' };
}

// opcoes.funcoes: endereço onde a Edge Function está rodando localmente (ex.: http://localhost:8000).
async function rotear(ctx, urlProjeto, opcoes) {
  await ctx.route(urlProjeto + '/**', async route => {
    const req = route.request();
    try {
      const r = await atender(req.method(), req.url(), req.headers(), req.postData(), opcoes);
      return route.fulfill(r);
    } catch (e) {
      console.error('[supabase local]', e);
      return route.fulfill({ status: 500, headers: CORS, body: JSON.stringify({ message: String(e) }) });
    }
  });
}

// A mesma API numa porta HTTP comum, para as Edge Functions (rodando no Deno) usarem o supabase-js.
let servidorHttp = null;
function abrirPorta(porta, opcoes) {
  return new Promise(resolve => {
    servidorHttp = require('http').createServer((req, res) => {
      let corpo = '';
      req.on('data', c => { corpo += c; });
      req.on('end', async () => {
        try {
          const r = await atender(req.method, 'http://localhost:' + porta + req.url, req.headers, corpo || undefined, opcoes);
          res.writeHead(r.status, r.headers); res.end(r.body);
        } catch (e) { res.writeHead(500); res.end(String(e)); }
      });
    }).listen(porta, resolve);
  });
}
function chaveServico() { return jwt({ role: 'service_role', iss: 'supabase-local', exp: Math.floor(Date.now() / 1000) + 3600 }); }
function tokenDe(email) { return sessao(usuarios[email]).access_token; }

// Ajudas para os testes.
function usuario(email) { return usuarios[email]; }
function confirmar(email) { usuarios[email].confirmado = true; }
function linkComSessao(email, tipo) {
  const s = sessao(usuarios[email]);
  return '#access_token=' + s.access_token + '&refresh_token=' + s.refresh_token + '&expires_in=3600&expires_at=' + s.expires_at + '&token_type=bearer&type=' + (tipo || 'signup');
}
async function sql(texto, params) { return (await pool.query(texto, params)).rows; }

async function parar() {
  if (servidorHttp) servidorHttp.close();
  if (proc) proc.kill();
  if (pool) await pool.end();
}

module.exports = { iniciar, rotear, parar, usuario, confirmar, linkComSessao, sql, abrirPorta, chaveServico, tokenDe };
