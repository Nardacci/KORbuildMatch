/*
 * KORbuild Match — etapa 3 (vagas e candidaturas) de ponta a ponta, contra um "Supabase local":
 * PostgreSQL com o esquema e as regras de acesso reais + PostgREST + login simulado
 * (supabase/tests/local/servidor.js). Não toca no projeto real.
 *
 *   python3 -m http.server 8765                 (na raiz do repositório)
 *   (cd supabase/tests/local && npm install)
 *   POSTGREST_BIN=/caminho/postgrest node docs/tests/vagas-supabase-local.js
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
  async function cidade(pg, id, texto) {
    await pg.fill(id, texto); await pg.waitForSelector(id + '-lista [role=option]');
    await pg.press(id, 'ArrowDown'); await pg.press(id, 'Enter');
  }
  async function cadastrar(pg, o) {
    await pg.goto(B + 'cadastro.html' + (o.empresa ? '?como=empresa' : '')); await pg.waitForSelector('#cad-form');
    await pg.fill('#cad-nome', o.nome); await pg.fill('#cad-email', o.email); await pg.selectOption('#cad-pais', 'BR');
    if (o.empresa) await pg.fill('#cad-setor', o.setor); else { await cidade(pg, '#cad-cidade', o.cidade); await pg.fill('#cad-titulo', o.titulo); }
    await pg.fill('#cad-senha', 'senha-forte-1'); await pg.check('#cad-termos'); await pg.click('#cad-btn');
    await pg.waitForSelector('#email-titulo');
    local.confirmar(o.email);
    await pg.goto(B + 'inicio.html' + local.linkComSessao(o.email)); await pg.waitForSelector('#ola');
  }

  // ---------------- EMPRESA ----------------
  const pe = await novoContexto(), te = T(pe);
  await cadastrar(pe, { empresa: true, nome: 'Padaria Aurora', email: 'rh@aurora.com.br', setor: 'Alimentação' });
  L(/Publicar uma vaga/.test(await te('#content')), 'empresa: início já oferece publicar vaga');
  await pe.click('#editar-perfil'); await pe.waitForSelector('#perfil-form');
  await pe.selectOption('#p-porte', '10 a 49 pessoas'); await cidade(pe, '#p-cidade', 'Campinas');
  await pe.fill('#p-descricao', 'Padaria de bairro com 3 lojas em Campinas, pães artesanais desde 1998.');
  await pe.check('input[name=p-canal][value=email]'); await pe.click('#salvar');
  await pe.waitForURL(/inicio\.html/); await pe.waitForSelector('#primeira-vaga');
  L(/primeira vaga/.test(await te('#resumo-topo')), 'empresa: perfil completo, início pede a primeira vaga');

  // Publicar: validação e triagem proibida
  await pe.click('#primeira-vaga a'); await pe.waitForSelector('#vaga-form');
  L((await pe.inputValue('#v-cidade')) === 'Campinas, SP' && (await pe.inputValue('#v-moeda')) === 'BRL', 'publicar: cidade e moeda vêm da sede da empresa');
  await pe.click('#v-publicar');
  L(/cargo/.test(await te('#v-titulo-err')) && /tipo/.test(await te('#v-tipo-err')), 'publicar: valida título e tipo');
  await pe.fill('#v-titulo', 'Atendente de loja'); await pe.selectOption('#v-tipo', 'integral');
  await pe.fill('#v-descricao', 'Atendimento no balcão, caixa e organização da vitrine.'); await pe.fill('#v-posicoes', '2');
  await pe.fill('#v-min', '2200'); await pe.fill('#v-max', '2600');
  await pe.fill('#v-req', 'Atendimento ao público\nEnsino médio completo'); await pe.fill('#v-comp', 'Atendimento, Caixa, Organização');
  await pe.click('#tr-add'); await pe.fill('#tr-texto-0', 'Qual a sua idade?');
  await pe.click('#v-publicar');
  L(/proibido/.test(await te('#tr-texto-0-err')), 'publicar: pergunta de triagem sobre idade é barrada');
  await pe.fill('#tr-texto-0', 'Tem disponibilidade aos sábados?');
  await pe.click('#tr-add'); await pe.fill('#tr-texto-1', 'Qual seu nível de Excel?'); await pe.check('input[name=tr-tipo-1][value=opcoes]');
  await pe.waitForSelector('#tr-opcoes-1');
  L((await pe.inputValue('#tr-texto-1')) === 'Qual seu nível de Excel?', 'publicar: trocar o tipo mantém o texto da pergunta');
  await pe.fill('#tr-opcoes-1', 'Básico, Intermediário, Avançado');
  L(!(await hs(pe)) && await btnsOk(pe), 'publicar: layout');
  await pe.click('#v-publicar'); await pe.waitForSelector('#done-title');
  L((await te('#done-title')) === 'Vaga publicada', 'publicar: vaga publicada');
  let vA = (await local.sql("select * from vagas where titulo = 'Atendente de loja'"))[0];
  L(vA.status === 'aberta' && vA.cidade === 'Campinas' && vA.raio_valor === 40 && vA.raio_unidade === 'km' && vA.triagem.length === 2 && vA.triagem[1].opcoes.length === 3 && Number(vA.salario_min) === 2200,
    'publicar: gravada no banco com local, raio, salário e triagem');
  L((await local.sql('select status from assinaturas'))[0].status === 'gratis', 'publicar: primeira vaga começa o período grátis');

  // Vaga remota e um rascunho
  await pe.goto(B + 'publicar-vaga.html'); await pe.waitForSelector('#vaga-form');
  await pe.fill('#v-titulo', 'Suporte ao cliente'); await pe.selectOption('#v-tipo', 'meio_periodo'); await pe.check('input[name=v-modelo][value=remoto]');
  L(await pe.isHidden('#local-presencial') && await pe.isVisible('#v-fuso'), 'publicar: remota troca local por fuso');
  await pe.selectOption('#v-fuso', '-3'); await pe.fill('#v-comp', 'Atendimento, Comunicação');
  await pe.click('#v-publicar'); await pe.waitForSelector('#done-title');
  await pe.goto(B + 'publicar-vaga.html'); await pe.waitForSelector('#vaga-form');
  await pe.fill('#v-titulo', 'Operador de caixa'); await pe.click('#v-rascunho'); await pe.waitForSelector('#done-title');
  L((await te('#done-title')) === 'Rascunho salvo', 'publicar: rascunho incompleto é aceito');

  // Minhas vagas: publicar o rascunho (3ª ativa) e bater no limite com a 4ª
  await pe.goto(B + 'vagas.html'); await pe.waitForSelector('#vagas-filtro');
  L(/Abertas · 2/.test(await te('#vagas-filtro')) && /Rascunhos · 1/.test(await te('#vagas-filtro')), 'minhas vagas: contagem por estado');
  await pe.click('[data-grupo=rascunhos]'); await pe.click('[data-acao=publicar]');
  await pe.waitForSelector('#vagas-filtro:has-text("Abertas · 3")');
  L((await local.sql("select status, cidade from vagas where titulo = 'Operador de caixa'"))[0].cidade === 'Campinas', 'minhas vagas: publica o rascunho (a cidade veio da sede)');
  await pe.goto(B + 'publicar-vaga.html'); await pe.waitForSelector('#vaga-form');
  await pe.fill('#v-titulo', 'Confeiteiro'); await pe.selectOption('#v-tipo', 'integral'); await pe.click('#v-publicar');
  await pe.waitForSelector('#form-status:not(:empty)');
  L(/3 vagas ativas/.test(await te('#form-status')), 'publicar: limite de 3 vagas ativas do plano: ' + await te('#form-status'));
  await pe.goto(B + 'vagas.html'); await pe.waitForSelector('#vagas-filtro');
  await pe.click('.vaga-card[data-vaga="' + vA.id + '"] [data-acao=pausar]'); await pe.waitForSelector('#vagas-filtro:has-text("Pausadas · 1")');
  await pe.click('[data-grupo=pausadas]'); await pe.click('[data-acao=reativar]'); await pe.waitForSelector('#vagas-filtro:has-text("Abertas · 3")');
  L(true, 'minhas vagas: pausar e reativar');
  L(!(await hs(pe)) && await btnsOk(pe), 'minhas vagas: layout');

  // ---------------- PROFISSIONAL ----------------
  const pp = await novoContexto(), tp = T(pp);
  await cadastrar(pp, { nome: 'João Silva', email: 'joao@exemplo.com', cidade: 'Valinhos', titulo: 'Atendente' });
  await pp.click('#editar-perfil'); await pp.waitForSelector('#perfil-form');
  await pp.selectOption('#p-disp', 'Disponível imediatamente'); await pp.selectOption('#p-dist', '25');
  await pp.check('input[name=p-modelos][value=remoto]'); await pp.fill('#p-comp', 'Atendimento, Caixa, Vendas');
  await pp.fill('#p-tel', '+55 19 91234-5678'); await pp.click('#salvar');
  await pp.waitForURL(/inicio\.html/); await pp.waitForSelector('#h-vagas');
  L((await pp.$$('.vaga-item')).length === 3 && /3 vagas combinam/.test(await tp('#resumo-topo')), 'profissional: início mostra as 3 vagas perto (2 em Campinas e 1 remota)');
  L(/≈ \d+ km de você/.test(await tp('.vaga-item')) && /2 competências em comum/.test(await tp('#content')) && /Suporte ao cliente/.test(await tp('.vaga-item:last-child')), 'profissional: distância, competências em comum e remota por último: ' + (await tp('.vaga-item')).slice(0, 200));

  await pp.click('#busca'); await pp.waitForSelector('#busca-lista');
  L(/3 vagas encontradas/.test(await tp('#busca-total')), 'buscar: 3 vagas');
  await pp.click('[data-modelo=remoto]');
  L(/1 vaga encontrada/.test(await tp('#busca-total')) && /Suporte ao cliente/.test(await tp('#busca-lista')), 'buscar: filtro remoto');
  await pp.click('[data-modelo=""]'); await pp.fill('#busca-q', 'caixa');
  L(/2 vagas encontradas/.test(await tp('#busca-total')), 'buscar: texto "caixa" acha título e competência: ' + await tp('#busca-total'));
  L(!(await hs(pp)) && await btnsOk(pp), 'buscar: layout');

  // Candidatar-se à vaga A
  await pp.goto(B + 'vaga.html?id=' + vA.id); await pp.waitForSelector('#candidatar');
  L(/R\$ 2\.200 – R\$ 2\.600 por mês/.test(await tp('.summary')) && /Padaria Aurora/.test(await tp('#content')), 'vaga: salário e empresa');
  await pp.click('#candidatar'); await pp.waitForSelector('#cand-form');
  await pp.click('#enviar');
  L(/Responda/.test(await tp('#tr-0-err')) && /Responda/.test(await tp('#tr-1-err')), 'candidatar: triagem obrigatória');
  await pp.check('input[name=tr-0][value=Sim]'); await pp.check('input[name=tr-1][value="Intermediário"]');
  await pp.fill('#c-msg', 'Trabalhei 2 anos em padaria, no caixa e no balcão.'); await pp.fill('#c-valor', '2400');
  await pp.click('#enviar'); await pp.waitForSelector('#done-title');
  L((await tp('#done-title')) === 'Candidatura enviada', 'candidatar: enviada');
  let c = (await local.sql('select * from candidaturas'))[0];
  L(c.status === 'novo' && c.respostas_triagem['0'] === 'Sim' && c.respostas_triagem['1'] === 'Intermediário' && Number(c.pretensao_valor) === 2400 && c.pretensao_moeda === 'BRL', 'candidatar: gravada com triagem e pretensão');
  await pp.goto(B + 'vaga.html?id=' + vA.id); await pp.waitForSelector('#vaga-acoes');
  L(/Candidatura enviada · ver status/.test(await tp('#vaga-acoes')) && !(await pp.$('#candidatar')), 'vaga: não deixa candidatar de novo');

  // Segunda candidatura e retirada
  const vB = (await local.sql("select id from vagas where titulo = 'Suporte ao cliente'"))[0];
  await pp.goto(B + 'vaga.html?id=' + vB.id); await pp.click('#candidatar'); await pp.waitForSelector('#cand-form');
  await pp.click('#enviar'); await pp.waitForSelector('#done-title');
  await pp.goto(B + 'candidaturas.html'); await pp.waitForSelector('#cand-filter');
  L(/Em andamento · 2/.test(await tp('#cand-filter')) && /Resposta até/.test(await tp('#content')), 'candidaturas: 2 em andamento com prazo de resposta');
  await pp.click('.cand-minha:has-text("Suporte ao cliente") [data-retirar=abrir]'); await pp.click('[data-retirar=confirmar]');
  await pp.waitForSelector('#cand-filter:has-text("Encerradas · 1")');
  L((await local.sql("select c.status from candidaturas c join vagas v on v.id = c.vaga_id where v.titulo = 'Suporte ao cliente'"))[0].status === 'retirada', 'candidaturas: retirar grava no banco');
  L(!(await hs(pp)) && await btnsOk(pp), 'candidaturas: layout');

  // ---------------- EMPRESA responde ----------------
  await pe.goto(B + 'inicio.html'); await pe.waitForSelector('#h-atencao');
  L(/1 candidato novo/.test(await te('#h-atencao + *, #content')) && /Atendente de loja/.test(await te('#content')), 'empresa: início mostra candidato novo');
  await pe.goto(B + 'candidatos.html?vaga=' + vA.id); await pe.waitForSelector('.cand-card');
  const card = await te('.cand-card');
  L(/João Silva/.test(card) && /Valinhos, SP/.test(card) && /≈ \d+ km da vaga/.test(card) && /2 competências em comum/.test(card) && /Responder até/.test(card), 'candidatos: cartão com distância, competências e prazo: ' + card.slice(0, 160));
  L(/sábados\?\s*Sim/.test(card) && /Excel\?\s*Intermediário/.test(card) && /R\$ 2\.400 por mês/.test(card) && /padaria/.test(card), 'candidatos: triagem, pretensão e mensagem: ' + card);
  await pe.click('.cand-card a:has-text("Ver perfil")'); await pe.waitForSelector('.page-title');
  L((await te('.page-title')) === 'João Silva' && /Em comum com a vaga: Atendimento, Caixa/.test(await te('#content')) && /reputação em construção/.test(await te('#content')), 'ver profissional: perfil e competências em comum');
  await pe.goBack(); await pe.waitForSelector('.cand-card');
  await pe.click('[data-cand=conversa]'); await pe.waitForURL(/conversa\.html/);
  await pe.goto(B + 'candidatos.html?vaga=' + vA.id + '&status=conversa'); await pe.waitForSelector('#cand-filter:has-text("Em conversa · 1")');
  L((await local.sql('select status from candidaturas where id = $1', [c.id]))[0].status === 'conversa', 'candidatos: chamar para conversa');
  L(!(await hs(pe)) && await btnsOk(pe), 'candidatos: layout');

  await pp.goto(B + 'candidaturas.html'); await pp.waitForSelector('.cand-minha');
  L(/Em conversa/.test(await tp('.cand-minha')), 'profissional vê "Em conversa"');

  // Empresa cancela a vaga: a candidatura vira "Vaga encerrada"
  await pe.goto(B + 'vagas.html'); await pe.waitForSelector('#vagas-filtro');
  await pe.click('.vaga-card[data-vaga="' + vA.id + '"] [data-acao=cancelar]');
  L(/avisa os 1 candidato em andamento/.test(await te('.confirmar')), 'cancelar: confirma avisando os candidatos');
  await pe.click('[data-acao=confirmar-cancelar]'); await pe.waitForSelector('#vagas-filtro:has-text("Encerradas · 1")');
  L((await local.sql('select status from candidaturas where id = $1', [c.id]))[0].status === 'encerrada', 'cancelar: candidatura encerrada pelo banco');
  await pp.goto(B + 'candidaturas.html?aba=encerradas'); await pp.waitForSelector('.cand-minha');
  L(/Vaga encerrada/.test(await tp('#content')) && /Retirada/.test(await tp('#content')), 'profissional vê vaga encerrada e retirada');

  // Visitante sem conta vê a vaga aberta
  const pv = await novoContexto(), tv = T(pv);
  await pv.goto(B + 'vaga.html?id=' + vB.id); await pv.waitForSelector('#vaga-acoes');
  L(/Entrar para se candidatar/.test(await tv('#vaga-acoes')) && /Suporte ao cliente/.test(await tv('.vaga-h')), 'visitante: vê a vaga e o convite para entrar');

  console.log('RESUMO:', pass, '/', pass + fail, 'passaram'); console.log('page errors:', errs);
  await b.close(); await local.parar();
})().catch(async e => { console.error('ERRO', e.message); try { await local.parar(); } catch (x) {} process.exit(1); });
