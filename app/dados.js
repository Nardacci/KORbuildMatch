/* KORbuild Match — listas fixas dos formulários da versão real.
 * Países: código ISO de 2 letras (o nome em português vem do navegador, Intl.DisplayNames).
 * Cidades: um arquivo por país em app/cidades/ (GeoNames, CC BY 4.0), baixado só quando o país é escolhido. */
window.KOR_DADOS = {
  paises: ["AD","AE","AF","AG","AI","AL","AM","AO","AR","AS","AT","AU","AW","AX","AZ","BA","BB","BD","BE","BF","BG","BH","BI","BJ","BL","BM","BN","BO","BQ","BR","BS","BT","BW","BY","BZ","CA","CC","CD","CF","CG","CH","CI","CK","CL","CM","CN","CO","CR","CU","CV","CW","CX","CY","CZ","DE","DJ","DK","DM","DO","DZ","EC","EE","EG","EH","ER","ES","ET","FI","FJ","FK","FM","FO","FR","GA","GB","GD","GE","GF","GG","GH","GI","GL","GM","GN","GP","GQ","GR","GS","GT","GU","GW","GY","HK","HN","HR","HT","HU","ID","IE","IL","IM","IN","IO","IQ","IR","IS","IT","JE","JM","JO","JP","KE","KG","KH","KI","KM","KN","KP","KR","KW","KY","KZ","LA","LB","LC","LI","LK","LR","LS","LT","LU","LV","LY","MA","MC","MD","ME","MF","MG","MH","MK","ML","MM","MN","MO","MP","MQ","MR","MS","MT","MU","MV","MW","MX","MY","MZ","NA","NC","NE","NF","NG","NI","NL","NO","NP","NR","NU","NZ","OM","PA","PE","PF","PG","PH","PK","PL","PM","PN","PR","PS","PT","PW","PY","QA","RE","RO","RS","RU","RW","SA","SB","SC","SD","SE","SG","SH","SI","SJ","SK","SL","SM","SN","SO","SR","SS","ST","SV","SX","SY","SZ","TC","TD","TF","TG","TH","TJ","TK","TL","TM","TN","TO","TR","TT","TV","TW","TZ","UA","UG","US","UY","UZ","VA","VC","VE","VG","VI","VN","VU","WF","WS","XK","YE","YT","ZA","ZM","ZW"],
  // Aparecem no topo da lista de países.
  paisesDestaque: ['BR', 'US', 'PT'],
  // Países onde as distâncias aparecem em milhas.
  paisesMilhas: ['US'],
  portes: ['1 a 9 pessoas', '10 a 49 pessoas', '50 a 249 pessoas', '250 pessoas ou mais'],
  modelos: [{ id: 'presencial', rotulo: 'Presencial' }, { id: 'hibrido', rotulo: 'Híbrido' }, { id: 'remoto', rotulo: 'Remoto' }],
  canais: [{ id: 'whatsapp', rotulo: 'WhatsApp' }, { id: 'sms', rotulo: 'SMS' }, { id: 'email', rotulo: 'E-mail' }],
  disponibilidades: ['Disponível imediatamente', 'Disponível em 15 dias', 'Disponível em 30 dias', 'Empregado(a), aberto(a) a propostas'],
  distancias: [5, 10, 15, 25, 40, 60, 100],
  limiteCompetencias: 12,

  // Vagas (seção 7)
  tipos: [{ id: 'integral', rotulo: 'Tempo integral' }, { id: 'meio_periodo', rotulo: 'Meio período' }, { id: 'temporario', rotulo: 'Temporário' }, { id: 'freelancer', rotulo: 'Freelancer' }],
  moedas: [{ id: 'BRL', rotulo: 'R$ · Real' }, { id: 'USD', rotulo: 'US$ · Dólar' }, { id: 'EUR', rotulo: '€ · Euro' }, { id: 'GBP', rotulo: '£ · Libra' }],
  moedaPorPais: { BR: 'BRL', US: 'USD', PT: 'EUR', ES: 'EUR', DE: 'EUR', FR: 'EUR', IT: 'EUR', IE: 'EUR', NL: 'EUR', GB: 'GBP' },
  periodos: [{ id: 'hora', rotulo: 'por hora' }, { id: 'mes', rotulo: 'por mês' }, { id: 'ano', rotulo: 'por ano' }],
  experiencias: ['Sem experiência', 'Até 1 ano', '1 a 2 anos', '3 a 5 anos', 'Mais de 5 anos'],
  // Raio de busca das vagas presenciais e híbridas: 25 milhas nos EUA, 40 km nos demais.
  raios: { km: [10, 25, 40, 60, 100], mi: [5, 10, 25, 40, 60] },
  raioPadrao: { km: 40, mi: 25 },
  fusos: [
    { id: -8, rotulo: 'UTC−8 · Los Angeles' }, { id: -6, rotulo: 'UTC−6 · Cidade do México' },
    { id: -5, rotulo: 'UTC−5 · Nova York, Miami, Toronto' }, { id: -3, rotulo: 'UTC−3 · Brasília, Buenos Aires' },
    { id: 0, rotulo: 'UTC+0 · Lisboa, Londres' }, { id: 1, rotulo: 'UTC+1 · Madri, Berlim' }
  ],
  limiteRequisitos: 10,
  limitePerguntasTriagem: 3,
  limiteOpcoesTriagem: 4,
  prazoRespostaDias: 7,
  // Perguntas de triagem não podem tocar nestes temas (proibidos por lei em muitos países).
  termosProibidosTriagem: [
    'idade', 'anos de idade', 'quantos anos', 'data de nascimento', 'ano de nascimento',
    'gênero', 'genero', 'sexo', 'homem', 'mulher',
    'raça', 'raca', 'cor da pele', 'etnia',
    'religião', 'religiao', 'crença', 'crenca',
    'estado civil', 'casado', 'casada', 'solteiro', 'solteira', 'divorciado', 'divorciada', 'viúvo', 'viuvo', 'viúva', 'viuva',
    'filho', 'filhos', 'filha', 'filhas', 'gravidez', 'grávida', 'gravida', 'gestante', 'maternidade', 'paternidade',
    'nacionalidade', 'origem', 'estrangeiro', 'estrangeira', 'imigrante'
  ]
};
