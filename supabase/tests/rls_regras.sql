-- =============================================================================
-- KORbuild Match — testes das regras de acesso (RLS) e de negócio do banco.
--
-- Rode num banco de TESTE, nunca no de produção: cria usuários fictícios.
-- Localmente: veja docs/supabase.md ("Testar o esquema"). Cada linha impressa é
-- PASS ou FAIL; no fim, o resumo.
-- =============================================================================

\set QUIET on
\set ON_ERROR_STOP on

create table if not exists public.resultados_teste (n serial, ok boolean, descricao text, detalhe text);
grant all on public.resultados_teste to anon, authenticated;
grant all on sequence public.resultados_teste_n_seq to anon, authenticated;
truncate public.resultados_teste;

-- Executa um comando como o usuário atual e registra se deu certo ou falhou como esperado.
create or replace function public.teste(descricao text, comando text, deve_falhar boolean default false)
returns void language plpgsql as $$
begin
  begin
    execute comando;
    insert into public.resultados_teste (ok, descricao, detalhe) values (not deve_falhar, descricao, case when deve_falhar then 'deveria ter falhado' end);
  exception when others then
    insert into public.resultados_teste (ok, descricao, detalhe) values (deve_falhar, descricao, sqlerrm);
  end;
end $$;

-- Confere uma condição (consulta que devolve boolean).
create or replace function public.confere(descricao text, consulta text)
returns void language plpgsql as $$
declare r boolean;
begin
  execute consulta into r;
  insert into public.resultados_teste (ok, descricao, detalhe) values (coalesce(r, false), descricao, case when not coalesce(r, false) then consulta end);
exception when others then
  insert into public.resultados_teste (ok, descricao, detalhe) values (false, descricao, sqlerrm);
end $$;

grant execute on function public.teste(text, text, boolean), public.confere(text, text) to anon, authenticated;

-- Usuários fictícios (ids fixos para os testes)
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000e1', 'rh@empresaexemplo.test', '{"tipo":"empresa","nome":"Empresa Exemplo"}'),
  ('00000000-0000-0000-0000-0000000000e2', 'rh@lojacentral.test',    '{"tipo":"empresa","nome":"Loja Central"}'),
  ('00000000-0000-0000-0000-0000000000a1', 'joao@exemplo.test',      '{"tipo":"profissional","nome":"João Silva"}'),
  ('00000000-0000-0000-0000-0000000000a2', 'mariana@exemplo.test',   '{"tipo":"profissional","nome":"Mariana Rocha"}');

select public.confere('cadastro: cria perfis, empresas e profissionais',
  $q$ select (select count(*) from perfis) = 4 and (select count(*) from empresas) = 2 and (select count(*) from profissionais) = 2 and (select count(*) from contatos) = 4 $q$);

create temp table ids as select
  (select id from empresas where nome = 'Empresa Exemplo') as e1,
  (select id from empresas where nome = 'Loja Central') as e2;
grant select on ids to anon, authenticated;

-- ----------------------------------------------------------------- EMPRESA E1
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e1', false);
set role authenticated;

select public.teste('empresa: edita o próprio perfil', $q$ update empresas set setor = 'Comércio', cidade = 'São Paulo' where dono = auth.uid() $q$);
select public.teste('empresa: não se autoverifica', $q$ update empresas set verificada = true where dono = auth.uid() $q$, true);
select public.teste('empresa: rascunho incompleto é aceito',
  $q$ insert into vagas (empresa_id, titulo) values ((select e1 from ids), 'Rascunho sem local') $q$);
select public.teste('empresa: publicar presencial sem local falha',
  $q$ insert into vagas (empresa_id, titulo, status) values ((select e1 from ids), 'Sem local', 'aberta') $q$, true);
select public.teste('empresa: publica vaga presencial completa',
  $q$ insert into vagas (empresa_id, titulo, status, cidade, pais, lat, lng, raio_valor, raio_unidade, triagem)
      values ((select e1 from ids), 'Atendente de loja', 'aberta', 'São Paulo', 'Brasil', -23.55, -46.63, 40, 'km',
              '[{"texto":"Tem disponibilidade aos sábados?","tipo":"sim_nao"}]') $q$);
select public.confere('empresa: primeira vaga publicada abre o período grátis',
  $q$ select status = 'gratis' and gratis_ate > now() + interval '89 days' from assinaturas where empresa_id = (select e1 from ids) $q$);
select public.teste('empresa: publica vaga remota (sem local)',
  $q$ insert into vagas (empresa_id, titulo, status, modelo, fuso) values ((select e1 from ids), 'Suporte ao cliente', 'aberta', 'remoto', -3) $q$);
select public.teste('empresa: terceira vaga ativa',
  $q$ insert into vagas (empresa_id, titulo, status, modelo) values ((select e1 from ids), 'Recepcionista', 'aberta', 'remoto') $q$);
select public.teste('empresa: quarta vaga ativa passa do limite do plano',
  $q$ insert into vagas (empresa_id, titulo, status, modelo) values ((select e1 from ids), 'Caixa', 'aberta', 'remoto') $q$, true);
select public.teste('empresa: mais de 3 perguntas de triagem falha',
  $q$ insert into vagas (empresa_id, titulo, triagem) values ((select e1 from ids), 'Muitas perguntas', '[{},{},{},{}]') $q$, true);
select public.teste('empresa: não publica vaga em nome de outra empresa',
  $q$ insert into vagas (empresa_id, titulo, modelo) values ((select e2 from ids), 'Invasora', 'remoto') $q$, true);
select public.teste('empresa: não ativa destaque sem pagar',
  $q$ update vagas set destaque_ate = now() + interval '30 days' where titulo = 'Recepcionista' $q$, true);
select public.confere('empresa: não altera outra empresa (RLS ignora a linha)',
  $q$ with u as (update empresas set nome = 'Hackeada' where nome = 'Loja Central' returning 1) select count(*) = 0 from u $q$);
select public.confere('empresa: não lê contatos de ninguém', $q$ select count(*) = 1 from contatos $q$);
select public.confere('empresa: vê profissionais visíveis', $q$ select count(*) = 2 from profissionais $q$);
select public.confere('empresa: não vê auditoria', $q$ select count(*) = 0 from auditoria $q$);

-- ----------------------------------------------------------------- VISITANTE
reset role;
select set_config('request.jwt.claim.sub', '', false);
set role anon;
select public.confere('visitante: vê só vagas abertas', $q$ select count(*) = 3 from vagas $q$);
select public.confere('visitante: vê perfis de empresa', $q$ select count(*) = 2 from empresas $q$);
select public.confere('visitante: não vê profissionais', $q$ select count(*) = 0 from profissionais $q$);
select public.teste('visitante: não publica vaga', $q$ insert into vagas (empresa_id, titulo) values ((select e1 from ids), 'Anônima') $q$, true);

-- ----------------------------------------------------------------- PROFISSIONAL A1 (João)
reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', false);
set role authenticated;

select public.teste('profissional: atualiza o próprio perfil',
  $q$ update profissionais set resumo = 'Atendimento · 3 anos', modelos = '{presencial,remoto}', competencias = '{Atendimento,Caixa}' where id = auth.uid() $q$);
select public.teste('profissional: não se autoverifica', $q$ update profissionais set verificado = true where id = auth.uid() $q$, true);
select public.teste('profissional: candidata-se (status forçado para "novo")',
  $q$ insert into candidaturas (vaga_id, profissional_id, status, mensagem, respostas_triagem)
      values ((select id from vagas where titulo = 'Atendente de loja'), auth.uid(), 'contratado', 'Tenho experiência!', '{"0":"Sim"}') $q$);
select public.confere('profissional: candidatura entrou como "novo"', $q$ select status = 'novo' from candidaturas where profissional_id = auth.uid() $q$);
select public.teste('profissional: candidata-se à vaga remota',
  $q$ insert into candidaturas (vaga_id, profissional_id) values ((select id from vagas where titulo = 'Suporte ao cliente'), auth.uid()) $q$);
select public.teste('profissional: não se candidata duas vezes',
  $q$ insert into candidaturas (vaga_id, profissional_id) values ((select id from vagas where titulo = 'Suporte ao cliente'), auth.uid()) $q$, true);
select public.teste('profissional: não se candidata em nome de outra pessoa',
  $q$ insert into candidaturas (vaga_id, profissional_id) values ((select id from vagas where titulo = 'Recepcionista'), '00000000-0000-0000-0000-0000000000a2') $q$, true);
select public.teste('profissional: não muda o próprio status para "conversa"',
  $q$ update candidaturas set status = 'conversa' where profissional_id = auth.uid() and vaga_id = (select id from vagas where titulo = 'Atendente de loja') $q$, true);
select public.teste('profissional: retira uma candidatura',
  $q$ update candidaturas set status = 'retirada' where profissional_id = auth.uid() and vaga_id = (select id from vagas where titulo = 'Suporte ao cliente') $q$);
select public.teste('profissional: não publica vaga', $q$ insert into vagas (empresa_id, titulo) values ((select e1 from ids), 'Do João') $q$, true);
select public.teste('profissional: segue uma empresa', $q$ insert into seguindo (profissional_id, empresa_id) values (auth.uid(), (select e1 from ids)) $q$);
select public.teste('profissional: declara uma experiência',
  $q$ insert into experiencias (profissional_id, cargo, empresa_nome, inicio, fim) values (auth.uid(), 'Atendente', 'Café Aurora', '2022-01-01', '2023-01-01') $q$);
select public.teste('profissional: não cria experiência "verificada" à mão',
  $q$ insert into experiencias (profissional_id, cargo, empresa_nome, contratacao_id) values (auth.uid(), 'Gerente', 'Falsa', gen_random_uuid()) $q$, true);

-- ----------------------------------------------------------------- PROFISSIONAL A2 (Mariana)
reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a2', false);
set role authenticated;
select public.confere('outra profissional: não vê candidaturas do João', $q$ select count(*) = 0 from candidaturas $q$);
select public.teste('outra profissional: candidata-se ao Atendente',
  $q$ insert into candidaturas (vaga_id, profissional_id) values ((select id from vagas where titulo = 'Atendente de loja'), auth.uid()) $q$);
select public.teste('outra profissional: oculta o perfil das buscas', $q$ update profissionais set visivel = false where id = auth.uid() $q$);

-- ----------------------------------------------------------------- EMPRESA E2 (Loja Central)
reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e2', false);
set role authenticated;
select public.confere('outra empresa: não vê candidaturas da Empresa Exemplo', $q$ select count(*) = 0 from candidaturas $q$);
select public.confere('outra empresa: não vê perfil oculto', $q$ select count(*) = 1 from profissionais $q$);
select public.confere('outra empresa: não vê rascunhos alheios', $q$ select count(*) = 0 from vagas where status = 'rascunho' $q$);
select public.teste('outra empresa: não registra contratação de quem nunca passou por ela',
  $q$ insert into contratacoes (empresa_id, profissional_id, registrada_por, funcao) values ((select e2 from ids), '00000000-0000-0000-0000-0000000000a1', 'empresa', 'Atendente') $q$, true);

-- ----------------------------------------------------------------- EMPRESA E1: funil e conversa
reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e1', false);
set role authenticated;
select public.confere('empresa: vê as candidaturas das suas vagas', $q$ select count(*) = 3 from candidaturas $q$);
select public.confere('empresa: vê o perfil oculto de quem se candidatou', $q$ select count(*) = 2 from profissionais $q$);
select public.teste('empresa: move candidato para "em conversa"',
  $q$ update candidaturas set status = 'conversa' where profissional_id = '00000000-0000-0000-0000-0000000000a1' and status = 'novo' $q$);
select public.teste('empresa: não marca "contratado" direto',
  $q$ update candidaturas set status = 'contratado' where profissional_id = '00000000-0000-0000-0000-0000000000a1' and status = 'conversa' $q$, true);
select public.teste('empresa: não altera a mensagem do candidato',
  $q$ update candidaturas set mensagem = 'editada' where profissional_id = '00000000-0000-0000-0000-0000000000a1' and status = 'conversa' $q$, true);
select public.teste('empresa: não reabre candidatura retirada',
  $q$ update candidaturas set status = 'novo' where status = 'retirada' $q$, true);
select public.teste('empresa: abre conversa com o João',
  $q$ insert into conversas (empresa_id, profissional_id, vaga_id) values ((select e1 from ids), '00000000-0000-0000-0000-0000000000a1', (select id from vagas where titulo = 'Atendente de loja')) $q$);
select public.teste('empresa: envia mensagem (lado vem da sessão, não do navegador)',
  $q$ insert into mensagens (conversa_id, de, texto) select id, 'profissional', 'Oi, João! Ainda está disponível?' from conversas $q$);
select public.confere('empresa: mensagem gravada como "empresa"', $q$ select de = 'empresa' and autor = auth.uid() from mensagens $q$);
select public.teste('empresa: não marca o compartilhamento do outro lado',
  $q$ update conversas set compartilhou_profissional = true $q$, true);
select public.teste('empresa: contato bloqueado antes dos dois compartilharem',
  $q$ select * from contato_da_conversa((select id from conversas)) $q$, true);
select public.teste('empresa: compartilha o próprio contato', $q$ update conversas set compartilhou_empresa = true $q$);

-- ----------------------------------------------------------------- JOÃO responde
reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', false);
set role authenticated;
select public.confere('profissional: vê a conversa e a mensagem', $q$ select count(*) = 1 from mensagens $q$);
select public.teste('profissional: responde', $q$ insert into mensagens (conversa_id, texto) select id, 'Sim! Posso começar já.' from conversas $q$);
select public.confere('conversa: "sem resposta" agora é da empresa', $q$ select ultima_mensagem_de = 'profissional' from conversas $q$);
select public.teste('profissional: não desfaz o compartilhamento da empresa', $q$ update conversas set compartilhou_empresa = false $q$, true);
select public.teste('profissional: compartilha o próprio contato', $q$ update conversas set compartilhou_profissional = true $q$);
select public.confere('profissional: recebe o contato da empresa depois dos dois',
  $q$ select email = 'rh@empresaexemplo.test' from contato_da_conversa((select id from conversas)) $q$);

reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a2', false);
set role authenticated;
select public.confere('outra profissional: não vê a conversa alheia', $q$ select count(*) = 0 from conversas $q$);
select public.confere('outra profissional: não lê mensagens alheias', $q$ select count(*) = 0 from mensagens $q$);
select public.teste('outra profissional: não escreve na conversa alheia',
  $q$ insert into mensagens (conversa_id, texto) values ((select id from conversas limit 1), 'intrusa') $q$, true);

-- ----------------------------------------------------------------- CONTRATAÇÃO
reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e1', false);
set role authenticated;
select public.teste('contratação: empresa não registra em nome do profissional',
  $q$ insert into contratacoes (empresa_id, profissional_id, registrada_por, funcao) values ((select e1 from ids), '00000000-0000-0000-0000-0000000000a1', 'profissional', 'Atendente') $q$, true);
select public.teste('contratação: empresa registra com o combinado',
  $q$ insert into contratacoes (empresa_id, profissional_id, vaga_id, candidatura_id, registrada_por, funcao, tipo, moeda, valor, periodo, data_inicio, jornada, status)
      select (select e1 from ids), c.profissional_id, c.vaga_id, c.id, 'empresa', 'Atendente de loja', 'integral', 'BRL', 2200, 'mes', current_date - 30, 'Seg a sex, 9h às 18h', 'confirmado'
      from candidaturas c where c.profissional_id = '00000000-0000-0000-0000-0000000000a1' and c.status = 'conversa' $q$);
select public.confere('contratação: nasce "aguardando" mesmo se o navegador mandar outro status', $q$ select status = 'aguardando' from contratacoes $q$);
select public.teste('contratação: empresa não confirma a própria', $q$ update contratacoes set status = 'confirmado' $q$, true);
select public.teste('contratação: não registra outra enquanto esta aguarda',
  $q$ insert into contratacoes (empresa_id, profissional_id, registrada_por, funcao) values ((select e1 from ids), '00000000-0000-0000-0000-0000000000a1', 'empresa', 'Outra') $q$, true);
select public.teste('contratação: empresa não muda o combinado sem contestação', $q$ update contratacoes set valor = 1000 $q$, true);

reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', false);
set role authenticated;
select public.teste('contratação: contestar exige explicação', $q$ update contratacoes set status = 'contestado' $q$, true);
select public.teste('contratação: profissional contesta', $q$ update contratacoes set status = 'contestado', contestacao_texto = 'O salário combinado foi R$ 2.400.' $q$);
select public.teste('contratação: profissional não muda o combinado', $q$ update contratacoes set valor = 9999 $q$, true);

reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e1', false);
set role authenticated;
select public.teste('contratação: empresa corrige o combinado e devolve para confirmar',
  $q$ update contratacoes set valor = 2400, resposta_texto = 'Corrigido, obrigado!', status = 'aguardando' $q$);

reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', false);
set role authenticated;
select public.teste('contratação: profissional confirma', $q$ update contratacoes set status = 'confirmado' $q$);
select public.confere('contratação: candidatura virou "contratado"',
  $q$ select status = 'contratado' from candidaturas where id = (select candidatura_id from contratacoes) $q$);
select public.confere('contratação: experiência verificada no perfil',
  $q$ select count(*) = 1 from experiencias where contratacao_id is not null and empresa_nome = 'Empresa Exemplo' and cargo = 'Atendente de loja' $q$);
select public.teste('experiência verificada: não edita o cargo', $q$ update experiencias set cargo = 'Gerente geral' where contratacao_id is not null $q$, true);
select public.teste('experiência verificada: não apaga', $q$ delete from experiencias where contratacao_id is not null $q$, true);
select public.teste('experiência verificada: oculta o nome da empresa', $q$ update experiencias set mostrar_empresa = false where contratacao_id is not null $q$);
select public.teste('avaliação: fechada enquanto o vínculo está ativo',
  $q$ insert into avaliacoes (contratacao_id, autor_tipo, respostas, nota) select id, 'profissional', '{"pagamento":"Sim"}', 5 from contratacoes $q$, true);
select public.teste('vínculo: fim no futuro não vale', $q$ update contratacoes set encerrada_em = current_date + 1 $q$, true);
select public.teste('vínculo: fim antes do início não vale', $q$ update contratacoes set encerrada_em = current_date - 60 $q$, true);
select public.teste('vínculo: profissional registra o fim', $q$ update contratacoes set encerrada_em = current_date $q$);
select public.confere('vínculo: prazo de avaliação de 7 dias', $q$ select avaliar_ate > now() + interval '6 days' from contratacoes $q$);
select public.teste('avaliação: não avalia em nome da empresa',
  $q$ insert into avaliacoes (contratacao_id, autor_tipo, respostas, nota) select id, 'empresa', '{}', 1 from contratacoes $q$, true);

reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e1', false);
set role authenticated;
select public.teste('avaliação: empresa avalia o profissional',
  $q$ insert into avaliacoes (contratacao_id, autor_tipo, respostas, nota, comentario)
      select id, 'empresa', '{"entregou":"Sim","horarios":"Sim","comunicacao":"Sim","novamente":"Sim"}', 5, 'Ótimo atendimento.' from contratacoes $q$);
select public.teste('avaliação: só uma por lado',
  $q$ insert into avaliacoes (contratacao_id, autor_tipo, respostas, nota) select id, 'empresa', '{}', 1 from contratacoes $q$, true);
select public.confere('avaliação: o autor vê a própria', $q$ select count(*) = 1 from avaliacoes $q$);

reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', false);
set role authenticated;
select public.confere('avaliação cega: o avaliado não vê antes de enviar a dele', $q$ select count(*) = 0 from avaliacoes $q$);
select public.confere('avaliação cega: a visão pública também esconde enquanto falta um lado', $q$ select count(*) = 0 from avaliacoes_publicas $q$);
select public.confere('reputação: ainda não conta a avaliação escondida',
  $q$ select avaliacoes = 0 and trabalhos = 1 from reputacao_profissionais where profissional_id = auth.uid() $q$);
select public.teste('avaliação: profissional avalia a empresa',
  $q$ insert into avaliacoes (contratacao_id, autor_tipo, respostas, nota)
      select id, 'profissional', '{"pagamento":"Sim","anuncio":"Parcialmente","condicoes":"Sim","ambiente":"Sim","novamente":"Sim"}', 4 from contratacoes $q$);
select public.confere('avaliação cega: com as duas enviadas, as duas aparecem', $q$ select count(*) = 2 from avaliacoes $q$);
select public.teste('avaliação: profissional responde à avaliação recebida',
  $q$ update avaliacoes set resposta = 'Obrigado pela oportunidade!' where autor_tipo = 'empresa' $q$);
select public.teste('avaliação: não responde à própria', $q$ update avaliacoes set resposta = 'eu mesmo' where autor_tipo = 'profissional' $q$, true);
select public.teste('avaliação: enviada não muda a nota', $q$ update avaliacoes set nota = 1 where autor_tipo = 'profissional' $q$, true);
select public.confere('reputação do profissional', $q$ select nota = 5.0 and avaliacoes = 1 and contratariam_de_novo_pct = 100 and em_construcao from reputacao_profissionais where profissional_id = auth.uid() $q$);
select public.confere('reputação da empresa', $q$ select nota = 4.0 and pagou_conforme_pct = 100 and correspondia_pct = 0 from reputacao_empresas where empresa_id = (select e1 from ids) $q$);
select public.teste('denúncia: profissional denuncia uma vaga',
  $q$ insert into denuncias (alvo_tipo, alvo_id, motivo) values ('vaga', (select id from vagas where titulo = 'Recepcionista'), 'Vaga falsa') $q$);

reset role;
set role anon;
select public.confere('visitante: vê avaliações publicadas', $q$ select count(*) = 2 from avaliacoes $q$);
select public.confere('visitante: visão pública com autor resumido e empresa oculta a pedido do profissional',
  $q$ select bool_and(case autor_tipo when 'profissional' then autor_nome = 'João S.' else autor_nome = 'Empresa não divulgada' end) and count(*) = 2 from avaliacoes_publicas $q$);

-- ----------------------------------------------------------------- CONVERSAS E PERFIL OCULTO (etapa 4)
reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e2', false);
set role authenticated;
select public.teste('conversa: empresa não abre conversa com perfil oculto que não se candidatou a ela',
  $q$ insert into conversas (empresa_id, profissional_id) values ((select e2 from ids), '00000000-0000-0000-0000-0000000000a2') $q$, true);
select public.teste('conversa: empresa abre conversa com perfil visível',
  $q$ insert into conversas (empresa_id, profissional_id) values ((select e2 from ids), '00000000-0000-0000-0000-0000000000a1') $q$);
reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a2', false);
set role authenticated;
select public.teste('conversa: profissional oculta abre conversa com outra empresa',
  $q$ insert into conversas (empresa_id, profissional_id) values ((select e2 from ids), auth.uid()) $q$);
reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e2', false);
set role authenticated;
select public.confere('conversa: a empresa vê o perfil oculto de quem conversa com ela', $q$ select count(*) = 1 from profissionais where id = '00000000-0000-0000-0000-0000000000a2' $q$);

-- ----------------------------------------------------------------- CONVITES E ENCERRAMENTO
reset role;
update assinaturas set limite_convites_mes = 1;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e1', false);
set role authenticated;
select public.teste('convite: empresa convida dentro do limite',
  $q$ insert into convites (empresa_id, profissional_id, mensagem) values ((select e1 from ids), '00000000-0000-0000-0000-0000000000a2', 'Seu perfil combina!') $q$);
select public.teste('convite: passa do limite do mês',
  $q$ insert into convites (empresa_id, profissional_id) values ((select e1 from ids), '00000000-0000-0000-0000-0000000000a1') $q$, true);
select public.teste('vaga: empresa encerra o Atendente como preenchida', $q$ update vagas set status = 'preenchida' where titulo = 'Atendente de loja' $q$);
select public.confere('vaga encerrada: candidatos em andamento são avisados',
  $q$ select status = 'encerrada' from candidaturas where profissional_id = '00000000-0000-0000-0000-0000000000a2' $q$);
select public.teste('vaga encerrada não reabre', $q$ update vagas set status = 'aberta' where titulo = 'Atendente de loja' $q$, true);
select public.teste('vaga: com uma vaga encerrada, publica outra', $q$ update vagas set status = 'aberta', modelo = 'remoto' where titulo = 'Rascunho sem local' $q$);

reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a2', false);
set role authenticated;
select public.teste('convite: a profissional recusa', $q$ update convites set status = 'recusado' $q$);
select public.teste('convite: não altera a mensagem da empresa', $q$ update convites set mensagem = 'mudei' $q$, true);

reset role;
update assinaturas set gratis_ate = now() - interval '1 day';
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e1', false);
set role authenticated;
select public.teste('plano: grátis vencido não publica', $q$ update vagas set status = 'pausada' where titulo = 'Recepcionista' $q$);
select public.teste('plano: grátis vencido não reativa vaga', $q$ update vagas set status = 'aberta' where titulo = 'Recepcionista' $q$, true);

reset role;
select set_config('request.jwt.claim.sub', '', false);
select public.confere('auditoria: contratação e avaliações registradas', $q$ select count(*) >= 7 from auditoria $q$);

-- ----------------------------------------------------------------- NOTIFICAÇÕES (etapa 6)
reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', false);
set role authenticated;
select public.confere('notificações: o profissional recebe os avisos dele (pedido de contratação, mensagem, avaliação)',
  $q$ select count(*) filter (where categoria = 'contratacao') >= 1 and count(*) filter (where categoria = 'mensagens') >= 1 and count(*) filter (where categoria = 'avaliacoes') >= 1
      and bool_and(user_id = auth.uid()) from notificacoes $q$);
select public.teste('notificações: não cria aviso direto', $q$ insert into notificacoes (user_id, categoria, titulo) values (auth.uid(), 'mensagens', 'falso') $q$, true);
select public.teste('notificações: marca como lida', $q$ update notificacoes set lida_em = now() where user_id = auth.uid() $q$);
select public.teste('notificações: não altera o texto do aviso', $q$ update notificacoes set titulo = 'outro' where user_id = auth.uid() $q$, true);
select public.teste('notificações: chama a função de aviso direto', $q$ select public.notificar(auth.uid(), 'mensagens', 'x', 'x', 'x') $q$, true);
reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a2', false);
set role authenticated;
select public.confere('notificações: cada um só vê os seus', $q$ select bool_and(user_id = auth.uid()) and count(*) >= 1 from notificacoes $q$);
reset role;
select public.confere('notificações: avisos vão sempre para o outro lado (ninguém é avisado da própria mensagem)',
  $q$ select not exists (select 1 from notificacoes n join mensagens m on n.link = 'conversa.html?id=' || m.conversa_id and n.user_id = m.autor
                         where n.texto = left(m.texto, 200)) $q$);

-- ----------------------------------------------------------------- LEMBRETES, FILA DE E-MAILS E PLANOS (etapa 6, parte 2)
reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a2', false);
set role authenticated;
select public.teste('lembretes: a tela não roda os lembretes', $q$ select public.lembretes_diarios() $q$, true);
select public.teste('e-mails: a tela não lê a fila de e-mails', $q$ select * from public.avisos_pendentes_email(10, 0) $q$, true);
select public.teste('e-mails: a tela não marca e-mails como enviados', $q$ select public.marcar_avisos_enviados(array[1::bigint]) $q$, true);
reset role;
set role anon;
select public.confere('planos: o preço do Essencial é público, em dólar (definido no painel)', $q$ select count(*) = 1 and bool_and(moeda = 'USD' and preco = 79) from planos where id = 'essencial' $q$);

reset role;
select set_config('request.jwt.claim.sub', '', false);
-- Candidatura "nova" há 8 dias, sem resposta
update vagas set status = 'pausada' where titulo = 'Recepcionista';
update assinaturas set gratis_ate = now() + interval '30 days';
update vagas set status = 'aberta' where titulo = 'Recepcionista';
insert into candidaturas (vaga_id, profissional_id, status, criado_em)
  values ((select id from vagas where titulo = 'Recepcionista'), '00000000-0000-0000-0000-0000000000a2', 'novo', now() - interval '8 days');
update assinaturas set gratis_ate = current_date + 7 + interval '12 hours';
select public.confere('lembretes: rodam e contam o que avisaram', $q$ select (public.lembretes_diarios() ->> 'candidaturas')::int = 1 $q$);
select public.confere('lembretes: a empresa é lembrada do candidato esperando',
  $q$ select count(*) = 1 from notificacoes n join empresas e on e.dono = n.user_id where e.nome = 'Empresa Exemplo' and n.titulo = '1 candidato esperando resposta há mais de 7 dias' $q$);
select public.confere('lembretes: o profissional sabe que a empresa foi lembrada',
  $q$ select count(*) = 1 from notificacoes where user_id = '00000000-0000-0000-0000-0000000000a2' and titulo = 'Candidatura sem resposta' $q$);
select public.confere('lembretes: aviso de 7 dias do período grátis',
  $q$ select count(*) = 1 from notificacoes where categoria = 'plano' and titulo = 'Faltam 7 dias do período grátis' $q$);
select public.confere('lembretes: rodar de novo não repete', $q$ select (public.lembretes_diarios() ->> 'candidaturas')::int = 0 $q$);

set role service_role;
select public.confere('e-mails: a fila agrupa os avisos por pessoa, com o e-mail',
  $q$ select count(*) >= 2 and bool_and(email like '%@%' and jsonb_array_length(avisos) >= 1) from public.avisos_pendentes_email(50, 0) $q$);
reset role;
insert into notificacao_prefs (user_id, categoria, push, email) values ('00000000-0000-0000-0000-0000000000a2', 'candidaturas', true, false)
  on conflict (user_id, categoria) do update set email = false;
set role service_role;
select public.confere('e-mails: respeita "Por e-mail" desligado',
  $q$ select not exists (select 1 from public.avisos_pendentes_email(50, 0) f, jsonb_array_elements(f.avisos) a
                         where f.user_id = '00000000-0000-0000-0000-0000000000a2' and a ->> 'categoria' = 'candidaturas') $q$);
select public.confere('e-mails: marcar como enviados',
  $q$ select public.marcar_avisos_enviados(array(select (a ->> 'id')::bigint from public.avisos_pendentes_email(50, 0) f, jsonb_array_elements(f.avisos) a)) > 0 $q$);
select public.confere('e-mails: enviados saem da fila', $q$ select not exists (select 1 from public.avisos_pendentes_email(50, 0)) $q$);
reset role;

-- ----------------------------------------------------------------- COTAÇÃO DO DÓLAR (preço em US$, cobrado em reais)
insert into cotacoes (par, taxa, data) values ('USD/BRL', 5.4721, '2026-10-01') on conflict do nothing;
set role anon;
select public.confere('cotação: pública para mostrar o valor em reais', $q$ select count(*) = 1 from cotacoes where par = 'USD/BRL' $q$);
reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', false);
set role authenticated;
select public.teste('cotação: a tela não grava cotação', $q$ insert into cotacoes (par, taxa, data) values ('USD/BRL', 1, '2026-10-02') $q$, true);
select public.confere('cotação: a tela não altera cotação', $q$ with u as (update cotacoes set taxa = 1 returning 1) select count(*) = 0 from u $q$);
select public.confere('cotação: empresa não muda o valor cobrado da própria assinatura',
  $q$ with u as (update assinaturas set valor_cobrado = 1 where empresa_id in (select id from empresas where dono = auth.uid()) returning 1) select count(*) = 0 from u $q$);
reset role;
select set_config('request.jwt.claim.sub', '', false);

-- ----------------------------------------------------------------- RESUMO
\set QUIET off
select n, case when ok then 'PASS' else 'FAIL' end as r, descricao, detalhe from public.resultados_teste order by n;
select count(*) filter (where ok) || ' / ' || count(*) || ' passaram' as resumo from public.resultados_teste;
