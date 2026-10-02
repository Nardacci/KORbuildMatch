/*
 * KORbuild Match — etapa 6 (avisos e plano) de ponta a ponta, contra o "Supabase local"
 * (PostgreSQL com o esquema e o RLS reais + PostgREST + login simulado). Não toca no projeto real.
 *
 *   python3 -m http.server 8765                 (na raiz do repositório)
 *   (cd supabase/tests/local && npm install)
 *   POSTGREST_BIN=/caminho/postgrest node docs/tests/avisos-supabase-local.js
 */
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const local = require('../../supabase/tests/local/servidor.js');
const SB = 'https://gbdmtgephszxhaprpiss.supabase.co';
const B = 'http://localhost:8765/app/';

(async () => {
  await local.iniciar();
  const b = await chromium.launch();
  const errs = []; let pass = 0, fail = 0;
  function L(ok, m) { if (process.env.DBG) console.log(ok ? 'ok ' : 'XX ', m); if (ok) pass++; else { fail++; console.log('FAIL', m); } }
  async function novoContexto() {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'pt-BR' });
    await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    await local.rotear(ctx, SB);
    const pg = await ctx.newPage();
    pg.on('pageerror', e => errs.push(e.message));
    return pg;
  }
  const T = pg => s => pg.textContent(s).then(x => (x || '').replace(/\s+/g, ' ').trim()).catch(() => '');
  const hs = pg => pg.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  const btnsOk = pg => pg.$$eval('.btn', bs => bs.filter(b => b.offsetParent).every(b => b.getBoundingClientRect().height >= 40));
  async function cadastrar(pg, o) {
    await pg.goto(B + 'cadastro.html' + (o.empresa ? '?como=empresa' : '')); await pg.waitForSelector('#cad-form');
    await pg.fill('#cad-nome', o.nome); await pg.fill('#cad-email', o.email); await pg.selectOption('#cad-pais', 'BR');
    if (o.empresa) await pg.fill('#cad-setor', 'Alimentação');
    else { await pg.fill('#cad-cidade', 'Valinhos'); await pg.waitForSelector('#cad-cidade-lista [role=option]'); await pg.press('#cad-cidade', 'ArrowDown'); await pg.press('#cad-cidade', 'Enter'); await pg.fill('#cad-titulo', 'Atendente'); }
    await pg.fill('#cad-senha', 'senha-forte-1'); await pg.check('#cad-termos'); await pg.click('#cad-btn');
    await pg.waitForSelector('#email-titulo');
    local.confirmar(o.email);
    await pg.goto(B + 'inicio.html' + local.linkComSessao(o.email)); await pg.waitForSelector('#ola');
  }
  const sql = local.sql;
  const sinoN = async pg => { await pg.waitForSelector('#sino'); return (await pg.$('#sino .bell-count')) ? Number(await pg.textContent('#sino .bell-count')) : 0; };

  const pe = await novoContexto(), te = T(pe);
  const pp = await novoContexto(), tp = T(pp);
  await cadastrar(pe, { empresa: true, nome: 'Padaria Aurora', email: 'rh@aurora.com.br' });
  await cadastrar(pp, { nome: 'João Silva', email: 'joao@exemplo.com' });
  const emp = (await sql('select * from empresas'))[0];
  const joao = local.usuario('joao@exemplo.com');
  await sql("update empresas set cidade = 'Campinas', estado = 'SP', pais = 'BR', lat = -22.906, lng = -47.061, porte = '10 a 49 pessoas', descricao = 'Padaria de bairro com 3 lojas em Campinas, desde 1998.'");
  await sql("update profissionais set disponibilidade = 'Disponível imediatamente', competencias = '{Atendimento,Caixa,Vendas}'");
  await sql("update contatos set canal = 'email'");

  // Plano antes da primeira vaga
  await pe.goto(B + 'plano.html'); await pe.waitForSelector('#plano-situacao');
  L(/3 meses grátis/.test(await te('#plano-situacao')) && /primeira vaga/.test(await te('#plano-situacao')) && /0 de 3/.test(await te('#uso-vagas')), 'plano: antes da primeira vaga');

  const vaga = (await sql(`insert into vagas (empresa_id, titulo, tipo, status, modelo, cidade, estado, pais, lat, lng, raio_valor, raio_unidade)
    values ($1, 'Atendente de loja', 'integral', 'aberta', 'presencial', 'Campinas', 'SP', 'BR', -22.906, -47.061, 40, 'km') returning *`, [emp.id]))[0];
  await pe.reload(); await pe.waitForSelector('#plano-situacao');
  L(/Período grátis · (9[0-2]|8[89]) dias restantes/.test(await te('#plano-situacao')) && /1 de 3/.test(await te('#uso-vagas')), 'plano: período grátis começou com a vaga: ' + await te('#plano-situacao h2'));
  L(!(await hs(pe)) && await btnsOk(pe), 'plano: layout');
  L(/US\$\s?79/.test(await te('#plano-preco')) && /Cobrado em reais/.test(await te('#plano-reais')), 'plano: Essencial em dólar, cobrado em reais (assinatura: plano-emails-supabase-local.js)');

  // Candidatura → aviso para a empresa
  await sql("insert into candidaturas (vaga_id, profissional_id, mensagem) values ($1, $2, 'Tenho experiência.')", [vaga.id, joao.id]);
  await pe.goto(B + 'inicio.html');
  L(await sinoN(pe) === 1, 'sino: 1 aviso novo para a empresa');
  await pe.click('#sino'); await pe.waitForSelector('.notif');
  L(/Nova candidatura: Atendente de loja/.test(await te('.notif-nova')) && /João Silva se candidatou/.test(await te('.notif-nova')) && /agora|há \d+ min/.test(await te('.notif-quando')), 'avisos: candidatura nova destacada');
  L(!(await hs(pe)) && await btnsOk(pe), 'avisos: layout');
  await pe.goto(B + 'inicio.html');
  L(await sinoN(pe) === 0, 'avisos: abrir a tela marca tudo como lido');

  // Empresa chama para conversa e escreve → avisos para o profissional
  await pe.goto(B + 'candidatos.html?vaga=' + vaga.id); await pe.click('[data-cand=conversa]'); await pe.waitForSelector('#msg-form');
  await pe.click('#msg-form button[type=submit]'); await pe.waitForSelector('#msgs .bubble-out');
  await pp.goto(B + 'inicio.html');
  L(await sinoN(pp) === 2, 'sino: profissional com 2 avisos (chamado para conversa e mensagem)');
  await pp.click('#sino'); await pp.waitForSelector('.notif');
  L(/Padaria Aurora quer conversar com você/.test(await tp('#content')) && /Nova mensagem de Padaria Aurora/.test(await tp('#content')), 'avisos: conversa e mensagem');
  await pp.click('.notif:has-text("Nova mensagem")'); await pp.waitForURL(/conversa\.html/);
  L(true, 'avisos: tocar no aviso abre a conversa');

  // Várias mensagens da mesma conversa viram um aviso só
  for (const t of ['Mais uma coisa:', 'Pode começar segunda?']) { await pe.fill('#msg-in', t); await pe.click('#msg-form button[type=submit]'); await pe.waitForTimeout(300); }
  const msgsNaoLidas = await sql("select count(*)::int n, max(texto) t from notificacoes where user_id = $1 and categoria = 'mensagens' and lida_em is null", [joao.id]);
  L(msgsNaoLidas[0].n === 1 && /segunda/.test(msgsNaoLidas[0].t), 'avisos: mensagens da mesma conversa agrupadas num aviso, com a mais recente');

  // Preferência: sem avisos de mensagem no app
  await pp.goto(B + 'notificacoes.html#prefs'); await pp.waitForSelector('[data-pref=mensagens][data-canal=push]');
  await pp.uncheck('[data-pref=mensagens][data-canal=push]'); await pp.waitForSelector('#toast.show');
  L((await sql("select push, email from notificacao_prefs where user_id = $1 and categoria = 'mensagens'", [joao.id]))[0].push === false, 'preferências: salvas no banco');
  const antes = (await sql("select count(*)::int n from notificacoes where user_id = $1", [joao.id]))[0].n;
  await pe.fill('#msg-in', 'Combinado então.'); await pe.click('#msg-form button[type=submit]'); await pe.waitForTimeout(500);
  L((await sql("select count(*)::int n from notificacoes where user_id = $1", [joao.id]))[0].n === antes, 'preferências: sem aviso de mensagem no app quando desligado');

  // Empresa não vê avisos do profissional
  await pe.goto(B + 'notificacoes.html'); await pe.waitForSelector('#prefs');
  L(!/quer conversar com você/.test(await te('#content')), 'privacidade: cada um só vê os próprios avisos');

  // Fim do período grátis
  await sql("update assinaturas set gratis_ate = now() + interval '3 days'");
  await pe.goto(B + 'inicio.html'); await pe.waitForSelector('#plano-alerta');
  L(/Período grátis · 3 dias restantes/.test(await te('#plano-alerta')), 'início: alerta de fim do período grátis');
  await sql("update assinaturas set gratis_ate = now() - interval '1 day'");
  await pe.goto(B + 'plano.html'); await pe.waitForSelector('#plano-situacao');
  L(/O período grátis terminou/.test(await te('#plano-situacao')) && /Encerrado/.test(await te('#plano-situacao')), 'plano: período grátis terminado');
  await pe.goto(B + 'publicar-vaga.html'); await pe.waitForSelector('#vaga-form');
  await pe.fill('#v-titulo', 'Confeiteiro'); await pe.selectOption('#v-tipo', 'integral'); await pe.click('#v-publicar');
  await pe.waitForSelector('#form-status:not(:empty)');
  L(/período grátis terminou/i.test(await te('#form-status')), 'publicar: bloqueado pelo banco depois do período grátis: ' + await te('#form-status'));

  console.log('RESUMO:', pass, '/', pass + fail, 'passaram'); console.log('page errors:', errs);
  await b.close(); await local.parar();
})().catch(async e => { console.error('ERRO', e.message); try { await local.parar(); } catch (x) {} process.exit(1); });
