/* KORbuild Match — listas fixas dos formulários da versão real.
 * Cidades: centro aproximado de cada uma (nunca o endereço). A distância é calculada a partir dele. */
window.KOR_DADOS = {
  paises: ['Brasil', 'Portugal', 'Estados Unidos', 'Canadá', 'Reino Unido', 'Alemanha', 'Espanha', 'Argentina', 'México'],
  portes: ['1 a 9 pessoas', '10 a 49 pessoas', '50 a 249 pessoas', '250 pessoas ou mais'],
  modelos: [{ id: 'presencial', rotulo: 'Presencial' }, { id: 'hibrido', rotulo: 'Híbrido' }, { id: 'remoto', rotulo: 'Remoto' }],
  canais: [{ id: 'whatsapp', rotulo: 'WhatsApp' }, { id: 'sms', rotulo: 'SMS' }, { id: 'email', rotulo: 'E-mail' }],
  disponibilidades: ['Disponível imediatamente', 'Disponível em 15 dias', 'Disponível em 30 dias', 'Empregado(a), aberto(a) a propostas'],
  distancias: [5, 10, 15, 25, 40, 60, 100],
  limiteCompetencias: 12,
  cidades: [
    { cidade: "São Paulo", estado: "SP", pais: "Brasil", lat: -23.5505, lng: -46.6333 },
    { cidade: "Campinas", estado: "SP", pais: "Brasil", lat: -22.9056, lng: -47.0608 },
    { cidade: "Guarulhos", estado: "SP", pais: "Brasil", lat: -23.4538, lng: -46.5333 },
    { cidade: "Osasco", estado: "SP", pais: "Brasil", lat: -23.5325, lng: -46.7917 },
    { cidade: "Santo André", estado: "SP", pais: "Brasil", lat: -23.6639, lng: -46.5383 },
    { cidade: "São Bernardo do Campo", estado: "SP", pais: "Brasil", lat: -23.6914, lng: -46.5646 },
    { cidade: "Diadema", estado: "SP", pais: "Brasil", lat: -23.6861, lng: -46.6228 },
    { cidade: "Barueri", estado: "SP", pais: "Brasil", lat: -23.5057, lng: -46.8790 },
    { cidade: "Jundiaí", estado: "SP", pais: "Brasil", lat: -23.1857, lng: -46.8978 },
    { cidade: "Santos", estado: "SP", pais: "Brasil", lat: -23.9608, lng: -46.3336 },
    { cidade: "Rio de Janeiro", estado: "RJ", pais: "Brasil", lat: -22.9068, lng: -43.1729 },
    { cidade: "Belo Horizonte", estado: "MG", pais: "Brasil", lat: -19.9167, lng: -43.9345 },
    { cidade: "Curitiba", estado: "PR", pais: "Brasil", lat: -25.4284, lng: -49.2733 },
    { cidade: "Lisboa", estado: "", pais: "Portugal", lat: 38.7223, lng: -9.1393 },
    { cidade: "Porto", estado: "", pais: "Portugal", lat: 41.1579, lng: -8.6291 },
    { cidade: "Miami", estado: "FL", pais: "Estados Unidos", lat: 25.7617, lng: -80.1918 },
    { cidade: "Orlando", estado: "FL", pais: "Estados Unidos", lat: 28.5383, lng: -81.3792 },
    { cidade: "Nova York", estado: "NY", pais: "Estados Unidos", lat: 40.7128, lng: -74.0060 },
    { cidade: "Toronto", estado: "ON", pais: "Canadá", lat: 43.6532, lng: -79.3832 },
    { cidade: "Londres", estado: "", pais: "Reino Unido", lat: 51.5074, lng: -0.1278 },
    { cidade: "Berlim", estado: "", pais: "Alemanha", lat: 52.5200, lng: 13.4050 },
    { cidade: "Madri", estado: "", pais: "Espanha", lat: 40.4168, lng: -3.7038 },
    { cidade: "Buenos Aires", estado: "", pais: "Argentina", lat: -34.6037, lng: -58.3816 },
    { cidade: "Cidade do México", estado: "", pais: "México", lat: 19.4326, lng: -99.1332 }
  ]
};
