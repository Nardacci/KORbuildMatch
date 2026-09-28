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
    minus: '<path d="M5 12h14"/>'
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

  /* ---------- Estado da jornada da empresa (sessionStorage) ---------- */

  var KEY = 'kor.empresa';

  function load() {
    var s = {};
    try { s = JSON.parse(window.sessionStorage.getItem(KEY)) || {}; } catch (e) { s = {}; }
    s.vagas = s.vagas || [];             // vagas publicadas na demonstração, a mais recente primeiro
    s.preenchidas = s.preenchidas || {}; // vagaId -> [ids de profissionais aguardando confirmação]
    s.status = s.status || {};           // "vagaId:profId" -> status do candidato
    s.convites = s.convites || {};       // "vagaId:profId" -> true
    s.avaliados = s.avaliados || {};     // profId -> avaliação enviada
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
    s.confirmacao = s.confirmacao || null; // 'sim' | 'nao' (contratação em Recepcionista, na Empresa Exemplo)
    return s;
  }

  function saveP(s) {
    try { window.sessionStorage.setItem(KEY_P, JSON.stringify(s)); } catch (e) { /* sem armazenamento: segue sem continuidade */ }
  }

  function E() { return window.MOCK.empresa; }
  function prof(id) { return window.MOCK.profissionais[id]; }
  function firstName(p) { return p.nome.split(' ')[0]; }
  function todasVagas(s) { return s.vagas.concat(E().vagas); }
  function vagaPorId(s, id) { return todasVagas(s).filter(function (v) { return v.id === id; })[0]; }
  function requisitosDe(v) { return v.requisitosTotal || E().requisitosPadrao; }
  function nota(n) { return parseFloat(String(n).replace(',', '.')); }
  function q(v) { return encodeURIComponent(v); }

  // A contratação que o João Silva confirma (jornada do profissional) é a mesma que a empresa marca.
  // Devolve 'sim' | 'nao' | null para a vaga da confirmação; null para as demais vagas.
  function confirmacaoDaVaga(vagaId) {
    return vagaId === window.MOCK.profissional.confirmacao.vagaId ? loadP().confirmacao : null;
  }

  function candidatosDe(s, vagaId) {
    var conf = confirmacaoDaVaga(vagaId);
    return (E().candidatos[vagaId] || []).map(function (c) {
      var st = s.status[vagaId + ':' + c.id] || c.status;
      if (conf && c.id === window.MOCK.profissional.id) st = conf === 'sim' ? 'contratado' : 'nao';
      return { id: c.id, atende: c.atende, status: st };
    });
  }

  // Pessoas marcadas como contratadas, aguardando confirmação (se o profissional recusou, sai da lista).
  function preench(s, vagaId) {
    var ids = s.preenchidas[vagaId];
    if (ids && confirmacaoDaVaga(vagaId) === 'nao') ids = ids.filter(function (id) { return id !== window.MOCK.profissional.id; });
    return ids && ids.length ? ids : null;
  }

  function indicadosDe(s, v) {
    return E().indicados[v.id] || (v.publicada ? E().indicadosPadrao : null);
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
    if (confirmacaoDaVaga(v.id) === 'sim' && v.status !== 'Preenchida') {
      return { status: 'Preenchida', chip: 'blue', detalhe: 'Preenchida por ' + prof(window.MOCK.profissional.id).nome + ' · confirmado' };
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
      { id: 'mensagens', label: 'Mensagens', icon: 'message' },
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

  // Cartão de profissional (indicados na tela inicial e candidatos).
  function profCard(id, atende, de, actions, extra) {
    var p = prof(id);
    return '<article class="card' + (p.novo ? ' card-new' : '') + '">' +
      '<div class="media center"><div class="avatar lg" style="background:' + esc(p.cor) + '">' + esc(p.iniciais) + '</div>' +
      '<div class="row-main"><div class="row-title" style="display:flex;align-items:center;gap:6px;font-weight:800">' + nomeComSelo(p) + '</div>' +
      '<div class="row-sub">' + esc(p.resumo) + '</div></div></div>' +
      '<div class="chips"><span class="chip green">Atende ' + atende + ' de ' + de + ' requisitos</span>' + reputacaoChip(p) + (extra || '') + '</div>' +
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

  function pills(name, items) {
    return '<div class="pills">' + items.map(function (it) {
      return '<label class="pill"><input type="radio" name="' + esc(name) + '" value="' + esc(it.id) + '" class="pill-input"><span>' + esc(it.rotulo) + '</span></label>';
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
      // Cada entrada recomeça a demonstração (empresa e profissional).
      try { window.sessionStorage.removeItem(KEY); window.sessionStorage.removeItem(KEY_P); } catch (err) { /* ignora */ }
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
      if (p.id === 'preencher' && confirmacaoDaVaga(p.vaga) === 'sim') {
        return rowStatic({ icone: 'check', tom: 'blue', titulo: 'Contratação de ' + prof(window.MOCK.profissional.id).nome + ' confirmada',
          texto: 'Vaga de ' + v.titulo + ' · o vínculo já conta no histórico e na reputação dos dois.' });
      }
      if (p.id === 'preencher' && preench(s, p.vaga)) {
        return rowStatic({ icone: 'clock', tom: 'amber', titulo: 'Aguardando confirmação de ' + nomesDe(preench(s, p.vaga)),
          texto: 'Vaga de ' + v.titulo + ' · o vínculo só conta depois que a pessoa confirmar.' });
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
      return v ? indicadosDe(s, v).length + ' para ' + v.titulo : 'Nenhum profissional indicado';
    }

    $('#content').innerHTML =
      '<div class="greeting-row"><div class="greeting"><h1>Bom dia, ' + esc(d.nome) + '</h1>' +
        '<p>' + (itens === 0 ? 'Nenhum item precisa da sua atenção hoje.' : (itens === 1 ? '1 item precisa' : itens + ' itens precisam') + ' da sua atenção hoje.') + '</p></div>' +
        '<a href="publicar-vaga.html" class="btn btn-primary">' + icon('plus', 16, { stroke: 2.2 }) + 'Publicar nova vaga</a></div>' +

      '<section class="section" aria-labelledby="h-pend"><h2 id="h-pend">Precisa da sua atenção</h2>' + pend + '</section>' +

      accordion('acc-ind', 'Profissionais indicados', indSummary(),
        '<div class="filter" role="group" aria-label="Escolha a vaga" id="ind-filter"></div>' +
        '<p class="note">' + icon('check', 16, { stroke: 2.4 }) + '<span>Atendem os requisitos da vaga e têm reputação no mesmo nível da sua empresa.</span></p>' +
        '<div class="section" id="ind-list" aria-live="polite"></div>' +
        accMore('Ver todos')) +

      accordion('acc-rep', 'Reputação da empresa', 'Nota ' + rep.nota + ' · ' + plural(rep.contratacoes, 'contratação', 'contratações'),
        (d.verificada ? '<span class="rep-badge">' + icon('check', 14, { stroke: 2.5 }) + 'Empresa verificada</span>' : '') +
        '<div class="rep-grid">' + repStat(rep.nota, 'Nota geral') + repStat(rep.contratacoes, 'Contratações verificadas') + repStat(rep.pagouConforme, 'Pagou conforme combinado') + '</div>' +
        '<p class="rep-foot">Conta só contratações confirmadas pelos dois lados.</p>', true) +

      accordion('acc-vagas', 'Minhas vagas', plural(vagas.length, 'vaga', 'vagas') + ' · ' + plural(nAbertas, 'aberta', 'abertas'),
        '<div class="list">' + vagasHtml + '</div>' + accMore('Ver todas'));

    function renderIndicados() {
      $('#acc-ind-sum').textContent = indSummary();

      $('#ind-filter').innerHTML = abertas.map(function (v) {
        var n = indicadosDe(s, v).length;
        return '<button type="button" data-vaga="' + esc(v.id) + '" aria-pressed="' + (v.id === selecionada) + '">' + esc(v.titulo) + ' · ' + n + '</button>';
      }).join('');

      var v = vagaPorId(s, selecionada);
      $('#ind-list').innerHTML = (indicadosDe(s, v) || []).map(function (i) {
        return profCard(i.id, i.atende, requisitosDe(v),
          '<div class="btn-row"><a href="#" class="btn btn-primary" data-todo="Convite enviado para ' + esc(prof(i.id).nome) + ' (simulação).">Convidar para a vaga</a>' +
          '<a href="' + esc(perfilHref(i.id, v.id)) + '" class="btn btn-outline">Ver perfil</a></div>');
      }).join('');
    }

    $('#content').addEventListener('click', function (e) {
      var b = e.target.closest('[data-vaga]');
      if (!b) return;
      selecionada = b.getAttribute('data-vaga');
      renderIndicados();
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

  function renderPublicar() {
    var f = E().formulario;
    var lista = { competencias: [], idiomas: [] };

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
        field('cidade', 'Cidade', 'input', 'type="text" maxlength="60" autocomplete="off" placeholder="Ex.: São Paulo"', '', { req: true }) +
      '</div>' +
      '<p id="loc-remoto" class="note" hidden>' + icon('check', 16, { stroke: 2.4 }) + '<span>Vaga remota: não é preciso informar país, estado nem cidade.</span></p>' +

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

    form.addEventListener('click', function (e) {
      var x = e.target.closest('.chip-x');
      if (!x) return;
      var kind = x.getAttribute('data-kind'), i = Number(x.getAttribute('data-i'));
      var removido = lista[kind].splice(i, 1)[0];
      renderChips(kind);
      say(removido + ' removido.');
      $(kind === 'competencias' ? '#competencias-in' : '#idioma-sel').focus();
    });

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

      var ok = check([
        { id: 'titulo', ok: val('titulo').length >= 3, msg: 'Informe o título da vaga (pelo menos 3 letras).' },
        { id: 'descricao', ok: val('descricao').length >= 20, msg: 'Descreva a vaga com pelo menos 20 caracteres.' },
        { id: 'modelo', ok: !!modelo(), msg: 'Escolha o modelo de trabalho.' },
        { id: 'pais', ok: remoto || !!val('pais'), msg: 'Selecione o país.' },
        { id: 'cidade', ok: remoto || !!val('cidade'), msg: 'Informe a cidade.' },
        { id: 'tipo', ok: !!val('tipo'), msg: 'Escolha o tipo de contratação.' },
        { id: 'salario', ok: salOk, msg: 'Confira a faixa salarial: o mínimo não pode ser maior que o máximo, e os valores não podem ser negativos.' },
        { id: 'posicoes', ok: n >= 1 && n <= 99 && Math.floor(n) === n, msg: 'Informe quantas posições a vaga tem (de 1 a 99).' }
      ]);
      $('#form-status').textContent = ok ? '' : 'Revise os campos destacados.';
      if (!ok) return;

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
          local: remoto ? 'Remoto' : [val('cidade'), val('estado'), val('pais')].filter(Boolean).join(', '),
          tipo: val('tipo'),
          salario: salarioTexto(val('moeda') || $('#moeda').value, $('#periodo').value, min, max),
          competencias: lista.competencias.slice(),
          idiomas: lista.idiomas.slice(),
          experiencia: val('experiencia')
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
      '<div><dt>Modelo</dt><dd>' + esc(modelo) + ' · ' + esc(d.tipo) + '</dd></div>' +
      '<div><dt>Salário</dt><dd>' + esc(d.salario) + '</dd></div>' +
      '<div><dt>Posições</dt><dd>' + v.posicoes + '</dd></div>' +
      '<div><dt>Experiência mínima</dt><dd>' + esc(d.experiencia) + '</dd></div>' +
      (d.competencias.length ? '<div><dt>Competências</dt><dd>' + esc(d.competencias.join(', ')) + '</dd></div>' : '') +
      (d.idiomas.length ? '<div><dt>Idiomas</dt><dd>' + esc(d.idiomas.join(', ')) + '</dd></div>' : '') +
      '</dl>';
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
            : (c.status === 'contratado' ? '<span class="chip blue">Contratado</span>' : '');
          var seletor = c.status === 'contratado' ? '' :
            '<label class="status-select"><span class="visually-hidden">Mudar status de ' + esc(p.nome) + '</span>' +
            '<select data-cand="' + esc(c.id) + '">' + E().statusCandidato.filter(function (st) { return st.manual !== false; }).map(function (st) {
              return '<option value="' + st.id + '"' + (st.id === c.status ? ' selected' : '') + '>' + esc(st.singular) + '</option>';
            }).join('') + '</select></label>';
          return profCard(c.id, c.atende, requisitosDe(v),
            '<div class="btn-row"><a href="' + esc(perfilHref(c.id, v.id)) + '" class="btn btn-primary">Ver perfil</a>' + seletor + '</div>', extra);
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
    var atende = null;
    if (vaga) {
      var achado = candidatosDe(s, vaga.id).concat(indicadosDe(s, vaga) || []).filter(function (c) { return c.id === id; })[0];
      if (achado) atende = achado.atende;
    }

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
        '<dl class="summary"><div><dt>Localização</dt><dd>' + esc(p.local) + '</dd></div><div><dt>Disponibilidade</dt><dd>' + esc(p.disponibilidade) + '</dd></div></dl>' +
        (atende !== null ? '<div class="chips"><span class="chip green">Atende ' + atende + ' de ' + requisitosDe(vaga) + ' requisitos · ' + esc(vaga.titulo) + '</span></div>' : '') +
        '<div class="btn-row"><button type="button" class="btn btn-primary" id="convidar"' + (s.convites[conviteKey] ? ' aria-disabled="true"' : '') + '>' +
          (s.convites[conviteKey] ? icon('check', 16, { stroke: 2.4 }) + 'Convite enviado' : 'Convidar para a vaga') + '</button>' +
        '<a href="#" class="btn btn-outline" data-todo="A conversa por mensagem ainda não faz parte do protótipo (simulação).">Enviar mensagem</a></div>' +
        (vaga ? '<p class="row-sub">Vaga do convite: ' + esc(vaga.titulo) + '</p>' : '') +
      '</section>' +

      '<section class="section"><h2>Reputação</h2>' + reputacao + '</section>' +

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
      showDone({
        icone: 'clock', tom: 'amber',
        titulo: 'Aguardando confirmação de ' + nomes,
        texto: 'Enviamos um pedido de confirmação. Só depois que ' + esc(ids.length > 1 ? 'as pessoas confirmarem' : firstName(prof(ids[0])) + ' confirmar') +
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

    var elegiveis = ordenar(candidatosDe(s, v.id).filter(function (c) { return c.status === 'analise' || c.status === 'entrevista'; }));
    var max = v.posicoes || 1;
    var tipo = max > 1 ? 'checkbox' : 'radio';

    if (!elegiveis.length) {
      $('#content').innerHTML = '<div class="empty"><p class="row-title">Ainda não há candidatos em análise ou entrevista.</p>' +
        '<p class="row-sub">Mova um candidato para “Em análise” ou “Entrevista” e volte aqui para indicar quem preencheu a vaga.</p>' +
        '<a href="candidatos.html?vaga=' + q(v.id) + '" class="btn btn-primary">Ver candidatos</a></div>';
      return;
    }

    $('#content').innerHTML =
      '<form id="fill-form" novalidate>' +
      '<div class="greeting"><h2 class="page-title">Quem preencheu a vaga de ' + esc(v.titulo) + '?</h2>' +
        '<p>' + (max > 1 ? 'Esta vaga tem ' + max + ' posições. Selecione até ' + max + ' pessoas.' : 'Selecione a pessoa contratada.') + '</p></div>' +
      '<p class="note note-box">' + icon('eye', 16, { stroke: 2 }) + '<span>A pessoa recebe um pedido de confirmação. Só depois de confirmar, o vínculo entra no histórico e na reputação dos dois lados.</span></p>' +
      '<fieldset class="field group" id="f-quem" aria-describedby="quem-err"><legend class="visually-hidden">Candidatos em análise ou entrevista</legend>' +
        elegiveis.map(function (c) {
          var p = prof(c.id);
          return '<label class="choice"><input type="' + tipo + '" name="quem" value="' + esc(c.id) + '" class="choice-input">' +
            '<span class="choice-body"><span class="avatar lg" style="background:' + esc(p.cor) + '">' + esc(p.iniciais) + '</span>' +
            '<span class="row-main"><span class="row-title" style="display:flex;align-items:center;gap:6px;font-weight:800">' + nomeComSelo(p) + '</span>' +
            '<span class="row-sub">' + esc(p.resumo) + '</span>' +
            '<span class="chips"><span class="chip">' + esc(statusLabel(c.status).singular) + '</span><span class="chip green">Atende ' + c.atende + ' de ' + requisitosDe(v) + '</span></span></span></span></label>';
        }).join('') +
        '<p class="field-error" id="quem-err" hidden></p></fieldset>' +
      '<div class="btn-row form-actions"><button type="submit" class="btn btn-primary">Enviar pedido de confirmação</button>' +
        '<a href="candidatos.html?vaga=' + q(v.id) + '" class="btn btn-outline">Cancelar</a></div>' +
      '</form>';

    $('#fill-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var marcados = Array.prototype.map.call(this.querySelectorAll('input[name="quem"]:checked'), function (i) { return i.value; });
      var msg = !marcados.length ? (max > 1 ? 'Selecione pelo menos uma pessoa.' : 'Selecione a pessoa contratada.')
        : (marcados.length > max ? 'A vaga tem ' + max + ' posições: selecione no máximo ' + max + ' pessoas.' : '');
      if (!check([{ id: 'quem', ok: !msg, msg: msg }])) return;
      var st = load();
      st.preenchidas[v.id] = marcados;
      save(st);
      aguardando(marcados);
    });
  }

  /* ---------- Avaliação cega (empresa avalia profissional e profissional avalia empresa) ---------- */

  // cfg: { aviso (html), cabecalho (html), perguntas, respostas, limite, cancelar (href) }
  function avaliacaoFormHtml(cfg) {
    return '<form id="rate-form" class="form" novalidate>' +
      '<p class="note note-box">' + icon('eye', 16, { stroke: 2 }) + '<span><strong>Avaliação cega:</strong> ' + cfg.aviso + '</span></p>' +
      cfg.cabecalho +

      cfg.perguntas.map(function (pg) {
        return group('q-' + pg.id, pg.texto, pills('q-' + pg.id, cfg.respostas.map(function (r) { return { id: r, rotulo: r }; })), { req: true });
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
      perguntas: A.perguntas, respostas: A.respostas, limite: A.limiteComentario, cancelar: 'empresa.html'
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
      { id: 'buscar', label: 'Buscar', icon: 'search' },
      { id: 'candidaturas', label: 'Candidaturas', icon: 'clipboard', href: 'candidaturas.html' },
      { id: 'mensagens', label: 'Mensagens', icon: 'message' },
      { id: 'perfil', label: 'Perfil', icon: 'user' }
    ], current);
  }

  function dataBR(iso) {
    var p = iso.split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }

  function hojeISO() {
    var d = new Date();
    function dois(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + dois(d.getMonth() + 1) + '-' + dois(d.getDate());
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
        '<div class="row-sub">' + empresaLink(v.empresa) + ' · ' + esc(v.modelo) + ' · ' + esc(v.tipo) + '</div></div>' +
        '<span class="chip ' + chipReq + '">' + c.atende + ' de ' + c.total + '</span></div>' +
      repEmpresa + extra + '</article>';
  }

  function confirmPending(c) {
    var e = empresaDe(c.empresa);
    return '<div class="media"><div class="icon-tile blue">' + icon('check', 22, { stroke: 2 }) + '</div>' +
      '<div class="row-main"><div class="row-title">Confirme sua contratação</div>' +
      '<div class="row-sub">' + esc(e.nome) + ' indicou você como contratado para ' + esc(c.vaga) + '. Ao confirmar, o trabalho entra no seu histórico verificado.</div></div></div>' +
      '<div class="btn-row"><button type="button" class="btn btn-primary" data-confirm="sim">Confirmar</button>' +
      '<button type="button" class="btn btn-outline" data-confirm="nao">Não fui contratado</button></div>';
  }

  function confirmDone(c, ok) {
    var e = empresaDe(c.empresa);
    return '<div class="media"><div class="icon-tile ' + (ok ? 'blue' : '') + '">' + icon('check', 22, { stroke: 2 }) + '</div>' +
      '<div class="row-main"><div class="row-title">' + (ok ? 'Contratação confirmada' : 'Resposta enviada') + '</div>' +
      '<div class="row-sub">' + (ok
        ? 'O trabalho na ' + esc(e.nome) + ' entrou no seu histórico verificado. A avaliação fica disponível ao fim do vínculo.'
        : esc(e.nome) + ' foi avisada de que você não foi contratado para esta vaga.') + '</div></div></div>' +
      (ok ? '<div class="btn-row"><a href="candidaturas.html" class="btn btn-outline">Ver em Minhas candidaturas</a></div>' : '');
  }

  function pendTexto(sp) {
    var n = (sp.confirmacao ? 0 : 1) + (sp.avaliados[PR().avaliacao.empresa] ? 0 : 1);
    return n === 0 ? 'Nenhuma pendência hoje. Veja as vagas indicadas.'
      : 'Você tem ' + plural(n, 'pendência', 'pendências') + ' e vagas novas indicadas.';
  }

  function renderProfissional() {
    var d = PR();
    var rep = d.reputacao;
    var sp = loadP();
    var av = d.avaliacao, avEmpresa = empresaDe(av.empresa);

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

    $('#content').innerHTML =
      '<div class="stack"><div class="greeting"><h1>Olá, ' + esc(d.nome) + '</h1>' +
        '<p id="pend-txt">' + esc(pendTexto(sp)) + '</p></div>' +
        '<a href="#" class="row-link" style="min-height:52px;border-color:var(--line-strong);color:var(--muted);font-size:15px" data-todo="' + TODO + '">' +
          '<span style="color:var(--ink)">' + icon('search', 20, { stroke: 2 }) + '</span>Buscar vagas, cargos ou empresas</a></div>' +

      '<section class="section" aria-labelledby="h-pend"><h2 id="h-pend">Precisa da sua atenção</h2>' +
        '<div class="card card-highlight" id="confirm-card" aria-live="polite">' +
          (sp.confirmacao ? confirmDone(d.confirmacao, sp.confirmacao === 'sim') : confirmPending(d.confirmacao)) + '</div>' +
        avaliar +
      '</section>' +

      accordion('acc-rep', 'Minha reputação', 'Nota ' + rep.nota + ' · ' + plural(rep.trabalhos, 'trabalho', 'trabalhos'),
        '<div class="rep-grid">' + repStat(rep.nota, 'Nota geral') + repStat(rep.trabalhos, 'Trabalhos verificados') + repStat(rep.contratariamDeNovo, 'Contratariam de novo') + '</div>' +
        accMore('Ver perfil'), true) +

      accordion('acc-vagas', 'Vagas indicadas para você', plural(d.vagasIndicadas.length, 'vaga indicada', 'vagas indicadas'),
        '<p class="note">' + icon('check', 16, { stroke: 2.4 }) + '<span>Combinam com o seu perfil e são de empresas com reputação no mesmo nível da sua.</span></p>' +
        d.vagasIndicadas.map(vagaCard).join('') + accMore('Ver todas'));

    // Confirmação de contratação: vale também para a jornada da empresa.
    $('#confirm-card').addEventListener('click', function (e) {
      var b = e.target.closest('[data-confirm]');
      if (!b) return;
      var ok = b.getAttribute('data-confirm') === 'sim';
      var st = loadP();
      st.confirmacao = ok ? 'sim' : 'nao';
      saveP(st);
      this.innerHTML = confirmDone(d.confirmacao, ok);
      $('#pend-txt').textContent = pendTexto(st);
    });

    // Vindo de outra tela, já abre a seção pedida.
    var aba = { vagas: 'acc-vagas', reputacao: 'acc-rep' }[params.get('aba')];
    if (aba) $('#' + aba + '-btn').click();

    $('#nav').innerHTML = profNav('inicio');
  }

  /* ---------- Profissional: detalhe da vaga ---------- */

  function renderVaga() {
    var v = vagaJob(params.get('id') || '');

    subTopbar('Detalhe da vaga', 'profissional.html');
    $('#nav').innerHTML = profNav('buscar');
    if (!v) return notFound('Não encontramos essa vaga.', 'profissional.html');

    var e = empresaDe(v.empresa), c = compat(v);
    var eu = prof(PR().id);

    function paint() {
      var sp = loadP();
      var ja = jaCandidatou(sp, v.id);
      var sal = v.salario ? salarioTexto(v.salario.moeda, v.salario.periodo, v.salario.min, v.salario.max) : 'A combinar';

      var reputacao = e.novo
        ? '<div class="card"><div class="chips"><span class="chip blue">Empresa nova · reputação em construção</span></div>' +
          '<p class="row-sub">A reputação aparece depois da primeira contratação confirmada pelos dois lados.</p>' +
          '<a href="perfil-empresa.html?id=' + q(e.id || v.empresa) + '" class="btn btn-outline">Ver perfil da empresa</a></div>'
        : '<div class="card rep-light"><div class="rep-grid rep-grid-2">' + repEmpresaStats(e) + '</div>' +
          '<a href="perfil-empresa.html?id=' + q(v.empresa) + '" class="btn btn-outline">Ver perfil da empresa</a></div>';

      var descricao = v.descricao.length > 240
        ? accordion('acc-desc', 'Descrição da vaga', 'Toque para ler a descrição completa', '<p class="prose">' + esc(v.descricao) + '</p>')
        : '<section class="section"><h2>Descrição</h2><p class="prose">' + esc(v.descricao) + '</p></section>';

      $('#content').innerHTML =
        '<section class="card"><h2 class="page-title vaga-h">' + esc(v.titulo) + '</h2>' +
          '<div class="row-sub">' + empresaLink(v.empresa) + '</div>' +
          '<div class="chips"><span class="chip">' + esc(v.modelo) + '</span><span class="chip">' + esc(v.tipo) + '</span></div>' +
          '<dl class="summary"><div><dt>Local</dt><dd>' + esc(v.local) + '</dd></div>' +
            '<div><dt>Salário</dt><dd>' + esc(sal) + '</dd></div>' +
            '<div><dt>Posições</dt><dd>' + v.posicoes + '</dd></div>' +
            '<div><dt>Publicada em</dt><dd>' + dataBR(v.publicadaEm) + '</dd></div></dl>' +
          (ja
            ? '<a href="candidaturas.html" class="btn btn-outline">' + icon('check', 16, { stroke: 2.4 }) + 'Candidatura enviada · ver status</a>'
            : '<button type="button" class="btn btn-primary" id="candidatar">Candidatar-se</button>') +
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
    }

    // Passo único de confirmação, com o resumo do que será enviado.
    function resumo() {
      var p = prof(PR().id);
      $('#content').innerHTML =
        '<div class="greeting"><h2 class="page-title">Confirmar candidatura</h2>' +
          '<p>Você está se candidatando a ' + esc(v.titulo) + ' em ' + esc(e.nome) + '. Vamos usar o perfil que você já preencheu.</p></div>' +
        '<section class="card"><h2 class="card-title">O que será enviado</h2>' +
          '<dl class="summary"><div><dt>Nome</dt><dd>' + esc(p.nome) + '</dd></div>' +
            '<div><dt>Resumo</dt><dd>' + esc(p.resumo) + '</dd></div>' +
            '<div><dt>Reputação</dt><dd>Nota ' + esc(p.nota) + ' · ' + p.trabalhos + ' trabalhos verificados</dd></div>' +
            '<div><dt>Localização</dt><dd>' + esc(p.local) + '</dd></div>' +
            '<div><dt>Competências</dt><dd>' + esc(p.competencias.join(', ')) + '</dd></div>' +
            '<div><dt>Idiomas</dt><dd>' + esc(p.idiomas.join(', ')) + '</dd></div>' +
            '<div><dt>Compatibilidade</dt><dd>Atende ' + c.atende + ' de ' + c.total + ' requisitos</dd></div></dl></section>' +
        '<div class="btn-row form-actions"><button type="button" class="btn btn-primary" id="enviar">Enviar candidatura</button>' +
          '<button type="button" class="btn btn-outline" id="voltar-vaga">Voltar</button></div>';
      window.scrollTo(0, 0);

      $('#voltar-vaga').addEventListener('click', function () { paint(); window.scrollTo(0, 0); });
      $('#enviar').addEventListener('click', function () {
        var sp = loadP();
        sp.candidaturas[v.id] = { data: hojeISO(), status: 'enviada' };
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

  var GRUPO = { enviada: 'andamento', visualizada: 'andamento', analise: 'andamento', entrevista: 'andamento', contratado: 'contratado', nao: 'encerradas' };
  var GRUPOS = [
    { id: 'andamento', rotulo: 'Em andamento' },
    { id: 'contratado', rotulo: 'Contratado' },
    { id: 'encerradas', rotulo: 'Encerradas' }
  ];

  function etapaRotulo(id) {
    return PR().etapas.filter(function (e) { return e.id === id; })[0].rotulo;
  }

  // Candidaturas feitas na demonstração (mais recente primeiro) e as anteriores, já com o status atual.
  function candidaturasDe(sp) {
    var novas = Object.keys(sp.candidaturas).reverse().map(function (vid) {
      var v = vagaJob(vid);
      return { id: vid, vaga: vid, titulo: v.titulo, empresa: v.empresa, data: sp.candidaturas[vid].data, status: sp.candidaturas[vid].status };
    });
    var antigas = PR().candidaturas.map(function (c) {
      var r = {};
      Object.keys(c).forEach(function (k) { r[k] = c[k]; });
      if (c.confirmar && sp.confirmacao === 'nao') { r.status = 'nao'; r.alcancou = 'entrevista'; }
      return r;
    });
    return novas.concat(antigas);
  }

  function timelineHtml(c) {
    var ord = ['enviada', 'visualizada', 'analise', 'entrevista'];
    var ids, atual;
    if (c.status === 'nao') { ids = ord.slice(0, ord.indexOf(c.alcancou) + 1).concat('nao'); atual = ids.length - 1; }
    else if (c.status === 'contratado') { ids = ord.concat('contratado'); atual = ids.length - 1; }
    else { ids = ord.concat('contratado'); atual = ord.indexOf(c.status); }
    var estado = { done: ' (concluída)', current: ' (etapa atual)', todo: ' (pendente)' };
    return '<ol class="timeline" style="--n:' + ids.length + '" aria-label="Andamento da candidatura">' + ids.map(function (id, i) {
      var st = i < atual ? 'done' : (i === atual ? 'current' : 'todo');
      return '<li class="tl-' + st + (id === 'nao' ? ' tl-nao' : '') + '"' + (i === atual ? ' aria-current="step"' : '') + '>' +
        '<span class="tl-dot" aria-hidden="true"></span>' +
        '<span class="tl-label">' + esc(etapaRotulo(id)) + '<span class="visually-hidden">' + estado[st] + '</span></span></li>';
    }).join('') + '</ol>';
  }

  function candidaturaCard(sp, c) {
    var pendente = c.confirmar && !sp.confirmacao;
    var chip, texto;
    if (c.status === 'contratado') {
      texto = pendente ? 'Contratado · aguardando sua confirmação' : 'Contratado · confirmado';
      chip = pendente ? 'amber' : 'green';
    } else {
      texto = etapaRotulo(c.status);
      chip = c.status === 'nao' ? 'grey' : 'blue';
    }

    var acoes = '';
    if (c.confirmar && c.status === 'contratado') {
      acoes = pendente
        ? '<div class="btn-row"><button type="button" class="btn btn-primary" data-conf="sim">Confirmar contratação</button>' +
          '<button type="button" class="btn btn-outline" data-conf="nao">Não fui contratado</button></div>'
        : '<p class="row-sub">Contratação confirmada. A avaliação da empresa fica disponível ao fim do vínculo.</p>';
    } else if (c.avaliar) {
      acoes = sp.avaliados[c.empresa]
        ? '<p class="row-sub">Avaliação enviada · será publicada quando a empresa enviar a dela ou quando o prazo terminar.</p>'
        : '<div class="btn-row"><a href="avaliar-empresa.html?id=' + q(c.empresa) + '" class="btn btn-primary">Avaliar empresa</a></div>';
    }

    var titulo = c.vaga && vagaJob(c.vaga)
      ? '<a href="vaga.html?id=' + q(c.vaga) + '" class="inline-link title-link">' + esc(c.titulo) + '</a>' : esc(c.titulo);

    return '<article class="card">' +
      '<div class="head-row"><div class="row-main"><h3 class="row-title vaga-title">' + titulo + '</h3>' +
        '<div class="row-sub">' + empresaLink(c.empresa) + ' · enviada em ' + dataBR(c.data) + '</div></div>' +
        '<span class="chip ' + chip + '">' + esc(texto) + '</span></div>' +
      timelineHtml(c) + acoes + '</article>';
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
    }

    $('#cand-filter').addEventListener('click', function (e) {
      var b = e.target.closest('[data-grupo]');
      if (!b) return;
      filtro = b.getAttribute('data-grupo');
      paint();
    });

    $('#cand-list').addEventListener('click', function (e) {
      var b = e.target.closest('[data-conf]');
      if (!b) return;
      var ok = b.getAttribute('data-conf') === 'sim';
      var sp = loadP();
      sp.confirmacao = ok ? 'sim' : 'nao';
      saveP(sp);
      filtro = ok ? 'contratado' : 'encerradas';
      paint();
      say(ok ? 'Contratação confirmada.' : 'Resposta enviada. A candidatura foi encerrada.');
      $('#cand-list').focus();
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
      perguntas: A.perguntas, respostas: A.respostas, limite: A.limiteComentario, cancelar: 'profissional.html'
    };

    $('#content').innerHTML = avaliacaoFormHtml(cfg);
    bindAvaliacao(cfg, function (r) {
      var st = loadP();
      st.avaliados[id] = r;
      saveP(st);
      enviada();
    });
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
    'avaliar-empresa': renderAvaliarEmpresa
  };
  if (PAGES[page]) PAGES[page]();
})();
