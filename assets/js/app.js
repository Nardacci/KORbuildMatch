/* KORbuild Match — protótipo de validação. Sem back-end: tudo vem de mock-data.js. */
(function () {
  'use strict';

  var ICONS = {
    logo: '<path d="M4 12l8-7 8 7v8H4z"/><path d="M9 15l2 2 4-4"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14.8c2 .7 3.2 2.5 3.6 5.2"/>',
    star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
    message: '<path d="M4 5h16v11H9l-5 4z"/>',
    chevron: '<path d="M9 6l6 6-6 6"/>',
    bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    home: '<path d="M3 10.5L12 3l9 7.5V21h-6v-6H9v6H3z"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    building: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1"/>',
    clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.2-6 8-6s7 2 8 6"/>',
    down: '<path d="M6 9l6 6 6-6"/>',
    back: '<path d="M15 6l-6 6 6 6"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
    minus: '<path d="M5 12h14"/>',
    send: '<path d="M4 12l16-8-6 16-3-6-7-2z"/>'
  };

  function icon(name, size, opts) {
    opts = opts || {};
    var s = size || 22;
    var fill = opts.fill || 'none';
    var sw = opts.stroke || 1.8;
    var label = opts.label ? ' role="img" aria-label="' + esc(opts.label) + '"' : ' aria-hidden="true"';
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="' + fill + '" stroke="currentColor" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round"' + label + '>' + ICONS[name] + '</svg>';
  }

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  var params = new URLSearchParams(window.location.search);

  /* ---------- Aviso para telas que ainda não existem ---------- */

  var toastTimer;
  function toast(msg) {
    var el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2600);
  }

  // Todo link/botão com data-todo mostra o aviso em vez de navegar.
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-todo]');
    if (!t) return;
    e.preventDefault();
    toast(t.getAttribute('data-todo') || 'Esta tela ainda não faz parte do protótipo.');
  });

  var TODO = 'Esta tela ainda não faz parte do protótipo.';

  // Voltando pelo histórico, o navegador pode mostrar a página antiga guardada em cache:
  // recarrega para refletir o que foi feito nas telas seguintes.
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) window.location.reload();
  });

  /* ---------- Peças comuns ---------- */

  function brandMark(lg) {
    return '<div class="brand-mark' + (lg ? ' lg' : '') + '" style="color:#FFFFFF">' + icon('logo', lg ? 22 : 20, { stroke: 2 }) + '</div>';
  }

  function bell(count) {
    return '<button type="button" class="icon-btn" data-todo="' + TODO + '" aria-label="Notificações, ' + count + ' novas">' +
      icon('bell') + '<span class="dot"></span></button>';
  }

  function rowLink(p) {
    var tile = p.tom === 'amber' ? 'icon-tile amber' : 'icon-tile';
    var dest = p.href ? 'href="' + esc(p.href) + '"' : 'href="#" data-todo="' + TODO + '"';
    return '<a ' + dest + ' class="row-link">' +
      '<div class="' + tile + '">' + icon(p.icone) + '</div>' +
      '<div class="row-main"><div class="row-title">' + esc(p.titulo) + '</div>' +
      '<div class="row-sub">' + esc(p.texto) + '</div></div>' +
      '<span class="chevron">' + icon('chevron', 20, { stroke: 2 }) + '</span></a>';
  }

  // Linha sem link, só informativa (ex.: "Aguardando confirmação").
  function rowStatic(p) {
    var tile = p.tom === 'amber' ? 'icon-tile amber' : (p.tom === 'blue' ? 'icon-tile blue' : 'icon-tile');
    return '<div class="row-link row-static">' +
      '<div class="' + tile + '">' + icon(p.icone) + '</div>' +
      '<div class="row-main"><div class="row-title">' + esc(p.titulo) + '</div>' +
      '<div class="row-sub">' + esc(p.texto) + '</div></div></div>';
  }

  // Itens com "href" viram links; a aba ativa aponta para a própria página.
  function nav(items, current) {
    return items.map(function (it) {
      var active = it.id === current;
      var self = window.location.pathname.split('/').pop() || 'index.html';
      var dest = active ? (it.href || self) : (it.href || '#');
      return '<a href="' + esc(dest) + '"' +
        (active ? ' aria-current="page"' : (it.href ? '' : ' data-todo="' + TODO + '"')) + '>' +
        icon(it.icon, 24, { stroke: active ? 2 : 1.8 }) + esc(it.label) + '</a>';
    }).join('');
  }

  function repStat(value, label) {
    return '<div><div class="rep-value">' + esc(value) + '</div><div class="rep-label">' + esc(label) + '</div></div>';
  }

  function plural(n, um, varios) { return n + ' ' + (n === 1 ? um : varios); }

  function dataBR(iso) {
    var p = iso.split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }

  function hojeISO() {
    var d = new Date();
    function dois(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + dois(d.getMonth() + 1) + '-' + dois(d.getDate());
  }

  // Uma data ISO (AAAA-MM-DD) + n dias, formatada dd/mm. Usada no prazo de 7 dias de resposta.
  function maisDias(iso, n) {
    var d = new Date(iso + 'T00:00:00');
    d.setDate(d.getDate() + n);
    function dois(x) { return (x < 10 ? '0' : '') + x; }
    return dois(d.getDate()) + '/' + dois(d.getMonth() + 1);
  }

  function horaCurta(iso) {
    var d = new Date(iso);
    function dois(n) { return (n < 10 ? '0' : '') + n; }
    return dois(d.getHours()) + ':' + dois(d.getMinutes());
  }

  // Seção que abre e fecha ao tocar no cabeçalho. Começa fechada.
  function accordion(id, title, summary, body, dark) {
    return '<section class="acc' + (dark ? ' acc-dark' : '') + '">' +
      '<h2 class="acc-h"><button type="button" class="acc-btn" id="' + id + '-btn" aria-expanded="false" aria-controls="' + id + '-panel">' +
        '<span class="acc-text"><span class="acc-title">' + esc(title) + '</span>' +
        '<span class="acc-sum" id="' + id + '-sum">' + esc(summary) + '</span></span>' +
        '<span class="acc-arrow">' + icon('down', 20, { stroke: 2 }) + '</span></button></h2>' +
      '<div class="acc-panel" id="' + id + '-panel" role="region" aria-labelledby="' + id + '-btn">' +
        '<div class="acc-clip"><div class="acc-inner">' + body + '</div></div></div></section>';
  }

  function accMore(label) {
    return '<div class="acc-more"><a href="#" data-todo="' + TODO + '">' + esc(label) + '</a></div>';
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('.acc-btn');
    if (!b) return;
    var open = b.getAttribute('aria-expanded') === 'true';
    b.setAttribute('aria-expanded', String(!open));
    b.closest('.acc').classList.toggle('is-open', !open);
  });

  var STATUS_CHIP = { 'Aberta': 'green', 'Pausada': 'grey', 'Preenchida': 'blue' };

  var PR_ID = window.MOCK.profissional.id;

  /* ---------- Estado da jornada da empresa (sessionStorage) ---------- */

  var KEY = 'kor.empresa';

  function load() {
    var s = {};
    try { s = JSON.parse(window.sessionStorage.getItem(KEY)) || {}; } catch (e) { s = {}; }
    s.vagas = s.vagas || [];             // vagas publicadas na demonstração, a mais recente primeiro
    s.preenchidas = s.preenchidas || {}; // vagaId -> [ids de profissionais aguardando confirmação]
    s.combinados = s.combinados || {};   // vagaId -> combinado registrado (salário, início, jornada, função, tipo)
    s.status = s.status || {};           // "vagaId:profId" -> status do candidato
    s.convites = s.convites || {};       // "vagaId:profId" -> true
    s.avaliados = s.avaliados || {};     // profId -> avaliação enviada
    s.raios = s.raios || {};             // vagaId -> raio ampliado pela empresa ({ valor, unidade })
    return s;
  }

  function save(s) {
    try { window.sessionStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* sem armazenamento: segue sem continuidade */ }
  }

  /* ---------- Estado da jornada do profissional (sessionStorage) ---------- */

  var KEY_P = 'kor.profissional';

  function loadP() {
    var s = {};
    try { s = JSON.parse(window.sessionStorage.getItem(KEY_P)) || {}; } catch (e) { s = {}; }
    s.candidaturas = s.candidaturas || {}; // vagaId -> { data, status } (candidaturas feitas na demonstração)
    s.avaliados = s.avaliados || {};       // empresaId -> avaliação enviada
    s.seguindo = s.seguindo || {};         // empresaId -> true
    s.confirmacao = s.confirmacao || null; // null | 'confirmado' | 'contestado' (contratação em Recepcionista, na Empresa Exemplo)
    s.contestacaoTexto = s.contestacaoTexto || ''; // o que mudou, quando contestado
    s.distanciaMax = s.distanciaMax || null; // km; null = a do perfil em mock-data.js
    return s;
  }

  function saveP(s) {
    try { window.sessionStorage.setItem(KEY_P, JSON.stringify(s)); } catch (e) { /* sem armazenamento: segue sem continuidade */ }
  }

  /* ---------- Conversas (sessionStorage, compartilhada pelas duas jornadas) ---------- */

  var KEY_CHAT = 'kor.chat';

  function loadChat() {
    var c = {};
    try { c = JSON.parse(window.sessionStorage.getItem(KEY_CHAT)) || {}; } catch (e) { c = {}; }
    if (!c.conversas) {
      // Primeira vez na sessão: parte das conversas já existentes em mock-data.js.
      c.conversas = {};
      var seed = window.MOCK.conversasIniciais || {};
      Object.keys(seed).forEach(function (k) {
        var v = seed[k];
        c.conversas[k] = {
          id: k, ladoDono: v.ladoDono, profissionalId: v.profissionalId, empresaId: v.empresaId,
          vagaTitulo: v.vagaTitulo || '', vagaEmpresaId: v.vagaEmpresaId || null, vagaProfId: v.vagaProfId || null,
          mensagens: v.mensagens.map(function (m) { return { de: m.de, texto: m.texto, quando: m.quando }; }),
          compartilhou: { empresa: !!v.compartilhou.empresa, profissional: !!v.compartilhou.profissional },
          lidoPor: { empresa: !!v.lidoPor.empresa, profissional: !!v.lidoPor.profissional },
          respondeuAuto: false
        };
      });
      saveChat(c);
    }
    return c;
  }

  function saveChat(c) {
    try { window.sessionStorage.setItem(KEY_CHAT, JSON.stringify(c)); } catch (e) { /* sem armazenamento: segue sem continuidade */ }
  }

  // O id de uma conversa é sempre o id "do outro lado" a partir da Empresa Exemplo/João Silva:
  // o profissional, exceto quando é o profissional falando com outra empresa (aí é o id da empresa).
  function chatKey(ladoDono, profissionalId, empresaId) {
    return ladoDono === 'profissional' ? empresaId : profissionalId;
  }

  function obterOuCriarConversa(opts) {
    var c = loadChat();
    var id = chatKey(opts.ladoDono, opts.profissionalId, opts.empresaId);
    var cv = c.conversas[id];
    if (!cv) {
      cv = c.conversas[id] = {
        id: id, ladoDono: opts.ladoDono, profissionalId: opts.profissionalId, empresaId: opts.empresaId,
        vagaTitulo: opts.vagaTitulo || '', vagaEmpresaId: opts.vagaEmpresaId || null, vagaProfId: opts.vagaProfId || null,
        mensagens: [], compartilhou: { empresa: false, profissional: false }, lidoPor: { empresa: true, profissional: true },
        respondeuAuto: false
      };
    } else if (opts.vagaTitulo) {
      cv.vagaTitulo = opts.vagaTitulo;
      cv.vagaEmpresaId = opts.vagaEmpresaId || cv.vagaEmpresaId;
      cv.vagaProfId = opts.vagaProfId || cv.vagaProfId;
    }
    saveChat(c);
    return cv;
  }

  function marcarLido(id, lado) {
    var c = loadChat();
    if (c.conversas[id]) { c.conversas[id].lidoPor[lado] = true; saveChat(c); }
  }

  // Resposta automática de quem não está logado nesta demonstração (qualquer um, menos a Empresa Exemplo e o João Silva).
  function respostaAutomatica(cv) {
    if (cv.ladoDono === 'ambos') return null;
    if (cv.ladoDono === 'empresa') {
      return { de: 'profissional', texto: 'Oi! Obrigado(a) pelo contato' + (cv.vagaTitulo ? ' sobre a vaga de ' + cv.vagaTitulo : '') + '. Pode perguntar o que precisar.' };
    }
    return { de: 'empresa', texto: 'Olá! Recebemos sua mensagem' + (cv.vagaTitulo ? ' sobre a vaga de ' + cv.vagaTitulo : '') + '. Em breve alguém do time responde por aqui.' };
  }

  function waEstado(cv, como) {
    var outro = como === 'empresa' ? 'profissional' : 'empresa';
    if (cv.compartilhou[como] && cv.compartilhou[outro]) return 'liberado';
    if (cv.compartilhou[como]) return 'aguardando';
    if (cv.compartilhou[outro]) return 'pedido';
    return 'nenhum';
  }

  // Só o canal do profissional varia (whatsapp/sms/email); a empresa sempre usa WhatsApp neste protótipo.
  function canalDoOutro(cv, como) {
    if (como !== 'empresa') return 'whatsapp';
    var p = prof(cv.profissionalId);
    return (p && p.canal) || 'whatsapp';
  }

  function canalRotulo(canal) {
    return canal === 'sms' ? 'Enviar SMS' : (canal === 'email' ? 'Enviar e-mail' : 'Chamar no WhatsApp');
  }

  function waBarHtml(cv, como) {
    var outroNome = como === 'empresa' ? firstName(prof(cv.profissionalId)) : empresaDe(cv.empresaId).nome;
    var estado = waEstado(cv, como);
    if (estado === 'nenhum') {
      return '<div class="wa-bar"><span class="wa-msg">Contato direto ainda não liberado</span>' +
        '<button type="button" class="btn btn-outline" data-wa="compartilhar">Compartilhar meu WhatsApp</button></div>';
    }
    if (estado === 'aguardando') {
      return '<div class="wa-bar"><span class="wa-msg">Aguardando ' + esc(outroNome) + '</span></div>';
    }
    if (estado === 'pedido') {
      return '<div class="wa-bar"><span class="wa-msg">' + esc(outroNome) + ' quer compartilhar o WhatsApp. Compartilhar o seu?</span>' +
        '<button type="button" class="btn btn-primary" data-wa="compartilhar">Compartilhar o meu WhatsApp</button></div>';
    }
    var canal = canalDoOutro(cv, como);
    return '<div class="wa-bar wa-liberado"><span class="wa-msg">' + icon('check', 16, { stroke: 2.4 }) + 'Contato liberado</span>' +
      '<button type="button" class="btn btn-primary" data-wa="contato">' + esc(canalRotulo(canal)) + '</button></div>';
  }

  // Cria (ou reaproveita) a conversa entre a Empresa Exemplo e um profissional.
  function iniciarConversaEmpresa(profId, vagaEmpresaId, vagaTitulo) {
    return obterOuCriarConversa({
      ladoDono: profId === PR_ID ? 'ambos' : 'empresa',
      profissionalId: profId, empresaId: 'empresa-exemplo',
      vagaTitulo: vagaTitulo || '', vagaEmpresaId: vagaEmpresaId || null,
      vagaProfId: (vagaEmpresaId && window.MOCK.vagaLink[vagaEmpresaId]) || null
    });
  }

  // Cria (ou reaproveita) a conversa entre o João Silva e uma empresa.
  function iniciarConversaProfissional(empresaId, vagaProfId, vagaTitulo) {
    var vagaEmpresaId = null;
    if (vagaProfId) {
      Object.keys(window.MOCK.vagaLink).some(function (k) {
        if (window.MOCK.vagaLink[k] === vagaProfId) { vagaEmpresaId = k; return true; }
        return false;
      });
    }
    return obterOuCriarConversa({
      ladoDono: empresaId === 'empresa-exemplo' ? 'ambos' : 'profissional',
      profissionalId: PR_ID, empresaId: empresaId,
      vagaTitulo: vagaTitulo || '', vagaEmpresaId: vagaEmpresaId, vagaProfId: vagaProfId || null
    });
  }

  function E() { return window.MOCK.empresa; }
  function prof(id) { return window.MOCK.profissionais[id]; }
  function firstName(p) { return p.nome.split(' ')[0]; }
  function todasVagas(s) { return s.vagas.concat(E().vagas); }
  function vagaPorId(s, id) { return todasVagas(s).filter(function (v) { return v.id === id; })[0]; }
  function requisitosDe(v) { return v.requisitosTotal || E().requisitosPadrao; }
  function nota(n) { return parseFloat(String(n).replace(',', '.')); }
  function q(v) { return encodeURIComponent(v); }

  /* ---------- Localização (documento v0.2, seções 6, 7, 10 e 10.1) ---------- */

  function LOC() { return window.MOCK.localizacao; }
  var KM_POR_MILHA = 1.609344;

  function unidadeDoPais(pais) { return LOC().paisesEmMilhas.indexOf(pais) !== -1 ? 'mi' : 'km'; }
  function raioPadrao(pais) { var u = unidadeDoPais(pais); return { valor: LOC().raioPadrao[u], unidade: u }; }
  function raioKm(r) { return r.unidade === 'mi' ? r.valor * KM_POR_MILHA : r.valor; }
  function raioTexto(r) { return r.valor + ' ' + (r.unidade === 'mi' ? 'milhas' : 'km'); }
  function cidadeCurta(loc) { return loc.cidade + (loc.estado ? ', ' + loc.estado : ''); }
  function semAcento(t) { return String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }

  function fusoDe(loc) { return loc ? LOC().fusoPorPais[loc.pais] : null; }
  function fusoRotulo(id) {
    var f = LOC().fusos.filter(function (x) { return x.id === id; })[0];
    return f ? f.rotulo : 'UTC' + (id < 0 ? '−' + (-id) : '+' + id);
  }
  function fusoCurto(id) { return fusoRotulo(id).split(' · ')[0]; }

  // Distância em linha reta entre dois pontos (fórmula de haversine), em km. No MVP não há rota.
  function distanciaKm(a, b) {
    var rad = Math.PI / 180;
    var dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  // Distância aproximada, para não expor o endereço: arredondada (1 em 1 até 10, de 5 em 5 até 100,
  // de 10 em 10 depois) e sempre com "≈".
  function distTexto(km, unidade) {
    var u = unidade === 'mi' ? 'mi' : 'km';
    var v = u === 'mi' ? km / KM_POR_MILHA : km;
    if (v < 1) return 'menos de 1 ' + u;
    var r = v < 10 ? Math.round(v) : (v < 100 ? Math.round(v / 5) * 5 : Math.round(v / 10) * 10);
    return '≈ ' + r.toLocaleString('pt-BR') + ' ' + u;
  }

  function modeloId(rotuloOuId) {
    var m = E().formulario.modelos.filter(function (x) { return x.id === rotuloOuId || x.rotulo === rotuloOuId; })[0];
    return m ? m.id : '';
  }
  function modeloRotulo(id) { return E().formulario.modelos.filter(function (x) { return x.id === id; })[0].rotulo; }

  // Cidade digitada ao publicar uma vaga -> ponto aproximado conhecido pelo protótipo (ou null).
  function acharCidade(cidade, pais, estado) {
    var c = LOC().cidades.filter(function (x) { return x.pais === pais && semAcento(x.cidade) === semAcento(cidade); })[0];
    return c ? { cidade: c.cidade, estado: estado || c.estado, pais: c.pais, lat: c.lat, lng: c.lng } : null;
  }

  // Localização do perfil do profissional (seção 6). A distância máxima do João pode ser
  // alterada na demonstração (tela inicial do profissional).
  function perfilLocal(id) {
    var p = prof(id);
    var max = p.distanciaMax;
    if (id === PR_ID && loadP().distanciaMax) max = loadP().distanciaMax;
    return { loc: p.loc, distanciaMax: max, aceitaMudar: !!p.aceitaMudar, modelos: p.modelos || ['presencial'], fuso: fusoDe(p.loc) };
  }

  // A distância máxima na unidade do país da pessoa (o perfil guarda em km).
  function distMaxTexto(pl) {
    var u = unidadeDoPais(pl.loc.pais);
    return 'até ' + (u === 'mi' ? Math.round(pl.distanciaMax / KM_POR_MILHA) + ' milhas' : pl.distanciaMax + ' km');
  }

  // Localização de uma vaga do catálogo do profissional: { modelo, loc, raio, fuso }.
  function localVagaJob(v) {
    return {
      modelo: modeloId(v.modelo), loc: v.loc || null,
      raio: v.raio || (v.loc ? raioPadrao(v.loc.pais) : null),
      fuso: v.fuso != null ? v.fuso : null
    };
  }

  // Localização de uma vaga da Empresa Exemplo (publicada na demonstração ou ligada ao catálogo),
  // já com o raio ampliado pela empresa, se houver. Devolve null quando a vaga não tem localização.
  function localVagaEmpresa(s, v) {
    var base;
    if (v.dados) {
      base = { modelo: v.dados.modelo, loc: v.dados.loc || null, raio: v.dados.raio || null, fuso: v.dados.fuso != null ? v.dados.fuso : null };
    } else if (window.MOCK.vagaLink[v.id]) {
      base = localVagaJob(vagaJob(window.MOCK.vagaLink[v.id]));
    } else {
      return null;
    }
    if (base.loc && s.raios[v.id]) base.raio = s.raios[v.id];
    return base;
  }

  // Regra das indicações (seção 10.1).
  // Presencial e híbrida: a pessoa precisa estar dentro do raio da vaga E dentro da distância máxima
  // que ela mesma aceita. Remota: não usa distância; entra quem aceita trabalho remoto e, se a vaga
  // definir um fuso, quem está a até N horas dele. Sem ponto conhecido, não filtra.
  // Devolve { ok, km (ou null), motivo: null | 'raio' | 'limite' | 'remoto' | 'fuso' }.
  function regraLocal(vl, pl, raioOutro) {
    if (!vl) return { ok: true, km: null, motivo: null };
    if (vl.modelo === 'remoto') {
      if (pl.modelos.indexOf('remoto') === -1) return { ok: false, km: null, motivo: 'remoto' };
      if (vl.fuso != null && pl.fuso != null && Math.abs(vl.fuso - pl.fuso) > LOC().toleranciaFusoHoras) return { ok: false, km: null, motivo: 'fuso' };
      return { ok: true, km: null, motivo: null };
    }
    if (!vl.loc || !pl.loc) return { ok: true, km: null, motivo: null };
    var km = distanciaKm(vl.loc, pl.loc);
    if (km > raioKm(raioOutro || vl.raio)) return { ok: false, km: km, motivo: 'raio' };
    if (km > pl.distanciaMax) return { ok: false, km: km, motivo: 'limite' };
    return { ok: true, km: km, motivo: null };
  }

  var MOTIVO_FORA = {
    raio: ['fora do raio da vaga', 'fora do raio da vaga'],
    limite: ['mora além da distância que aceita', 'moram além da distância que aceitam'],
    remoto: ['não aceita trabalho remoto', 'não aceitam trabalho remoto'],
    fuso: ['está em fuso incompatível', 'estão em fuso incompatível']
  };

  // "2 fora do raio da vaga · 1 mora além da distância que aceita"
  function foraResumo(fora) {
    return Object.keys(MOTIVO_FORA).map(function (m) {
      var n = fora.filter(function (f) { return f.motivo === m; }).length;
      return n ? n + ' ' + MOTIVO_FORA[m][n === 1 ? 0 : 1] : '';
    }).filter(Boolean).join(' · ');
  }

  // A contratação que o João Silva confirma (jornada do profissional) é a mesma que a empresa marca.
  // Devolve null | 'confirmado' | 'contestado' | 'recusado' para a vaga da confirmação; null para as demais vagas.
  function confirmacaoDaVaga(vagaId) {
    return vagaId === window.MOCK.profissional.confirmacao.vagaId ? loadP().confirmacao : null;
  }

  function candidatosDe(s, vagaId) {
    var conf = confirmacaoDaVaga(vagaId);
    var lista = (E().candidatos[vagaId] || []).slice();

    // Se o João se candidatou de verdade a esta vaga pelo lado do profissional, e ela ainda não
    // tinha um candidato fixo para ele no mock, ele entra na lista (mesma sessão, mesma aba).
    var vagaProfId = window.MOCK.vagaLink[vagaId];
    if (vagaProfId && !lista.some(function (c) { return c.id === PR_ID; })) {
      var live = loadP().candidaturas[vagaProfId];
      if (live) lista.push({ id: PR_ID, atende: compat(vagaJob(vagaProfId)).atende, status: 'novo', data: live.data });
    }

    return lista.map(function (c) {
      var st = s.status[vagaId + ':' + c.id] || c.status;
      if (c.id === PR_ID) {
        if (conf === 'confirmado' || conf === 'contestado') st = 'contratado';
        else if (conf === 'recusado') st = 'nao';
      }
      return { id: c.id, atende: c.atende, status: st, data: c.data, candidatura: candidaturaDe(vagaId, c.id) };
    });
  }

  // O que a pessoa enviou ao se candidatar: mensagem, respostas de triagem, pretensão salarial e
  // currículo. Vem do mock (candidatos fictícios) ou, para o João, do que ele enviou na sessão.
  function candidaturaDe(vagaEmpresaId, profId) {
    var mockC = (E().candidatos[vagaEmpresaId] || []).filter(function (c) { return c.id === profId; })[0];
    var cand = (mockC && mockC.candidatura) || null;
    if (profId === PR_ID) {
      var vagaProfId = window.MOCK.vagaLink[vagaEmpresaId];
      if (vagaProfId) {
        var live = loadP().candidaturas[vagaProfId];
        if (live && live.candidatura) cand = live.candidatura;
      }
    }
    return cand;
  }

  function temCandidatura(cand) {
    return !!(cand && (cand.mensagem || cand.pretensao || cand.curriculo ||
      (cand.triagem && Object.keys(cand.triagem).some(function (k) { return cand.triagem[k]; }))));
  }

  // "Dentro da faixa" / "Acima" / "Abaixo", só quando a pretensão usa a mesma moeda e período da vaga.
  function faixaIndicador(pret, sal) {
    if (!sal || !pret || pret.moeda !== sal.moeda || pret.periodo !== sal.periodo) return null;
    if (pret.valor < sal.min) return { label: 'Abaixo da faixa', tom: 'grey' };
    if (pret.valor > sal.max) return { label: 'Acima da faixa', tom: 'amber' };
    return { label: 'Dentro da faixa', tom: 'green' };
  }

  // Corpo do bloco "Candidatura": mensagem, perguntas de triagem respondidas, pretensão salarial
  // (com a indicação de faixa) e currículo. Usado tanto no card compacto quanto no perfil completo.
  function candidaturaCorpoHtml(cand, vagaProf) {
    var partes = [];
    if (cand.mensagem) partes.push('<p class="row-sub cand-msg">“' + esc(cand.mensagem) + '”</p>');
    var perguntas = (vagaProf && vagaProf.perguntasTriagem) || [];
    if (perguntas.length) {
      partes.push('<dl class="summary">' + perguntas.map(function (pg, i) {
        var r = cand.triagem && cand.triagem[i] != null && cand.triagem[i] !== '' ? cand.triagem[i] : 'Não respondida';
        return '<div><dt>' + esc(pg.texto) + '</dt><dd>' + esc(r) + '</dd></div>';
      }).join('') + '</dl>');
    }
    if (cand.pretensao) {
      var ind = faixaIndicador(cand.pretensao, vagaProf && vagaProf.salario);
      partes.push('<div class="chips"><span class="chip' + (ind ? ' ' + ind.tom : '') + '">Pretensão: ' + esc(combSalario(cand.pretensao)) +
        (ind ? ' · ' + esc(ind.label) : '') + '</span></div>');
    }
    if (cand.curriculo) {
      partes.push('<div class="btn-row"><button type="button" class="btn btn-outline" data-todo="' + TODO + '">' +
        icon('clipboard', 16, { stroke: 2 }) + 'Ver currículo</button></div>' +
        '<p class="row-sub cand-arquivo">' + esc(cand.curriculo.nome) + ' · ' + formatBytes(cand.curriculo.tamanho) + '</p>');
    }
    return partes.join('');
  }

  function formatBytes(n) {
    var mb = n / (1024 * 1024);
    return mb >= 0.1 ? mb.toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
  }

  // Termos de temas proibidos numa pergunta de triagem (idade, gênero, raça, religião, estado civil,
  // filhos, gravidez, nacionalidade, origem). Devolve os termos encontrados, ou [] se estiver tudo bem.
  // Só conta como termo quando ele aparece como palavra própria — não dentro de outra palavra
  // (ex.: "disponibilidade" não pode acionar o termo "idade").
  var LETRA_PT = /[a-zà-öø-ÿ]/i;
  function contemComoPalavra(t, termo) {
    var i = t.indexOf(termo);
    while (i !== -1) {
      var antes = t.charAt(i - 1), depois = t.charAt(i + termo.length);
      if (!LETRA_PT.test(antes) && !LETRA_PT.test(depois)) return true;
      i = t.indexOf(termo, i + 1);
    }
    return false;
  }
  function termosProibidosEm(texto) {
    var t = (texto || '').toLowerCase();
    return E().formulario.termosProibidosTriagem.filter(function (termo) { return contemComoPalavra(t, termo); });
  }

  // Pessoas marcadas como contratadas, aguardando confirmação (some da lista se a pessoa recusou).
  function preench(s, vagaId) {
    var ids = s.preenchidas[vagaId];
    if (ids && confirmacaoDaVaga(vagaId) === 'recusado') ids = ids.filter(function (id) { return id !== PR_ID; });
    return ids && ids.length ? ids : null;
  }

  // O combinado registrado pela empresa na sessão, ou o combinado padrão de mock-data.js (a mesma
  // referência usada no card do profissional mesmo antes de a empresa passar por preencher-vaga.html).
  function combinadoDe(s, vagaId) {
    if (s.combinados && s.combinados[vagaId]) return s.combinados[vagaId];
    if (vagaId === window.MOCK.profissional.confirmacao.vagaId) return window.MOCK.profissional.confirmacao.combinado;
    return null;
  }

  function combSalario(comb) {
    var fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: comb.moeda });
    var per = E().formulario.periodos.filter(function (p) { return p.id === comb.periodo; })[0].rotulo;
    return fmt.format(comb.valor) + ' ' + per;
  }

  function combinadoResumoHtml(comb) {
    return '<dl class="summary">' +
      '<div><dt>Função</dt><dd>' + esc(comb.funcao) + '</dd></div>' +
      '<div><dt>Tipo de contratação</dt><dd>' + esc(comb.tipoContratacao) + '</dd></div>' +
      '<div><dt>Salário</dt><dd>' + esc(combSalario(comb)) + '</dd></div>' +
      '<div><dt>Início</dt><dd>' + dataBR(comb.dataInicio) + '</dd></div>' +
      '<div><dt>Jornada</dt><dd>' + esc(comb.jornada) + '</dd></div></dl>';
  }

  // Texto de referência ao combinado, citado dentro de uma pergunta de avaliação.
  function refTexto(chave, comb) {
    if (chave === 'funcao') return comb.funcao;
    if (chave === 'jornada') return comb.jornada;
    if (chave === 'salario') return combSalario(comb);
    if (chave === 'condicoes') return 'início em ' + dataBR(comb.dataInicio) + ', ' + comb.tipoContratacao;
    return '';
  }

  function indicadosDe(s, v) {
    return E().indicados[v.id] || (v.publicada ? E().indicadosPadrao : null);
  }

  // Indicados de uma vaga já filtrados pela regra de localização, com quem ficou de fora e, quando
  // há poucos (menos que "minimoIndicados"), o menor raio que traria mais gente (aviso para ampliar).
  function indicacoesDe(s, v) {
    var vl = localVagaEmpresa(s, v);
    var dentro = [], fora = [];
    (indicadosDe(s, v) || []).forEach(function (i) {
      var r = regraLocal(vl, perfilLocal(i.id));
      (r.ok ? dentro : fora).push({ id: i.id, atende: i.atende, km: r.km, motivo: r.motivo });
    });
    var sugestao = null;
    if (vl && vl.loc && vl.modelo !== 'remoto' && dentro.length < LOC().minimoIndicados) {
      LOC().raios[vl.raio.unidade].some(function (valor) {
        var r = { valor: valor, unidade: vl.raio.unidade };
        if (raioKm(r) <= raioKm(vl.raio)) return false;
        var ganho = fora.filter(function (f) { return f.motivo === 'raio' && regraLocal(vl, perfilLocal(f.id), r).ok; }).length;
        if (ganho) sugestao = { raio: r, ganho: ganho };
        return ganho > 0;
      });
    }
    return { vl: vl, dentro: dentro, fora: fora, sugestao: sugestao };
  }

  // Cidade do profissional e distância aproximada até a vaga (sem endereço), para os cards da empresa.
  function localProfTexto(id, vl) {
    var pl = perfilLocal(id);
    var mesmoPais = vl && vl.loc ? vl.loc.pais === pl.loc.pais : pl.loc.pais === E().loc.pais;
    var t = cidadeCurta(pl.loc) + (mesmoPais ? '' : ' · ' + pl.loc.pais);
    if (vl && vl.loc && vl.modelo !== 'remoto') t += ' · ' + distTexto(distanciaKm(vl.loc, pl.loc), unidadeDoPais(vl.loc.pais)) + ' da vaga';
    return t;
  }

  // Texto e aviso sobre a localização das indicações de uma vaga (tela inicial da empresa).
  function indLocalHtml(ind) {
    var vl = ind.vl, html;
    if (!vl) return '';
    if (vl.modelo === 'remoto') {
      html = 'Vaga remota: sem limite de distância. Indicamos quem aceita trabalho remoto' +
        (vl.fuso != null ? ' e está a até ' + LOC().toleranciaFusoHoras + ' h do fuso da vaga (' + fusoCurto(vl.fuso) + ')' : '') + '.';
    } else if (!vl.loc) {
      html = 'Não localizamos a cidade da vaga no protótipo, então as indicações não foram filtradas por distância.';
    } else {
      html = 'Moram a até ' + raioTexto(vl.raio) + ' da vaga (' + cidadeCurta(vl.loc) + ') e aceitam essa distância. Distância aproximada, em linha reta; o endereço de ninguém é mostrado.';
    }
    var out = '<p class="note">' + icon('check', 16, { stroke: 2.4 }) + '<span id="ind-regra">' + esc(html) + '</span></p>';
    if (ind.fora.length) {
      out += '<p class="row-sub note-indent" id="ind-fora">Não aparecem: ' + esc(foraResumo(ind.fora)) + '.</p>';
    }
    if (!ind.sugestao && vl.loc && vl.modelo !== 'remoto' && ind.dentro.length < LOC().minimoIndicados) {
      out += '<p class="row-sub note-indent" id="ind-poucos">Poucos profissionais nos arredores. Ampliar o raio não traria mais ninguém agora.</p>';
    }
    if (ind.sugestao) {
      var sg = ind.sugestao;
      out += '<div class="card card-warn" id="ind-aviso"><div class="media"><div class="icon-tile amber">' + icon('users', 22) + '</div>' +
        '<div class="row-main"><div class="row-title">Poucos profissionais nos arredores</div>' +
        '<div class="row-sub">' + (ind.dentro.length ? 'Só ' + plural(ind.dentro.length, 'profissional', 'profissionais') : 'Nenhum profissional') +
          ' dentro de ' + esc(raioTexto(vl.raio)) + '. Com ' + esc(raioTexto(sg.raio)) + ', ' +
          (sg.ganho === 1 ? 'entra mais 1 profissional.' : 'entram mais ' + sg.ganho + ' profissionais.') + '</div></div></div>' +
        '<button type="button" class="btn btn-primary" data-ampliar="' + sg.raio.valor + '" data-unidade="' + sg.raio.unidade + '">Ampliar raio para ' + esc(raioTexto(sg.raio)) + '</button></div>';
    }
    return out;
  }

  // Compatibilidade primeiro, reputação depois (quem é novo na plataforma fica atrás).
  function ordenar(list) {
    return list.slice().sort(function (a, b) {
      if (b.atende !== a.atende) return b.atende - a.atende;
      var pa = prof(a.id), pb = prof(b.id);
      var na = pa.novo ? -1 : nota(pa.nota), nb = pb.novo ? -1 : nota(pb.nota);
      if (nb !== na) return nb - na;
      return pb.trabalhos - pa.trabalhos;
    });
  }

  function statusLabel(id) {
    return E().statusCandidato.filter(function (x) { return x.id === id; })[0];
  }

  function nomesDe(ids) {
    return ids.map(function (id) { return prof(id).nome; }).join(' e ');
  }

  // Status e detalhe de uma vaga, levando em conta o que foi feito na demonstração.
  function vagaInfo(s, v) {
    var conf = confirmacaoDaVaga(v.id);
    if (conf === 'confirmado' && v.status !== 'Preenchida') {
      return { status: 'Preenchida', chip: 'blue', detalhe: 'Preenchida por ' + prof(PR_ID).nome + ' · confirmado' };
    }
    if (conf === 'contestado' && v.status !== 'Preenchida') {
      return { status: 'Preenchida · combinado contestado', chip: 'amber', detalhe: prof(PR_ID).nome + ' apontou uma diferença no combinado.' };
    }
    if (conf === 'recusado' && v.status !== 'Preenchida') {
      return { status: 'Aberta', chip: 'amber', detalhe: 'Contratação recusada por ' + prof(PR_ID).nome + '. Escolha outra pessoa.' };
    }
    var ids = preench(s, v.id);
    if (ids && v.status !== 'Preenchida') {
      return { status: 'Preenchida · aguardando confirmação', chip: 'amber', detalhe: 'Pessoa indicada: ' + nomesDe(ids) };
    }
    if (v.status === 'Preenchida') return { status: v.status, chip: 'blue', detalhe: v.detalhe };
    var c = candidatosDe(s, v.id);
    var novos = c.filter(function (x) { return x.status === 'novo'; }).length;
    return {
      status: v.status,
      chip: STATUS_CHIP[v.status] || 'grey',
      detalhe: plural(c.length, 'candidato', 'candidatos') + (novos ? ' · ' + plural(novos, 'novo', 'novos') : '')
    };
  }

  function vagaAberta(s, v) { return vagaInfo(s, v).status === 'Aberta'; }

  /* ---------- Peças das telas da empresa ---------- */

  function empresaNav(current) {
    return nav([
      { id: 'inicio', label: 'Início', icon: 'home', href: 'empresa.html' },
      { id: 'vagas', label: 'Vagas', icon: 'briefcase' },
      { id: 'candidatos', label: 'Candidatos', icon: 'users', href: 'candidatos.html' },
      { id: 'mensagens', label: 'Mensagens', icon: 'message', href: 'mensagens.html?como=empresa' },
      { id: 'empresa', label: 'Empresa', icon: 'building' }
    ], current);
  }

  // Topo das telas internas: seta de voltar (tela anterior) e título.
  function subTopbar(title, fallback) {
    $('#topbar').innerHTML =
      '<a href="' + esc(fallback) + '" class="icon-btn" id="back" aria-label="Voltar">' + icon('back', 22, { stroke: 2 }) + '</a>' +
      '<h1 class="topbar-title">' + esc(title) + '</h1>';
    $('#back').addEventListener('click', function (e) {
      var ref = document.referrer;
      if (window.history.length > 1 && ref && ref.indexOf(window.location.origin) === 0) {
        e.preventDefault();
        window.history.back();
      }
    });
  }

  function notFound(msg, href) {
    $('#content').innerHTML = '<div class="card"><h2 class="card-title">' + esc(msg) + '</h2>' +
      '<p class="row-sub">Volte para o início e tente de novo.</p>' +
      '<a href="' + (href || 'empresa.html') + '" class="btn btn-primary">Ir para o início</a></div>';
  }

  function perfilHref(id, vagaId) {
    return 'perfil-profissional.html?id=' + q(id) + (vagaId ? '&vaga=' + q(vagaId) : '');
  }

  function reputacaoChip(p) {
    return p.novo
      ? '<span class="chip blue">Novo na plataforma · reputação em construção</span>'
      : '<span class="chip">Nota ' + esc(p.nota) + ' · ' + p.trabalhos + ' trabalhos verificados</span>';
  }

  function nomeComSelo(p) {
    return esc(p.nome) + (p.verificado ? ' <span style="color:var(--green)">' + icon('check', 16, { stroke: 2.6, label: 'Perfil verificado' }) + '</span>' : '');
  }

  // Cartão de profissional (indicados na tela inicial e candidatos). "candBlock" é o bloco
  // "Candidatura" (mensagem, triagem, pretensão, currículo), quando a pessoa já é candidata.
  // "localTxt": cidade e distância aproximada até a vaga (ver localProfTexto).
  function profCard(id, atende, de, actions, extra, candBlock, localTxt) {
    var p = prof(id);
    return '<article class="card' + (p.novo ? ' card-new' : '') + '">' +
      '<div class="media center"><div class="avatar lg" style="background:' + esc(p.cor) + '">' + esc(p.iniciais) + '</div>' +
      '<div class="row-main"><div class="row-title" style="display:flex;align-items:center;gap:6px;font-weight:800">' + nomeComSelo(p) + '</div>' +
      '<div class="row-sub">' + esc(p.resumo) + '</div>' +
      (localTxt ? '<div class="row-sub loc-line">' + esc(localTxt) + '</div>' : '') + '</div></div>' +
      '<div class="chips"><span class="chip green">Atende ' + atende + ' de ' + de + ' requisitos</span>' + reputacaoChip(p) + (extra || '') + '</div>' +
      (candBlock ? '<div class="cand-block">' + candBlock + '</div>' : '') +
      actions + '</article>';
  }

  /* ----- Formulários: campos, grupos e validação ----- */

  var REQ = ' <span class="req" aria-hidden="true">*</span>';

  function field(id, label, tag, attrs, inner, o) {
    o = o || {};
    var desc = (o.hint ? id + '-hint ' : '') + id + '-err';
    var common = ' id="' + id + '" data-ctl ' + attrs + ' aria-describedby="' + desc + '"' + (o.req ? ' aria-required="true"' : '');
    var control = tag === 'input' ? '<input' + common + '>' : '<' + tag + common + '>' + (inner || '') + '</' + tag + '>';
    return '<div class="field" id="f-' + id + '"><label for="' + id + '">' + esc(label) + (o.req ? REQ : '') + '</label>' + control +
      (o.hint ? '<p class="field-hint" id="' + id + '-hint">' + esc(o.hint) + '</p>' : '') +
      '<p class="field-error" id="' + id + '-err" hidden></p></div>';
  }

  function group(id, legend, inner, o) {
    o = o || {};
    var desc = (o.hint ? id + '-hint ' : '') + id + '-err';
    return '<fieldset class="field group" id="f-' + id + '" aria-describedby="' + desc + '">' +
      '<legend>' + esc(legend) + (o.req ? REQ : '') + '</legend>' +
      (o.hint ? '<p class="field-hint" id="' + id + '-hint">' + esc(o.hint) + '</p>' : '') +
      inner + '<p class="field-error" id="' + id + '-err" hidden></p></fieldset>';
  }

  function pills(name, items, selected) {
    return '<div class="pills">' + items.map(function (it) {
      var checked = selected != null && String(it.id) === String(selected) ? ' checked' : '';
      return '<label class="pill"><input type="radio" name="' + esc(name) + '" value="' + esc(it.id) + '" class="pill-input"' + checked + '><span>' + esc(it.rotulo) + '</span></label>';
    }).join('') + '</div>';
  }

  function options(list, placeholder) {
    return (placeholder ? '<option value="">' + esc(placeholder) + '</option>' : '') + list.map(function (it) {
      var v = typeof it === 'string' ? it : it.id, l = typeof it === 'string' ? it : it.rotulo;
      return '<option value="' + esc(v) + '">' + esc(l) + '</option>';
    }).join('');
  }

  // Aplica o resultado da validação; foca o primeiro campo com erro. Devolve true se tudo passou.
  function check(rules) {
    var first = null;
    rules.forEach(function (r) {
      var err = $('#' + r.id + '-err'), box = $('#f-' + r.id);
      if (!err || !box) return;
      err.hidden = r.ok;
      err.textContent = r.ok ? '' : r.msg;
      box.classList.toggle('invalid', !r.ok);
      var ctl = box.querySelector('[data-ctl]');
      if (ctl) ctl.setAttribute('aria-invalid', String(!r.ok));
      if (!r.ok && !first) first = box.querySelector('input,select,textarea,button');
    });
    if (first) first.focus();
    return !first;
  }

  // Ao mexer num campo com erro, o erro some (é conferido de novo ao enviar).
  function limparErro(e) {
    var box = e.target.closest('.field.invalid');
    if (!box) return;
    box.classList.remove('invalid');
    var err = box.querySelector('.field-error');
    if (err) { err.hidden = true; err.textContent = ''; }
    var ctl = box.querySelector('[data-ctl]');
    if (ctl) ctl.removeAttribute('aria-invalid');
    var st = $('#form-status');
    if (st && !document.querySelector('.field.invalid')) st.textContent = '';
  }
  document.addEventListener('input', limparErro);
  document.addEventListener('change', limparErro);

  function say(msg) {
    var el = $('#live');
    if (el) el.textContent = msg;
  }

  function showDone(o) {
    $('#content').innerHTML = '<div class="done"><div class="icon-tile lg ' + (o.tom || 'blue') + '">' + icon(o.icone, 30, { stroke: 2 }) + '</div>' +
      '<h2 id="done-title" tabindex="-1">' + esc(o.titulo) + '</h2>' +
      '<p class="done-text">' + o.texto + '</p>' + (o.extra || '') +
      '<div class="btn-row done-actions">' + o.acoes + '</div></div>' +
      '<div class="visually-hidden" role="status" id="live"></div>';
    window.scrollTo(0, 0);
    $('#done-title').focus();
  }

  /* ---------- Confirmação/contestação do combinado (usada na tela inicial e em Minhas candidaturas) ---------- */

  // modo: null (padrão) | 'contestar' (compõe a contestação) | 'recusar' (confirma a recusa antes de enviar)
  function paintCombinado(container, comb, vagaTitulo) {
    var paraVaga = vagaTitulo ? ' para ' + esc(vagaTitulo) : '';
    function render(modo) {
      var sp = loadP();
      var estado = sp.confirmacao || 'pendente';
      var html;
      if (modo === 'contestar') {
        html = combinadoResumoHtml(comb) +
          field('contestacao-texto', 'O que está diferente do combinado?', 'textarea', 'rows="3" maxlength="300"', '',
            { req: true, hint: 'Conte o que mudou. Isso vai para a empresa revisar.' }) +
          '<div class="btn-row"><button type="button" class="btn btn-primary" data-cf="enviar-contestacao">Enviar contestação</button>' +
          '<button type="button" class="btn btn-outline" data-cf="cancelar">Cancelar</button></div>';
      } else if (modo === 'recusar') {
        html = '<h3 class="card-title">Confirmar que não foi contratado?</h3>' +
          '<p class="row-sub">A empresa será avisada' + paraVaga + ', e o vínculo não entra no histórico de ninguém.</p>' +
          '<div class="btn-row"><button type="button" class="btn btn-primary" data-cf="confirmar-recusa">Sim, não fui contratado</button>' +
          '<button type="button" class="btn btn-outline" data-cf="cancelar">Cancelar</button></div>';
      } else if (estado === 'pendente') {
        html = '<h3 class="card-title">Confirme a contratação</h3>' + combinadoResumoHtml(comb) +
          '<div class="btn-row"><button type="button" class="btn btn-primary" data-cf="confirmar">Confirmar</button>' +
          '<button type="button" class="btn btn-outline" data-cf="contestar">Algo está diferente</button>' +
          '<button type="button" class="btn btn-outline" data-cf="recusar">Não fui contratado</button></div>';
      } else if (estado === 'contestado') {
        html = '<h3 class="card-title">Contestação enviada</h3>' +
          '<p class="row-sub">Você disse: “' + esc(sp.contestacaoTexto || '') + '”. A empresa foi avisada e vai revisar o combinado.</p>';
      } else if (estado === 'recusado') {
        html = '<h3 class="card-title">Resposta enviada</h3>' +
          '<p class="row-sub">Você avisou que não foi contratado' + paraVaga + '. A empresa foi avisada, e o vínculo não entra no histórico.</p>';
      } else {
        html = '<h3 class="card-title">Contratação confirmada</h3>' +
          '<p class="row-sub">O trabalho entra no seu histórico verificado. A avaliação fica disponível ao fim do vínculo.</p>';
      }
      container.innerHTML = html;
      container.querySelectorAll('[data-cf]').forEach(function (b) {
        b.addEventListener('click', function () {
          var act = b.getAttribute('data-cf');
          if (act === 'confirmar') {
            var st = loadP(); st.confirmacao = 'confirmado'; saveP(st);
            render(null); say('Contratação confirmada.'); atualizarPendTxt();
          } else if (act === 'contestar') {
            render('contestar');
          } else if (act === 'recusar') {
            render('recusar');
          } else if (act === 'cancelar') {
            render(null);
          } else if (act === 'enviar-contestacao') {
            var val = container.querySelector('#contestacao-texto').value.trim();
            if (!check([{ id: 'contestacao-texto', ok: val.length > 0, msg: 'Conte o que está diferente antes de enviar.' }])) return;
            var st2 = loadP(); st2.confirmacao = 'contestado'; st2.contestacaoTexto = val; saveP(st2);
            render(null); say('Contestação enviada.'); atualizarPendTxt();
          } else if (act === 'confirmar-recusa') {
            var st3 = loadP(); st3.confirmacao = 'recusado'; saveP(st3);
            render(null); say('Resposta enviada.'); atualizarPendTxt();
          }
        });
      });
    }
    render(null);
  }

  function atualizarPendTxt() {
    var el = $('#pend-txt');
    if (el) el.textContent = pendTexto(loadP());
  }

  /* ---------- Login ---------- */

  function initLogin() {
    var role = 'profissional';
    var buttons = document.querySelectorAll('[data-role]');
    var submit = $('#login-submit');

    function update() {
      buttons.forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-role') === role));
      });
      submit.textContent = role === 'empresa' ? 'Entrar como empresa' : 'Entrar como profissional';
    }

    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        role = b.getAttribute('data-role');
        update();
      });
    });

    // Protótipo: não há autenticação. Qualquer e-mail e senha entram.
    $('#login-form').addEventListener('submit', function (e) {
      e.preventDefault();
      // Cada entrada recomeça a demonstração (empresa, profissional e conversas).
      try {
        window.sessionStorage.removeItem(KEY);
        window.sessionStorage.removeItem(KEY_P);
        window.sessionStorage.removeItem(KEY_CHAT);
      } catch (err) { /* ignora */ }
      window.location.href = role === 'empresa' ? 'empresa.html' : 'profissional.html';
    });

    update();
  }

  /* ---------- Empresa: início ---------- */

  function renderEmpresa() {
    var d = E();
    var s = load();
    var vagas = todasVagas(s);
    var rep = d.reputacao;
    var abertas = vagas.filter(function (v) { return vagaAberta(s, v) && indicadosDe(s, v); });
    var pedida = params.get('vaga');
    var selecionada = abertas.some(function (v) { return v.id === pedida; }) ? pedida : (abertas.length ? abertas[0].id : null);

    $('#topbar').innerHTML =
      brandMark() +
      '<button type="button" class="row-main" data-todo="' + TODO + '" style="border:0;background:transparent;padding:0;text-align:left;color:inherit;min-height:44px;flex-direction:row;align-items:center;gap:6px;cursor:pointer">' +
        '<span style="display:flex;flex-direction:column"><span style="font-size:11px;font-weight:600;color:var(--muted-2)">Empresa</span>' +
        '<span style="font-size:15px;font-weight:800">' + esc(d.nome) + '</span></span>' +
        '<span class="chevron">' + icon('down', 16, { stroke: 2 }) + '</span></button>' +
      bell(3) +
      '<a href="index.html" class="avatar" aria-label="Conta da empresa (sair)">' + esc(d.iniciais) + '</a>';

    // "Precisa da sua atenção": o que já foi resolvido na demonstração sai da contagem.
    var itens = 0;
    var pend = d.pendencias.map(function (p) {
      var v = p.vaga ? vagaPorId(s, p.vaga) : null;
      if (p.id === 'preencher') {
        var conf = confirmacaoDaVaga(p.vaga);
        if (conf === 'confirmado') {
          return rowStatic({ icone: 'check', tom: 'blue', titulo: 'Contratação de ' + prof(PR_ID).nome + ' confirmada',
            texto: 'Vaga de ' + v.titulo + ' · o vínculo já conta no histórico e na reputação dos dois.' });
        }
        if (conf === 'contestado') {
          return rowStatic({ icone: 'message', tom: 'amber', titulo: 'Combinado contestado por ' + prof(PR_ID).nome,
            texto: 'Vaga de ' + v.titulo + ' · “' + loadP().contestacaoTexto + '”' });
        }
        if (conf === 'recusado') {
          return rowStatic({ icone: 'message', tom: 'amber', titulo: 'Contratação recusada por ' + prof(PR_ID).nome,
            texto: 'Vaga de ' + v.titulo + ' · escolha outra pessoa em Minhas vagas.' });
        }
        if (preench(s, p.vaga)) {
          return rowStatic({ icone: 'clock', tom: 'amber', titulo: 'Aguardando confirmação de ' + nomesDe(preench(s, p.vaga)),
            texto: 'Vaga de ' + v.titulo + ' · o vínculo só conta depois que a pessoa confirmar.' });
        }
      }
      if (p.id === 'avaliar' && s.avaliados[p.profissional]) {
        return rowStatic({ icone: 'check', tom: 'blue', titulo: 'Avaliação de ' + prof(p.profissional).nome + ' enviada',
          texto: 'Fica oculta até a pessoa enviar a dela ou o prazo terminar.' });
      }
      var titulo = p.titulo;
      if (p.id === 'novos') {
        var n = candidatosDe(s, p.vaga).filter(function (c) { return c.status === 'novo'; }).length;
        if (!n) return '';
        titulo = p.titulo.replace('{n}', n).replace('candidatos novos', n === 1 ? 'candidato novo' : 'candidatos novos');
      }
      itens++;
      if (p.destaque) {
        return '<div class="card card-highlight"><div class="media">' +
          '<div class="icon-tile blue">' + icon('check', 22, { stroke: 2 }) + '</div>' +
          '<div class="row-main"><div class="row-title">' + esc(titulo) + '</div>' +
          '<div class="row-sub">' + esc(p.texto) + '</div></div></div>' +
          '<a href="' + esc(p.href) + '" class="btn btn-primary">' + esc(p.acao) + '</a></div>';
      }
      return rowLink({ icone: p.icone, tom: p.tom, titulo: titulo, texto: p.texto, href: p.href });
    }).join('');

    var vagasHtml = vagas.map(function (v) {
      var i = vagaInfo(s, v);
      return '<a class="list-item" href="candidatos.html?vaga=' + q(v.id) + '"><div class="row-main"><div class="row-title">' + esc(v.titulo) + '</div>' +
        '<div class="row-sub">' + esc(i.detalhe) + '</div></div>' +
        '<span class="chip ' + i.chip + '">' + esc(i.status) + '</span>' +
        '<span class="chevron">' + icon('chevron', 18, { stroke: 2 }) + '</span></a>';
    }).join('');

    var nAbertas = vagas.filter(function (v) { return vagaAberta(s, v); }).length;

    function indSummary() {
      var v = vagas.filter(function (x) { return x.id === selecionada; })[0];
      return v ? indicacoesDe(s, v).dentro.length + ' para ' + v.titulo : 'Nenhum profissional indicado';
    }

    $('#content').innerHTML =
      '<div class="visually-hidden" role="status" id="live"></div>' +
      '<div class="stack"><div class="greeting-row"><div class="greeting"><h1>Bom dia, ' + esc(d.nome) + '</h1>' +
        '<p>' + (itens === 0 ? 'Nenhum item precisa da sua atenção hoje.' : (itens === 1 ? '1 item precisa' : itens + ' itens precisam') + ' da sua atenção hoje.') + '</p></div>' +
        '<a href="publicar-vaga.html" class="btn btn-primary">' + icon('plus', 16, { stroke: 2.2 }) + 'Publicar nova vaga</a></div>' +
        // Mesmo campo de busca da tela inicial do profissional.
        '<a href="buscar.html?como=empresa" class="row-link" id="busca-empresa" style="min-height:52px;border-color:var(--line-strong);color:var(--muted);font-size:15px">' +
          '<span style="color:var(--ink)">' + icon('search', 20, { stroke: 2 }) + '</span>Buscar profissionais ou cargos</a></div>' +

      '<section class="section" aria-labelledby="h-pend"><h2 id="h-pend">Precisa da sua atenção</h2>' + pend + '</section>' +

      accordion('acc-ind', 'Profissionais indicados', indSummary(),
        '<div class="filter" role="group" aria-label="Escolha a vaga" id="ind-filter"></div>' +
        '<p class="note">' + icon('check', 16, { stroke: 2.4 }) + '<span>Atendem os requisitos da vaga e têm reputação no mesmo nível da sua empresa.</span></p>' +
        '<div id="ind-local"></div>' +
        '<div class="section" id="ind-list" aria-live="polite"></div>' +
        '<div class="acc-more"><a href="buscar.html?como=empresa">Buscar outros profissionais</a></div>') +

      accordion('acc-rep', 'Reputação da empresa', 'Nota ' + rep.nota + ' · ' + plural(rep.contratacoes, 'contratação', 'contratações'),
        (d.verificada ? '<span class="rep-badge">' + icon('check', 14, { stroke: 2.5 }) + 'Empresa verificada</span>' : '') +
        '<div class="rep-grid">' + repStat(rep.nota, 'Nota geral') + repStat(rep.contratacoes, 'Contratações verificadas') + repStat(rep.pagouConforme, 'Pagou conforme combinado') + '</div>' +
        '<p class="rep-foot">Conta só contratações confirmadas pelos dois lados.</p>', true) +

      accordion('acc-vagas', 'Minhas vagas', plural(vagas.length, 'vaga', 'vagas') + ' · ' + plural(nAbertas, 'aberta', 'abertas'),
        '<div class="list">' + vagasHtml + '</div>' + accMore('Ver todas'));

    function renderIndicados() {
      $('#acc-ind-sum').textContent = indSummary();

      $('#ind-filter').innerHTML = abertas.map(function (v) {
        var n = indicacoesDe(s, v).dentro.length;
        return '<button type="button" data-vaga="' + esc(v.id) + '" aria-pressed="' + (v.id === selecionada) + '">' + esc(v.titulo) + ' · ' + n + '</button>';
      }).join('');

      var v = vagaPorId(s, selecionada);
      var ind = indicacoesDe(s, v);
      $('#ind-local').innerHTML = indLocalHtml(ind);
      $('#ind-list').innerHTML = ind.dentro.length ? ind.dentro.map(function (i) {
        return profCard(i.id, i.atende, requisitosDe(v),
          '<div class="btn-row"><button type="button" class="btn btn-primary" data-convidar="' + esc(i.id) + '" data-cv-vaga="' + esc(v.id) + '">Convidar para a vaga</button>' +
          '<a href="' + esc(perfilHref(i.id, v.id)) + '" class="btn btn-outline">Ver perfil</a></div>', '', '', localProfTexto(i.id, ind.vl));
      }).join('') : '<div class="empty"><p class="row-title">Nenhum profissional indicado nos arredores.</p></div>';
    }

    $('#content').addEventListener('click', function (e) {
      var b = e.target.closest('[data-vaga]');
      if (b) { selecionada = b.getAttribute('data-vaga'); renderIndicados(); return; }
      var amp = e.target.closest('[data-ampliar]');
      if (amp) {
        var r = { valor: Number(amp.getAttribute('data-ampliar')), unidade: amp.getAttribute('data-unidade') };
        var st = load();
        st.raios[selecionada] = r;
        save(st);
        s = st;
        renderIndicados();
        say('Raio ampliado para ' + raioTexto(r) + '.');
        return;
      }
      var cv = e.target.closest('[data-convidar]');
      if (cv) {
        var candId = cv.getAttribute('data-convidar'), vagaIdCtx = cv.getAttribute('data-cv-vaga');
        var vObj = vagaPorId(load(), vagaIdCtx);
        iniciarConversaEmpresa(candId, vagaIdCtx, vObj ? vObj.titulo : '');
        toast('Convite enviado para ' + prof(candId).nome + ' (simulação).');
      }
    });

    if (selecionada) renderIndicados();

    // Vindo de outra tela (ex.: "Ver profissionais indicados"), já abre a seção pedida.
    var aba = { indicados: 'acc-ind', vagas: 'acc-vagas' }[params.get('aba')];
    if (aba && (aba !== 'acc-ind' || selecionada)) {
      $('#' + aba + '-btn').click();
      $('#' + aba + '-btn').scrollIntoView({ block: 'start' });
    }

    $('#nav').innerHTML = empresaNav('inicio');
  }

  /* ---------- Empresa: publicar vaga ---------- */

  // Um item da lista de perguntas de triagem, em publicar-vaga.html.
  // Assinatura (item, i) para bater com o callback de Array.map (elemento primeiro, índice depois).
  function triagemItemHtml(item, i) {
    var n = i + 1;
    var opcoesHtml = [0, 1, 2, 3].map(function (k) {
      return field('triagem-' + i + '-opcao-' + k, 'Opção ' + (k + 1), 'input',
        'type="text" maxlength="40" autocomplete="off" data-triagem-i="' + i + '" data-triagem-campo="opcao-' + k + '" value="' + esc(item.opcoes[k] || '') + '"');
    }).join('');
    return '<div class="triagem-item">' +
      '<div class="head-row"><strong>Pergunta ' + n + '</strong>' +
      '<button type="button" class="chip-x" data-remove-triagem="' + i + '" aria-label="Remover pergunta ' + n + '">' + icon('x', 12, { stroke: 2.4 }) + '</button></div>' +
      field('triagem-' + i + '-texto', 'Texto da pergunta', 'input',
        'type="text" maxlength="140" autocomplete="off" placeholder="Ex.: Tem disponibilidade aos sábados?" data-triagem-i="' + i + '" data-triagem-campo="texto" value="' + esc(item.texto) + '"', '', { req: true }) +
      group('triagem-' + i + '-tipo', 'Tipo de resposta',
        pills('triagem-' + i + '-tipo', [{ id: 'simnao', rotulo: 'Sim/Não' }, { id: 'multipla', rotulo: 'Múltipla escolha' }], item.tipo), { req: true }) +
      '<div class="triagem-opcoes"' + (item.tipo !== 'multipla' ? ' hidden' : '') + '>' + opcoesHtml + '</div>' +
      '</div>';
  }

  function renderPublicar() {
    var f = E().formulario;
    var lista = { competencias: [], idiomas: [] };
    var triagem = [];

    subTopbar('Publicar vaga', 'empresa.html');
    $('#nav').innerHTML = empresaNav('vagas');

    $('#content').innerHTML =
      '<form id="vaga-form" class="form" novalidate>' +
      '<p class="form-note">Campos com <span aria-hidden="true">*</span><span class="visually-hidden">asterisco</span> são obrigatórios. A vaga descreve o trabalho, não a pessoa: por isso não há campos de idade, gênero, raça, religião, estado civil, nacionalidade ou foto.</p>' +

      field('titulo', 'Título da vaga', 'input', 'type="text" maxlength="80" autocomplete="off" placeholder="Ex.: Recepcionista"', '', { req: true }) +
      field('descricao', 'Descrição', 'textarea', 'rows="5" maxlength="1500" placeholder="O que a pessoa vai fazer, em que horários, com quem vai trabalhar…"', '',
        { req: true, hint: 'Pelo menos 20 caracteres.' }) +

      group('modelo', 'Modelo de trabalho', pills('modelo', f.modelos), { req: true }) +

      '<div id="loc-fields" class="form-block">' +
        field('pais', 'País', 'select', '', options(f.paises, 'Selecione'), { req: true }) +
        field('estado', 'Estado ou região', 'input', 'type="text" maxlength="60" autocomplete="off" placeholder="Ex.: São Paulo"', '') +
        field('cidade', 'Cidade', 'input', 'type="text" maxlength="60" autocomplete="off" list="cidades-lista" placeholder="Ex.: São Paulo"', '', { req: true }) +
        '<datalist id="cidades-lista"></datalist>' +
        field('raio', 'Raio de busca', 'select', '', '', {
          hint: 'Indicamos só quem mora até essa distância da vaga (em linha reta) e aceita essa distância. Padrão: 25 milhas nos Estados Unidos e 40 km nos demais países.' }) +
      '</div>' +
      '<div id="loc-remoto" class="form-block" hidden>' +
        '<p class="note">' + icon('check', 16, { stroke: 2.4 }) + '<span>Vaga remota: não é preciso informar país, estado nem cidade, e não há raio de distância.</span></p>' +
        field('fuso', 'Fuso horário da equipe (opcional)', 'select', '', options(LOC().fusos, 'Qualquer fuso'), {
          hint: 'Se escolher um fuso, indicamos quem está a até ' + LOC().toleranciaFusoHoras + ' h de diferença dele.' }) +
      '</div>' +

      field('tipo', 'Tipo de contratação', 'select', '', options(f.tipos, 'Selecione'), { req: true }) +

      group('salario', 'Faixa salarial (opcional)',
        '<div class="form-grid">' +
          '<label class="mini"><span>Moeda</span><select id="moeda">' + options(f.moedas) + '</select></label>' +
          '<label class="mini"><span>Período</span><select id="periodo">' + options(f.periodos) + '</select></label>' +
          '<label class="mini"><span>Mínimo</span><input id="sal-min" type="number" inputmode="decimal" min="0" step="any" placeholder="0"></label>' +
          '<label class="mini"><span>Máximo</span><input id="sal-max" type="number" inputmode="decimal" min="0" step="any" placeholder="0"></label>' +
        '</div>') +

      '<div class="field" id="f-competencias"><label for="competencias-in">Competências</label>' +
        '<div class="add-row"><input id="competencias-in" data-ctl type="text" maxlength="40" autocomplete="off" placeholder="Ex.: Atendimento ao público" aria-describedby="competencias-hint competencias-err">' +
        '<button type="button" class="btn btn-outline" id="competencias-add">Adicionar</button></div>' +
        '<p class="field-hint" id="competencias-hint">Digite e toque em Adicionar (ou Enter). Até ' + f.limiteCompetencias + '.</p>' +
        '<p class="field-error" id="competencias-err" hidden></p>' +
        '<ul class="chips chip-list" id="competencias-list" aria-label="Competências adicionadas"></ul></div>' +

      '<div class="field" id="f-idiomas"><span class="field-label" id="idiomas-lbl">Idiomas</span>' +
        '<div class="add-row wrap"><label class="mini"><span>Idioma</span><select id="idioma-sel" data-ctl aria-describedby="idiomas-err">' + options(f.idiomas) + '</select></label>' +
        '<label class="mini"><span>Nível</span><select id="nivel-sel">' + options(f.niveis) + '</select></label>' +
        '<button type="button" class="btn btn-outline" id="idiomas-add">Adicionar</button></div>' +
        '<p class="field-error" id="idiomas-err" hidden></p>' +
        '<ul class="chips chip-list" id="idiomas-list" aria-label="Idiomas adicionados"></ul></div>' +

      field('experiencia', 'Experiência mínima', 'select', '', options(f.experiencias)) +
      field('posicoes', 'Número de posições', 'input', 'type="number" inputmode="numeric" min="1" max="99" value="1"', '', { req: true }) +

      '<div class="field" id="f-triagem-section"><span class="field-label">Perguntas de triagem (opcional, até ' + f.limitePerguntasTriagem + ')</span>' +
        '<p class="note note-box">' + icon('eye', 16, { stroke: 2 }) + '<span>Não é permitido perguntar sobre idade, gênero, raça, religião, estado civil, filhos, gravidez, nacionalidade ou origem. Nenhuma resposta é eliminatória — você só vê as respostas e decide.</span></p>' +
        '<div id="triagem-list"></div>' +
        '<button type="button" class="btn btn-outline" id="triagem-add">Adicionar pergunta</button></div>' +

      '<p class="form-status" id="form-status" role="alert"></p>' +
      '<div class="btn-row form-actions"><button type="submit" class="btn btn-primary">Publicar vaga</button>' +
      '<a href="empresa.html" class="btn btn-outline">Cancelar</a></div>' +
      '<div class="visually-hidden" role="status" id="live"></div>' +
      '</form>';

    var form = $('#vaga-form');

    function val(id) { return $('#' + id).value.trim(); }
    function modelo() { var c = form.querySelector('input[name="modelo"]:checked'); return c ? c.value : ''; }

    function renderChips(kind) {
      $('#' + kind + '-list').innerHTML = lista[kind].map(function (t, i) {
        return '<li class="chip chip-removable"><span>' + esc(t) + '</span><button type="button" class="chip-x" data-kind="' + kind + '" data-i="' + i + '" aria-label="Remover ' + esc(t) + '">' + icon('x', 12, { stroke: 2.4 }) + '</button></li>';
      }).join('');
    }

    function addCompetencia() {
      var input = $('#competencias-in'), t = input.value.trim();
      var dup = lista.competencias.some(function (x) { return x.toLowerCase() === t.toLowerCase(); });
      var msg = !t ? 'Digite uma competência antes de adicionar.'
        : (dup ? 'Essa competência já foi adicionada.'
        : (lista.competencias.length >= f.limiteCompetencias ? 'Você pode adicionar até ' + f.limiteCompetencias + ' competências.' : ''));
      if (!check([{ id: 'competencias', ok: !msg, msg: msg }])) return;
      lista.competencias.push(t);
      input.value = '';
      renderChips('competencias');
      say(t + ' adicionada.');
      input.focus();
    }

    function addIdioma() {
      var idioma = $('#idioma-sel').value, nivel = $('#nivel-sel').value;
      lista.idiomas = lista.idiomas.filter(function (x) { return x.split(' · ')[0] !== idioma; });
      lista.idiomas.push(idioma + ' · ' + nivel);
      renderChips('idiomas');
      say(idioma + ', nível ' + nivel + ', adicionado.');
    }

    $('#competencias-add').addEventListener('click', addCompetencia);
    $('#competencias-in').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); addCompetencia(); }
    });
    $('#idiomas-add').addEventListener('click', addIdioma);

    function renderTriagemList() {
      $('#triagem-list').innerHTML = triagem.map(triagemItemHtml).join('');
      $('#triagem-add').hidden = triagem.length >= f.limitePerguntasTriagem;
    }

    $('#triagem-add').addEventListener('click', function () {
      if (triagem.length >= f.limitePerguntasTriagem) return;
      triagem.push({ texto: '', tipo: '', opcoes: ['', '', '', ''] });
      renderTriagemList();
      say('Pergunta ' + triagem.length + ' adicionada.');
      var novo = $('#triagem-' + (triagem.length - 1) + '-texto');
      if (novo) novo.focus();
    });

    $('#triagem-list').addEventListener('input', function (e) {
      var i = e.target.getAttribute('data-triagem-i'), campo = e.target.getAttribute('data-triagem-campo');
      if (i == null || !campo) return;
      if (campo === 'texto') triagem[i].texto = e.target.value;
      else if (campo.indexOf('opcao-') === 0) triagem[i].opcoes[Number(campo.split('-')[1])] = e.target.value;
    });

    $('#triagem-list').addEventListener('change', function (e) {
      var m = e.target.name && e.target.name.match(/^triagem-(\d+)-tipo$/);
      if (!m) return;
      triagem[Number(m[1])].tipo = e.target.value;
      renderTriagemList();
    });

    $('#triagem-list').addEventListener('click', function (e) {
      var b = e.target.closest('[data-remove-triagem]');
      if (!b) return;
      triagem.splice(Number(b.getAttribute('data-remove-triagem')), 1);
      renderTriagemList();
      say('Pergunta removida.');
    });

    form.addEventListener('click', function (e) {
      var x = e.target.closest('.chip-x');
      if (!x) return;
      var kind = x.getAttribute('data-kind'), i = Number(x.getAttribute('data-i'));
      var removido = lista[kind].splice(i, 1)[0];
      renderChips(kind);
      say(removido + ' removido.');
      $(kind === 'competencias' ? '#competencias-in' : '#idioma-sel').focus();
    });

    // Raio de busca na unidade do país (milhas nos EUA, km nos demais), já no valor padrão,
    // e sugestões de cidades conhecidas pelo protótipo.
    function atualizarPais() {
      var pais = val('pais');
      var padrao = raioPadrao(pais);
      $('#raio').innerHTML = LOC().raios[padrao.unidade].map(function (n) {
        var r = { valor: n, unidade: padrao.unidade };
        return '<option value="' + n + '"' + (n === padrao.valor ? ' selected' : '') + '>' + esc(raioTexto(r)) + (n === padrao.valor ? ' (padrão)' : '') + '</option>';
      }).join('');
      $('#cidades-lista').innerHTML = LOC().cidades.filter(function (c) { return !pais || c.pais === pais; }).map(function (c) {
        return '<option value="' + esc(c.cidade) + '"></option>';
      }).join('');
    }
    atualizarPais();
    $('#pais').addEventListener('change', atualizarPais);

    // Vaga remota não precisa de localização.
    form.addEventListener('change', function (e) {
      if (e.target.name !== 'modelo') return;
      var remoto = e.target.value === 'remoto';
      $('#loc-fields').hidden = remoto;
      $('#loc-remoto').hidden = !remoto;
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var remoto = modelo() === 'remoto';
      var min = val('sal-min'), max = val('sal-max');
      var salOk = (!min || Number(min) >= 0) && (!max || Number(max) >= 0) && !(min && max && Number(min) > Number(max));
      var n = Number($('#posicoes').value);

      var triagemRules = [];
      triagem.forEach(function (item, i) {
        var termosTexto = termosProibidosEm(item.texto);
        var msgTexto = item.texto.trim().length < 5 ? 'Escreva a pergunta (pelo menos 5 letras).'
          : (termosTexto.length ? 'Essa pergunta não pode falar sobre: ' + termosTexto.join(', ') + '. Reescreva sem citar esses temas.' : '');
        triagemRules.push({ id: 'triagem-' + i + '-texto', ok: !msgTexto, msg: msgTexto });
        triagemRules.push({ id: 'triagem-' + i + '-tipo', ok: !!item.tipo, msg: 'Escolha Sim/Não ou múltipla escolha.' });
        if (item.tipo === 'multipla') {
          var preenchidas = item.opcoes.filter(function (o) { return o.trim(); });
          triagemRules.push({ id: 'triagem-' + i + '-opcao-0', ok: preenchidas.length >= 2, msg: 'Adicione pelo menos 2 opções.' });
          item.opcoes.forEach(function (o, k) {
            if (!o.trim()) return;
            var termosOpcao = termosProibidosEm(o);
            if (termosOpcao.length) triagemRules.push({ id: 'triagem-' + i + '-opcao-' + k, ok: false, msg: 'Essa opção não pode falar sobre: ' + termosOpcao.join(', ') + '.' });
          });
        }
      });

      var ok = check([
        { id: 'titulo', ok: val('titulo').length >= 3, msg: 'Informe o título da vaga (pelo menos 3 letras).' },
        { id: 'descricao', ok: val('descricao').length >= 20, msg: 'Descreva a vaga com pelo menos 20 caracteres.' },
        { id: 'modelo', ok: !!modelo(), msg: 'Escolha o modelo de trabalho.' },
        { id: 'pais', ok: remoto || !!val('pais'), msg: 'Selecione o país.' },
        { id: 'cidade', ok: remoto || !!val('cidade'), msg: 'Informe a cidade.' },
        { id: 'tipo', ok: !!val('tipo'), msg: 'Escolha o tipo de contratação.' },
        { id: 'salario', ok: salOk, msg: 'Confira a faixa salarial: o mínimo não pode ser maior que o máximo, e os valores não podem ser negativos.' },
        { id: 'posicoes', ok: n >= 1 && n <= 99 && Math.floor(n) === n, msg: 'Informe quantas posições a vaga tem (de 1 a 99).' }
      ].concat(triagemRules));
      $('#form-status').textContent = ok ? '' : 'Revise os campos destacados.';
      if (!ok) return;

      var pais = val('pais');
      var loc = remoto ? null : acharCidade(val('cidade'), pais, val('estado'));
      var s = load();
      var v = {
        id: 'vaga-' + Date.now().toString(36),
        titulo: val('titulo'),
        status: 'Aberta',
        posicoes: n,
        publicada: true,
        requisitosTotal: E().requisitosPadrao,
        dados: {
          descricao: val('descricao'),
          modelo: modelo(),
          local: remoto ? 'Remoto' : [loc ? loc.cidade : val('cidade'), val('estado'), pais].filter(Boolean).join(', '),
          // Ponto aproximado da cidade (null se o protótipo não a conhece) e raio de busca (seção 7).
          loc: loc,
          raio: remoto ? null : { valor: Number($('#raio').value), unidade: unidadeDoPais(pais) },
          fuso: remoto && $('#fuso').value !== '' ? Number($('#fuso').value) : null,
          tipo: val('tipo'),
          salario: salarioTexto(val('moeda') || $('#moeda').value, $('#periodo').value, min, max),
          competencias: lista.competencias.slice(),
          idiomas: lista.idiomas.slice(),
          experiencia: val('experiencia'),
          perguntasTriagem: triagem.filter(function (t) { return t.texto.trim(); }).map(function (t) {
            return { texto: t.texto.trim(), tipo: t.tipo, opcoes: t.tipo === 'multipla' ? t.opcoes.filter(function (o) { return o.trim(); }) : [] };
          })
        }
      };
      s.vagas.unshift(v);
      save(s);
      renderPublicada(v);
    });
  }

  function salarioTexto(moeda, periodo, min, max) {
    if (!min && !max) return 'A combinar';
    var fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: moeda });
    var per = E().formulario.periodos.filter(function (p) { return p.id === periodo; })[0].rotulo;
    var faixa = min && max ? fmt.format(min) + ' a ' + fmt.format(max) : (min ? 'a partir de ' + fmt.format(min) : 'até ' + fmt.format(max));
    return faixa + ' ' + per;
  }

  function renderPublicada(v) {
    var d = v.dados;
    var modelo = E().formulario.modelos.filter(function (m) { return m.id === d.modelo; })[0].rotulo;
    var resumo = '<dl class="summary">' +
      '<div><dt>Local</dt><dd>' + esc(d.local) + '</dd></div>' +
      (d.raio ? '<div><dt>Raio de busca</dt><dd>' + esc(raioTexto(d.raio)) + '</dd></div>' : '') +
      (d.modelo === 'remoto' ? '<div><dt>Fuso da equipe</dt><dd>' + esc(d.fuso != null ? fusoRotulo(d.fuso) : 'Qualquer fuso') + '</dd></div>' : '') +
      '<div><dt>Modelo</dt><dd>' + esc(modelo) + ' · ' + esc(d.tipo) + '</dd></div>' +
      '<div><dt>Salário</dt><dd>' + esc(d.salario) + '</dd></div>' +
      '<div><dt>Posições</dt><dd>' + v.posicoes + '</dd></div>' +
      '<div><dt>Experiência mínima</dt><dd>' + esc(d.experiencia) + '</dd></div>' +
      (d.competencias.length ? '<div><dt>Competências</dt><dd>' + esc(d.competencias.join(', ')) + '</dd></div>' : '') +
      (d.idiomas.length ? '<div><dt>Idiomas</dt><dd>' + esc(d.idiomas.join(', ')) + '</dd></div>' : '') +
      (d.perguntasTriagem.length ? '<div><dt>Perguntas de triagem</dt><dd>' + esc(d.perguntasTriagem.map(function (t) { return t.texto; }).join(' · ')) + '</dd></div>' : '') +
      '</dl>' +
      (d.modelo !== 'remoto' && !d.loc ? '<p class="note note-box">' + icon('eye', 16, { stroke: 2 }) + '<span>Não localizamos essa cidade no protótipo, então as indicações desta vaga não serão filtradas por distância.</span></p>' : '');
    showDone({
      icone: 'check',
      titulo: 'Vaga publicada',
      texto: 'A vaga “' + esc(v.titulo) + '” já aparece em Minhas vagas. Os profissionais indicados já podem ser vistos.',
      extra: resumo,
      acoes: '<a href="empresa.html?vaga=' + q(v.id) + '&aba=indicados" class="btn btn-primary">Ver profissionais indicados para esta vaga</a>' +
        '<a href="empresa.html?aba=vagas" class="btn btn-outline">Ver minhas vagas</a>'
    });
  }

  /* ---------- Empresa: candidatos ---------- */

  function renderCandidatos() {
    var s = load();
    var vagas = todasVagas(s);
    var pedida = params.get('vaga');

    subTopbar('Candidatos', 'empresa.html');
    $('#nav').innerHTML = empresaNav('candidatos');

    // Sem vaga na URL (aba Candidatos), abre a vaga mais recente.
    var v = pedida ? vagaPorId(s, pedida) : vagas[0];
    if (!v) return notFound('Não encontramos essa vaga.');

    var filtro = params.get('status');

    $('#content').innerHTML =
      '<div class="field"><label for="vaga-sel">Vaga</label><select id="vaga-sel">' +
        vagas.map(function (x) { return '<option value="' + esc(x.id) + '"' + (x.id === v.id ? ' selected' : '') + '>' + esc(x.titulo) + '</option>'; }).join('') +
      '</select></div>' +
      '<div id="vaga-head"></div>' +
      '<div class="filter" role="group" aria-label="Filtrar por status" id="cand-filter"></div>' +
      '<div class="section" id="cand-list" tabindex="-1"></div>' +
      '<div class="visually-hidden" role="status" id="live"></div>';

    $('#vaga-sel').addEventListener('change', function () {
      window.location.replace('candidatos.html?vaga=' + q(this.value));
    });

    function paint() {
      s = load();
      var info = vagaInfo(s, v);
      var todos = ordenar(candidatosDe(s, v.id));
      var etapas = E().statusCandidato.filter(function (st) {
        return st.manual !== false || todos.some(function (c) { return c.status === st.id; });
      });
      function contar(id) { return todos.filter(function (c) { return c.status === id; }).length; }

      if (!etapas.some(function (st) { return st.id === filtro; })) {
        var primeira = etapas.filter(function (st) { return contar(st.id) > 0; })[0];
        filtro = primeira ? primeira.id : 'novo';
      }

      var pode = info.status === 'Aberta' || info.status === 'Pausada';
      $('#vaga-head').innerHTML = '<div class="card"><div class="head-row"><h2 class="card-title">' + esc(v.titulo) + '</h2>' +
        '<span class="chip ' + info.chip + '">' + esc(info.status) + '</span></div>' +
        '<p class="row-sub">' + plural(todos.length, 'candidato', 'candidatos') + ' · ' + plural(v.posicoes || 1, 'posição', 'posições') + '</p>' +
        (pode ? '<a href="preencher-vaga.html?vaga=' + q(v.id) + '" class="btn btn-outline">Marcar como preenchida</a>' : '') + '</div>';

      $('#cand-filter').innerHTML = etapas.map(function (st) {
        return '<button type="button" data-status="' + st.id + '" aria-pressed="' + (st.id === filtro) + '">' + esc(st.rotulo) + ' · ' + contar(st.id) + '</button>';
      }).join('');

      var lista = todos.filter(function (c) { return c.status === filtro; });
      var rotulo = statusLabel(filtro).rotulo;
      var vl = localVagaEmpresa(s, v);
      var html;
      if (!todos.length) {
        html = '<div class="empty"><p class="row-title">Ainda não há candidatos para esta vaga.</p>' +
          '<p class="row-sub">Enquanto isso, veja os profissionais que a plataforma indica.</p>' +
          '<a href="empresa.html?vaga=' + q(v.id) + '&aba=indicados" class="btn btn-primary">Ver profissionais indicados</a></div>';
      } else if (!lista.length) {
        html = '<div class="empty"><p class="row-title">Nenhum candidato em “' + esc(rotulo) + '”.</p></div>';
      } else {
        html = lista.map(function (c) {
          var p = prof(c.id);
          var aguardando = (preench(s, v.id) || []).indexOf(c.id) !== -1;
          var extra = aguardando ? '<span class="chip amber">Aguardando confirmação</span>'
            : (c.status === 'contratado' ? '<span class="chip blue">Contratado</span>'
            : (c.status === 'novo' && c.data ? '<span class="chip amber">Responder até ' + maisDias(c.data, 7) + '</span>' : ''));
          var seletor = c.status === 'contratado' ? '' :
            '<label class="status-select"><span class="visually-hidden">Mudar status de ' + esc(p.nome) + '</span>' +
            '<select data-cand="' + esc(c.id) + '">' + E().statusCandidato.filter(function (st) { return st.manual !== false; }).map(function (st) {
              return '<option value="' + st.id + '"' + (st.id === c.status ? ' selected' : '') + '>' + esc(st.singular) + '</option>';
            }).join('') + '</select></label>';
          var vagaProf = window.MOCK.vagaLink[v.id] && vagaJob(window.MOCK.vagaLink[v.id]);
          var candBlock = temCandidatura(c.candidatura) ? candidaturaCorpoHtml(c.candidatura, vagaProf) : '';
          return profCard(c.id, c.atende, requisitosDe(v),
            '<div class="btn-row"><a href="' + esc(perfilHref(c.id, v.id)) + '" class="btn btn-primary">Ver perfil</a>' +
            '<button type="button" class="btn btn-outline" data-conversar="' + esc(c.id) + '">Conversar</button>' + seletor + '</div>', extra, candBlock, localProfTexto(c.id, vl));
        }).join('');
      }
      $('#cand-list').innerHTML = html;
    }

    $('#cand-filter').addEventListener('click', function (e) {
      var b = e.target.closest('[data-status]');
      if (!b) return;
      filtro = b.getAttribute('data-status');
      paint();
    });

    $('#cand-list').addEventListener('change', function (e) {
      var sel = e.target.closest('[data-cand]');
      if (!sel) return;
      var st = load();
      st.status[v.id + ':' + sel.getAttribute('data-cand')] = sel.value;
      save(st);
      paint();
      say(prof(sel.getAttribute('data-cand')).nome + ' movido para ' + statusLabel(sel.value).singular + '.');
      $('#cand-list').focus();
    });

    $('#cand-list').addEventListener('click', function (e) {
      var b = e.target.closest('[data-conversar]');
      if (!b) return;
      var candId = b.getAttribute('data-conversar');
      var st = load();
      var atual = st.status[v.id + ':' + candId];
      if (!atual || atual === 'novo') { st.status[v.id + ':' + candId] = 'conversa'; save(st); }
      var conv = iniciarConversaEmpresa(candId, v.id, v.titulo);
      window.location.href = 'conversa.html?id=' + q(conv.id) + '&como=empresa';
    });

    paint();
  }

  /* ---------- Empresa: perfil do profissional ---------- */

  function estrelas(n) {
    var html = '';
    for (var i = 1; i <= 5; i++) html += icon('star', 14, { fill: i <= n ? 'currentColor' : 'none', stroke: 1.6 });
    return '<span class="stars-static" role="img" aria-label="Nota ' + n + ' de 5">' + html + '</span>';
  }

  // Avaliação recebida. "perguntas" define as respostas objetivas; "quemRespondeu" nomeia a resposta.
  function avaliacaoHtml(a, perguntas, quemRespondeu) {
    return '<article class="review"><div class="review-head">' + estrelas(a.nota) + '<span class="row-sub">' + esc(a.autor || a.empresa) + ' · ' + esc(a.quando) + '</span></div>' +
      '<dl class="review-answers">' + perguntas.map(function (p) {
        return '<div><dt>' + esc(p.texto) + '</dt><dd>' + esc(a.respostas[p.id]) + '</dd></div>';
      }).join('') + '</dl>' +
      (a.comentario ? '<blockquote class="review-text">' + esc(a.comentario) + '</blockquote>' : '') +
      (a.resposta ? '<div class="review-reply"><strong>Resposta ' + quemRespondeu + '</strong><p>' + esc(a.resposta) + '</p></div>' : '') +
      '</article>';
  }

  function experiencias(lista) {
    return lista.map(function (x) {
      return '<div class="hist-item"><div class="row-title">' + esc(x.cargo) + '</div><div class="row-sub">' + esc(x.empresa) + ' · ' + esc(x.periodo) + '</div></div>';
    }).join('');
  }

  function renderPerfil() {
    var s = load();
    var id = params.get('id');
    var p = prof(id);

    subTopbar('Perfil do profissional', 'candidatos.html');
    $('#nav').innerHTML = empresaNav('candidatos');
    if (!p) return notFound('Não encontramos esse profissional.');

    var vagaId = params.get('vaga');
    var vaga = (vagaId && vagaPorId(s, vagaId)) || todasVagas(s).filter(function (x) { return vagaAberta(s, x); })[0];
    var conviteKey = vaga ? vaga.id + ':' + id : '';

    // Compatibilidade com a vaga, quando a pessoa é candidata ou indicada dela.
    var candidatoObj = vaga ? candidatosDe(s, vaga.id).filter(function (c) { return c.id === id; })[0] : null;
    var atende = null;
    if (vaga) {
      var achado = candidatoObj || (indicadosDe(s, vaga) || []).filter(function (c) { return c.id === id; })[0];
      if (achado) atende = achado.atende;
    }

    // Bloco "Candidatura", só quando a pessoa é candidata de fato (não apenas indicada) e enviou algo.
    var vagaProf = vaga && window.MOCK.vagaLink[vaga.id] && vagaJob(window.MOCK.vagaLink[vaga.id]);
    var candSection = (candidatoObj && temCandidatura(candidatoObj.candidatura))
      ? '<section class="section"><h2>Candidatura</h2>' + candidaturaCorpoHtml(candidatoObj.candidatura, vagaProf) + '</section>'
      : '';

    // Localização e preferências (seção 6). Distância aproximada até a vaga, nunca o endereço.
    var pl = perfilLocal(id);
    var vl = vaga ? localVagaEmpresa(s, vaga) : null;
    var distVaga = vl && vl.loc && vl.modelo !== 'remoto'
      ? distTexto(distanciaKm(vl.loc, pl.loc), unidadeDoPais(vl.loc.pais)) + ' da vaga' : '';
    var localSection = '<section class="section" aria-labelledby="h-local"><h2 id="h-local">Localização e preferências</h2><div class="card">' +
      '<dl class="summary">' +
        '<div><dt>Região</dt><dd>' + esc(p.local) + '</dd></div>' +
        (distVaga ? '<div><dt>Distância</dt><dd>' + esc(distVaga) + ' · em linha reta, aproximada</dd></div>' : '') +
        '<div><dt>Distância máxima que aceita</dt><dd>' + esc(distMaxTexto(pl)) + '</dd></div>' +
        '<div><dt>Aceita se mudar</dt><dd>' + (pl.aceitaMudar ? 'Sim' : 'Não') + '</dd></div>' +
        '<div><dt>Modelos de trabalho</dt><dd>' + esc(pl.modelos.map(modeloRotulo).join(', ')) + '</dd></div>' +
        '<div><dt>Fuso horário</dt><dd>' + esc(fusoRotulo(pl.fuso)) + '</dd></div>' +
      '</dl><p class="row-sub">O endereço não é mostrado: só a cidade e a distância aproximada.</p></div></section>';

    var reputacao = p.novo
      ? '<div class="card"><div class="chips">' + reputacaoChip(p) + '</div>' +
        '<p class="row-sub">A reputação aparece depois da primeira contratação confirmada pelos dois lados.</p></div>'
      : '<div class="card rep-light"><div class="rep-grid">' + repStat(p.nota, 'Nota geral') + repStat(p.trabalhos, 'Trabalhos verificados') + repStat(p.contrataria, 'Contratariam novamente') + '</div></div>';

    var verificada = p.experienciaVerificada.length
      ? experiencias(p.experienciaVerificada) +
        (p.trabalhos > p.experienciaVerificada.length ? '<p class="row-sub">Mostrando as ' + p.experienciaVerificada.length + ' mais recentes de ' + p.trabalhos + ' trabalhos verificados.</p>' : '')
      : '<p class="row-sub">Ainda sem experiências verificadas. O histórico verificado começa na primeira contratação confirmada pelos dois lados.</p>';

    var avaliacoes = p.avaliacoes.length
      ? accordion('acc-aval', 'Avaliações recebidas', 'Nota ' + p.nota + ' · ' + plural(p.avaliacoes.length, 'avaliação', 'avaliações'),
          p.avaliacoes.map(function (a) { return avaliacaoHtml(a, E().avaliacao.perguntas, 'do profissional'); }).join(''))
      : '<section class="section"><h2>Avaliações recebidas</h2><p class="row-sub">Ainda não há avaliações publicadas.</p></section>';

    $('#content').innerHTML =
      '<section class="card profile-head"><div class="media center"><div class="avatar xl" style="background:' + esc(p.cor) + '">' + esc(p.iniciais) + '</div>' +
        '<div class="row-main"><h2 class="profile-name">' + nomeComSelo(p) + '</h2><div class="row-sub">' + esc(p.resumo) + '</div></div></div>' +
        '<dl class="summary"><div><dt>Localização</dt><dd>' + esc(p.local + (distVaga ? ' · ' + distVaga : '')) + '</dd></div><div><dt>Disponibilidade</dt><dd>' + esc(p.disponibilidade) + '</dd></div></dl>' +
        (atende !== null ? '<div class="chips"><span class="chip green">Atende ' + atende + ' de ' + requisitosDe(vaga) + ' requisitos · ' + esc(vaga.titulo) + '</span></div>' : '') +
        '<div class="btn-row"><button type="button" class="btn btn-primary" id="convidar"' + (s.convites[conviteKey] ? ' aria-disabled="true"' : '') + '>' +
          (s.convites[conviteKey] ? icon('check', 16, { stroke: 2.4 }) + 'Convite enviado' : 'Convidar para a vaga') + '</button>' +
        '<button type="button" class="btn btn-outline" id="msg-btn">Enviar mensagem</button></div>' +
        (vaga ? '<p class="row-sub">Vaga do convite: ' + esc(vaga.titulo) + '</p>' : '') +
      '</section>' +

      candSection +

      '<section class="section"><h2>Reputação</h2>' + reputacao + '</section>' +

      localSection +

      '<section class="section" aria-labelledby="h-verif"><h2 id="h-verif">Experiência verificada</h2>' +
        '<div class="hist hist-verified"><p class="hist-badge">' + icon('check', 16, { stroke: 2.6 }) + 'Confirmada pelos dois lados na plataforma</p>' + verificada + '</div></section>' +

      '<section class="section" aria-labelledby="h-decl"><h2 id="h-decl">Experiência declarada</h2>' +
        '<div class="hist hist-declared"><p class="hist-badge">' + icon('user', 16, { stroke: 2 }) + 'Informada pelo profissional · não verificada</p>' +
        (p.experienciaDeclarada.length ? experiencias(p.experienciaDeclarada) : '<p class="row-sub">Nenhuma experiência declarada.</p>') + '</div></section>' +

      '<section class="section"><h2>Competências</h2><ul class="chips chip-list">' +
        p.competencias.map(function (c) { return '<li class="chip">' + esc(c) + '</li>'; }).join('') + '</ul></section>' +

      '<section class="section"><h2>Idiomas</h2><ul class="chips chip-list">' +
        p.idiomas.map(function (c) { return '<li class="chip">' + esc(c) + '</li>'; }).join('') + '</ul></section>' +

      '<section class="section"><h2>Formação</h2><ul class="plain-list">' +
        p.formacao.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul></section>' +

      avaliacoes;

    $('#convidar').addEventListener('click', function () {
      if (!vaga) { toast('Publique uma vaga para poder convidar.'); return; }
      var st = load();
      if (st.convites[conviteKey]) { toast('Você já convidou ' + firstName(p) + ' para esta vaga.'); return; }
      st.convites[conviteKey] = true;
      save(st);
      this.setAttribute('aria-disabled', 'true');
      this.innerHTML = icon('check', 16, { stroke: 2.4 }) + 'Convite enviado';
      toast('Convite enviado para ' + p.nome + ' (simulação).');
    });

    $('#msg-btn').addEventListener('click', function () {
      if (vaga) {
        var st2 = load();
        var atual = st2.status[vaga.id + ':' + id];
        if (!atual || atual === 'novo') { st2.status[vaga.id + ':' + id] = 'conversa'; save(st2); }
      }
      var conv = iniciarConversaEmpresa(id, vaga ? vaga.id : null, vaga ? vaga.titulo : '');
      window.location.href = 'conversa.html?id=' + q(conv.id) + '&como=empresa';
    });
  }

  /* ---------- Empresa: marcar vaga como preenchida ---------- */

  function renderPreencher() {
    var s = load();
    var v = vagaPorId(s, params.get('vaga') || '');

    subTopbar('Marcar como preenchida', 'empresa.html');
    $('#nav').innerHTML = empresaNav('vagas');
    if (!v) return notFound('Não encontramos essa vaga.');

    function aguardando(ids) {
      var nomes = nomesDe(ids);
      subTopbar('Marcar como preenchida', 'empresa.html');
      showDone({
        icone: 'clock', tom: 'amber',
        titulo: 'Aguardando confirmação de ' + nomes,
        texto: 'Registramos o combinado e enviamos um pedido de confirmação. Só depois que ' + esc(ids.length > 1 ? 'as pessoas confirmarem' : firstName(prof(ids[0])) + ' confirmar') +
          ', o vínculo entra no histórico e na reputação dos dois lados.',
        extra: '<p class="note">' + icon('check', 16, { stroke: 2.4 }) + '<span>Em Minhas vagas, “' + esc(v.titulo) + '” aparece como “Preenchida · aguardando confirmação”.</span></p>',
        acoes: '<a href="empresa.html?aba=vagas" class="btn btn-primary">Ver minhas vagas</a>' +
          '<a href="candidatos.html?vaga=' + q(v.id) + '" class="btn btn-outline">Voltar aos candidatos</a>'
      });
    }

    var info = vagaInfo(s, v);
    if (info.status !== 'Preenchida' && preench(s, v.id)) return aguardando(preench(s, v.id));

    if (info.status === 'Preenchida') {
      $('#content').innerHTML = '<div class="card"><h2 class="card-title">Esta vaga já foi preenchida</h2>' +
        '<p class="row-sub">' + esc(info.detalhe || '') + '</p>' +
        '<a href="candidatos.html?vaga=' + q(v.id) + '" class="btn btn-primary">Ver candidatos</a></div>';
      return;
    }

    var elegiveis = ordenar(candidatosDe(s, v.id).filter(function (c) { return c.status === 'conversa'; }));
    var max = v.posicoes || 1;
    var tipo = max > 1 ? 'checkbox' : 'radio';

    if (!elegiveis.length) {
      $('#content').innerHTML = '<div class="empty"><p class="row-title">Ainda não há candidatos em conversa.</p>' +
        '<p class="row-sub">Inicie uma conversa com um candidato e volte aqui para indicar quem preencheu a vaga.</p>' +
        '<a href="candidatos.html?vaga=' + q(v.id) + '" class="btn btn-primary">Ver candidatos</a></div>';
      return;
    }

    renderEscolha();

    function renderEscolha() {
      subTopbar('Marcar como preenchida', 'empresa.html');
      $('#content').innerHTML =
        '<form id="fill-form" novalidate>' +
        '<div class="greeting"><h2 class="page-title">Quem preencheu a vaga de ' + esc(v.titulo) + '?</h2>' +
          '<p>' + (max > 1 ? 'Esta vaga tem ' + max + ' posições. Selecione até ' + max + ' pessoas.' : 'Selecione a pessoa contratada.') + '</p></div>' +
        '<p class="note note-box">' + icon('eye', 16, { stroke: 2 }) + '<span>Depois de escolher, você registra o combinado. A pessoa recebe um pedido de confirmação; só depois de confirmar, o vínculo entra no histórico e na reputação dos dois lados.</span></p>' +
        '<fieldset class="field group" id="f-quem" aria-describedby="quem-err"><legend class="visually-hidden">Candidatos em conversa</legend>' +
          elegiveis.map(function (c) {
            var p = prof(c.id);
            return '<label class="choice"><input type="' + tipo + '" name="quem" value="' + esc(c.id) + '" class="choice-input">' +
              '<span class="choice-body"><span class="avatar lg" style="background:' + esc(p.cor) + '">' + esc(p.iniciais) + '</span>' +
              '<span class="row-main"><span class="row-title" style="display:flex;align-items:center;gap:6px;font-weight:800">' + nomeComSelo(p) + '</span>' +
              '<span class="row-sub">' + esc(p.resumo) + '</span>' +
              '<span class="chips"><span class="chip">' + esc(statusLabel(c.status).singular) + '</span><span class="chip green">Atende ' + c.atende + ' de ' + requisitosDe(v) + '</span></span></span></span></label>';
          }).join('') +
          '<p class="field-error" id="quem-err" hidden></p></fieldset>' +
        '<div class="btn-row form-actions"><button type="submit" class="btn btn-primary">Continuar</button>' +
          '<a href="candidatos.html?vaga=' + q(v.id) + '" class="btn btn-outline">Cancelar</a></div>' +
        '</form>';

      $('#fill-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var marcados = Array.prototype.map.call(this.querySelectorAll('input[name="quem"]:checked'), function (i) { return i.value; });
        var msg = !marcados.length ? (max > 1 ? 'Selecione pelo menos uma pessoa.' : 'Selecione a pessoa contratada.')
          : (marcados.length > max ? 'A vaga tem ' + max + ' posições: selecione no máximo ' + max + ' pessoas.' : '');
        if (!check([{ id: 'quem', ok: !msg, msg: msg }])) return;
        renderCombinado(marcados);
      });
    }

    function renderCombinado(marcados) {
      var f = E().formulario;
      subTopbar('Registrar o combinado', 'candidatos.html?vaga=' + q(v.id));
      $('#content').innerHTML =
        '<form id="comb-form" class="form" novalidate>' +
        '<div class="greeting"><h2 class="page-title">Registrar o combinado</h2>' +
          '<p>Isso ajuda ' + esc(nomesDe(marcados)) + ' a confirmar com segurança, e serve de referência nas avaliações.</p></div>' +

        field('funcao', 'Função', 'input', 'type="text" maxlength="60" autocomplete="off" value="' + esc(v.titulo) + '"', '', { req: true }) +
        group('tipo-contratacao', 'Tipo de contratação', pills('tipo-contratacao', f.tipos.map(function (t) { return { id: t, rotulo: t }; })), { req: true }) +

        group('salario2', 'Salário combinado',
          '<div class="form-grid">' +
            '<label class="mini"><span>Moeda</span><select id="moeda2">' + options(f.moedas) + '</select></label>' +
            '<label class="mini"><span>Período</span><select id="periodo2">' + options(f.periodos) + '</select></label>' +
            '<label class="mini"><span>Valor</span><input id="valor2" data-ctl type="number" inputmode="decimal" min="0" step="any" placeholder="0" aria-describedby="salario2-err"></label>' +
          '</div>', { req: true }) +

        field('data-inicio', 'Data de início', 'input', 'type="date"', '', { req: true }) +
        field('jornada', 'Jornada / horário', 'input', 'type="text" maxlength="80" autocomplete="off" placeholder="Ex.: Seg a sex, 9h às 18h"', '', { req: true }) +

        '<p class="form-status" id="form-status" role="alert"></p>' +
        '<div class="btn-row form-actions"><button type="submit" class="btn btn-primary">Registrar e enviar pedido</button>' +
          '<a href="candidatos.html?vaga=' + q(v.id) + '" class="btn btn-outline">Cancelar</a></div>' +
        '<div class="visually-hidden" role="status" id="live"></div>' +
        '</form>';

      $('#comb-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var tipoSel = $('#comb-form').querySelector('input[name="tipo-contratacao"]:checked');
        var valor = $('#valor2').value;
        var ok = check([
          { id: 'funcao', ok: $('#funcao').value.trim().length > 0, msg: 'Informe a função combinada.' },
          { id: 'tipo-contratacao', ok: !!tipoSel, msg: 'Escolha o tipo de contratação.' },
          { id: 'salario2', ok: !!valor && Number(valor) > 0, msg: 'Informe o valor do salário combinado.' },
          { id: 'data-inicio', ok: !!$('#data-inicio').value, msg: 'Informe a data de início.' },
          { id: 'jornada', ok: $('#jornada').value.trim().length > 0, msg: 'Informe a jornada ou horário combinado.' }
        ]);
        $('#form-status').textContent = ok ? '' : 'Revise os campos destacados.';
        if (!ok) return;

        var comb = {
          funcao: $('#funcao').value.trim(),
          tipoContratacao: tipoSel.value,
          moeda: $('#moeda2').value, periodo: $('#periodo2').value, valor: Number(valor),
          dataInicio: $('#data-inicio').value,
          jornada: $('#jornada').value.trim()
        };
        var st = load();
        st.preenchidas[v.id] = marcados;
        st.combinados[v.id] = comb;
        save(st);
        aguardando(marcados);
      });
    }
  }

  /* ---------- Avaliação cega (empresa avalia profissional e profissional avalia empresa) ---------- */

  // cfg: { aviso (html), cabecalho (html), perguntas, respostas, limite, cancelar (href), combinado }
  function avaliacaoFormHtml(cfg) {
    return '<form id="rate-form" class="form" novalidate>' +
      '<p class="note note-box">' + icon('eye', 16, { stroke: 2 }) + '<span><strong>Avaliação cega:</strong> ' + cfg.aviso + '</span></p>' +
      cfg.cabecalho +

      cfg.perguntas.map(function (pg) {
        var texto = (cfg.combinado && pg.ref)
          ? pg.texto.replace(/\?\s*$/, '') + ' (' + refTexto(pg.ref, cfg.combinado) + ')?'
          : pg.texto;
        return group('q-' + pg.id, texto, pills('q-' + pg.id, cfg.respostas.map(function (r) { return { id: r, rotulo: r }; })), { req: true });
      }).join('') +

      group('nota', 'Nota geral',
        '<div class="stars">' + [1, 2, 3, 4, 5].map(function (n) {
          return '<label class="star"><input type="radio" name="nota" value="' + n + '" class="pill-input"><span class="star-ico">' + icon('star', 34, { stroke: 1.6 }) + '</span>' +
            '<span class="visually-hidden">' + n + (n === 1 ? ' estrela' : ' estrelas') + '</span></label>';
        }).join('') + '</div><p class="field-hint" id="nota-txt" aria-live="polite">Escolha de 1 a 5 estrelas.</p>', { req: true }) +

      field('comentario', 'Comentário (opcional)', 'textarea', 'rows="4" maxlength="' + cfg.limite + '"', '',
        { hint: 'Fale só do trabalho realizado. Não inclua dados pessoais (telefone, endereço, documentos) nem ofensas.' }) +
      '<p class="counter" id="contador">0 / ' + cfg.limite + '</p>' +

      '<p class="form-status" id="form-status" role="alert"></p>' +
      '<div class="btn-row form-actions"><button type="submit" class="btn btn-primary">Enviar avaliação</button>' +
        '<a href="' + esc(cfg.cancelar) + '" class="btn btn-outline">Cancelar</a></div>' +
      '<div class="visually-hidden" role="status" id="live"></div></form>';
  }

  // Liga contador, estrelas e validação. Ao passar, chama onSave({ nota, respostas, comentario }).
  function bindAvaliacao(cfg, onSave) {
    var form = $('#rate-form');

    $('#comentario').addEventListener('input', function () {
      $('#contador').textContent = this.value.length + ' / ' + cfg.limite;
    });

    // Estrelas: preenche até a nota escolhida (setas do teclado mudam a nota).
    form.addEventListener('change', function (e) {
      if (e.target.name !== 'nota') return;
      var n = Number(e.target.value);
      form.querySelectorAll('.star').forEach(function (el, i) { el.classList.toggle('on', i < n); });
      $('#nota-txt').textContent = 'Nota: ' + n + ' de 5.';
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      function marcado(nome) { var c = form.querySelector('input[name="' + nome + '"]:checked'); return c ? c.value : ''; }
      var regras = cfg.perguntas.map(function (pg) {
        return { id: 'q-' + pg.id, ok: !!marcado('q-' + pg.id), msg: 'Responda: ' + pg.texto };
      });
      regras.push({ id: 'nota', ok: !!marcado('nota'), msg: 'Escolha a nota geral, de 1 a 5 estrelas.' });
      var ok = check(regras);
      $('#form-status').textContent = ok ? '' : 'Responda todas as perguntas e escolha a nota.';
      if (!ok) return;

      var respostas = {};
      cfg.perguntas.forEach(function (pg) { respostas[pg.id] = marcado('q-' + pg.id); });
      onSave({ nota: Number(marcado('nota')), respostas: respostas, comentario: $('#comentario').value.trim() });
    });
  }

  /* ---------- Empresa: avaliar profissional ---------- */

  function renderAvaliar() {
    var s = load();
    var id = params.get('id');
    var p = prof(id);
    var A = E().avaliacao;

    subTopbar('Avaliar profissional', 'empresa.html');
    $('#nav').innerHTML = empresaNav('candidatos');
    if (!p) return notFound('Não encontramos esse profissional.');

    var pend = A.pendentes[id] || { vaga: '', prazoDias: A.prazoPadrao };
    var prazo = plural(pend.prazoDias, 'dia', 'dias');

    function enviada() {
      showDone({
        icone: 'check',
        titulo: 'Avaliação enviada',
        texto: 'Sua avaliação fica oculta por enquanto. Ela será publicada quando ' + esc(firstName(p)) + ' enviar a própria avaliação ou, no máximo, quando o prazo terminar, em ' + esc(prazo) + '.',
        acoes: '<a href="empresa.html" class="btn btn-primary">Voltar ao início</a>'
      });
    }

    if (s.avaliados[id]) return enviada();

    var cfg = {
      aviso: esc(firstName(p)) + ' só verá sua avaliação quando enviar a própria avaliação, ou quando o prazo terminar em ' + esc(prazo) + '.',
      cabecalho: '<div class="media center"><div class="avatar lg" style="background:' + esc(p.cor) + '">' + esc(p.iniciais) + '</div>' +
        '<div class="row-main"><div class="row-title" style="font-weight:800">' + nomeComSelo(p) + '</div>' +
        '<div class="row-sub">' + esc(pend.vaga ? 'Vaga: ' + pend.vaga : p.resumo) + '</div></div></div>',
      perguntas: A.perguntas, respostas: A.respostas, limite: A.limiteComentario, cancelar: 'empresa.html',
      combinado: pend.combinado || null
    };

    $('#content').innerHTML = avaliacaoFormHtml(cfg);
    bindAvaliacao(cfg, function (r) {
      var st = load();
      st.avaliados[id] = r;
      save(st);
      enviada();
    });
  }

  /* ==========================================================================
     Jornada do profissional (o profissional logado é o João Silva)
     ========================================================================== */

  function PR() { return window.MOCK.profissional; }
  function empresaDe(id) { return window.MOCK.empresas[id]; }
  function vagaJob(id) { return window.MOCK.vagas[id]; }

  function profNav(current) {
    return nav([
      { id: 'inicio', label: 'Início', icon: 'home', href: 'profissional.html' },
      { id: 'buscar', label: 'Buscar', icon: 'search', href: 'buscar.html?como=profissional' },
      { id: 'candidaturas', label: 'Candidaturas', icon: 'clipboard', href: 'candidaturas.html' },
      { id: 'mensagens', label: 'Mensagens', icon: 'message', href: 'mensagens.html?como=profissional' },
      { id: 'perfil', label: 'Perfil', icon: 'user' }
    ], current);
  }

  // Quantos requisitos da vaga o João atende, e o que falta.
  function compat(v) {
    var faltam = v.requisitos.filter(function (r) { return !r.atende; }).map(function (r) { return r.texto; });
    return { atende: v.requisitos.length - faltam.length, total: v.requisitos.length, faltam: faltam };
  }

  function empresaLink(id) {
    return '<a href="perfil-empresa.html?id=' + q(id) + '" class="inline-link">' + esc(empresaDe(id).nome) + '</a>';
  }

  function jaCandidatou(sp, vagaId) {
    return !!sp.candidaturas[vagaId] || PR().candidaturas.some(function (c) { return c.vaga === vagaId; });
  }

  // Quatro números da reputação de uma empresa (mesmos valores em todas as telas).
  function repEmpresaStats(e) {
    return repStat(e.nota, 'Nota geral') + repStat(e.contratacoes, 'Contratações verificadas') +
      repStat(e.pagouConforme, 'Pagou conforme combinado') + repStat(e.trabalhariaNovamente, 'Trabalhariam novamente');
  }

  /* ---------- Profissional: início ---------- */

  // Onde fica a vaga, vista pelo João: cidade e distância aproximada ou, se remota, o fuso da equipe.
  function localVagaTexto(v) {
    var vl = localVagaJob(v);
    if (vl.modelo === 'remoto' || !vl.loc) return 'De qualquer lugar' + (vl.fuso != null ? ' · equipe em ' + fusoCurto(vl.fuso) : '');
    var pl = perfilLocal(PR_ID);
    return cidadeCurta(vl.loc) + (vl.loc.pais !== pl.loc.pais ? ' · ' + vl.loc.pais : '') +
      ' · ' + distTexto(distanciaKm(vl.loc, pl.loc), unidadeDoPais(pl.loc.pais)) + ' de você';
  }

  // Vagas indicadas ao João, filtradas pela mesma regra de localização das indicações da empresa.
  function vagasIndicadasDe() {
    var pl = perfilLocal(PR_ID), dentro = [], fora = [];
    PR().vagasIndicadas.forEach(function (id) {
      var r = regraLocal(localVagaJob(vagaJob(id)), pl);
      if (r.ok) dentro.push(id); else fora.push({ id: id, motivo: r.motivo });
    });
    return { dentro: dentro, fora: fora };
  }

  function vagaCard(vagaId) {
    var v = vagaJob(vagaId), e = empresaDe(v.empresa), c = compat(v);
    var chipReq = c.atende / c.total < 0.7 ? 'grey' : 'green';
    var repEmpresa = e.novo
      ? '<div><span class="chip blue">Empresa nova · reputação em construção</span></div>'
      : '<div class="row-sub" style="display:flex;align-items:center;gap:6px;font-weight:600;color:var(--ink)"><span style="color:var(--amber)">' +
          icon('star', 16, { fill: 'currentColor', stroke: 1.5 }) + '</span>Empresa ' + esc(e.nota) + ' · ' + e.contratacoes + ' contratações verificadas</div>';
    var extra = c.faltam.length
      ? '<div class="row-sub">Falta: ' + esc(c.faltam.join(', ')) + '</div>'
      : (e.novo ? '' : '<div class="row-sub" style="color:var(--green);font-weight:600">' + esc(e.pagouConforme) + ' pagou conforme combinado</div>');
    return '<article class="card card-tap">' +
      '<div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start">' +
        '<div class="row-main"><h3 class="row-title vaga-title"><a href="vaga.html?id=' + q(v.id) + '" class="card-link">' + esc(v.titulo) + '</a></h3>' +
        '<div class="row-sub">' + empresaLink(v.empresa) + ' · ' + esc(v.modelo) + ' · ' + esc(v.tipo) + '</div>' +
        '<div class="row-sub loc-line">' + esc(localVagaTexto(v)) + '</div></div>' +
        '<span class="chip ' + chipReq + '">' + c.atende + ' de ' + c.total + '</span></div>' +
      repEmpresa + extra + '</article>';
  }

  function confirmPending(c) {
    var e = empresaDe(c.empresa);
    return '<div class="media"><div class="icon-tile blue">' + icon('check', 22, { stroke: 2 }) + '</div>' +
      '<div class="row-main"><div class="row-title">Confirme sua contratação</div>' +
      '<div class="row-sub">' + esc(e.nome) + ' indicou você como contratado para ' + esc(c.vaga) + '. Ao confirmar, o trabalho entra no seu histórico verificado.</div></div></div>';
  }

  function pendTexto(sp) {
    var s = load();
    var comb = combinadoDe(s, PR().confirmacao.vagaId);
    var temCombinado = comb && !sp.confirmacao;
    var n = (temCombinado ? 1 : 0) + (sp.avaliados[PR().avaliacao.empresa] ? 0 : 1);
    return n === 0 ? 'Nenhuma pendência hoje. Veja as vagas indicadas.'
      : 'Você tem ' + plural(n, 'pendência', 'pendências') + ' e vagas novas indicadas.';
  }

  function renderProfissional() {
    var d = PR();
    var rep = d.reputacao;
    var sp = loadP();
    var av = d.avaliacao, avEmpresa = empresaDe(av.empresa);
    var comb = combinadoDe(load(), d.confirmacao.vagaId);

    $('#topbar').innerHTML =
      brandMark() +
      '<div class="brand-name" style="flex-grow:1">KORbuild <span>Match</span></div>' +
      bell(2) +
      '<a href="index.html" class="avatar blue" aria-label="Minha conta (sair)">' + esc(d.iniciais) + '</a>';

    var avaliar = sp.avaliados[av.empresa]
      ? rowStatic({ icone: 'check', tom: 'blue', titulo: 'Avaliação de ' + avEmpresa.nome + ' enviada',
          texto: 'Fica oculta até a empresa enviar a dela ou o prazo terminar.' })
      : rowLink({ icone: 'star', tom: 'amber', titulo: 'Avalie a ' + avEmpresa.nome,
          texto: 'Prazo termina em ' + plural(av.prazoDias, 'dia', 'dias') + '. Sua avaliação fica oculta até a empresa enviar a dela.',
          href: 'avaliar-empresa.html?id=' + q(av.empresa) });

    var pendItens = '<div class="card card-highlight" id="confirm-card" aria-live="polite"></div>' + avaliar;

    $('#content').innerHTML =
      '<div class="stack"><div class="greeting"><h1>Olá, ' + esc(d.nome) + '</h1>' +
        '<p id="pend-txt">' + esc(pendTexto(sp)) + '</p></div>' +
        '<a href="buscar.html?como=profissional" class="row-link" style="min-height:52px;border-color:var(--line-strong);color:var(--muted);font-size:15px">' +
          '<span style="color:var(--ink)">' + icon('search', 20, { stroke: 2 }) + '</span>Buscar vagas, cargos ou empresas</a></div>' +

      '<section class="section" aria-labelledby="h-pend"><h2 id="h-pend">Precisa da sua atenção</h2>' + pendItens + '</section>' +

      accordion('acc-rep', 'Minha reputação', 'Nota ' + rep.nota + ' · ' + plural(rep.trabalhos, 'trabalho', 'trabalhos'),
        '<div class="rep-grid">' + repStat(rep.nota, 'Nota geral') + repStat(rep.trabalhos, 'Trabalhos verificados') + repStat(rep.contratariamDeNovo, 'Contratariam de novo') + '</div>' +
        accMore('Ver perfil'), true) +

      accordion('acc-vagas', 'Vagas indicadas para você', plural(vagasIndicadasDe().dentro.length, 'vaga indicada', 'vagas indicadas'),
        '<p class="note">' + icon('check', 16, { stroke: 2.4 }) + '<span>Combinam com o seu perfil e são de empresas com reputação no mesmo nível da sua.</span></p>' +
        field('dist-max', 'Distância máxima que você aceita', 'select', '',
          LOC().distanciasPerfil.map(function (n) { return '<option value="' + n + '">até ' + n + ' km</option>'; }).join(''),
          { hint: 'Vagas presenciais e híbridas só aparecem até essa distância de ' + cidadeCurta(perfilLocal(PR_ID).loc) + ' (em linha reta) e dentro do raio de cada vaga. Vagas remotas aparecem de qualquer lugar.' }) +
        '<div class="section" id="vagas-ind"></div>' +
        '<div class="acc-more"><a href="buscar.html?como=profissional">Buscar mais vagas</a></div>') +

      '<div class="visually-hidden" role="status" id="live"></div>';

    paintCombinado($('#confirm-card'), comb, d.confirmacao.vaga);

    function paintVagasIndicadas() {
      var vi = vagasIndicadasDe();
      $('#acc-vagas-sum').textContent = plural(vi.dentro.length, 'vaga indicada', 'vagas indicadas');
      $('#vagas-ind').innerHTML = (vi.dentro.length ? vi.dentro.map(vagaCard).join('')
        : '<div class="empty"><p class="row-title">Nenhuma vaga indicada nessa distância.</p></div>') +
        (vi.fora.length ? '<p class="row-sub" id="vagas-fora">' + esc(plural(vi.fora.length, 'vaga indicada não aparece', 'vagas indicadas não aparecem')) +
          ': fora da distância que você aceita ou do raio da vaga.</p>' : '');
    }
    $('#dist-max').value = String(perfilLocal(PR_ID).distanciaMax);
    $('#dist-max').addEventListener('change', function () {
      var st = loadP();
      st.distanciaMax = Number(this.value);
      saveP(st);
      paintVagasIndicadas();
      say('Distância máxima: até ' + this.value + ' km.');
    });
    paintVagasIndicadas();

    // Vindo de outra tela, já abre a seção pedida.
    var aba = { vagas: 'acc-vagas', reputacao: 'acc-rep' }[params.get('aba')];
    if (aba) $('#' + aba + '-btn').click();

    $('#nav').innerHTML = profNav('inicio');
  }

  /* ---------- Profissional: detalhe da vaga ---------- */

  // Aviso (só informativo) quando a vaga fica fora da distância que o João aceita ou do raio dela.
  // Candidatar-se continua possível: a regra vale para as indicações, não para a candidatura.
  function foraDeAlcanceHtml(v) {
    var vl = localVagaJob(v), pl = perfilLocal(PR_ID);
    var r = regraLocal(vl, pl);
    if (r.ok) return '';
    var t = r.motivo === 'limite' ? 'Fica além da distância máxima que você aceita (' + distMaxTexto(pl) + ').'
      : r.motivo === 'raio' ? 'Fica fora do raio desta vaga (' + raioTexto(vl.raio) + '), então ela não aparece nas suas indicações.'
      : r.motivo === 'fuso' ? 'A equipe trabalha em outro fuso (' + fusoCurto(vl.fuso) + '), a mais de ' + LOC().toleranciaFusoHoras + ' h do seu.'
      : 'Vaga remota, e o seu perfil não inclui trabalho remoto.';
    return '<p class="note note-box" id="vaga-alcance">' + icon('eye', 16, { stroke: 2 }) + '<span>' + esc(t) + '</span></p>';
  }

  function renderVaga() {
    var v = vagaJob(params.get('id') || '');

    subTopbar('Detalhe da vaga', 'profissional.html');
    $('#nav').innerHTML = profNav('buscar');
    if (!v) return notFound('Não encontramos essa vaga.', 'profissional.html');

    var e = empresaDe(v.empresa), c = compat(v);

    function paint() {
      var sp = loadP();
      var ja = jaCandidatou(sp, v.id);
      var sal = v.salario ? salarioTexto(v.salario.moeda, v.salario.periodo, v.salario.min, v.salario.max) : 'A combinar';

      var reputacao = e.novo
        ? '<div class="card"><div class="chips"><span class="chip blue">Empresa nova · reputação em construção</span></div>' +
          '<p class="row-sub">A reputação aparece depois da primeira contratação confirmada pelos dois lados.</p>' +
          '<a href="perfil-empresa.html?id=' + q(v.empresa) + '" class="btn btn-outline">Ver perfil da empresa</a></div>'
        : '<div class="card rep-light"><div class="rep-grid rep-grid-2">' + repEmpresaStats(e) + '</div>' +
          '<a href="perfil-empresa.html?id=' + q(v.empresa) + '" class="btn btn-outline">Ver perfil da empresa</a></div>';

      var descricao = v.descricao.length > 240
        ? accordion('acc-desc', 'Descrição da vaga', 'Toque para ler a descrição completa', '<p class="prose">' + esc(v.descricao) + '</p>')
        : '<section class="section"><h2>Descrição</h2><p class="prose">' + esc(v.descricao) + '</p></section>';

      $('#content').innerHTML =
        '<section class="card"><h2 class="page-title vaga-h">' + esc(v.titulo) + '</h2>' +
          '<div class="row-sub">' + empresaLink(v.empresa) + '</div>' +
          '<div class="chips"><span class="chip">' + esc(v.modelo) + '</span><span class="chip">' + esc(v.tipo) + '</span></div>' +
          '<dl class="summary"><div><dt>Local</dt><dd>' + esc(localVagaTexto(v)) + '</dd></div>' +
            '<div><dt>Salário</dt><dd>' + esc(sal) + '</dd></div>' +
            '<div><dt>Posições</dt><dd>' + v.posicoes + '</dd></div>' +
            '<div><dt>Publicada em</dt><dd>' + dataBR(v.publicadaEm) + '</dd></div></dl>' +
          foraDeAlcanceHtml(v) +
          '<div class="btn-row">' +
            (ja
              ? '<a href="candidaturas.html" class="btn btn-outline">' + icon('check', 16, { stroke: 2.4 }) + 'Candidatura enviada · ver status</a>'
              : '<button type="button" class="btn btn-primary" id="candidatar">Candidatar-se</button>') +
            '<button type="button" class="btn btn-outline" id="duvida-btn">Tirar dúvida com a empresa</button>' +
          '</div>' +
        '</section>' +

        '<section class="section"><h2>Compatibilidade</h2><div class="card">' +
          '<div class="chips"><span class="chip ' + (c.atende / c.total < 0.7 ? 'grey' : 'green') + '">Atende ' + c.atende + ' de ' + c.total + ' requisitos</span></div>' +
          '<ul class="req-list">' + v.requisitos.map(function (r) {
            return '<li class="' + (r.atende ? 'req-ok' : 'req-falta') + '">' +
              (r.atende ? '<span class="req-ico">' + icon('check', 16, { stroke: 2.6 }) + '</span><span class="visually-hidden">Atende: </span><span>' + esc(r.texto) + '</span>'
                : '<span class="req-ico">' + icon('minus', 16, { stroke: 2.6 }) + '</span><span>' + esc(r.texto) + '</span><span class="chip amber">Falta</span>') + '</li>';
          }).join('') + '</ul></div></section>' +

        '<section class="section"><h2>Reputação da empresa</h2>' + reputacao + '</section>' +

        descricao +

        '<section class="section"><h2>Competências</h2><ul class="chips chip-list">' +
          v.competencias.map(function (x) { return '<li class="chip">' + esc(x) + '</li>'; }).join('') + '</ul></section>' +

        '<section class="section"><h2>Idiomas</h2><ul class="chips chip-list">' +
          v.idiomas.map(function (x) { return '<li class="chip">' + esc(x) + '</li>'; }).join('') + '</ul></section>';

      var b = $('#candidatar');
      if (b) b.addEventListener('click', resumo);
      $('#duvida-btn').addEventListener('click', function () {
        var conv = iniciarConversaProfissional(v.empresa, v.id, v.titulo);
        window.location.href = 'conversa.html?id=' + q(conv.id) + '&como=profissional';
      });
    }

    // Passo único de confirmação, com o resumo do que será enviado.
    function resumo() {
      var p = prof(PR().id);
      var curriculo = null; // { nome, tamanho } — o arquivo em si nunca é guardado, nem no protótipo.
      var salPadrao = v.salario || { moeda: 'BRL', periodo: 'mes' };

      // Perguntas de triagem: sempre visíveis e obrigatórias quando a vaga tiver.
      var triagemHtml = (v.perguntasTriagem && v.perguntasTriagem.length)
        ? '<section class="card"><h2 class="card-title">Perguntas da empresa</h2>' +
          v.perguntasTriagem.map(function (pg, i) {
            var opcoes = pg.tipo === 'multipla'
              ? pg.opcoes.map(function (o) { return { id: o, rotulo: o }; })
              : [{ id: 'Sim', rotulo: 'Sim' }, { id: 'Não', rotulo: 'Não' }];
            return group('triagem-resp-' + i, pg.texto, pills('triagem-resp-' + i, opcoes), { req: true });
          }).join('') + '</section>'
        : '';

      // O que já foi preenchido dentro do accordion opcional, para o resumo no cabeçalho fechado.
      function resumoOpcionaisTexto() {
        var partes = [];
        if ($('#mensagem-candidato') && $('#mensagem-candidato').value.trim()) partes.push('Mensagem');
        if ($('#pret-valor') && $('#pret-valor').value) partes.push('Pretensão');
        if (curriculo) partes.push('Currículo anexado');
        return partes.length ? partes.join(' · ') : 'Nenhuma preenchida ainda';
      }

      var opcionaisBody =
        '<section class="card"><h2 class="card-title">Mensagem para a empresa</h2>' +
          field('mensagem-candidato', 'Mensagem', 'textarea', 'rows="3" maxlength="400"', '',
            { hint: 'Conte brevemente por que você é uma boa escolha.' }) +
        '</section>' +

        '<section class="card"><h2 class="card-title">Pretensão salarial</h2>' +
          '<div class="form-grid">' +
            '<label class="mini"><span>Moeda</span><select id="pret-moeda">' + options(E().formulario.moedas) + '</select></label>' +
            '<label class="mini"><span>Período</span><select id="pret-periodo">' + options(E().formulario.periodos) + '</select></label>' +
            '<label class="mini"><span>Valor</span><input id="pret-valor" type="number" inputmode="decimal" min="0" step="any" placeholder="0"></label>' +
          '</div>' +
        '</section>' +

        '<section class="card"><h2 class="card-title">Currículo</h2><div id="curriculo-area"></div></section>';

      $('#content').innerHTML =
        '<div class="greeting"><h2 class="page-title">Confirmar candidatura</h2>' +
          '<p>Você está se candidatando a ' + esc(v.titulo) + ' em ' + esc(e.nome) + '. Vamos usar o perfil que você já preencheu.</p></div>' +

        triagemHtml +

        '<section class="card"><h2 class="card-title">O que será enviado</h2>' +
          '<dl class="summary"><div><dt>Nome</dt><dd>' + esc(p.nome) + '</dd></div>' +
            '<div><dt>Resumo</dt><dd>' + esc(p.resumo) + '</dd></div>' +
            '<div><dt>Reputação</dt><dd>Nota ' + esc(p.nota) + ' · ' + p.trabalhos + ' trabalhos verificados</dd></div>' +
            '<div><dt>Localização</dt><dd>' + esc(p.local) + '</dd></div>' +
            '<div><dt>Competências</dt><dd>' + esc(p.competencias.join(', ')) + '</dd></div>' +
            '<div><dt>Idiomas</dt><dd>' + esc(p.idiomas.join(', ')) + '</dd></div>' +
            '<div><dt>Compatibilidade</dt><dd>Atende ' + c.atende + ' de ' + c.total + ' requisitos</dd></div></dl></section>' +

        accordion('acc-opcional', 'Adicionar mais informações (opcional)', 'Nenhuma preenchida ainda', opcionaisBody) +

        '<p class="form-status" id="form-status" role="alert"></p>' +
        '<div class="btn-row form-actions"><button type="button" class="btn btn-primary" id="enviar">Enviar candidatura</button>' +
          '<button type="button" class="btn btn-outline" id="voltar-vaga">Voltar</button></div>' +
        '<div class="visually-hidden" role="status" id="live"></div>';
      window.scrollTo(0, 0);

      $('#pret-moeda').value = salPadrao.moeda;
      $('#pret-periodo').value = salPadrao.periodo;

      function atualizarResumoOpcionais() {
        var el = $('#acc-opcional-sum');
        if (el) el.textContent = resumoOpcionaisTexto();
      }
      $('#mensagem-candidato').addEventListener('input', atualizarResumoOpcionais);
      $('#pret-valor').addEventListener('input', atualizarResumoOpcionais);

      function renderCurriculoArea() {
        var area = $('#curriculo-area');
        if (curriculo) {
          area.innerHTML = '<div class="file-chip"><span class="file-name">' + icon('clipboard', 18, { stroke: 2 }) +
            esc(curriculo.nome) + ' · ' + formatBytes(curriculo.tamanho) + '</span>' +
            '<button type="button" class="btn btn-outline" id="curriculo-remover">Remover</button></div>';
          $('#curriculo-remover').addEventListener('click', function () {
            curriculo = null;
            renderCurriculoArea();
            say('Currículo removido.');
          });
        } else {
          area.innerHTML = '<label class="btn btn-outline file-btn" for="curriculo-input">' + icon('clipboard', 16, { stroke: 2 }) + 'Anexar currículo (PDF)</label>' +
            '<input type="file" id="curriculo-input" accept="application/pdf,.pdf" class="visually-hidden">' +
            '<p class="field-error" id="curriculo-err" hidden></p>';
          $('#curriculo-input').addEventListener('change', function (ev) {
            var file = ev.target.files[0];
            if (!file) return;
            var errEl = $('#curriculo-err');
            var ehPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
            if (!ehPdf) {
              errEl.hidden = false; errEl.textContent = 'Envie um arquivo em PDF.'; ev.target.value = ''; return;
            }
            if (file.size > 5 * 1024 * 1024) {
              errEl.hidden = false; errEl.textContent = 'O arquivo deve ter até 5 MB (este tem ' + formatBytes(file.size) + ').'; ev.target.value = ''; return;
            }
            errEl.hidden = true;
            curriculo = { nome: file.name, tamanho: file.size };
            renderCurriculoArea();
            say('Currículo anexado: ' + file.name + '.');
          });
        }
        atualizarResumoOpcionais();
      }
      renderCurriculoArea();

      $('#voltar-vaga').addEventListener('click', function () { paint(); window.scrollTo(0, 0); });
      $('#enviar').addEventListener('click', function () {
        var triagemResp = {};
        var regras = [];
        if (v.perguntasTriagem) {
          v.perguntasTriagem.forEach(function (pg, i) {
            var marcado = document.querySelector('input[name="triagem-resp-' + i + '"]:checked');
            triagemResp[i] = marcado ? marcado.value : null;
            regras.push({ id: 'triagem-resp-' + i, ok: !!marcado, msg: 'Responda: ' + pg.texto });
          });
        }
        var ok = check(regras);
        $('#form-status').textContent = ok ? '' : 'Responda as perguntas da empresa antes de enviar.';
        if (!ok) return;

        var pretVal = $('#pret-valor').value;
        var pretensao = pretVal ? { valor: Number(pretVal), moeda: $('#pret-moeda').value, periodo: $('#pret-periodo').value } : null;
        var mensagem = $('#mensagem-candidato').value.trim();

        var sp = loadP();
        sp.candidaturas[v.id] = {
          data: hojeISO(), status: 'enviada',
          candidatura: { mensagem: mensagem || null, triagem: triagemResp, pretensao: pretensao, curriculo: curriculo }
        };
        saveP(sp);
        showDone({
          icone: 'check',
          titulo: 'Candidatura enviada',
          texto: 'Sua candidatura para “' + esc(v.titulo) + '” em ' + esc(e.nome) + ' foi enviada com o perfil que você já preencheu. Acompanhe o andamento em Minhas candidaturas.',
          acoes: '<a href="candidaturas.html" class="btn btn-primary">Ver minhas candidaturas</a>' +
            '<a href="profissional.html" class="btn btn-outline">Voltar ao início</a>'
        });
      });
    }

    paint();
  }

  /* ---------- Profissional: minhas candidaturas ---------- */

  var GRUPO = { enviada: 'andamento', visualizada: 'andamento', conversa: 'andamento', contratado: 'contratado', nao: 'encerradas', retirada: 'encerradas', encerrada: 'encerradas', recusado: 'encerradas' };
  var GRUPOS = [
    { id: 'andamento', rotulo: 'Em andamento' },
    { id: 'contratado', rotulo: 'Contratado' },
    { id: 'encerradas', rotulo: 'Encerradas' }
  ];

  function etapaRotulo(id) {
    return PR().etapas.filter(function (e) { return e.id === id; })[0].rotulo;
  }

  // Candidaturas feitas na demonstração (mais recente primeiro) e as anteriores, já com o status atual.
  // A candidatura da Recepcionista acompanha o que a empresa fez na jornada dela (mesma sessão).
  function candidaturasDe(sp) {
    var novas = Object.keys(sp.candidaturas).reverse().map(function (vid) {
      var v = vagaJob(vid);
      return { id: vid, vaga: vid, titulo: v.titulo, empresa: v.empresa, data: sp.candidaturas[vid].data, status: sp.candidaturas[vid].status };
    });
    var s = load();
    var antigas = PR().candidaturas.map(function (c) {
      var r = {};
      Object.keys(c).forEach(function (k) { r[k] = c[k]; });
      if (c.vaga === 'recepcionista-exemplo') {
        var vagaIdEmp = PR().confirmacao.vagaId;
        if (sp.confirmacao === 'recusado') {
          r.status = 'recusado';
        } else {
          r.status = 'contratado';
          r.combinado = combinadoDe(s, vagaIdEmp);
        }
      }
      return r;
    });
    return novas.concat(antigas);
  }

  function timelineHtml(c) {
    var ord = ['enviada', 'visualizada', 'conversa'];
    var saida = c.status === 'nao' || c.status === 'retirada' || c.status === 'encerrada' || c.status === 'recusado';
    var ids, atual;
    if (c.status === 'recusado') { ids = ord.concat('contratado', 'recusado'); atual = ids.length - 1; }
    else if (saida) { ids = ord.slice(0, ord.indexOf(c.alcancou) + 1).concat(c.status); atual = ids.length - 1; }
    else if (c.status === 'contratado') { ids = ord.concat('contratado'); atual = ids.length - 1; }
    else { ids = ord.concat('contratado'); atual = ord.indexOf(c.status); }
    var estado = { done: ' (concluída)', current: ' (etapa atual)', todo: ' (pendente)' };
    return '<ol class="timeline" style="--n:' + ids.length + '" aria-label="Andamento da candidatura">' + ids.map(function (id, i) {
      var st = i < atual ? 'done' : (i === atual ? 'current' : 'todo');
      return '<li class="tl-' + st + (saida && i === atual ? ' tl-nao' : '') + '"' + (i === atual ? ' aria-current="step"' : '') + '>' +
        '<span class="tl-dot" aria-hidden="true"></span>' +
        '<span class="tl-label">' + esc(etapaRotulo(id)) + '<span class="visually-hidden">' + estado[st] + '</span></span></li>';
    }).join('') + '</ol>';
  }

  function candidaturaCard(sp, c) {
    var texto, chip, acoesHtml = '';
    if (c.status === 'contratado') {
      if (c.confirmar) {
        if (sp.confirmacao === 'confirmado') {
          texto = 'Contratado · confirmado'; chip = 'green';
          acoesHtml = '<p class="row-sub">Contratação confirmada. A avaliação da empresa fica disponível ao fim do vínculo.</p>';
        } else if (sp.confirmacao === 'contestado') {
          texto = 'Contratado · combinado contestado'; chip = 'amber';
          acoesHtml = '<p class="row-sub">Você disse: “' + esc(sp.contestacaoTexto || '') + '”. A empresa foi avisada e vai revisar.</p>';
        } else {
          texto = 'Contratado · aguardando sua confirmação'; chip = 'amber';
          acoesHtml = '<div class="combinado-slot" data-slot="' + esc(c.id) + '"></div>';
        }
      } else {
        texto = 'Contratado · confirmado'; chip = 'green';
        if (c.avaliar) {
          acoesHtml = sp.avaliados[c.empresa]
            ? '<p class="row-sub">Avaliação enviada · será publicada quando a empresa enviar a dela ou quando o prazo terminar.</p>'
            : '<div class="btn-row"><a href="avaliar-empresa.html?id=' + q(c.empresa) + '" class="btn btn-primary">Avaliar empresa</a></div>';
        }
      }
    } else if (c.status === 'recusado') {
      texto = 'Não contratado'; chip = 'grey';
      acoesHtml = '<p class="row-sub">Você avisou que não foi contratado para esta vaga. O vínculo não entrou no seu histórico.</p>';
    } else if (c.status === 'conversa') {
      texto = 'Em conversa'; chip = 'blue';
      var ladoDono = c.empresa === 'empresa-exemplo' ? 'ambos' : 'profissional';
      var convId = chatKey(ladoDono, PR_ID, c.empresa);
      acoesHtml = '<div class="btn-row"><a href="conversa.html?id=' + q(convId) + '&como=profissional" class="btn btn-outline">Abrir conversa</a></div>';
    } else if (c.status === 'enviada' || c.status === 'visualizada') {
      texto = etapaRotulo(c.status); chip = 'blue';
      if (c.data) acoesHtml = '<p class="row-sub">A empresa responde até ' + maisDias(c.data, 7) + '.</p>';
    } else {
      texto = etapaRotulo(c.status);
      chip = (c.status === 'nao' || c.status === 'retirada' || c.status === 'encerrada') ? 'grey' : 'blue';
    }

    var titulo = c.vaga && vagaJob(c.vaga)
      ? '<a href="vaga.html?id=' + q(c.vaga) + '" class="inline-link title-link">' + esc(c.titulo) + '</a>' : esc(c.titulo);

    return '<article class="card">' +
      '<div class="head-row"><div class="row-main"><h3 class="row-title vaga-title">' + titulo + '</h3>' +
        '<div class="row-sub">' + empresaLink(c.empresa) + ' · enviada em ' + dataBR(c.data) + '</div></div>' +
        '<span class="chip ' + chip + '">' + esc(texto) + '</span></div>' +
      timelineHtml(c) + acoesHtml + '</article>';
  }

  function renderCandidaturas() {
    subTopbar('Minhas candidaturas', 'profissional.html');
    $('#nav').innerHTML = profNav('candidaturas');

    var filtro = params.get('status');

    $('#content').innerHTML =
      '<div class="filter" role="group" aria-label="Filtrar candidaturas" id="cand-filter"></div>' +
      '<div class="section" id="cand-list" tabindex="-1"></div>' +
      '<div class="visually-hidden" role="status" id="live"></div>';

    function paint() {
      var sp = loadP();
      var todas = candidaturasDe(sp);
      function doGrupo(g) { return todas.filter(function (c) { return GRUPO[c.status] === g; }); }

      if (!GRUPOS.some(function (g) { return g.id === filtro; })) {
        var primeiro = GRUPOS.filter(function (g) { return doGrupo(g.id).length > 0; })[0];
        filtro = primeiro ? primeiro.id : 'andamento';
      }

      $('#cand-filter').innerHTML = GRUPOS.map(function (g) {
        return '<button type="button" data-grupo="' + g.id + '" aria-pressed="' + (g.id === filtro) + '">' + esc(g.rotulo) + ' · ' + doGrupo(g.id).length + '</button>';
      }).join('');

      var lista = doGrupo(filtro);
      $('#cand-list').innerHTML = lista.length
        ? lista.map(function (c) { return candidaturaCard(sp, c); }).join('')
        : '<div class="empty"><p class="row-title">Nenhuma candidatura aqui.</p>' +
          '<p class="row-sub">Veja as vagas indicadas para você e candidate-se.</p>' +
          '<a href="profissional.html?aba=vagas" class="btn btn-primary">Ver vagas indicadas</a></div>';

      $all('.combinado-slot').forEach(function (slot) {
        var cid = slot.getAttribute('data-slot');
        var candObj = lista.filter(function (x) { return x.id === cid; })[0];
        if (candObj && candObj.combinado) paintCombinado(slot, candObj.combinado, candObj.titulo);
      });
    }

    $('#cand-filter').addEventListener('click', function (e) {
      var b = e.target.closest('[data-grupo]');
      if (!b) return;
      filtro = b.getAttribute('data-grupo');
      paint();
    });

    paint();
  }

  /* ---------- Profissional: perfil da empresa ---------- */

  function renderPerfilEmpresa() {
    var id = params.get('id') || '';
    var e = empresaDe(id);

    subTopbar('Perfil da empresa', 'profissional.html');
    $('#nav').innerHTML = profNav('buscar');
    if (!e) return notFound('Não encontramos essa empresa.', 'profissional.html');

    var sp = loadP();

    var reputacao = e.novo
      ? '<div class="card"><div class="chips"><span class="chip blue">Empresa nova · reputação em construção</span></div>' +
        '<p class="row-sub">A reputação aparece depois da primeira contratação confirmada pelos dois lados.</p></div>'
      : '<div class="card rep-light"><div class="rep-grid">' + repStat(e.nota, 'Nota geral') + repStat(e.contratacoes, 'Contratações verificadas') +
        repStat(e.pagouConforme, 'Pagou conforme combinado') + repStat(e.correspondia, 'A vaga correspondia ao anúncio') +
        repStat(e.trabalhariaNovamente, 'Trabalhariam novamente') + '</div>' +
        '<p class="row-sub">Conta só contratações confirmadas pelos dois lados.</p></div>';

    var abertas = Object.keys(window.MOCK.vagas).map(vagaJob).filter(function (v) { return v.empresa === id; });
    var vagasHtml = abertas.length
      ? '<div class="list">' + abertas.map(function (v) {
          var c = compat(v);
          return '<a class="list-item" href="vaga.html?id=' + q(v.id) + '"><div class="row-main"><div class="row-title">' + esc(v.titulo) + '</div>' +
            '<div class="row-sub">' + esc(v.modelo) + ' · ' + esc(v.tipo) + '</div></div>' +
            '<span class="chip ' + (c.atende / c.total < 0.7 ? 'grey' : 'green') + '">' + c.atende + ' de ' + c.total + '</span>' +
            '<span class="chevron">' + icon('chevron', 18, { stroke: 2 }) + '</span></a>';
        }).join('') + '</div>'
      : '<p class="row-sub">Nenhuma vaga aberta no momento.</p>';

    var avaliacoes = e.avaliacoes.length
      ? accordion('acc-aval', 'Avaliações recebidas', 'Nota ' + e.nota + ' · ' + plural(e.avaliacoes.length, 'avaliação', 'avaliações'),
          e.avaliacoes.map(function (a) { return avaliacaoHtml(a, PR().avaliacaoEmpresa.perguntas, 'da empresa'); }).join(''))
      : '<section class="section"><h2>Avaliações recebidas</h2><p class="row-sub">Ainda não há avaliações publicadas.</p></section>';

    $('#content').innerHTML =
      '<section class="card profile-head"><div class="media center"><div class="avatar xl avatar-empresa">' + esc(e.iniciais) + '</div>' +
        '<div class="row-main"><h2 class="profile-name">' + esc(e.nome) + '</h2><div class="row-sub">' + esc(e.setor) + '</div></div></div>' +
        '<dl class="summary"><div><dt>Localização</dt><dd>' + esc(e.local) + '</dd></div></dl>' +
        (e.verificada ? '<div class="chips"><span class="chip green">' + icon('check', 14, { stroke: 2.6 }) + '&nbsp;Empresa verificada</span></div>' : '') +
        '<div class="btn-row"><button type="button" class="btn ' + (sp.seguindo[id] ? 'btn-outline' : 'btn-primary') + '" id="seguir" aria-pressed="' + !!sp.seguindo[id] + '">' +
          (sp.seguindo[id] ? icon('check', 16, { stroke: 2.4 }) + 'Seguindo' : 'Seguir empresa') + '</button></div>' +
      '</section>' +

      '<section class="section"><h2>Reputação</h2>' + reputacao + '</section>' +
      '<section class="section"><h2>Vagas abertas</h2>' + vagasHtml + '</section>' +
      avaliacoes;

    // Simulado: alterna Seguir / Seguindo.
    $('#seguir').addEventListener('click', function () {
      var st = loadP();
      var segue = !st.seguindo[id];
      st.seguindo[id] = segue;
      saveP(st);
      this.setAttribute('aria-pressed', String(segue));
      this.className = 'btn ' + (segue ? 'btn-outline' : 'btn-primary');
      this.innerHTML = segue ? icon('check', 16, { stroke: 2.4 }) + 'Seguindo' : 'Seguir empresa';
      toast(segue ? 'Você agora segue ' + e.nome + ' (simulação).' : 'Você deixou de seguir ' + e.nome + ' (simulação).');
    });
  }

  /* ---------- Profissional: avaliar empresa ---------- */

  function renderAvaliarEmpresa() {
    var id = params.get('id') || '';
    var e = empresaDe(id);
    var A = PR().avaliacaoEmpresa;

    subTopbar('Avaliar empresa', 'profissional.html');
    $('#nav').innerHTML = profNav('candidaturas');
    if (!e) return notFound('Não encontramos essa empresa.', 'profissional.html');

    var dias = PR().avaliacao.empresa === id ? PR().avaliacao.prazoDias : A.prazoPadrao;
    var prazo = plural(dias, 'dia', 'dias');

    function enviada() {
      showDone({
        icone: 'check',
        titulo: 'Avaliação enviada',
        texto: 'Sua avaliação fica oculta por enquanto. Ela será publicada quando ' + esc(e.nome) + ' enviar a própria avaliação ou, no máximo, quando o prazo terminar, em ' + esc(prazo) + '.',
        acoes: '<a href="profissional.html" class="btn btn-primary">Voltar ao início</a>' +
          '<a href="candidaturas.html" class="btn btn-outline">Ver minhas candidaturas</a>'
      });
    }

    if (loadP().avaliados[id]) return enviada();

    var cfg = {
      aviso: esc(e.nome) + ' só verá sua avaliação quando enviar a dela, ou quando o prazo terminar em ' + esc(prazo) + '.',
      cabecalho: '<div class="media center"><div class="avatar lg avatar-empresa">' + esc(e.iniciais) + '</div>' +
        '<div class="row-main"><div class="row-title" style="font-weight:800">' + esc(e.nome) + '</div>' +
        '<div class="row-sub">' + esc(e.setor) + ' · ' + esc(e.local) + '</div></div></div>',
      perguntas: A.perguntas, respostas: A.respostas, limite: A.limiteComentario, cancelar: 'profissional.html',
      combinado: PR().avaliacao.empresa === id ? PR().avaliacao.combinado : null
    };

    $('#content').innerHTML = avaliacaoFormHtml(cfg);
    bindAvaliacao(cfg, function (r) {
      var st = loadP();
      st.avaliados[id] = r;
      saveP(st);
      enviada();
    });
  }

  /* ---------- Mensagens (as duas jornadas) ---------- */

  function renderMensagens() {
    var como = params.get('como') === 'empresa' ? 'empresa' : 'profissional';
    subTopbar('Mensagens', como === 'empresa' ? 'empresa.html' : 'profissional.html');
    $('#nav').innerHTML = como === 'empresa' ? empresaNav('mensagens') : profNav('mensagens');

    var chat = loadChat();
    function ultima(cv) { return cv.mensagens.length ? cv.mensagens[cv.mensagens.length - 1].quando : '1970-01-01T00:00:00'; }

    var lista = Object.keys(chat.conversas).map(function (id) { return chat.conversas[id]; })
      .filter(function (cv) { return (cv.ladoDono === como || cv.ladoDono === 'ambos') && cv.mensagens.length > 0; })
      .sort(function (a, b) { return new Date(ultima(b)) - new Date(ultima(a)); });

    if (!lista.length) {
      $('#content').innerHTML = '<div class="empty"><p class="row-title">Nenhuma conversa ainda.</p>' +
        '<p class="row-sub">Inicie uma conversa a partir de um candidato, de uma vaga ou de um perfil.</p></div>';
      return;
    }

    $('#content').innerHTML = '<div class="list chat-list">' + lista.map(function (cv) {
      var outro = como === 'empresa' ? prof(cv.profissionalId) : empresaDe(cv.empresaId);
      var msg = cv.mensagens[cv.mensagens.length - 1];
      var naoLida = !cv.lidoPor[como];
      var liberado = cv.compartilhou.empresa && cv.compartilhou.profissional;
      var avatar = como === 'empresa'
        ? '<span class="avatar" style="background:' + esc(outro.cor) + '">' + esc(outro.iniciais) + '</span>'
        : '<span class="avatar avatar-empresa">' + esc(outro.iniciais) + '</span>';
      return '<a class="chat-row' + (naoLida ? ' chat-unread' : '') + '" href="conversa.html?id=' + q(cv.id) + '&como=' + como + '">' + avatar +
        '<span class="row-main"><span class="chat-row-top"><span class="row-title">' + esc(outro.nome) + '</span>' +
          '<span class="chat-time">' + horaCurta(msg.quando) + '</span></span>' +
          (cv.vagaTitulo ? '<span class="chat-vaga-lbl">' + esc(cv.vagaTitulo) + '</span>' : '') +
          '<span class="row-sub chat-preview">' + esc((msg.de === como ? 'Você: ' : '') + msg.texto) + '</span>' +
          (liberado ? '<span class="chip green chat-wa-badge">' + icon('check', 12, { stroke: 2.6 }) + 'WhatsApp liberado</span>' : '') + '</span>' +
        (naoLida ? '<span class="chat-dot" aria-hidden="true"></span><span class="visually-hidden">, não lida</span>' : '') + '</a>';
    }).join('') + '</div>';
  }

  /* ---------- Conversa ---------- */

  function renderConversa() {
    var como = params.get('como') === 'empresa' ? 'empresa' : 'profissional';
    var id = params.get('id') || '';
    var fallback = 'mensagens.html?como=' + como;

    $('#nav').innerHTML = como === 'empresa' ? empresaNav('mensagens') : profNav('mensagens');

    var chat = loadChat();
    var cv = chat.conversas[id];
    if (!cv) {
      subTopbar('Conversa', fallback);
      return notFound('Não encontramos essa conversa.', fallback);
    }

    var outro = como === 'empresa' ? prof(cv.profissionalId) : empresaDe(cv.empresaId);
    subTopbar(outro.nome, fallback);
    marcarLido(id, como);

    function vagaLinkHtml() {
      if (!cv.vagaTitulo) return '';
      var href = como === 'empresa'
        ? (cv.vagaEmpresaId ? 'candidatos.html?vaga=' + q(cv.vagaEmpresaId) : null)
        : (cv.vagaProfId ? 'vaga.html?id=' + q(cv.vagaProfId) : null);
      return '<div class="chat-vaga">' + icon('briefcase', 16, { stroke: 2 }) +
        (href ? '<a href="' + esc(href) + '">' + esc(cv.vagaTitulo) + '</a>' : '<span>' + esc(cv.vagaTitulo) + '</span>') + '</div>';
    }

    function bubblesHtml() {
      if (!cv.mensagens.length) return '<li class="bubble-sys">Nenhuma mensagem ainda. Escreva para começar a conversa.</li>';
      return cv.mensagens.map(function (m) {
        var meu = m.de === como;
        return '<li class="bubble ' + (meu ? 'bubble-out' : 'bubble-in') + '"><span class="bubble-text">' + esc(m.texto) + '</span>' +
          '<span class="bubble-time">' + horaCurta(m.quando) + '</span></li>';
      }).join('');
    }

    function repintar() {
      $('#wa-area').innerHTML = waBarHtml(cv, como);
      $('#msgs').innerHTML = bubblesHtml();
      $('#msgs').scrollTop = $('#msgs').scrollHeight;
    }

    $('#content').innerHTML =
      vagaLinkHtml() +
      '<div id="wa-area"></div>' +
      '<ul class="bubbles" id="msgs" aria-live="polite"></ul>' +
      '<form id="msg-form" class="chat-compose">' +
        '<label class="visually-hidden" for="msg-in">Mensagem</label>' +
        '<textarea id="msg-in" rows="1" maxlength="500" placeholder="Escreva uma mensagem…"></textarea>' +
        '<button type="submit" class="btn btn-primary chat-send" aria-label="Enviar">' + icon('send', 18, { stroke: 2.2 }) + '</button>' +
      '</form>' +
      '<div class="visually-hidden" role="status" id="live"></div>';

    repintar();

    $('#wa-area').addEventListener('click', function (e) {
      var b = e.target.closest('[data-wa]');
      if (!b) return;
      var act = b.getAttribute('data-wa');
      if (act === 'compartilhar') {
        var c = loadChat(), cvv = c.conversas[id];
        cvv.compartilhou[como] = true;
        cvv.mensagens.push({ de: como, texto: 'Você compartilhou seu WhatsApp.', quando: new Date().toISOString() });
        saveChat(c);
        cv = cvv;
        repintar();
        say('WhatsApp compartilhado.');
      } else if (act === 'contato') {
        var existing = $('#wa-area').querySelector('.wa-preview');
        if (existing) { existing.remove(); return; }
        var euNome = como === 'empresa' ? empresaDe(cv.empresaId).nome : prof(cv.profissionalId).nome;
        var msgTexto = 'Olá! Aqui é ' + euNome + ', pelo KORbuild Match' + (cv.vagaTitulo ? ', sobre a vaga de ' + cv.vagaTitulo : '') + '.';
        var canal = canalDoOutro(cv, como);
        var meio = canal === 'sms' ? 'por SMS' : (canal === 'email' ? 'por e-mail' : 'pelo WhatsApp');
        $('#wa-area').insertAdjacentHTML('beforeend',
          '<div class="wa-preview"><p class="wa-preview-lbl">Isto contataria ' + esc(outro.nome) + ' ' + meio + ' com esta mensagem (simulação):</p>' +
          '<blockquote>' + esc(msgTexto) + '</blockquote>' +
          '<p class="wa-preview-note">Os contatos deste protótipo são fictícios; nada é enviado de verdade.</p>' +
          '<button type="button" class="btn btn-outline" data-wa="fechar">Fechar</button></div>');
      } else if (act === 'fechar') {
        var p = $('#wa-area').querySelector('.wa-preview');
        if (p) p.remove();
      }
    });

    $('#msg-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var input = $('#msg-in');
      var texto = input.value.trim();
      if (!texto) return;
      var c = loadChat();
      var cvv = c.conversas[id];
      cvv.mensagens.push({ de: como, texto: texto, quando: new Date().toISOString() });
      cvv.lidoPor[como] = true;
      cvv.lidoPor[como === 'empresa' ? 'profissional' : 'empresa'] = false;
      saveChat(c);
      cv = cvv;
      input.value = '';
      repintar();
      say('Mensagem enviada.');

      if (cv.ladoDono !== 'ambos' && !cv.respondeuAuto) {
        var auto = respostaAutomatica(cv);
        if (auto) {
          setTimeout(function () {
            var c2 = loadChat(), cvv2 = c2.conversas[id];
            if (!cvv2) return;
            cvv2.mensagens.push({ de: auto.de, texto: auto.texto, quando: new Date().toISOString() });
            cvv2.respondeuAuto = true;
            cvv2.lidoPor.empresa = true;
            cvv2.lidoPor.profissional = true;
            saveChat(c2);
            cv = cvv2;
            repintar();
          }, 500);
        }
      }
    });
  }

  /* ---------- Busca (as duas jornadas): localização como filtro opcional (seções 10 e 10.1) ---------- */

  // A empresa busca profissionais; o profissional busca vagas. Nenhum filtro vem ligado: quem pesquisa
  // decide distância, cidade/estado/país, modelo de trabalho, disposto a se mudar (só na busca da
  // empresa) e fuso horário. A distância parte da sede da empresa ou da região do profissional.
  function renderBusca() {
    var ehEmpresa = params.get('como') === 'empresa';
    var f = E().formulario;
    var origem = ehEmpresa ? E().loc : perfilLocal(PR_ID).loc;
    var unidade = unidadeDoPais(origem.pais);

    subTopbar(ehEmpresa ? 'Buscar profissionais' : 'Buscar vagas', ehEmpresa ? 'empresa.html' : 'profissional.html');
    $('#nav').innerHTML = ehEmpresa ? empresaNav('buscar') : profNav('buscar');

    var modelosHtml = '<div class="pills">' + f.modelos.map(function (m) {
      return '<label class="pill"><input type="checkbox" name="f-modelo" value="' + m.id + '" class="pill-input"><span>' + esc(m.rotulo) + '</span></label>';
    }).join('') + '</div>';

    var filtros =
      '<p class="note">' + icon('check', 16, { stroke: 2.4 }) + '<span>Todos os filtros são opcionais e valem só para esta busca. Distâncias aproximadas, em linha reta; o endereço de ninguém é mostrado.</span></p>' +
      field('f-dist', 'Distância a partir de ' + cidadeCurta(origem) + (ehEmpresa ? ' (sede)' : ' (sua região)'), 'select', '',
        '<option value="">Qualquer distância</option>' + LOC().raios[unidade].map(function (n) {
          return '<option value="' + n + '">Até ' + esc(raioTexto({ valor: n, unidade: unidade })) + '</option>';
        }).join(''),
        { hint: ehEmpresa ? '' : 'Vagas remotas aparecem com qualquer distância.' }) +
      field('f-pais', 'País', 'select', '', options(f.paises, 'Qualquer país')) +
      field('f-estado', 'Estado ou região', 'input', 'type="text" maxlength="60" autocomplete="off" placeholder="Ex.: SP"', '') +
      field('f-cidade', 'Cidade', 'input', 'type="text" maxlength="60" autocomplete="off" placeholder="Ex.: Campinas"', '') +
      group('f-modelo', ehEmpresa ? 'Modelo de trabalho que aceita' : 'Modelo de trabalho', modelosHtml) +
      (ehEmpresa ? group('f-mudar', 'Disposto a se mudar',
        '<div class="pills"><label class="pill"><input type="checkbox" id="f-mudar-in" class="pill-input"><span>Só quem aceita se mudar</span></label></div>') : '') +
      field('f-fuso', 'Fuso horário', 'select', '', options(LOC().fusos, 'Qualquer fuso')) +
      '<div class="btn-row"><button type="button" class="btn btn-outline" id="f-limpar">Limpar filtros</button></div>';

    $('#content').innerHTML =
      '<div class="field"><label for="busca-texto">' + (ehEmpresa ? 'Nome, função ou competência' : 'Cargo, empresa ou competência') + '</label>' +
        '<input id="busca-texto" type="search" autocomplete="off" placeholder="' + (ehEmpresa ? 'Ex.: Recepcionista' : 'Ex.: Atendente') + '"></div>' +
      accordion('acc-filtros', 'Filtros de localização', 'Nenhum filtro', filtros) +
      '<p class="row-sub" id="busca-count" role="status" aria-live="polite"></p>' +
      '<div class="section" id="busca-list"></div>';

    function contem(texto, termo) { return semAcento(texto).indexOf(semAcento(termo)) !== -1; }

    function lerFiltros() {
      return {
        texto: $('#busca-texto').value.trim(),
        dist: $('#f-dist').value ? raioKm({ valor: Number($('#f-dist').value), unidade: unidade }) : null,
        pais: $('#f-pais').value,
        estado: $('#f-estado').value.trim(),
        cidade: $('#f-cidade').value.trim(),
        modelos: $all('input[name="f-modelo"]:checked').map(function (i) { return i.value; }),
        mudar: ehEmpresa && $('#f-mudar-in').checked,
        fuso: $('#f-fuso').value === '' ? null : Number($('#f-fuso').value)
      };
    }

    function nAtivos(fl) {
      return [fl.dist, fl.pais, fl.estado, fl.cidade, fl.modelos.length, fl.mudar, fl.fuso != null].filter(Boolean).length;
    }

    // Local de texto (país, estado, cidade): um item sem localização (vaga remota) não passa.
    function passaLocal(loc, fl) {
      if (!fl.pais && !fl.estado && !fl.cidade) return true;
      if (!loc) return false;
      return (!fl.pais || loc.pais === fl.pais) &&
        (!fl.estado || contem(loc.estado, fl.estado)) &&
        (!fl.cidade || contem(loc.cidade, fl.cidade));
    }

    function resultadosVagas(fl) {
      return Object.keys(window.MOCK.vagas).map(vagaJob).map(function (v) {
        var vl = localVagaJob(v);
        return { v: v, vl: vl, km: vl.loc ? distanciaKm(origem, vl.loc) : null };
      }).filter(function (x) {
        var v = x.v, e = empresaDe(v.empresa);
        if (fl.texto && !contem([v.titulo, e.nome, v.competencias.join(' '), v.local].join(' '), fl.texto)) return false;
        if (fl.dist != null && x.km != null && x.km > fl.dist) return false;
        if (!passaLocal(x.vl.loc, fl)) return false;
        if (fl.modelos.length && fl.modelos.indexOf(x.vl.modelo) === -1) return false;
        if (fl.fuso != null && (x.vl.fuso != null ? x.vl.fuso : fusoDe(x.vl.loc)) !== fl.fuso) return false;
        return true;
      }).sort(function (a, b) { return (a.km == null ? Infinity : a.km) - (b.km == null ? Infinity : b.km); });
    }

    function resultadosProfissionais(fl) {
      return Object.keys(window.MOCK.profissionais).map(function (id) {
        var pl = perfilLocal(id);
        return { id: id, p: prof(id), pl: pl, km: distanciaKm(origem, pl.loc) };
      }).filter(function (x) {
        if (fl.texto && !contem([x.p.nome, x.p.resumo, x.p.competencias.join(' '), x.p.local].join(' '), fl.texto)) return false;
        if (fl.dist != null && x.km > fl.dist) return false;
        if (!passaLocal(x.pl.loc, fl)) return false;
        if (fl.modelos.length && !fl.modelos.some(function (m) { return x.pl.modelos.indexOf(m) !== -1; })) return false;
        if (fl.mudar && !x.pl.aceitaMudar) return false;
        if (fl.fuso != null && x.pl.fuso !== fl.fuso) return false;
        return true;
      }).sort(function (a, b) { return a.km - b.km; });
    }

    function profBuscaCard(x) {
      var p = x.p;
      var onde = cidadeCurta(x.pl.loc) + (x.pl.loc.pais !== origem.pais ? ' · ' + x.pl.loc.pais : '') + ' · ' + distTexto(x.km, unidade) + ' da sede';
      return '<article class="card' + (p.novo ? ' card-new' : '') + '">' +
        '<div class="media center"><div class="avatar lg" style="background:' + esc(p.cor) + '">' + esc(p.iniciais) + '</div>' +
        '<div class="row-main"><div class="row-title" style="display:flex;align-items:center;gap:6px;font-weight:800">' + nomeComSelo(p) + '</div>' +
        '<div class="row-sub">' + esc(p.resumo) + '</div><div class="row-sub loc-line">' + esc(onde) + '</div></div></div>' +
        '<div class="chips">' + reputacaoChip(p) +
          '<span class="chip">' + esc(x.pl.modelos.map(modeloRotulo).join(', ')) + '</span>' +
          (x.pl.aceitaMudar ? '<span class="chip blue">Aceita se mudar</span>' : '') + '</div>' +
        '<div class="btn-row"><a href="' + esc(perfilHref(x.id)) + '" class="btn btn-outline">Ver perfil</a></div></article>';
    }

    function paint() {
      var fl = lerFiltros();
      var n = nAtivos(fl);
      $('#acc-filtros-sum').textContent = n ? plural(n, 'filtro ativo', 'filtros ativos') : 'Nenhum filtro';
      var lista = ehEmpresa ? resultadosProfissionais(fl) : resultadosVagas(fl);
      $('#busca-count').textContent = ehEmpresa
        ? plural(lista.length, 'profissional encontrado', 'profissionais encontrados')
        : plural(lista.length, 'vaga encontrada', 'vagas encontradas');
      $('#busca-list').innerHTML = lista.length
        ? lista.map(function (x) { return ehEmpresa ? profBuscaCard(x) : vagaCard(x.v.id); }).join('')
        : '<div class="empty"><p class="row-title">Nenhum resultado com esses filtros.</p>' +
          '<p class="row-sub">Tente ampliar a distância ou limpar algum filtro.</p></div>';
    }

    $('#content').addEventListener('input', paint);
    $('#content').addEventListener('change', paint);
    $('#f-limpar').addEventListener('click', function () {
      $('#busca-texto').value = '';
      ['#f-dist', '#f-pais', '#f-estado', '#f-cidade', '#f-fuso'].forEach(function (sel) { $(sel).value = ''; });
      $all('#content input[type="checkbox"]').forEach(function (i) { i.checked = false; });
      paint();
    });
    paint();
  }

  /* ---------- Início ---------- */

  var page = document.body.getAttribute('data-page');
  var PAGES = {
    login: initLogin,
    empresa: renderEmpresa,
    'publicar-vaga': renderPublicar,
    candidatos: renderCandidatos,
    'perfil-profissional': renderPerfil,
    'preencher-vaga': renderPreencher,
    'avaliar-profissional': renderAvaliar,
    profissional: renderProfissional,
    vaga: renderVaga,
    candidaturas: renderCandidaturas,
    'perfil-empresa': renderPerfilEmpresa,
    'avaliar-empresa': renderAvaliarEmpresa,
    mensagens: renderMensagens,
    conversa: renderConversa,
    buscar: renderBusca
  };
  if (PAGES[page]) PAGES[page]();
})();
