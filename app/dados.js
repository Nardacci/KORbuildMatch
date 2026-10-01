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
  limiteCompetencias: 12
};
