# Cidades

Um arquivo por país (código ISO de 2 letras), usado na busca de cidade do cadastro e do perfil.
O site só baixa o arquivo do país escolhido.

Dados: [GeoNames](https://www.geonames.org), licença [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/),
via os pacotes `cities.json` (cidades e estados) e `all-the-cities` (população, para ordenar a busca).
Cidades com mais de 1.000 habitantes ou sedes de município. Para atualizar: `scripts/gerar-cidades.js`.
