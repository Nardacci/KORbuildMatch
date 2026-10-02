/*
 * KORbuild Match — etapa 5 (contratação e reputação) de ponta a ponta, contra o "Supabase local"
 * (PostgreSQL com o esquema e o RLS reais + PostgREST + login simulado). Não toca no projeto real.
 *
 *   python3 -m http.server 8765                 (na raiz do repositório)
 *   (cd supabase/tests/local && npm install)
 *   POSTGREST_BIN=/caminho/postgrest node docs/tests/contratacao-supabase-local.js
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

  // Preparação: contas pelas telas; perfis, vaga, candidatura em conversa e contato liberado no banco.
  const pe = await novoContexto(), te = T(pe);
  const pp = await novoContexto(), tp = T(pp);
  await cadastrar(pe, { empresa: true, nome: 'Padaria Aurora', email: 'rh@aurora.com.br' });
  await cadastrar(pp, { nome: 'João Silva', email: 'joao@exemplo.com' });
  const emp = (await sql('select * from empresas'))[0];
  const joao = local.usuario('joao@exemplo.com');
  await sql("update empresas set cidade = 'Campinas', estado = 'SP', pais = 'BR', lat = -22.906, lng = -47.061, porte = '10 a 49 pessoas', descricao = 'Padaria de bairro com 3 lojas em Campinas, desde 1998.'");
  await sql("update profissionais set disponibilidade = 'Disponível imediatamente', competencias = '{Atendimento,Caixa,Vendas}'");
  await sql("update contatos set canal = 'email'");
  const vaga = (await sql(`insert into vagas (empresa_id, titulo, tipo, status, modelo, cidade, estado, pais, lat, lng, raio_valor, raio_unidade, moeda, salario_min, salario_max, periodo, posicoes)
    values ($1, 'Atendente de loja', 'integral', 'aberta', 'presencial', 'Campinas', 'SP', 'BR', -22.906, -47.061, 40, 'km', 'BRL', 2200, 2600, 'mes', 1) returning *`, [emp.id]))[0];
  const cand = (await sql("insert into candidaturas (vaga_id, profissional_id, status) values ($1, $2, 'conversa') returning *", [vaga.id, joao.id]))[0];
  const cv = (await sql("insert into conversas (empresa_id, profissional_id, vaga_id, compartilhou_empresa, compartilhou_profissional) values ($1, $2, $3, true, true) returning *", [emp.id, joao.id, vaga.id]))[0];
  await sql("insert into mensagens (conversa_id, autor, de, texto) values ($1, $2, 'empresa', 'Pode começar segunda?')", [cv.id, emp.dono]);
  await sql("insert into mensagens (conversa_id, autor, de, texto) values ($1, $2, 'profissional', 'Posso sim!')", [cv.id, joao.id]);

  // "Deu certo?" na conversa
  await pp.goto(B + 'conversa.html?id=' + cv.id); await pp.waitForSelector('#deu-certo-card');
  L(/Você foi contratado\(a\) por Padaria Aurora\?/.test(await tp('#deu-certo-card')), 'deu certo: profissional vê a pergunta depois de liberar o contato');
  await pp.click('#deu-certo-nao'); await pp.waitForFunction(() => !document.querySelector('#deu-certo-card'));
  L((await sql('select deu_certo_profissional from conversas'))[0].deu_certo_profissional === 'nao', 'deu certo: "Ainda não" esconde e grava');

  await pe.goto(B + 'conversa.html?id=' + cv.id); await pe.waitForSelector('#deu-certo-card');
  await pe.click('#deu-certo-card a'); await pe.waitForSelector('#contr-form');
  L((await pe.inputValue('#k-funcao')) === 'Atendente de loja' && (await pe.inputValue('#k-valor')) === '2200' && await pe.isChecked('#k-preencher'), 'registrar: combinado vem da vaga e sugere marcar como preenchida');
  L(!(await hs(pe)) && await btnsOk(pe), 'registrar: layout');
  await pe.fill('#k-jornada', 'Seg a sex, 9h às 18h'); await pe.click('#k-salvar'); await pe.waitForSelector('#done-title');
  let k = (await sql('select * from contratacoes'))[0];
  L(k.status === 'aguardando' && k.registrada_por === 'empresa' && Number(k.valor) === 2200 && k.candidatura_id === cand.id && k.jornada === 'Seg a sex, 9h às 18h', 'registrar: contratação aguardando confirmação');
  L((await sql('select status from vagas where id = $1', [vaga.id]))[0].status === 'preenchida', 'registrar: vaga marcada como preenchida');

  // Profissional contesta
  await pp.goto(B + 'inicio.html'); await pp.waitForSelector('#ola');
  L(/Confirme a contratação/.test(await tp('#content')) && /Padaria Aurora · Atendente de loja/.test(await tp('#content')), 'início (profissional): pendência para confirmar');
  await pp.goto(B + 'contratacoes.html'); await pp.waitForSelector('.contr-card');
  L(/R\$ 2\.200 por mês/.test(await tp('.contr-card')) && /Seg a sex, 9h às 18h/.test(await tp('.contr-card')), 'contratações: combinado completo');
  await pp.click('[data-k=contestar]'); await pp.click('[data-k=enviar-contestacao]');
  L(/Escreva/.test(await tp('.field-error:not([hidden])')), 'contestar: exige explicação');
  await pp.fill('textarea[id^="t-"]', 'O salário combinado foi R$ 2.400.'); await pp.click('[data-k=enviar-contestacao]');
  await pp.waitForSelector('.contr-card:has-text("Você contestou")');
  L((await sql('select status from contratacoes'))[0].status === 'contestado', 'contestar: gravado');

  // Empresa corrige
  await pe.goto(B + 'inicio.html'); await pe.waitForSelector('#ola');
  L(/Combinado contestado/.test(await te('#content')), 'início (empresa): pendência da contestação');
  await pe.goto(B + 'contratacoes.html'); await pe.waitForSelector('.contr-card a:has-text("Corrigir")');
  L(/R\$ 2\.400/.test(await te('.contr-card')), 'contratações (empresa): vê o texto da contestação');
  await pe.click('.contr-card a:has-text("Corrigir")'); await pe.waitForSelector('#contr-form');
  await pe.fill('#k-valor', '2400'); await pe.fill('#k-resposta', 'Você tem razão, corrigido!'); await pe.click('#k-salvar'); await pe.waitForSelector('#done-title');
  k = (await sql('select * from contratacoes'))[0];
  L(k.status === 'aguardando' && Number(k.valor) === 2400 && k.resposta_texto === 'Você tem razão, corrigido!', 'corrigir: combinado corrigido e de volta para confirmação');

  // Profissional confirma
  await pp.goto(B + 'contratacoes.html'); await pp.waitForSelector('[data-k=confirmar]');
  L(/Você tem razão, corrigido!/.test(await tp('.contr-card')) && /R\$ 2\.400 por mês/.test(await tp('.contr-card')), 'confirmar: vê a resposta e o valor corrigido');
  await pp.click('[data-k=confirmar]'); await pp.waitForSelector('.contr-card:has-text("Vínculo ativo")');
  L((await sql('select status from candidaturas'))[0].status === 'contratado', 'confirmar: candidatura vira contratado');
  L((await sql('select count(*)::int n from experiencias where contratacao_id is not null'))[0].n === 1, 'confirmar: experiência verificada no perfil');
  L(!(await hs(pp)) && await btnsOk(pp), 'contratações: layout');

  // Experiência verificada no perfil, com o nome da empresa oculto
  await pp.goto(B + 'perfil.html'); await pp.waitForSelector('#exp-area [data-exp]');
  L(/Atendente de loja/.test(await tp('#exp-area')) && /Padaria Aurora/.test(await tp('#exp-area')), 'perfil: experiência verificada');
  await pp.uncheck('#exp-area [data-exp]'); await pp.waitForTimeout(600);
  L((await sql('select mostrar_empresa from experiencias'))[0].mostrar_empresa === false, 'perfil: ocultar o nome da empresa');

  // Fim do vínculo abre a avaliação
  await pp.goto(B + 'contratacoes.html'); await pp.click('[data-k=encerrar]'); await pp.click('[data-k=enviar-fim]');
  L(/Informe a data/.test(await tp('.field-error:not([hidden])')), 'fim do vínculo: exige a data');
  const hoje = new Date(); const iso = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0') + '-' + String(hoje.getDate()).padStart(2, '0');
  await pp.fill('input[id^="t-"]', iso); await pp.click('[data-k=enviar-fim]');
  await pp.waitForSelector('.contr-card a:has-text("Avaliar agora")');
  L(!!(await sql('select avaliar_ate from contratacoes'))[0].avaliar_ate, 'fim do vínculo: prazo de avaliação aberto');

  // Empresa avalia primeiro
  await pe.goto(B + 'inicio.html'); await pe.waitForSelector('#ola');
  L(/Avalie João/.test(await te('#content')), 'início (empresa): pendência de avaliar');
  await pe.goto(B + 'avaliar.html?id=' + k.id); await pe.waitForSelector('#av-form');
  L(/Combinado: Atendente de loja/.test(await te('#av-form')) && /Combinado: Seg a sex/.test(await te('#av-form')), 'avaliar: combinado como referência');
  await pe.click('#av-enviar');
  L(/Responda todas/.test(await te('#form-status')), 'avaliar: perguntas obrigatórias');
  for (const q of ['entregou', 'horarios', 'comunicacao', 'novamente']) await pe.check('input[name=q-' + q + '][value=Sim]');
  await pe.check('input[name=q-nota][value="5"]', { force: true }); await pe.fill('#q-coment', 'Ótimo atendimento no balcão.');
  L(!(await hs(pe)) && await btnsOk(pe), 'avaliar: layout');
  await pe.click('#av-enviar'); await pe.waitForSelector('#done-title');
  L((await sql("select nota from avaliacoes where autor_tipo = 'empresa'"))[0].nota === 5, 'avaliar: avaliação da empresa gravada');

  // Cega: o profissional ainda não vê
  await pp.goto(B + 'perfil.html'); await pp.waitForSelector('#rep-area .card');
  L(!/Ótimo atendimento/.test(await tp('#rep-area')) && /1 trabalho verificado/.test(await tp('#rep-area')), 'avaliação cega: o profissional não vê antes de avaliar');
  await pp.goto(B + 'avaliar.html?id=' + k.id); await pp.waitForSelector('#av-form');
  L(/Combinado: R\$ 2\.400 por mês/.test(await tp('#av-form')), 'avaliar (profissional): pagamento com o valor combinado');
  for (const q of ['pagamento', 'condicoes', 'ambiente', 'novamente']) await pp.check('input[name=q-' + q + '][value=Sim]');
  await pp.check('input[name=q-anuncio][value=Parcialmente]'); await pp.check('input[name=q-nota][value="4"]', { force: true });
  await pp.click('#av-enviar'); await pp.waitForSelector('#done-title');

  // Publicadas: resposta e reputação
  await pp.goto(B + 'perfil.html'); await pp.waitForSelector('.avaliacao');
  L(/Empresa não divulgada/.test(await tp('.avaliacao')) && /Ótimo atendimento/.test(await tp('.avaliacao')) && /Nota 5 de 5/.test(await pp.getAttribute('.estrelas', 'aria-label')), 'publicadas: o profissional vê a avaliação recebida (empresa oculta a pedido dele)');
  await pp.fill('.av-responder textarea', 'Obrigado pela oportunidade!'); await pp.click('.av-responder button');
  await pp.waitForSelector('.av-resposta');
  L((await sql("select resposta from avaliacoes where autor_tipo = 'empresa'"))[0].resposta === 'Obrigado pela oportunidade!', 'resposta: publicada pelo avaliado');
  await pp.goto(B + 'inicio.html'); await pp.waitForSelector('#hero-rep');
  L(/1 trabalho verificado · a nota aparece com 3 avaliações/.test(await tp('#hero-rep')), 'início: reputação em construção com o trabalho verificado');
  await pp.goto(B + 'vaga.html?id=' + vaga.id); await pp.waitForSelector('#rep-empresa .card');
  L(/João S\./.test(await tp('#rep-empresa')) && /1 contratação verificada/.test(await tp('#rep-empresa')) && /Parcialmente/.test(await tp('#rep-empresa')), 'vaga: reputação e avaliação da empresa');
  await pe.goto(B + 'ver-profissional.html?id=' + joao.id); await pe.waitForSelector('#reputacao');
  L(/Ótimo atendimento/.test(await te('#reputacao')) && /Obrigado pela oportunidade!/.test(await te('#reputacao')), 'perfil do profissional (empresa): avaliação e resposta');

  // Profissional registra outra contratação; a empresa recusa e ele contesta
  await pp.goto(B + 'registrar-contratacao.html?empresa=' + emp.id); await pp.waitForSelector('#contr-form');
  await pp.fill('#k-funcao', 'Caixa'); await pp.click('#k-salvar'); await pp.waitForSelector('#done-title');
  await pe.goto(B + 'contratacoes.html'); await pe.waitForSelector('[data-k=recusar]');
  L(/registrou que foi contratado/.test(await te('#content')), 'registro do profissional: empresa vê o pedido');
  await pe.click('[data-k=recusar]'); await pe.click('[data-k=confirmar-recusa]'); await pe.waitForSelector('.contr-card:has-text("Você recusou")');
  await pp.goto(B + 'contratacoes.html'); await pp.click('[data-k=contestar-recusa]');
  await pp.waitForSelector('.contr-card:has-text("moderação está analisando")');
  L((await sql("select recusa_contestada from contratacoes where funcao = 'Caixa'"))[0].recusa_contestada === true, 'recusa: profissional contesta, vai para a moderação');

  console.log('RESUMO:', pass, '/', pass + fail, 'passaram'); console.log('page errors:', errs);
  await b.close(); await local.parar();
})().catch(async e => { console.error('ERRO', e.message); try { await local.parar(); } catch (x) {} process.exit(1); });
