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

  window.MOCK = {
    empresa: {
      nome: 'Empresa Exemplo',
      iniciais: 'EE',
      verificada: true,
      reputacao: { nota: '4,7', contratacoes: 23, pagouConforme: '96%' },

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
        { id: 'analise', rotulo: 'Em análise', singular: 'Em análise' },
        { id: 'entrevista', rotulo: 'Entrevista', singular: 'Entrevista' },
        { id: 'nao', rotulo: 'Não selecionados', singular: 'Não selecionado' },
        { id: 'contratado', rotulo: 'Contratados', singular: 'Contratado', manual: false }
      ],

      // Quem se candidatou a cada vaga. "atende" = quantos requisitos da vaga a pessoa atende.
      candidatos: {
        recepcionista: [
          { id: 'joao-silva', atende: 5, status: 'entrevista' },
          { id: 'rafael-lima', atende: 4, status: 'entrevista' },
          { id: 'fernanda-costa', atende: 4, status: 'analise' },
          { id: 'juliana-alves', atende: 5, status: 'novo' },
          { id: 'diego-martins', atende: 4, status: 'novo' },
          { id: 'thiago-pereira', atende: 3, status: 'nao' }
        ],
        atendente: [
          { id: 'mariana-rocha', atende: 5, status: 'entrevista' },
          { id: 'paulo-andrade', atende: 4, status: 'analise' },
          { id: 'lucas-teixeira', atende: 4, status: 'novo' },
          { id: 'thiago-pereira', atende: 5, status: 'novo' },
          { id: 'juliana-alves', atende: 5, status: 'novo' },
          { id: 'diego-martins', atende: 3, status: 'novo' },
          { id: 'fernanda-costa', atende: 3, status: 'nao' }
        ],
        auxiliar: [
          { id: 'fernanda-costa', atende: 5, status: 'analise' },
          { id: 'diego-martins', atende: 5, status: 'novo' },
          { id: 'paulo-andrade', atende: 3, status: 'nao' }
        ],
        vendedora: [
          { id: 'ana-souza', atende: 5, status: 'contratado' },
          { id: 'carla-mendes', atende: 4, status: 'nao' }
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

      // Avaliação cega do profissional
      avaliacao: {
        prazoPadrao: 7,
        limiteComentario: 300,
        respostas: ['Sim', 'Não', 'Parcialmente'],
        perguntas: [
          { id: 'entregou', texto: 'Entregou o trabalho combinado?' },
          { id: 'horarios', texto: 'Cumpriu horários e prazos?' },
          { id: 'comunicacao', texto: 'Comunicação clara e profissional?' },
          { id: 'novamente', texto: 'Contrataria novamente?' }
        ],
        pendentes: {
          'ana-souza': { vaga: 'Vendedora', prazoDias: 5 }
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
        nota: '4,6', trabalhos: 11, contrataria: '90%', verificado: true,
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
          { cargo: 'Recepcionista', empresa: 'Hotel Vista Mar', periodo: '2024 – 2025' },
          { cargo: 'Recepcionista', empresa: 'Clínica Bem Viver', periodo: '2023 – 2024' }
        ],
        experienciaDeclarada: [
          { cargo: 'Auxiliar administrativo', empresa: 'Contabilidade Souza', periodo: '2022 – 2023' }
        ],
        competencias: ['Atendimento ao público', 'Agenda e telefonia', 'Pacote Office', 'Organização'],
        idiomas: ['Português · Nativo', 'Inglês · Avançado'],
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

    profissional: {
      nome: 'João',
      iniciais: 'JS',
      reputacao: { nota: '4,8', trabalhos: 6, contratariamDeNovo: '100%' },

      confirmacao: {
        empresa: 'Empresa Exemplo',
        vaga: 'Recepcionista'
      },

      avaliacao: { empresa: 'Loja Central', prazo: '3 dias' },

      vagasIndicadas: [
        { titulo: 'Atendente de loja', empresa: 'Loja Central', modelo: 'Presencial', tipo: 'Tempo integral', requisitos: '5 de 5', notaEmpresa: '4,6', contratacoesEmpresa: 31, pagouConforme: '98%' },
        { titulo: 'Assistente administrativo', empresa: 'Grupo Horizonte', modelo: 'Híbrido', tipo: 'Meio período', requisitos: '4 de 5', notaEmpresa: '4,7', contratacoesEmpresa: 12, falta: 'Excel avançado' },
        { titulo: 'Suporte ao cliente', empresa: 'Nova Rota Serviços', modelo: 'Remoto', tipo: 'Tempo integral', requisitos: '3 de 5', empresaNova: true, falta: 'inglês avançado, experiência em suporte' }
      ]
    }
  };
})();
