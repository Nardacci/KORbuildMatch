/*
 * KORbuild Match — teste das telas de contas (app/) contra um Supabase SIMULADO.
 * Não toca no projeto real. Precisa de Node + Playwright e do site servido localmente:
 *   python3 -m http.server 8765   (na raiz do repositório)
 *   node docs/tests/contas-supabase-simulado.js
 * As requisições para o endereço do projeto são respondidas aqui mesmo (Auth + REST + gatilho de cadastro).
 */
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const crypto = require('crypto');
const SB = 'https://gbdmtgephszxhaprpiss.supabase.co';
const B = 'http://localhost:8765/app/';
// ---------- Supabase simulado ----------
const db = { users: {}, perfis: {}, empresas: {}, profissionais: {}, contatos: {} };
const tokens = {}; const log = [];
function userJson(u) { return { id: u.id, aud: 'authenticated', role: 'authenticated', email: u.email, email_confirmed_at: u.confirmado ? new Date().toISOString() : null, user_metadata: u.meta, app_metadata: { provider: 'email' }, identities: [{}], created_at: u.criado }; }
function sessao(u) { const t = 'tok-' + crypto.randomUUID(); tokens[t] = u.id; return { access_token: t, token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'r-' + t, user: userJson(u) }; }
function erro(status, code, msg) { return { status, body: { code: status, error_code: code, msg } }; }
function porEmail(e) { return Object.values(db.users).find(u => u.email === e); }
function uidDe(h) { const a = (h['authorization'] || '').replace('Bearer ', ''); return tokens[a] || null; }
function auth(method, path, q, body, h) {
  log.push(method + ' ' + path);
  if (path === '/auth/v1/signup') {
    if (/@naoautorizado\.test$/.test(body.email)) return erro(400, 'email_address_not_authorized', 'Email address "' + body.email + '" cannot be used as it is not authorized');
    if (/@falhaenvio\.test$/.test(body.email)) return erro(500, 'unexpected_failure', 'Error sending confirmation email');
    if (porEmail(body.email)) { const u = porEmail(body.email); return { status: 200, body: Object.assign(userJson(u), { identities: [] }) }; }
    if (body.password.length < 8) return erro(422, 'weak_password', 'Password should be at least 8 characters');
    const u = { id: crypto.randomUUID(), email: body.email, senha: body.password, meta: body.data || {}, confirmado: false, criado: new Date().toISOString(), redirect: q.get('redirect_to') };
    db.users[u.id] = u;
    // gatilho criar_conta
    const m = u.meta; if (m.tipo === 'empresa' || m.tipo === 'profissional') {
      db.perfis[u.id] = { id: u.id, tipo: m.tipo, nome: m.nome };
      if (m.tipo === 'empresa') { const id = crypto.randomUUID(); db.empresas[id] = { id, dono: u.id, nome: m.nome, setor: null, pais: null, cidade: null, lat: null, porte: null, descricao: null, site: null }; }
      else db.profissionais[u.id] = { id: u.id, nome: m.nome, resumo: null, cidade: null, lat: null, disponibilidade: null, distancia_max_km: 25, modelos: ['presencial'], competencias: [], visivel: true, aceita_mudar: false, sobre: null };
      db.contatos[u.id] = { user_id: u.id, canal: 'whatsapp', telefone: null, email: u.email };
    }
    return { status: 200, body: userJson(u) };
  }
  if (path === '/auth/v1/token') {
    if (q.get('grant_type') === 'password') {
      const u = porEmail(body.email);
      if (!u || u.senha !== body.password) return erro(400, 'invalid_credentials', 'Invalid login credentials');
      if (!u.confirmado) return erro(400, 'email_not_confirmed', 'Email not confirmed');
      return { status: 200, body: sessao(u) };
    }
    const t = (body.refresh_token || '').replace('r-', ''); const u = db.users[tokens[t]];
    return u ? { status: 200, body: sessao(u) } : erro(400, 'refresh_token_not_found', 'Invalid Refresh Token');
  }
  if (path === '/auth/v1/resend' || path === '/auth/v1/recover') { db.ultimoRedirect = q.get('redirect_to') || (body && body.options && body.options.email_redirect_to); return { status: 200, body: {} }; }
  if (path === '/auth/v1/user') {
    const u = db.users[uidDe(h)]; if (!u) return erro(401, 'bad_jwt', 'invalid JWT');
    if (method === 'PUT') { if (body.password) u.senha = body.password; if (body.data) Object.assign(u.meta, body.data); }
    return { status: 200, body: userJson(u) };
  }
  if (path === '/auth/v1/logout') { delete tokens[(h['authorization'] || '').replace('Bearer ', '')]; return { status: 204, body: null }; }
  return erro(404, 'not_found', 'not found ' + path);
}
// RLS simplificado: cada um só lê/escreve o que é seu
function dono(tab, row, uid) { return tab === 'empresas' ? row.dono === uid : tab === 'contatos' ? row.user_id === uid : row.id === uid; }
function rest(method, path, q, body, h) {
  const tab = path.replace('/rest/v1/', ''); const uid = uidDe(h); log.push(method + ' ' + tab);
  if (!uid) return { status: 401, body: { message: 'JWT' } };
  if (!db[tab]) return (h['accept'] || '').includes('vnd.pgrst.object') ? { status: 406, body: { code: 'PGRST116', message: 'no rows' } } : { status: 200, body: [] };  // tabelas da etapa 3: vazias aqui
  const filtros = [...q.entries()].filter(([k]) => !['select', 'on_conflict', 'columns'].includes(k)).map(([k, v]) => [k, v.replace(/^eq\./, '')]);
  let rows = Object.values(db[tab]).filter(r => dono(tab, r, uid) && filtros.every(([k, v]) => String(r[k]) === v));
  if (method === 'PATCH') rows.forEach(r => Object.assign(r, body));
  if (method === 'POST') { const b = Array.isArray(body) ? body : [body]; b.forEach(x => { if (x.user_id !== uid) throw new Error('rls'); db[tab][x.user_id] = Object.assign(db[tab][x.user_id] || {}, x); }); rows = b; }
  const obj = (h['accept'] || '').includes('vnd.pgrst.object');
  if (obj) return rows.length ? { status: 200, body: rows[0] } : { status: 406, body: { code: 'PGRST116', message: 'no rows' } };
  if (method !== 'GET' && !(h['prefer'] || '').includes('return=representation')) return { status: method === 'POST' ? 201 : 204, body: null };
  return { status: 200, body: rows };
}
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'en-US' });
  const errs = []; let pass = 0, fail = 0;
  function L(ok, m) { if (process.env.DBG) console.log(ok ? 'ok ' : 'XX ', m); if (ok) pass++; else { fail++; console.log('FAIL', m); } }
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await ctx.route(SB + '/**', async route => {
    const req = route.request(); const u = new URL(req.url());
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    let body = null; try { body = req.postDataJSON(); } catch (e) {}
    const h = req.headers();
    const r = u.pathname.startsWith('/auth') ? auth(req.method(), u.pathname, u.searchParams, body, h) : rest(req.method(), u.pathname, u.searchParams, body, h);
    route.fulfill({ status: r.status, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'x-supabase-api-version': '2024-01-01' }, body: r.body == null ? '' : JSON.stringify(r.body) });
  });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errs.push(e.message));
  const t = s => pg.textContent(s).then(x => (x || '').replace(/\s+/g, ' ').trim()).catch(() => '');
  const hs = () => pg.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  const btnsOk = () => pg.$$eval('.btn', bs => bs.filter(b => b.offsetParent).every(b => b.getBoundingClientRect().height >= 40));

  // 1. Entrar
  await pg.goto(B + 'entrar.html'); await pg.waitForSelector('#entrar-form');
  L((await t('.hero h1')) === 'Entrar' && /Versão beta/.test(await t('.beta-banner')), 'entrar: tela');
  await pg.click('#entrar-btn');
  L(/Informe um e-mail/.test(await t('#ent-email-err')), 'entrar: valida e-mail');
  L(!(await hs()) && await btnsOk(), 'entrar: layout');
  L(/radial-gradient/.test(await pg.evaluate(() => getComputedStyle(document.querySelector('.app')).backgroundImage)), 'entrar: fundo escuro do modelo C');

  // 2. Cadastro profissional
  await pg.click('text=Criar conta grátis'); await pg.waitForSelector('#cad-form');
  await pg.click('#cad-btn');
  L(/Informe seu nome/.test(await t('#cad-nome-err')) && /cidade/.test(await t('#cad-cidade-err')) && /Termos/.test(await t('#cad-termos-err')), 'cadastro: validação');
  await pg.fill('#cad-nome', 'João Silva'); await pg.fill('#cad-email', 'Joao@Exemplo.com');
  L((await pg.inputValue('#cad-pais')) === 'US' && /Estados Unidos/.test(await t('#cad-pais option:checked')), 'cadastro: país sugerido pelo idioma do navegador (en-US)');
  L((await pg.$$eval('#cad-pais option', o => o.length)) > 200, 'cadastro: todos os países');
  await pg.fill('#cad-cidade', 'Laconia'); await pg.click('#cad-btn');
  L(/lista de sugestões/.test(await t('#cad-cidade-err')), 'cadastro: cidade digitada sem escolher na lista');
  await pg.fill('#cad-cidade', 'laco'); await pg.waitForSelector('#cad-cidade-lista [role=option]');
  L(/Laconia/.test(await t('#cad-cidade-lista')) && /New Hampshire/.test(await t('#cad-cidade-lista')), 'cadastro: busca acha Laconia, New Hampshire');
  await pg.click('#cad-cidade-lista [role=option]:has-text("Laconia")');
  L((await pg.inputValue('#cad-cidade')) === 'Laconia, NH', 'cadastro: cidade escolhida ' + await pg.inputValue('#cad-cidade'));
  await pg.selectOption('#cad-pais', 'BR');
  L((await pg.inputValue('#cad-cidade')) === '', 'cadastro: trocar o país limpa a cidade');
  await pg.fill('#cad-cidade', 'sao paulo'); await pg.waitForSelector('#cad-cidade-lista [role=option]');
  L((await t('#cad-cidade-lista [role=option]')).indexOf('São Paulo') === 0, 'cadastro: busca sem acento, maior cidade primeiro');
  await pg.press('#cad-cidade', 'ArrowDown'); await pg.press('#cad-cidade', 'Enter');
  L((await pg.inputValue('#cad-cidade')) === 'São Paulo, SP', 'cadastro: escolhe com o teclado');
  await pg.fill('#cad-cidade', 'xyzxyz'); await pg.waitForSelector('.combo-vazio');
  L(/Nenhuma cidade/.test(await t('.combo-vazio')), 'cadastro: aviso quando não acha');
  await pg.selectOption('#cad-pais', 'US');
  await pg.fill('#cad-cidade', 'Laconia, n'); await pg.waitForSelector('#cad-cidade-lista [role=option]');
  await pg.press('#cad-cidade', 'ArrowDown'); await pg.press('#cad-cidade', 'Enter');
  L((await pg.inputValue('#cad-cidade')) === 'Laconia, NH', 'cadastro: "cidade, estado" também acha');
  await pg.fill('#cad-titulo', 'Recepcionista');
  await pg.fill('#cad-senha', 'curta'); await pg.check('#cad-termos'); await pg.click('#cad-btn');
  L(/8 caracteres/.test(await t('#cad-senha-err')), 'cadastro: senha curta');
  await pg.fill('#cad-senha', 'senha-forte-1'); await pg.click('#cad-btn');
  await pg.waitForSelector('#email-titulo');
  const joao = porEmail('joao@exemplo.com');
  L(!!joao && joao.meta.tipo === 'profissional' && joao.meta.nome === 'João Silva' && joao.meta.pais === 'US' && joao.meta.resumo === 'Recepcionista' &&
    joao.meta.local.cidade === 'Laconia' && joao.meta.local.estado === 'NH' && joao.meta.local.lat === 43.528, 'cadastro: envia tipo, nome, país, cidade e resumo: ' + JSON.stringify(joao && joao.meta));
  L(joao && /\/app\/inicio\.html$/.test(joao.redirect), 'cadastro: link de confirmação volta para inicio.html: ' + (joao && joao.redirect));
  L(/joao@exemplo.com/.test(await t('#email-destino')) && /Reenviar em \d+ s/.test(await t('#email-reenviar')), 'cadastro: tela confirme seu e-mail');
  L(!!db.profissionais[joao.id] && db.perfis[joao.id].tipo === 'profissional', 'cadastro: gatilho criou o perfil');
  await pg.click('#email-corrigir');
  L((await pg.inputValue('#cad-email')) === 'Joao@Exemplo.com' && (await pg.inputValue('#cad-nome')) === 'João Silva' && (await pg.inputValue('#cad-cidade')) === 'Laconia, NH', 'cadastro: corrigir mantém os dados');
  // 3. Entrar antes de confirmar
  await pg.goto(B + 'entrar.html'); await pg.fill('#ent-email', 'joao@exemplo.com'); await pg.fill('#ent-senha', 'senha-forte-1'); await pg.click('#entrar-btn');
  await pg.waitForSelector('#reenviar');
  L(/Confirme seu e-mail/.test(await t('#form-status')), 'entrar: e-mail não confirmado');
  await pg.click('#reenviar'); await pg.waitForFunction(() => /novo link/.test(document.querySelector('#form-status').textContent));
  L(true, 'entrar: reenvia confirmação');
  // 4. Clicar no link do e-mail (sessão no endereço)
  joao.confirmado = true;
  const s1 = sessao(joao);
  await pg.goto(B + 'inicio.html#access_token=' + s1.access_token + '&refresh_token=' + s1.refresh_token + '&expires_in=3600&expires_at=' + s1.expires_at + '&token_type=bearer&type=signup');
  await pg.waitForSelector('#ola');
  L((await t('#ola')) === 'Olá, João!', 'início: saudação ' + await t('#ola'));
  L(!(await pg.evaluate(() => location.hash)), 'início: tokens saem do endereço');
  const pj = db.profissionais[joao.id];
  L(pj.cidade === 'Laconia' && pj.estado === 'NH' && pj.pais === 'US' && pj.lat === 43.528 && pj.resumo === 'Recepcionista', 'início: cadastro completa o perfil: ' + JSON.stringify(pj));
  L(joao.meta.completado === true, 'início: marca que já completou');
  L(/40%/.test(await t('#pct')), 'início: progresso 40% ' + await t('#pct'));
  L(!!(await pg.$('.hero-c')) && /Reputação em construção/.test(await t('.hero-c')) && /16 mi/.test(await t('.hero-c')), 'início: topo escuro do protótipo, distância em milhas nos EUA: ' + await t('.hero-stats'));
  L((await t('#nav [aria-current]')) === 'Início' && (await pg.$$('#nav a')).length === 5, 'início: navegação inferior');
  L((await pg.getAttribute('#nav [data-nav=mensagens]', 'href')) === 'mensagens.html' && (await pg.getAttribute('#nav [data-nav=buscar]', 'href')) === 'buscar.html', 'início: abas da navegação levam às telas reais');
  L(!(await hs()) && await btnsOk(), 'início: layout');
  await pg.screenshot({ path: require('os').tmpdir() + '/kor-inicio.png', fullPage: true });
  // 5. Perfil
  await pg.click('#editar-perfil'); await pg.waitForSelector('#perfil-form');
  L((await pg.inputValue('#p-resumo')) === 'Recepcionista' && (await pg.inputValue('#p-cidade')) === 'Laconia, NH' && (await pg.inputValue('#p-pais')) === 'US', 'perfil: carrega dados');
  L(/Até 16 mi \(25 km\)/.test(await t('#p-dist option:checked')), 'perfil: distância em milhas nos EUA: ' + await t('#p-dist option:checked'));
  L((await t('#nav [aria-current]')) === 'Perfil', 'perfil: aba Perfil ativa');
  await pg.click('#salvar');
  L(/disponibilidade/.test(await t('#p-disp-err')) && /competência/.test(await t('#p-comp-err')) && /celular/.test(await t('#p-tel-err')), 'perfil: validação');
  await pg.selectOption('#p-disp', 'Disponível imediatamente'); await pg.selectOption('#p-dist', '15');
  await pg.selectOption('#p-pais', 'BR'); await pg.click('#salvar');
  L(/Informe a cidade/.test(await t('#p-cidade-err')) && /Até 15 km$/.test(await t('#p-dist option:checked')), 'perfil: trocar o país pede a cidade de novo e volta para km');
  await pg.fill('#p-cidade', 'campinas'); await pg.waitForSelector('#p-cidade-lista [role=option]');
  await pg.press('#p-cidade', 'ArrowDown'); await pg.press('#p-cidade', 'Enter');
  await pg.check('input[name=p-modelos][value=remoto]');
  await pg.fill('#p-comp', 'Atendimento, Agenda, Pacote Office, Atendimento');
  await pg.fill('#p-tel', '+55 11 91234-5678');
  await pg.screenshot({ path: require('os').tmpdir() + '/kor-perfil.png', fullPage: true });
  await pg.click('#salvar'); await pg.waitForURL(/inicio\.html/);
  L(pj.cidade === 'Campinas' && pj.estado === 'SP' && pj.pais === 'BR' && pj.lat === -22.906, 'perfil: cidade nova salva: ' + [pj.cidade, pj.estado, pj.pais, pj.lat]);
  L(pj.disponibilidade === 'Disponível imediatamente' && pj.distancia_max_km === 15 && pj.modelos.join() === 'presencial,remoto' && pj.competencias.join() === 'Atendimento,Agenda,Pacote Office', 'perfil: salva no banco: ' + JSON.stringify(pj));
  L(db.contatos[joao.id].telefone === '+55 11 91234-5678' && db.contatos[joao.id].canal === 'whatsapp', 'perfil: salva contato');
  await pg.waitForSelector('#ola');
  L(!(await pg.$('#completar')) && !!(await pg.$('#sem-vagas')) && !!(await pg.$('.search-c')), 'início: perfil completo vira a página principal (busca e vagas)');
  L(/perfil está completo/.test(await t('.hero-c')) && /vagas perto de você/.test(await t('.hero-stats')), 'início: topo da página principal');
  L(/Campinas, SP/.test(await t('#sem-vagas')) && /Recepcionista/.test(await t('#editar-perfil')) && /3 competências/.test(await t('#editar-perfil')), 'início: vagas vazias com a cidade e resumo do perfil: ' + await t('#editar-perfil'));
  L((await pg.getAttribute('#busca', 'href')) === 'buscar.html', 'início: busca leva à tela de vagas');
  L(!(await hs()) && await btnsOk(), 'início completo: layout');
  // 6. Sair
  await pg.goto(B + 'perfil.html'); await pg.waitForSelector('#sair');
  await pg.click('#sair'); await pg.waitForURL(/entrar\.html\?saiu=1/);
  L(/Você saiu/.test(await t('#aviso')), 'sair: aviso');
  await pg.goto(B + 'perfil.html'); await pg.waitForURL(/entrar\.html\?volta=perfil\.html/);
  L(true, 'sem sessão: perfil manda para entrar');
  // 7. Entrar
  await pg.fill('#ent-email', 'joao@exemplo.com'); await pg.fill('#ent-senha', 'errada'); await pg.click('#entrar-btn');
  await pg.waitForFunction(() => /incorretos/.test(document.querySelector('#form-status').textContent));
  L(true, 'entrar: senha errada');
  await pg.fill('#ent-senha', 'senha-forte-1'); await pg.click('#entrar-btn');
  await pg.waitForURL(/app\/perfil\.html$/);
  L(true, 'entrar: volta para a página pedida');
  await pg.goto(B + 'entrar.html'); await pg.waitForURL(/inicio\.html/);
  L(true, 'entrar: com sessão vai direto ao início');
  await pg.goto(B + 'perfil.html'); await pg.waitForSelector('#sair'); await pg.click('#sair'); await pg.waitForURL(/saiu=1/);
  // 8. Recuperar senha
  await pg.click('text=Esqueci minha senha'); await pg.fill('#rec-email', 'joao@exemplo.com'); await pg.click('#rec-btn');
  await pg.waitForSelector('#rec-ok');
  L(/nova-senha\.html$/.test(db.ultimoRedirect || ''), 'recuperar: link aponta para nova-senha: ' + db.ultimoRedirect);
  const s2 = sessao(joao);
  await pg.goto(B + 'nova-senha.html#access_token=' + s2.access_token + '&refresh_token=' + s2.refresh_token + '&expires_in=3600&expires_at=' + s2.expires_at + '&token_type=bearer&type=recovery');
  await pg.waitForSelector('#ns-form');
  await pg.fill('#ns-senha', 'nova-senha-2'); await pg.fill('#ns-senha2', 'diferente'); await pg.click('#ns-btn');
  L(/não são iguais/.test(await t('#ns-senha2-err')), 'nova senha: confere repetição');
  await pg.fill('#ns-senha2', 'nova-senha-2'); await pg.click('#ns-btn');
  await pg.waitForURL(/entrar\.html\?senha=1/);
  L(joao.senha === 'nova-senha-2' && /Senha alterada/.test(await t('#aviso')), 'nova senha: salva e pede para entrar');
  await pg.goto(B + 'nova-senha.html#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired');
  await pg.waitForSelector('#ns-vencido');
  L(true, 'nova senha: link vencido');
  // 9. Cadastro empresa
  await pg.goto(B + 'cadastro.html?como=empresa'); await pg.waitForSelector('#cad-setor');
  await pg.fill('#cad-nome', 'Padaria Aurora'); await pg.fill('#cad-email', 'rh@aurora.com.br'); await pg.selectOption('#cad-pais', 'BR');
  await pg.fill('#cad-setor', 'Alimentação'); await pg.fill('#cad-senha', 'senha-forte-1'); await pg.check('#cad-termos'); await pg.click('#cad-btn');
  await pg.waitForSelector('#email-titulo');
  const emp = porEmail('rh@aurora.com.br'); emp.confirmado = true;
  await pg.goto(B + 'entrar.html'); await pg.fill('#ent-email', 'rh@aurora.com.br'); await pg.fill('#ent-senha', 'senha-forte-1'); await pg.click('#entrar-btn');
  await pg.waitForSelector('#ola');
  const e = Object.values(db.empresas)[0];
  L((await t('#ola')) === 'Olá, Padaria Aurora!' && /perfil da empresa/.test(await t('.hero-c')) && /grátis na 1ª vaga/.test(await t('.hero-stats')), 'empresa: início');
  L(e.setor === 'Alimentação' && e.pais === 'BR', 'empresa: setor e país do cadastro');
  L((await t('#nav [aria-current]')) === 'Início' && /Empresa/.test(await t('#nav')) && /Candidatos/.test(await t('#nav')), 'empresa: navegação da empresa');
  await pg.click('#editar-perfil'); await pg.waitForSelector('#p-porte');
  L((await pg.inputValue('#p-pais')) === 'BR' && (await t('.topbar-title')) === 'Minha empresa', 'empresa: perfil com o país do cadastro');
  await pg.selectOption('#p-porte', '10 a 49 pessoas');
  await pg.fill('#p-cidade', 'Campinas'); await pg.waitForSelector('#p-cidade-lista [role=option]');
  await pg.click('#p-cidade-lista [role=option] >> nth=0');
  await pg.fill('#p-descricao', 'Padaria de bairro com 3 lojas em Campinas, pães artesanais desde 1998.');
  await pg.check('input[name=p-canal][value=email]');
  await pg.click('#salvar'); await pg.waitForURL(/inicio\.html/); await pg.waitForSelector('#ola');
  L(e.cidade === 'Campinas' && e.estado === 'SP' && e.porte === '10 a 49 pessoas' && !!(await pg.$('#primeira-vaga')) && /Publicar uma vaga/.test(await t('#busca')), 'empresa: perfil completo vira a página principal ' + JSON.stringify(e));
  L(!Object.values(db.profissionais).some(p => p.nome === 'Hackeado'), 'rls simulado ok');
  // 10. Cadastro repetido
  await pg.goto(B + 'perfil.html'); await pg.waitForSelector('#sair'); await pg.click('#sair'); await pg.waitForURL(/saiu=1/);
  await pg.goto(B + 'cadastro.html'); await pg.fill('#cad-nome', 'Outro'); await pg.fill('#cad-email', 'joao@exemplo.com');
  await pg.fill('#cad-cidade', 'Boston'); await pg.waitForSelector('#cad-cidade-lista [role=option]'); await pg.press('#cad-cidade', 'ArrowDown'); await pg.press('#cad-cidade', 'Enter');
  await pg.fill('#cad-senha', 'qualquer-1'); await pg.check('#cad-termos'); await pg.click('#cad-btn');
  await pg.waitForSelector('#email-titulo');
  L(porEmail('joao@exemplo.com').meta.nome === 'João Silva', 'cadastro repetido: não revela nem sobrescreve a conta');
  // 11. Erros do envio de e-mail aparecem com explicação e código
  await pg.goto(B + 'cadastro.html?como=empresa'); await pg.waitForSelector('#cad-setor');
  await pg.fill('#cad-nome', 'Teste Erro'); await pg.fill('#cad-email', 'a@naoautorizado.test'); await pg.selectOption('#cad-pais', 'BR');
  await pg.fill('#cad-setor', 'Testes'); await pg.fill('#cad-senha', 'senha-forte-1'); await pg.check('#cad-termos'); await pg.click('#cad-btn');
  await pg.waitForFunction(() => /modo de teste/.test(document.querySelector('#form-status').textContent));
  L(/email_address_not_authorized/.test(await t('#form-status')), 'erro: e-mail não autorizado explicado, com código: ' + await t('#form-status'));
  await pg.fill('#cad-email', 'a@falhaenvio.test'); await pg.click('#cad-btn');
  await pg.waitForFunction(() => /enviar o e-mail de confirmação/.test(document.querySelector('#form-status').textContent));
  L(/Error sending confirmation email/.test(await t('#form-status')), 'erro: falha no envio do e-mail explicada');
  console.log('RESUMO:', pass, '/', pass + fail, 'passaram'); console.log('page errors:', errs);
  await b.close();
})().catch(e => { console.error('ERRO', e.message); process.exit(1); });
