/*
 * KORbuild Match — DADOS FICTÍCIOS para validação.
 * Edite este arquivo para mudar nomes, números e vagas exibidos nas telas.
 * Nenhum dado aqui é real.
 */
window.MOCK = {
  empresa: {
    nome: 'Empresa Exemplo',
    iniciais: 'EE',
    verificada: true,
    reputacao: { nota: '4,7', contratacoes: 23, pagouConforme: '96%' },

    // "Precisa da sua atenção"
    pendencias: [
      {
        destaque: true,
        titulo: 'Quem preencheu a vaga de Recepcionista?',
        texto: 'Indique a pessoa contratada. Ela confirma, e o vínculo passa a contar no histórico e na reputação dos dois.',
        acao: 'Marcar como preenchida'
      },
      { icone: 'users', titulo: '8 candidatos novos', texto: 'Atendente de loja' },
      { icone: 'star', tom: 'amber', titulo: 'Avalie Ana Souza', texto: 'Vendedora · prazo termina em 5 dias' },
      { icone: 'message', titulo: '2 mensagens sem resposta', texto: 'Candidatos de Atendente de loja' }
    ],

    vagas: [
      { id: 'recepcionista', titulo: 'Recepcionista', status: 'Aberta', detalhe: '12 candidatos' },
      { id: 'atendente', titulo: 'Atendente de loja', status: 'Aberta', detalhe: '15 candidatos · 8 novos' },
      { id: 'auxiliar', titulo: 'Auxiliar administrativo', status: 'Pausada', detalhe: '5 candidatos' },
      { id: 'vendedora', titulo: 'Vendedora', status: 'Preenchida', detalhe: 'Preenchida por Ana Souza · confirmado' }
    ],

    // Indicações por vaga aberta
    indicados: {
      recepcionista: [
        { nome: 'Mariana Rocha', iniciais: 'MR', cor: '#DCE6F7', resumo: 'Recepcionista · 4 anos de experiência', requisitos: '5 de 5', nota: '4,8', trabalhos: 9, verificado: true },
        { nome: 'Paulo Andrade', iniciais: 'PA', cor: '#F3E6D6', resumo: 'Atendimento ao público · 6 anos', requisitos: '4 de 5', nota: '4,7', trabalhos: 14, verificado: true },
        { nome: 'Lucas Teixeira', iniciais: 'LT', cor: '#E4E9F1', resumo: 'Recepcionista · 2 anos de experiência', requisitos: '5 de 5', novo: true }
      ],
      atendente: [
        { nome: 'Carla Mendes', iniciais: 'CM', cor: '#E3F4EB', resumo: 'Vendas e atendimento · 3 anos', requisitos: '5 de 5', nota: '4,9', trabalhos: 7, verificado: true },
        { nome: 'Rafael Lima', iniciais: 'RL', cor: '#DCE6F7', resumo: 'Atendente de loja · 5 anos', requisitos: '4 de 5', nota: '4,6', trabalhos: 11, verificado: true },
        { nome: 'Beatriz Nunes', iniciais: 'BN', cor: '#F3E6D6', resumo: 'Primeiro emprego · curso de atendimento', requisitos: '4 de 5', novo: true }
      ]
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
