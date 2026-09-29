/*
 * KORbuild Match — DADOS FICTÍCIOS para validação.
 * Edite este arquivo para mudar nomes, números e vagas exibidos nas telas.
 * Nenhum dado aqui é real.
 */
(function () {
  // Respostas objetivas de uma avaliação, na ordem das perguntas.
  function resp(entregou, horarios, comunicacao, novamente) {
    return { entregou: entregou, horarios: horarios, comunicacao: comunicacao, novamente: novamente };
  }

  // Respostas objetivas de uma avaliação de empresa, na ordem das perguntas.
  function respE(pagamento, anuncio, condicoes, ambiente, novamente) {
    return { pagamento: pagamento, anuncio: anuncio, condicoes: condicoes, ambiente: ambiente, novamente: novamente };
  }

  // O combinado de uma contratação: referência usada em "Registrar o combinado" e nas avaliações.
  function combinado(funcao, tipoContratacao, moeda, periodo, valor, dataInicio, jornada) {
    return { funcao: funcao, tipoContratacao: tipoContratacao, moeda: moeda, periodo: periodo, valor: valor, dataInicio: dataInicio, jornada: jornada };
  }

  // Reputação da Empresa Exemplo: a mesma na jornada da empresa e na do profissional.
  var REP_EXEMPLO = { nota: '4,7', contratacoes: 23, pagouConforme: '96%' };

  window.MOCK = {
    empresa: {
      nome: 'Empresa Exemplo',
      iniciais: 'EE',
      verificada: true,
      reputacao: REP_EXEMPLO,

      // Quantos requisitos uma vaga tem, quando ela não informa (vagas publicadas na demonstração).
      requisitosPadrao: 5,

      // "Precisa da sua atenção". Os números ({n}) vêm da lista de candidatos.
      pendencias: [
        {
          id: 'preencher',
          destaque: true,
          vaga: 'recepcionista',
          titulo: 'Quem preencheu a vaga de Recepcionista?',
          texto: 'Indique a pessoa contratada. Ela confirma, e o vínculo passa a contar no histórico e na reputação dos dois.',
          acao: 'Marcar como preenchida',
          href: 'preencher-vaga.html?vaga=recepcionista'
        },
        { id: 'novos', icone: 'users', vaga: 'atendente', titulo: '{n} candidatos novos', texto: 'Atendente de loja', href: 'candidatos.html?vaga=atendente' },
        { id: 'avaliar', icone: 'star', tom: 'amber', profissional: 'ana-souza', titulo: 'Avalie Ana Souza', texto: 'Vendedora · prazo termina em 5 dias', href: 'avaliar-profissional.html?id=ana-souza' },
        { id: 'mensagens', icone: 'message', titulo: '2 mensagens sem resposta', texto: 'Candidatos de Atendente de loja' }
      ],

      // Vagas, da mais recente para a mais antiga. Vagas publicadas na demonstração entram na frente.
      vagas: [
        { id: 'recepcionista', titulo: 'Recepcionista', status: 'Aberta', posicoes: 1 },
        { id: 'atendente', titulo: 'Atendente de loja', status: 'Aberta', posicoes: 2 },
        { id: 'auxiliar', titulo: 'Auxiliar administrativo', status: 'Pausada', posicoes: 1 },
        { id: 'vendedora', titulo: 'Vendedora', status: 'Preenchida', posicoes: 1, detalhe: 'Preenchida por Ana Souza · confirmado' }
      ],

      // Etapas do funil de candidatos. "manual: false" não aparece no seletor de status.
      statusCandidato: [
        { id: 'novo', rotulo: 'Novos', singular: 'Novo' },
        { id: 'conversa', rotulo: 'Em conversa', singular: 'Em conversa' },
        { id: 'nao', rotulo: 'Não selecionados', singular: 'Não selecionado' },
        { id: 'contratado', rotulo: 'Contratados', singular: 'Contratado', manual: false }
      ],

      // Quem se candidatou a cada vaga. "atende" = quantos requisitos da vaga a pessoa atende.
      // "data" = quando se candidatou; usada para o prazo de 7 dias ("Responder até").
      candidatos: {
        recepcionista: [
          { id: 'joao-silva', atende: 5, status: 'novo', data: '2026-09-23' },
          { id: 'rafael-lima', atende: 4, status: 'conversa', data: '2026-09-21' },
          { id: 'fernanda-costa', atende: 4, status: 'conversa', data: '2026-09-22' },
          { id: 'juliana-alves', atende: 5, status: 'novo', data: '2026-09-26' },
          { id: 'diego-martins', atende: 4, status: 'novo', data: '2026-09-27' },
          { id: 'thiago-pereira', atende: 3, status: 'nao', data: '2026-09-10' }
        ],
        atendente: [
          { id: 'mariana-rocha', atende: 5, status: 'conversa', data: '2026-09-15' },
          { id: 'paulo-andrade', atende: 4, status: 'conversa', data: '2026-09-18' },
          { id: 'lucas-teixeira', atende: 4, status: 'novo', data: '2026-09-25' },
          { id: 'thiago-pereira', atende: 5, status: 'novo', data: '2026-09-26' },
          { id: 'juliana-alves', atende: 5, status: 'novo', data: '2026-09-27' },
          { id: 'diego-martins', atende: 3, status: 'novo', data: '2026-09-24' },
          { id: 'fernanda-costa', atende: 3, status: 'nao', data: '2026-09-05' }
        ],
        auxiliar: [
          { id: 'fernanda-costa', atende: 5, status: 'conversa', data: '2026-09-12' },
          { id: 'diego-martins', atende: 5, status: 'novo', data: '2026-09-24' },
          { id: 'paulo-andrade', atende: 3, status: 'nao', data: '2026-08-01' }
        ],
        vendedora: [
          { id: 'ana-souza', atende: 5, status: 'contratado', data: '2026-06-01' },
          { id: 'carla-mendes', atende: 4, status: 'nao', data: '2026-05-20' }
        ]
      },

      // Indicações da plataforma por vaga aberta (quem ainda não se candidatou).
      indicados: {
        recepcionista: [
          { id: 'mariana-rocha', atende: 5 },
          { id: 'paulo-andrade', atende: 4 },
          { id: 'lucas-teixeira', atende: 5 }
        ],
        atendente: [
          { id: 'carla-mendes', atende: 5 },
          { id: 'rafael-lima', atende: 4 },
          { id: 'beatriz-nunes', atende: 4 }
        ]
      },

      // Indicações para qualquer vaga publicada na demonstração.
      indicadosPadrao: [
        { id: 'mariana-rocha', atende: 5 },
        { id: 'carla-mendes', atende: 5 },
        { id: 'lucas-teixeira', atende: 4 }
      ],

      // Avaliação cega do profissional. "ref" liga a pergunta a um campo do combinado, mostrado como referência.
      avaliacao: {
        prazoPadrao: 7,
        limiteComentario: 300,
        respostas: ['Sim', 'Não', 'Parcialmente'],
        perguntas: [
          { id: 'entregou', texto: 'Entregou o trabalho combinado?', ref: 'funcao' },
          { id: 'horarios', texto: 'Cumpriu horários e prazos?', ref: 'jornada' },
          { id: 'comunicacao', texto: 'Comunicação clara e profissional?' },
          { id: 'novamente', texto: 'Contrataria novamente?' }
        ],
        pendentes: {
          'ana-souza': { vaga: 'Vendedora', prazoDias: 5, combinado: combinado('Vendedora', 'Tempo integral', 'BRL', 'mes', 1800, '2026-06-01', 'Seg a sáb, 9h às 18h') }
        }
      },

      // Opções do formulário "Publicar vaga". Não há campos de idade, gênero, raça,
      // religião, estado civil, nacionalidade ou foto: são proibidos por lei em muitos países.
      formulario: {
        paises: ['Brasil', 'Portugal', 'Estados Unidos', 'Canadá', 'Reino Unido', 'Alemanha', 'Espanha', 'Argentina', 'México'],
        modelos: [
          { id: 'presencial', rotulo: 'Presencial' },
          { id: 'hibrido', rotulo: 'Híbrido' },
          { id: 'remoto', rotulo: 'Remoto' }
        ],
        tipos: ['Tempo integral', 'Meio período', 'Temporário', 'Freelancer'],
        moedas: [
          { id: 'BRL', rotulo: 'R$ · Real' },
          { id: 'USD', rotulo: 'US$ · Dólar' },
          { id: 'EUR', rotulo: '€ · Euro' },
          { id: 'GBP', rotulo: '£ · Libra' }
        ],
        periodos: [
          { id: 'hora', rotulo: 'por hora' },
          { id: 'mes', rotulo: 'por mês' },
          { id: 'ano', rotulo: 'por ano' }
        ],
        idiomas: ['Português', 'Inglês', 'Espanhol', 'Francês', 'Alemão', 'Italiano', 'Mandarim', 'Libras'],
        niveis: ['Básico', 'Intermediário', 'Avançado', 'Fluente'],
        experiencias: ['Sem experiência', 'Até 1 ano', '1 a 2 anos', '3 a 5 anos', 'Mais de 5 anos'],
        limiteCompetencias: 12
      }
    },

    // Perfis dos profissionais (candidatos e indicados). A chave é o id usado nos links.
    // "canal" é o meio de contato preferido, usado quando o WhatsApp é liberado no chat (padrão: whatsapp).
    profissionais: {
      'mariana-rocha': {
        nome: 'Mariana Rocha', iniciais: 'MR', cor: '#DCE6F7',
        resumo: 'Recepcionista · 4 anos de experiência',
        local: 'São Paulo, SP · Brasil', disponibilidade: 'Disponível imediatamente',
        nota: '4,8', trabalhos: 9, contrataria: '100%', verificado: true,
        experienciaVerificada: [
          { cargo: 'Recepcionista', empresa: 'Clínica Bem Viver', periodo: '2024 – 2025' },
          { cargo: 'Recepcionista', empresa: 'Hotel Vista Mar', periodo: '2023 – 2024' },
          { cargo: 'Atendente', empresa: 'Café Aurora', periodo: '2022 – 2023' }
        ],
        experienciaDeclarada: [
          { cargo: 'Auxiliar de recepção', empresa: 'Escritório Prado', periodo: '2021 – 2022' }
        ],
        competencias: ['Atendimento ao público', 'Agenda e telefonia', 'Pacote Office', 'Cadastro de clientes'],
        idiomas: ['Português · Nativo', 'Inglês · Intermediário'],
        formacao: ['Técnico em Administração · concluído'],
        avaliacoes: [
          { empresa: 'Clínica Bem Viver', quando: 'há 2 meses', nota: 5, respostas: resp('Sim', 'Sim', 'Sim', 'Sim'),
            comentario: 'Recepção muito organizada e sempre cordial com os pacientes.', resposta: 'Obrigada! Foi um prazer trabalhar com a equipe.' },
          { empresa: 'Hotel Vista Mar', quando: 'há 1 ano', nota: 5, respostas: resp('Sim', 'Sim', 'Sim', 'Sim'),
            comentario: 'Pontual e comunicativa, lidou bem com a alta temporada.' }
        ]
      },

      'paulo-andrade': {
        nome: 'Paulo Andrade', iniciais: 'PA', cor: '#F3E6D6',
        resumo: 'Atendimento ao público · 6 anos',
        local: 'Campinas, SP · Brasil', disponibilidade: 'Disponível em 15 dias',
        nota: '4,7', trabalhos: 14, contrataria: '93%', verificado: true,
        experienciaVerificada: [
          { cargo: 'Atendente de balcão', empresa: 'Loja Central', periodo: '2024 – 2025' },
          { cargo: 'Atendente', empresa: 'Grupo Horizonte', periodo: '2022 – 2024' }
        ],
        experienciaDeclarada: [
          { cargo: 'Operador de caixa', empresa: 'Mercado Bom Preço', periodo: '2019 – 2022' }
        ],
        competencias: ['Atendimento ao público', 'Resolução de conflitos', 'Operação de caixa', 'Vendas consultivas'],
        idiomas: ['Português · Nativo', 'Espanhol · Básico'],
        formacao: ['Ensino médio · concluído', 'Curso de atendimento ao cliente · 40 h'],
        avaliacoes: [
          { empresa: 'Loja Central', quando: 'há 4 meses', nota: 5, respostas: resp('Sim', 'Sim', 'Sim', 'Sim'),
            comentario: 'Ótimo com clientes difíceis. Ajudou a treinar quem entrou depois dele.' },
          { empresa: 'Grupo Horizonte', quando: 'há 1 ano', nota: 4, respostas: resp('Sim', 'Parcialmente', 'Sim', 'Sim'),
            comentario: 'Bom trabalho, com alguns atrasos no início do contrato.', resposta: 'Ajustei o meu deslocamento e passei a chegar antes do horário.' }
        ]
      },

      'lucas-teixeira': {
        nome: 'Lucas Teixeira', iniciais: 'LT', cor: '#E4E9F1',
        resumo: 'Recepcionista · 2 anos de experiência',
        local: 'Guarulhos, SP · Brasil', disponibilidade: 'Disponível imediatamente',
        nota: null, trabalhos: 0, contrataria: null, verificado: false, novo: true,
        experienciaVerificada: [],
        experienciaDeclarada: [
          { cargo: 'Recepcionista', empresa: 'Studio Fit', periodo: '2024 – 2026' }
        ],
        competencias: ['Atendimento ao público', 'Agendamento', 'Pacote Office'],
        idiomas: ['Português · Nativo', 'Inglês · Básico'],
        formacao: ['Ensino médio · concluído'],
        avaliacoes: []
      },

      'carla-mendes': {
        nome: 'Carla Mendes', iniciais: 'CM', cor: '#E3F4EB',
        resumo: 'Vendas e atendimento · 3 anos',
        local: 'São Paulo, SP · Brasil', disponibilidade: 'Disponível imediatamente',
        nota: '4,9', trabalhos: 7, contrataria: '100%', verificado: true,
        experienciaVerificada: [
          { cargo: 'Vendedora', empresa: 'Loja Central', periodo: '2024 – 2025' },
          { cargo: 'Atendente de loja', empresa: 'Boutique Alameda', periodo: '2023 – 2024' }
        ],
        experienciaDeclarada: [
          { cargo: 'Promotora de vendas', empresa: 'Agência Impulso', periodo: '2022 – 2023' }
        ],
        competencias: ['Vendas', 'Atendimento ao público', 'Visual merchandising', 'Controle de estoque'],
        idiomas: ['Português · Nativo', 'Inglês · Intermediário'],
        formacao: ['Tecnólogo em Gestão Comercial · cursando'],
        avaliacoes: [
          { empresa: 'Loja Central', quando: 'há 3 meses', nota: 5, respostas: resp('Sim', 'Sim', 'Sim', 'Sim'),
            comentario: 'Superou as metas de vendas em todos os meses.', resposta: 'Aprendi muito com a equipe. Obrigada!' }
        ]
      },

      'rafael-lima': {
        nome: 'Rafael Lima', iniciais: 'RL', cor: '#DCE6F7',
        resumo: 'Atendente de loja · 5 anos',
        local: 'Osasco, SP · Brasil', disponibilidade: 'Disponível em 30 dias',
        nota: '4,6', trabalhos: 11, contrataria: '90%', verificado: true, canal: 'sms',
        experienciaVerificada: [
          { cargo: 'Atendente de loja', empresa: 'Grupo Horizonte', periodo: '2024 – 2025' },
          { cargo: 'Atendente', empresa: 'Papelaria Central', periodo: '2022 – 2024' }
        ],
        experienciaDeclarada: [
          { cargo: 'Estoquista', empresa: 'Distribuidora Norte', periodo: '2020 – 2022' }
        ],
        competencias: ['Atendimento ao público', 'Operação de caixa', 'Organização de estoque'],
        idiomas: ['Português · Nativo'],
        formacao: ['Ensino médio · concluído'],
        avaliacoes: [
          { empresa: 'Grupo Horizonte', quando: 'há 5 meses', nota: 4, respostas: resp('Sim', 'Sim', 'Parcialmente', 'Sim'),
            comentario: 'Trabalho sólido. Pode melhorar o retorno de mensagens fora do turno.' }
        ]
      },

      'beatriz-nunes': {
        nome: 'Beatriz Nunes', iniciais: 'BN', cor: '#F3E6D6',
        resumo: 'Primeiro emprego · curso de atendimento',
        local: 'Santo André, SP · Brasil', disponibilidade: 'Disponível imediatamente',
        nota: null, trabalhos: 0, contrataria: null, verificado: false, novo: true,
        experienciaVerificada: [],
        experienciaDeclarada: [
          { cargo: 'Voluntária de atendimento', empresa: 'Feira Solidária do Bairro', periodo: '2025' }
        ],
        competencias: ['Atendimento ao público', 'Comunicação', 'Trabalho em equipe'],
        idiomas: ['Português · Nativo', 'Inglês · Básico'],
        formacao: ['Ensino médio · concluído', 'Curso de atendimento · 60 h'],
        avaliacoes: []
      },

      'joao-silva': {
        nome: 'João Silva', iniciais: 'JS', cor: '#DCE6F7',
        resumo: 'Recepcionista · 3 anos de experiência',
        local: 'São Paulo, SP · Brasil', disponibilidade: 'Disponível imediatamente',
        nota: '4,8', trabalhos: 6, contrataria: '100%', verificado: true,
        experienciaVerificada: [
          { cargo: 'Atendente', empresa: 'Loja Central', periodo: '2025 – 2026' },
          { cargo: 'Recepcionista', empresa: 'Hotel Vista Mar', periodo: '2024 – 2025' },
          { cargo: 'Recepcionista', empresa: 'Clínica Bem Viver', periodo: '2023 – 2024' }
        ],
        experienciaDeclarada: [
          { cargo: 'Auxiliar administrativo', empresa: 'Contabilidade Souza', periodo: '2022 – 2023' }
        ],
        competencias: ['Atendimento ao público', 'Agenda e telefonia', 'Pacote Office', 'Organização'],
        idiomas: ['Português · Nativo', 'Inglês · Intermediário'],
        formacao: ['Tecnólogo em Gestão de Pessoas · concluído'],
        avaliacoes: [
          { empresa: 'Hotel Vista Mar', quando: 'há 6 meses', nota: 5, respostas: resp('Sim', 'Sim', 'Sim', 'Sim'),
            comentario: 'Recebeu bem os hóspedes e resolveu imprevistos com calma.', resposta: 'Agradeço a confiança!' }
        ]
      },

      'ana-souza': {
        nome: 'Ana Souza', iniciais: 'AS', cor: '#E3F4EB',
        resumo: 'Vendedora · 5 anos de experiência',
        local: 'São Paulo, SP · Brasil', disponibilidade: 'Em contrato atual',
        nota: '4,9', trabalhos: 8, contrataria: '100%', verificado: true,
        experienciaVerificada: [
          { cargo: 'Vendedora', empresa: 'Empresa Exemplo', periodo: '2026 – atual' },
          { cargo: 'Vendedora', empresa: 'Loja Central', periodo: '2024 – 2025' },
          { cargo: 'Consultora de vendas', empresa: 'Boutique Alameda', periodo: '2022 – 2024' }
        ],
        experienciaDeclarada: [
          { cargo: 'Balconista', empresa: 'Farmácia Vida', periodo: '2020 – 2022' }
        ],
        competencias: ['Vendas', 'Negociação', 'Atendimento ao público', 'Fidelização de clientes'],
        idiomas: ['Português · Nativo', 'Espanhol · Intermediário'],
        formacao: ['Ensino superior em Marketing · cursando'],
        avaliacoes: [
          { empresa: 'Loja Central', quando: 'há 8 meses', nota: 5, respostas: resp('Sim', 'Sim', 'Sim', 'Sim'),
            comentario: 'Referência de vendas na equipe.' }
        ]
      },

      'fernanda-costa': {
        nome: 'Fernanda Costa', iniciais: 'FC', cor: '#F3E6D6',
        resumo: 'Assistente administrativa · 3 anos',
        local: 'São Bernardo do Campo, SP · Brasil', disponibilidade: 'Disponível em 15 dias',
        nota: '4,5', trabalhos: 5, contrataria: '80%', verificado: true,
        experienciaVerificada: [
          { cargo: 'Assistente administrativa', empresa: 'Grupo Horizonte', periodo: '2024 – 2025' },
          { cargo: 'Auxiliar administrativa', empresa: 'Transportes Rota', periodo: '2023 – 2024' }
        ],
        experienciaDeclarada: [
          { cargo: 'Estagiária administrativa', empresa: 'Instituto Fênix', periodo: '2022 – 2023' }
        ],
        competencias: ['Rotinas administrativas', 'Excel', 'Atendimento telefônico', 'Arquivo e documentos'],
        idiomas: ['Português · Nativo', 'Inglês · Intermediário'],
        formacao: ['Administração · cursando'],
        avaliacoes: [
          { empresa: 'Grupo Horizonte', quando: 'há 7 meses', nota: 4, respostas: resp('Sim', 'Sim', 'Sim', 'Parcialmente'),
            comentario: 'Organizada e detalhista.' }
        ]
      },

      'diego-martins': {
        nome: 'Diego Martins', iniciais: 'DM', cor: '#E4E9F1',
        resumo: 'Auxiliar administrativo · 1 ano',
        local: 'Diadema, SP · Brasil', disponibilidade: 'Disponível imediatamente',
        nota: null, trabalhos: 0, contrataria: null, verificado: false, novo: true,
        experienciaVerificada: [],
        experienciaDeclarada: [
          { cargo: 'Auxiliar administrativo', empresa: 'Oficina Martins', periodo: '2025 – 2026' }
        ],
        competencias: ['Excel', 'Organização de documentos', 'Atendimento telefônico'],
        idiomas: ['Português · Nativo'],
        formacao: ['Ensino médio · concluído', 'Curso de Excel · 30 h'],
        avaliacoes: []
      },

      'juliana-alves': {
        nome: 'Juliana Alves', iniciais: 'JA', cor: '#E3F4EB',
        resumo: 'Atendimento e recepção · 2 anos',
        local: 'São Paulo, SP · Brasil', disponibilidade: 'Disponível imediatamente',
        nota: '4,4', trabalhos: 3, contrataria: '100%', verificado: true,
        experienciaVerificada: [
          { cargo: 'Atendente', empresa: 'Café Aurora', periodo: '2025' },
          { cargo: 'Recepcionista temporária', empresa: 'Hotel Vista Mar', periodo: '2024' }
        ],
        experienciaDeclarada: [
          { cargo: 'Atendente de eventos', empresa: 'Buffet Estação', periodo: '2023 – 2024' }
        ],
        competencias: ['Atendimento ao público', 'Comunicação', 'Trabalho em equipe'],
        idiomas: ['Português · Nativo', 'Inglês · Intermediário'],
        formacao: ['Ensino médio · concluído'],
        avaliacoes: [
          { empresa: 'Café Aurora', quando: 'há 4 meses', nota: 4, respostas: resp('Sim', 'Sim', 'Sim', 'Sim'),
            comentario: 'Simpática e ágil no atendimento.' }
        ]
      },

      'thiago-pereira': {
        nome: 'Thiago Pereira', iniciais: 'TP', cor: '#DCE6F7',
        resumo: 'Atendimento ao cliente · 1 ano',
        local: 'Barueri, SP · Brasil', disponibilidade: 'Disponível em 30 dias',
        nota: null, trabalhos: 0, contrataria: null, verificado: false, novo: true,
        experienciaVerificada: [],
        experienciaDeclarada: [
          { cargo: 'Atendente de telemarketing', empresa: 'Central Contato', periodo: '2025 – 2026' }
        ],
        competencias: ['Atendimento ao cliente', 'Comunicação', 'Sistemas de cadastro'],
        idiomas: ['Português · Nativo', 'Inglês · Básico'],
        formacao: ['Ensino médio · concluído'],
        avaliacoes: []
      }
    },

    // Empresas vistas pelo profissional. A chave é o id usado nos links.
    // Empresa Exemplo usa a mesma reputação da jornada da empresa.
    empresas: {
      'empresa-exemplo': {
        nome: 'Empresa Exemplo', iniciais: 'EE', setor: 'Comércio e serviços', local: 'São Paulo, SP · Brasil', verificada: true,
        nota: REP_EXEMPLO.nota, contratacoes: REP_EXEMPLO.contratacoes, pagouConforme: REP_EXEMPLO.pagouConforme,
        correspondia: '94%', trabalhariaNovamente: '91%',
        avaliacoes: [
          { autor: 'Bruno T.', quando: 'há 2 meses', nota: 5, respostas: respE('Sim', 'Sim', 'Sim', 'Sim', 'Sim'),
            comentario: 'Pagamento em dia e equipe muito acessível.', resposta: 'Obrigado pelo trabalho, Bruno!' },
          { autor: 'Camila R.', quando: 'há 5 meses', nota: 4, respostas: respE('Sim', 'Parcialmente', 'Sim', 'Sim', 'Sim'),
            comentario: 'A rotina teve mais atendimento por telefone do que o anúncio dizia.' }
        ]
      },
      'loja-central': {
        nome: 'Loja Central', iniciais: 'LC', setor: 'Varejo', local: 'São Paulo, SP · Brasil', verificada: true,
        nota: '4,6', contratacoes: 31, pagouConforme: '98%', correspondia: '95%', trabalhariaNovamente: '92%',
        avaliacoes: [
          { autor: 'Ana S.', quando: 'há 8 meses', nota: 5, respostas: respE('Sim', 'Sim', 'Sim', 'Sim', 'Sim'),
            comentario: 'Metas claras e comissão paga no prazo.', resposta: 'Ana foi uma referência para a equipe. Obrigado!' },
          { autor: 'Paulo A.', quando: 'há 4 meses', nota: 4, respostas: respE('Sim', 'Sim', 'Parcialmente', 'Sim', 'Sim'),
            comentario: 'Bom ambiente. As escalas mudavam com pouco aviso em datas de promoção.' }
        ]
      },
      'grupo-horizonte': {
        nome: 'Grupo Horizonte', iniciais: 'GH', setor: 'Serviços administrativos', local: 'São Paulo, SP · Brasil', verificada: true,
        nota: '4,7', contratacoes: 12, pagouConforme: '100%', correspondia: '96%', trabalhariaNovamente: '94%',
        avaliacoes: [
          { autor: 'Fernanda C.', quando: 'há 7 meses', nota: 5, respostas: respE('Sim', 'Sim', 'Sim', 'Sim', 'Sim'),
            comentario: 'Trabalho híbrido bem organizado e gestão respeitosa.' }
        ]
      },
      'hotel-vista-mar': {
        nome: 'Hotel Vista Mar', iniciais: 'HV', setor: 'Hotelaria', local: 'Santos, SP · Brasil', verificada: true,
        nota: '4,5', contratacoes: 18, pagouConforme: '95%', correspondia: '90%', trabalhariaNovamente: '89%',
        avaliacoes: [
          { autor: 'Mariana R.', quando: 'há 1 ano', nota: 4, respostas: respE('Sim', 'Sim', 'Sim', 'Sim', 'Parcialmente'),
            comentario: 'Boa estrutura. Na alta temporada a carga de trabalho aumenta bastante.' }
        ]
      },
      'cafe-aurora': {
        nome: 'Café Aurora', iniciais: 'CA', setor: 'Alimentação', local: 'São Paulo, SP · Brasil', verificada: false,
        nota: '4,4', contratacoes: 9, pagouConforme: '93%', correspondia: '92%', trabalhariaNovamente: '88%',
        avaliacoes: [
          { autor: 'Juliana A.', quando: 'há 4 meses', nota: 4, respostas: respE('Sim', 'Sim', 'Sim', 'Sim', 'Sim'),
            comentario: 'Equipe unida e gorjetas divididas com transparência.' }
        ]
      },
      'nova-rota': {
        nome: 'Nova Rota Serviços', iniciais: 'NR', setor: 'Atendimento e logística', local: 'Curitiba, PR · Brasil', verificada: false,
        novo: true, avaliacoes: []
      }
    },

    // Vagas abertas que o profissional pode ver. "atende" já considera o perfil do João Silva.
    vagas: {
      'atendente-loja': {
        id: 'atendente-loja', titulo: 'Atendente de loja', empresa: 'loja-central',
        local: 'São Paulo, SP · Brasil', modelo: 'Presencial', tipo: 'Tempo integral',
        salario: { moeda: 'BRL', min: 2200, max: 2600, periodo: 'mes' }, posicoes: 2, publicadaEm: '2026-09-21',
        requisitos: [
          { texto: 'Atendimento ao público', atende: true },
          { texto: 'Experiência com atendimento (1 ano)', atende: true },
          { texto: 'Ensino médio completo', atende: true },
          { texto: 'Trabalho em equipe', atende: true },
          { texto: 'Disponibilidade para escala 6x1', atende: true }
        ],
        descricao: 'Atendimento aos clientes no salão, organização das prateleiras e apoio ao caixa nos horários de pico.',
        competencias: ['Atendimento ao público', 'Organização', 'Trabalho em equipe'],
        idiomas: ['Português · Nativo']
      },
      'assistente-adm': {
        id: 'assistente-adm', titulo: 'Assistente administrativo', empresa: 'grupo-horizonte',
        local: 'São Paulo, SP · Brasil', modelo: 'Híbrido', tipo: 'Meio período',
        salario: { moeda: 'BRL', min: 1800, max: 2200, periodo: 'mes' }, posicoes: 1, publicadaEm: '2026-09-18',
        requisitos: [
          { texto: 'Pacote Office', atende: true },
          { texto: 'Rotinas administrativas', atende: true },
          { texto: 'Organização de documentos', atende: true },
          { texto: 'Comunicação escrita', atende: true },
          { texto: 'Excel avançado', atende: false }
        ],
        descricao: 'Você vai apoiar o time administrativo do Grupo Horizonte em três frentes: atendimento interno e por telefone, organização e arquivo de documentos, e rotinas de compras e contratos. ' +
          'O trabalho é híbrido, com dois dias por semana no escritório, em meio período. Você terá um mentor nos primeiros 30 dias e acesso a treinamentos internos de planilhas e sistemas. ' +
          'Buscamos alguém organizado, com boa comunicação escrita e vontade de aprender ferramentas novas. Conhecimento de Excel avançado é um diferencial, mas o treinamento faz parte da vaga.',
        competencias: ['Rotinas administrativas', 'Pacote Office', 'Excel', 'Comunicação escrita'],
        idiomas: ['Português · Nativo']
      },
      'suporte-cliente': {
        id: 'suporte-cliente', titulo: 'Suporte ao cliente', empresa: 'nova-rota',
        local: 'Remoto', modelo: 'Remoto', tipo: 'Tempo integral',
        salario: { moeda: 'BRL', min: 2500, max: 3000, periodo: 'mes' }, posicoes: 3, publicadaEm: '2026-09-25',
        requisitos: [
          { texto: 'Atendimento ao cliente', atende: true },
          { texto: 'Comunicação clara', atende: true },
          { texto: 'Sistemas de cadastro', atende: true },
          { texto: 'Inglês avançado', atende: false },
          { texto: 'Experiência em suporte', atende: false }
        ],
        descricao: 'Atendimento por chat e e-mail a clientes de uma plataforma de entregas, com foco em resolver o problema no primeiro contato.',
        competencias: ['Atendimento ao cliente', 'Comunicação', 'Sistemas de cadastro'],
        idiomas: ['Português · Nativo', 'Inglês · Avançado']
      },
      'recepcionista-exemplo': {
        id: 'recepcionista-exemplo', titulo: 'Recepcionista', empresa: 'empresa-exemplo',
        local: 'São Paulo, SP · Brasil', modelo: 'Presencial', tipo: 'Tempo integral',
        salario: { moeda: 'BRL', min: 2000, max: 2400, periodo: 'mes' }, posicoes: 1, publicadaEm: '2026-08-28',
        requisitos: [
          { texto: 'Atendimento ao público', atende: true },
          { texto: 'Agenda e telefonia', atende: true },
          { texto: 'Pacote Office', atende: true },
          { texto: 'Organização', atende: true },
          { texto: 'Inglês básico', atende: true }
        ],
        descricao: 'Recepção de clientes e visitantes, controle de agenda e atendimento telefônico da Empresa Exemplo.',
        competencias: ['Atendimento ao público', 'Agenda e telefonia', 'Pacote Office'],
        idiomas: ['Português · Nativo', 'Inglês · Básico']
      },
      'atendente-exemplo': {
        id: 'atendente-exemplo', titulo: 'Atendente de loja', empresa: 'empresa-exemplo',
        local: 'São Paulo, SP · Brasil', modelo: 'Presencial', tipo: 'Tempo integral',
        salario: { moeda: 'BRL', min: 1900, max: 2300, periodo: 'mes' }, posicoes: 2, publicadaEm: '2026-09-10',
        requisitos: [
          { texto: 'Atendimento ao público', atende: true },
          { texto: 'Trabalho em equipe', atende: true },
          { texto: 'Ensino médio completo', atende: true },
          { texto: 'Operação de caixa', atende: false }
        ],
        descricao: 'Atendimento aos clientes da loja e organização do espaço de vendas da Empresa Exemplo.',
        competencias: ['Atendimento ao público', 'Vendas'],
        idiomas: ['Português · Nativo']
      }
    },

    // Liga o id da vaga no catálogo da empresa (candidatos.html) ao id correspondente no
    // catálogo do profissional (vaga.html), quando a mesma vaga aparece nos dois lados.
    vagaLink: { recepcionista: 'recepcionista-exemplo', atendente: 'atendente-exemplo' },

    // Conversas que já existem quando a demonstração começa (o resto nasce das ações na tela).
    // "ladoDono" diz quem pode interagir nesta demonstração: 'empresa', 'profissional' ou 'ambos'
    // (só a Empresa Exemplo e o João Silva têm os dois lados navegáveis no protótipo).
    conversasIniciais: {
      'rafael-lima': {
        ladoDono: 'empresa', profissionalId: 'rafael-lima', empresaId: 'empresa-exemplo',
        vagaTitulo: 'Atendente de loja', vagaEmpresaId: 'atendente', vagaProfId: 'atendente-exemplo',
        mensagens: [
          { de: 'empresa', texto: 'Oi, Rafael! Vimos seu perfil para a vaga de Atendente de loja. Você ainda está disponível?', quando: '2026-09-26T14:10:00' },
          { de: 'profissional', texto: 'Oi! Sim, ainda estou. Posso começar em até 30 dias.', quando: '2026-09-26T14:40:00' }
        ],
        compartilhou: { empresa: false, profissional: true },
        lidoPor: { empresa: false, profissional: true }
      },
      'hotel-vista-mar': {
        ladoDono: 'profissional', profissionalId: 'joao-silva', empresaId: 'hotel-vista-mar',
        vagaTitulo: 'Recepcionista de plantão', vagaEmpresaId: null, vagaProfId: null,
        mensagens: [
          { de: 'profissional', texto: 'Olá! Fiquei com uma dúvida sobre a escala de plantão, pode me explicar melhor?', quando: '2026-09-15T10:00:00' },
          { de: 'empresa', texto: 'Oi, João! A escala é 12x36, com início às 7h. Faz sentido para você?', quando: '2026-09-15T11:20:00' }
        ],
        compartilhou: { empresa: false, profissional: false },
        lidoPor: { empresa: true, profissional: true }
      }
    },

    // O profissional logado é o João Silva (perfil em "profissionais").
    profissional: {
      id: 'joao-silva',
      nome: 'João',
      iniciais: 'JS',
      reputacao: { nota: '4,8', trabalhos: 6, contratariamDeNovo: '100%' },

      // Contratação em andamento: a mesma vaga que a Empresa Exemplo administra na jornada dela.
      // O combinado abaixo é o valor padrão, mostrado mesmo sem a empresa passar por preencher-vaga.html;
      // se ela registrar um combinado na mesma sessão, ele substitui este (mesmo dado, uma só fonte).
      confirmacao: {
        empresa: 'empresa-exemplo', vaga: 'Recepcionista', vagaId: 'recepcionista',
        combinado: combinado('Recepcionista', 'Tempo integral', 'BRL', 'mes', 2100, '2026-10-06', 'Seg a sex, 9h às 18h')
      },

      // Avaliação cega pendente (vínculo anterior)
      avaliacao: { empresa: 'loja-central', prazoDias: 3, combinado: combinado('Atendente', 'Tempo integral', 'BRL', 'mes', 1900, '2025-01-15', 'Seg a sex, 8h às 17h') },

      vagasIndicadas: ['atendente-loja', 'assistente-adm', 'suporte-cliente'],

      // Candidaturas anteriores. "confirmar": a candidatura acompanha a contratação em andamento (Recepcionista);
      // "avaliar": contratado e confirmado, com avaliação da empresa pendente.
      candidaturas: [
        { id: 'recepcionista-exemplo', vaga: 'recepcionista-exemplo', titulo: 'Recepcionista', empresa: 'empresa-exemplo', data: '2026-09-02', status: 'visualizada', confirmar: true },
        { id: 'atendente-hotel', vaga: null, titulo: 'Recepcionista de plantão', empresa: 'hotel-vista-mar', data: '2026-09-15', status: 'conversa' },
        { id: 'atendente-cafe', vaga: null, titulo: 'Atendente de balcão', empresa: 'cafe-aurora', data: '2026-08-20', status: 'nao', alcancou: 'conversa' },
        { id: 'suporte-retirada', vaga: null, titulo: 'Atendente de suporte', empresa: 'nova-rota', data: '2026-09-05', status: 'retirada', alcancou: 'enviada' },
        { id: 'vendas-encerrada', vaga: null, titulo: 'Vendedora', empresa: 'loja-central', data: '2026-07-10', status: 'encerrada', alcancou: 'conversa' },
        { id: 'atendente-loja-anterior', vaga: null, titulo: 'Atendente', empresa: 'loja-central', data: '2025-01-12', status: 'contratado', avaliar: true }
      ],

      // Avaliação de empresa (cega). "ref" liga a pergunta a um campo do combinado, mostrado como referência.
      avaliacaoEmpresa: {
        prazoPadrao: 7,
        limiteComentario: 300,
        respostas: ['Sim', 'Não', 'Parcialmente'],
        perguntas: [
          { id: 'pagamento', texto: 'O pagamento foi feito conforme combinado?', ref: 'salario' },
          { id: 'anuncio', texto: 'A vaga correspondia ao anúncio?' },
          { id: 'condicoes', texto: 'Condições e prazos foram cumpridos?', ref: 'condicoes' },
          { id: 'ambiente', texto: 'O ambiente de trabalho foi respeitoso?' },
          { id: 'novamente', texto: 'Trabalharia novamente para esta empresa?' }
        ]
      },

      // Etapas do processo seletivo. As quatro últimas são saídas (o candidato não segue depois delas).
      etapas: [
        { id: 'enviada', rotulo: 'Enviada' },
        { id: 'visualizada', rotulo: 'Visualizada' },
        { id: 'conversa', rotulo: 'Em conversa' },
        { id: 'contratado', rotulo: 'Contratado' },
        { id: 'nao', rotulo: 'Não selecionado' },
        { id: 'retirada', rotulo: 'Retirada' },
        { id: 'encerrada', rotulo: 'Vaga encerrada' },
        { id: 'recusado', rotulo: 'Não contratado' }
      ]
    }
  };
})();
