/*
 * KORbuild Match — gera app/cidades/<PAÍS>.json a partir do GeoNames (CC BY 4.0).
 *   npm install cities.json all-the-cities
 *   node scripts/gerar-cidades.js app/cidades
 * Formato de cada arquivo: { e: [[estado, sigla], ...], c: [[cidade, índice do estado, lat, lng], ...] },
 * com as cidades mais populosas primeiro. Coordenadas com 3 casas (~100 m): sempre um ponto aproximado.
 */
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const pops = {}; require('all-the-cities').forEach(c => { pops[c.country + '|' + c.name + '|' + c.loc.coordinates[1].toFixed(1) + '|' + c.loc.coordinates[0].toFixed(1)] = c.population; });
const cities = require('cities.json/cities.json').map(c => { const lat = +c.lat, lng = +c.lng;
  return { name: c.name, country: c.country, adminCode: c.admin1, population: pops[c.country + '|' + c.name + '|' + lat.toFixed(1) + '|' + lng.toFixed(1)] || 0, loc: { coordinates: [lng, lat] } }; });
const admin1 = require('cities.json/admin1.json');
const out = process.argv[2];
const adm = {}; admin1.forEach(a => adm[a.code] = a.name);
const UF = { 'Acre':'AC','Alagoas':'AL','Amapá':'AP','Amazonas':'AM','Bahia':'BA','Ceará':'CE','Federal District':'DF','Distrito Federal':'DF','Espírito Santo':'ES','Goiás':'GO','Maranhão':'MA','Mato Grosso':'MT','Mato Grosso do Sul':'MS','Minas Gerais':'MG','Pará':'PA','Paraíba':'PB','Paraná':'PR','Pernambuco':'PE','Piauí':'PI','Rio de Janeiro':'RJ','Rio Grande do Norte':'RN','Rio Grande do Sul':'RS','Rondônia':'RO','Roraima':'RR','Santa Catarina':'SC','São Paulo':'SP','Sergipe':'SE','Tocantins':'TO' };
const por = {};
cities.forEach(c => { (por[c.country] = por[c.country] || []).push(c); });
fs.mkdirSync(out, { recursive: true });
let total = 0, gz = 0; const resumo = {}; const semUF = new Set();
Object.keys(por).sort().forEach(pais => {
  const vistos = {}; const lista = por[pais].sort((a, b) => b.population - a.population || a.name.localeCompare(b.name))
    .filter(c => { const k = c.name + '|' + c.adminCode; if (vistos[k]) return false; vistos[k] = 1; return true; });
  const estados = [], idx = {};
  const linhas = lista.map(c => {
    const nomeEst = adm[pais + '.' + c.adminCode] || '';
    let sigla = '';
    if (pais === 'US' || pais === 'CA') sigla = /^[A-Z]{2}$/.test(c.adminCode) ? c.adminCode : '';
    if (pais === 'BR') { sigla = UF[nomeEst] || ''; if (!sigla && nomeEst) semUF.add(nomeEst); }
    const chave = nomeEst + '|' + sigla;
    if (idx[chave] == null) { idx[chave] = estados.length; estados.push([nomeEst, sigla]); }
    const [lng, lat] = c.loc.coordinates;
    return [c.name, idx[chave], +lat.toFixed(3), +lng.toFixed(3)];
  });
  const json = JSON.stringify({ e: estados, c: linhas });
  fs.writeFileSync(path.join(out, pais + '.json'), json);
  total += json.length; gz += zlib.gzipSync(json).length; resumo[pais] = lista.length;
});
console.log('paises', Object.keys(por).length, 'MB', (total / 1e6).toFixed(1), 'gz MB', (gz / 1e6).toFixed(1));
['BR', 'US', 'PT', 'MX'].forEach(p => { const s = fs.statSync(path.join(out, p + '.json')).size; console.log(p, resumo[p], (s / 1024).toFixed(0) + 'KB', (zlib.gzipSync(fs.readFileSync(path.join(out, p + '.json'))).length / 1024).toFixed(0) + 'KB gz'); });
console.log('BR sem UF:', [...semUF]);
console.log(JSON.stringify(Object.keys(por).sort()));
