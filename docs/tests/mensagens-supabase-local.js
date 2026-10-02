/*
 * KORbuild Match — etapa 4 (mensagens) de ponta a ponta, contra o "Supabase local"
 * (PostgreSQL com o esquema e o RLS reais + PostgREST + login simulado). Não toca no projeto real.
 *
 *   python3 -m http.server 8765                 (na raiz do repositório)
 *   (cd supabase/tests/local && npm install)
 *   POSTGREST_BIN=/caminho/postgrest node docs/tests/mensagens-supabase-local.js
 *
 * Sem o Realtime do Supabase aqui, a conversa recebe as mensagens novas pela conferência periódica (5 s).
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

  // Preparação: empresa e profissional pelas telas; perfis, vaga e candidatura direto no banco.
  const pe = await novoContexto(), te = T(pe);
  const pp = await novoContexto(), tp = T(pp);
  await cadastrar(pe, { empresa: true, nome: 'Padaria Aurora', email: 'rh@aurora.com.br' });
  await cadastrar(pp, { nome: 'João Silva', email: 'joao@exemplo.com' });
  const emp = (await local.sql("select * from empresas"))[0];
  const joao = local.usuario('joao@exemplo.com');
  await local.sql("update empresas set cidade = 'Campinas', estado = 'SP', pais = 'BR', lat = -22.906, lng = -47.061, porte = '10 a 49 pessoas', descricao = 'Padaria de bairro com 3 lojas em Campinas, desde 1998.'");
  await local.sql("update profissionais set disponibilidade = 'Disponível imediatamente', competencias = '{Atendimento,Caixa,Vendas}', modelos = '{presencial,remoto}'");
  await local.sql("update contatos set telefone = '+55 19 91234-5678' where user_id = $1", [joao.id]);
  const vaga = (await local.sql(`insert into vagas (empresa_id, titulo, tipo, status, modelo, cidade, estado, pais, lat, lng, raio_valor, raio_unidade, competencias)
    values ($1, 'Atendente de loja', 'integral', 'aberta', 'presencial', 'Campinas', 'SP', 'BR', -22.906, -47.061, 40, 'km', '{Atendimento,Caixa}') returning *`, [emp.id]))[0];
  const vagaB = (await local.sql(`insert into vagas (empresa_id, titulo, tipo, status, modelo, fuso) values ($1, 'Suporte ao cliente', 'integral', 'aberta', 'remoto', -3) returning *`, [emp.id]))[0];
  await local.sql("insert into candidaturas (vaga_id, profissional_id, mensagem) values ($1, $2, 'Tenho experiência em padaria.')", [vaga.id, joao.id]);

  // Sem conversas ainda
  await pp.goto(B + 'mensagens.html'); await pp.waitForSelector('.empty');
  L(/Nenhuma conversa ainda/.test(await tp('#content')) && (await tp('#nav [aria-current]')) === 'Mensagens', 'mensagens: vazio e aba ativa');

  // Empresa chama para conversa: abre a conversa com texto sugerido
  await pe.goto(B + 'candidatos.html?vaga=' + vaga.id); await pe.waitForSelector('[data-cand=conversa]');
  await pe.click('[data-cand=conversa]'); await pe.waitForURL(/conversa\.html\?id=/); await pe.waitForSelector('#msg-form');
  L((await te('.topbar-title')) === 'João Silva' && /Oi, João! Vimos sua candidatura para Atendente de loja/.test(await pe.inputValue('#msg-in')), 'chamar para conversa: abre a conversa com a mensagem sugerida');
  L(/Atendente de loja/.test(await te('.chat-vaga')) && /Contato direto ainda não liberado/.test(await te('#wa-area')), 'conversa: vaga e contato ainda não liberado');
  L((await local.sql('select status from candidaturas'))[0].status === 'conversa', 'chamar para conversa: candidatura em conversa');
  await pe.click('#msg-form button[type=submit]'); await pe.waitForSelector('#msgs .bubble-out');
  let m = await local.sql('select * from mensagens');
  L(m.length === 1 && m[0].de === 'empresa' && m[0].autor === (await local.sql('select dono from empresas'))[0].dono, 'enviar: mensagem gravada como empresa, autor vem do login');
  L(!(await hs(pe)) && await btnsOk(pe), 'conversa: layout');

  // Profissional vê a mensagem não lida
  await pp.goto(B + 'inicio.html'); await pp.waitForSelector('#ola');
  L(/1 mensagem sem resposta/.test(await tp('#msgs-sem-resposta')) && /Padaria Aurora/.test(await tp('#msgs-sem-resposta')), 'início: mensagem sem resposta para o profissional');
  L((await tp('#nav [data-nav=mensagens] .nav-badge')) === '1', 'navegação: contador de não lidas');
  await pp.click('#nav [data-nav=mensagens]'); await pp.waitForSelector('.chat-row');
  L((await pp.getAttribute('.chat-row', 'class')).indexOf('chat-unread') !== -1 && /Padaria Aurora/.test(await tp('.chat-row')) && /Oi, João!/.test(await tp('.chat-row')), 'lista: conversa não lida com prévia');
  await pp.click('.chat-row'); await pp.waitForSelector('#msgs .bubble-in');
  L((await tp('.topbar-title')) === 'Padaria Aurora', 'conversa (profissional): título com a empresa');
  await pp.fill('#msg-in', 'Oi! Tenho sim, posso na quinta à tarde.'); await pp.press('#msg-in', 'Enter');
  await pp.waitForSelector('#msgs .bubble-out');
  L((await local.sql("select de from mensagens order by criado_em desc limit 1"))[0].de === 'profissional', 'enviar com Enter: gravada como profissional');
  const cv = (await local.sql('select * from conversas'))[0];
  L(cv.ultima_mensagem_de === 'profissional' && cv.lido_profissional_em, 'conversa: última de quem e leitura atualizadas pelo banco');

  // A conversa aberta da empresa recebe a resposta sozinha
  await pe.waitForSelector('#msgs .bubble-in', { timeout: 12000 });
  L(/quinta à tarde/.test(await te('#msgs')), 'tempo real (conferência periódica): resposta aparece na conversa aberta');

  // Troca de contato
  await pe.click('[data-contato=compartilhar]'); await pe.waitForSelector('#wa-area:has-text("Aguardando")');
  L((await local.sql('select compartilhou_empresa from conversas'))[0].compartilhou_empresa === true, 'contato: empresa compartilhou');
  await pp.reload(); await pp.waitForSelector('#wa-area');
  L(/quer trocar contato/.test(await tp('#wa-area')), 'contato: profissional vê o pedido');
  await pp.click('[data-contato=compartilhar]'); await pp.waitForSelector('.wa-liberado');
  await pp.click('[data-contato=ver]'); await pp.waitForSelector('#contato-liberado');
  L(/rh@aurora\.com\.br/.test(await tp('#contato-liberado')) && !!(await pp.$('#contato-liberado a[href^="mailto:rh@aurora.com.br"]')), 'contato: profissional recebe o e-mail da empresa');
  await pe.waitForSelector('.wa-liberado', { timeout: 12000 });
  await pe.click('[data-contato=ver]'); await pe.waitForSelector('#contato-liberado');
  L((await pe.getAttribute('#contato-liberado a[href*="wa.me"]', 'href') || '').indexOf('https://wa.me/5519912345678') === 0, 'contato: empresa recebe o WhatsApp do profissional');

  // Sem resposta (empresa) e resposta rápida
  await pp.fill('#msg-in', 'Qual o horário da vaga?'); await pp.click('#msg-form button[type=submit]'); await pp.waitForSelector('#msgs li:nth-child(3)');
  await pe.goto(B + 'inicio.html'); await pe.waitForSelector('#msgs-sem-resposta');
  L(/1 mensagem sem resposta/.test(await te('#msgs-sem-resposta')), 'início (empresa): mensagem sem resposta');
  await pe.click('#msgs-sem-resposta'); await pe.waitForSelector('.sr-card');
  L(/Qual o horário da vaga\?/.test(await te('.sr-card')) && /Esperando desde hoje/.test(await te('.sr-card')), 'sem resposta: última mensagem e tempo de espera');
  await pe.click('.sr-rapida'); await pe.click('.sr-form button[type=submit]'); await pe.waitForSelector('#sr-vazio');
  L(/Tudo respondido/.test(await te('#sr-vazio')), 'sem resposta: resposta rápida zera a lista');
  L(!(await hs(pe)) && await btnsOk(pe), 'mensagens: layout');

  // Tirar dúvida em outra vaga da mesma empresa reaproveita a conversa
  await pp.goto(B + 'vaga.html?id=' + vagaB.id); await pp.waitForSelector('#duvida');
  await pp.click('#duvida'); await pp.waitForURL(/conversa\.html/);
  L(new URL(pp.url()).searchParams.get('id') === cv.id && (await local.sql('select count(*)::int n from conversas'))[0].n === 1, 'tirar dúvida: reaproveita a conversa com a empresa');

  // Denúncia
  await pp.click('[data-den=abrir]'); await pp.check('input[name=den-motivo][value=Spam]'); await pp.click('[data-den=enviar]');
  await pp.waitForSelector('#den-ok');
  L((await local.sql("select alvo_tipo, motivo from denuncias"))[0].motivo === 'Spam', 'denúncia: gravada para a moderação');

  // Outra pessoa não abre a conversa
  const px = await novoContexto(), tx = T(px);
  await cadastrar(px, { nome: 'Maria Souza', email: 'maria@exemplo.com' });
  await px.goto(B + 'conversa.html?id=' + cv.id); await px.waitForSelector('.empty');
  L(/Conversa não encontrada/.test(await tx('#content')), 'privacidade: outra pessoa não vê a conversa');

  console.log('RESUMO:', pass, '/', pass + fail, 'passaram'); console.log('page errors:', errs);
  await b.close(); await local.parar();
})().catch(async e => { console.error('ERRO', e.message); try { await local.parar(); } catch (x) {} process.exit(1); });
