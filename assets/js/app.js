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
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>'
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

  function E() { return window.MOCK.empresa; }
  function prof(id) { return window.MOCK.profissionais[id]; }
  function firstName(p) { return p.nome.split(' ')[0]; }
  function todasVagas(s) { return s.vagas.concat(E().vagas); }
  function vagaPorId(s, id) { return todasVagas(s).filter(function (v) { return v.id === id; })[0]; }
  function requisitosDe(v) { return v.requisitosTotal || E().requisitosPadrao; }
  function nota(n) { return parseFloat(String(n).replace(',', '.')); }
  function q(v) { return encodeURIComponent(v); }

  function candidatosDe(s, vagaId) {
    return (E().candidatos[vagaId] || []).map(function (c) {
      return { id: c.id, atende: c.atende, status: s.status[vagaId + ':' + c.id] || c.status };
    });
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
    var ids = s.preenchidas[v.id];
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

  function notFound(msg) {
    $('#content').innerHTML = '<div class="card"><h2 class="card-title">' + esc(msg) + '</h2>' +
      '<p class="row-sub">Volte para o início e tente de novo.</p>' +
      '<a href="empresa.html" class="btn btn-primary">Ir para o início</a></div>';
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
      // Cada entrada recomeça a demonstração da empresa.
      try { window.sessionStorage.removeItem(KEY); } catch (err) { /* ignora */ }
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
      if (p.id === 'preencher' && s.preenchidas[p.vaga]) {
        return rowStatic({ icone: 'clock', tom: 'amber', titulo: 'Aguardando confirmação de ' + nomesDe(s.preenchidas[p.vaga]),
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

      var pode = v.status !== 'Preenchida' && !s.preenchidas[v.id];
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
          var aguardando = (s.preenchidas[v.id] || []).indexOf(c.id) !== -1;
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

  function avaliacaoHtml(a) {
    var perguntas = E().avaliacao.perguntas;
    return '<article class="review"><div class="review-head">' + estrelas(a.nota) + '<span class="row-sub">' + esc(a.empresa) + ' · ' + esc(a.quando) + '</span></div>' +
      '<dl class="review-answers">' + perguntas.map(function (p) {
        return '<div><dt>' + esc(p.texto) + '</dt><dd>' + esc(a.respostas[p.id]) + '</dd></div>';
      }).join('') + '</dl>' +
      (a.comentario ? '<blockquote class="review-text">' + esc(a.comentario) + '</blockquote>' : '') +
      (a.resposta ? '<div class="review-reply"><strong>Resposta do profissional</strong><p>' + esc(a.resposta) + '</p></div>' : '') +
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
          p.avaliacoes.map(avaliacaoHtml).join(''))
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

    if (s.preenchidas[v.id]) return aguardando(s.preenchidas[v.id]);

    if (v.status === 'Preenchida') {
      $('#content').innerHTML = '<div class="card"><h2 class="card-title">Esta vaga já foi preenchida</h2>' +
        '<p class="row-sub">' + esc(v.detalhe || '') + '</p>' +
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

    if (s.avaliados[id]) return enviada();

    function enviada() {
      showDone({
        icone: 'check',
        titulo: 'Avaliação enviada',
        texto: 'Sua avaliação fica oculta por enquanto. Ela será publicada quando ' + esc(firstName(p)) + ' enviar a própria avaliação ou, no máximo, quando o prazo terminar, em ' + esc(prazo) + '.',
        acoes: '<a href="empresa.html" class="btn btn-primary">Voltar ao início</a>'
      });
    }

    $('#content').innerHTML =
      '<form id="rate-form" class="form" novalidate>' +
      '<p class="note note-box">' + icon('eye', 16, { stroke: 2 }) + '<span><strong>Avaliação cega:</strong> ' + esc(firstName(p)) + ' só verá sua avaliação quando enviar a própria avaliação, ou quando o prazo terminar em ' + esc(prazo) + '.</span></p>' +
      '<div class="media center"><div class="avatar lg" style="background:' + esc(p.cor) + '">' + esc(p.iniciais) + '</div>' +
        '<div class="row-main"><div class="row-title" style="font-weight:800">' + nomeComSelo(p) + '</div>' +
        '<div class="row-sub">' + esc(pend.vaga ? 'Vaga: ' + pend.vaga : p.resumo) + '</div></div></div>' +

      A.perguntas.map(function (pg) {
        return group('q-' + pg.id, pg.texto, pills('q-' + pg.id, A.respostas.map(function (r) { return { id: r, rotulo: r }; })), { req: true });
      }).join('') +

      group('nota', 'Nota geral',
        '<div class="stars">' + [1, 2, 3, 4, 5].map(function (n) {
          return '<label class="star"><input type="radio" name="nota" value="' + n + '" class="pill-input"><span class="star-ico">' + icon('star', 34, { stroke: 1.6 }) + '</span>' +
            '<span class="visually-hidden">' + n + (n === 1 ? ' estrela' : ' estrelas') + '</span></label>';
        }).join('') + '</div><p class="field-hint" id="nota-txt" aria-live="polite">Escolha de 1 a 5 estrelas.</p>', { req: true }) +

      field('comentario', 'Comentário (opcional)', 'textarea', 'rows="4" maxlength="' + A.limiteComentario + '"', '',
        { hint: 'Fale só do trabalho realizado. Não inclua dados pessoais (telefone, endereço, documentos) nem ofensas.' }) +
      '<p class="counter" id="contador">0 / ' + A.limiteComentario + '</p>' +

      '<p class="form-status" id="form-status" role="alert"></p>' +
      '<div class="btn-row form-actions"><button type="submit" class="btn btn-primary">Enviar avaliação</button>' +
        '<a href="empresa.html" class="btn btn-outline">Cancelar</a></div>' +
      '<div class="visually-hidden" role="status" id="live"></div></form>';

    var form = $('#rate-form');

    $('#comentario').addEventListener('input', function () {
      $('#contador').textContent = this.value.length + ' / ' + A.limiteComentario;
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
      var regras = A.perguntas.map(function (pg) {
        return { id: 'q-' + pg.id, ok: !!marcado('q-' + pg.id), msg: 'Responda: ' + pg.texto };
      });
      regras.push({ id: 'nota', ok: !!marcado('nota'), msg: 'Escolha a nota geral, de 1 a 5 estrelas.' });
      var ok = check(regras);
      $('#form-status').textContent = ok ? '' : 'Responda todas as perguntas e escolha a nota.';
      if (!ok) return;

      var st = load();
      var respostas = {};
      A.perguntas.forEach(function (pg) { respostas[pg.id] = marcado('q-' + pg.id); });
      st.avaliados[id] = { nota: Number(marcado('nota')), respostas: respostas, comentario: $('#comentario').value.trim() };
      save(st);
      enviada();
    });
  }

  /* ---------- Profissional ---------- */

  function renderProfissional() {
    var d = window.MOCK.profissional;
    var rep = d.reputacao;

    $('#topbar').innerHTML =
      brandMark() +
      '<div class="brand-name" style="flex-grow:1">KORbuild <span>Match</span></div>' +
      bell(2) +
      '<a href="index.html" class="avatar blue" aria-label="Minha conta (sair)">' + esc(d.iniciais) + '</a>';

    var vagas = d.vagasIndicadas.map(function (v, i) {
      var chipReq = v.empresaNova || v.requisitos.indexOf('3') === 0 ? 'grey' : 'green';
      var repEmpresa = v.empresaNova
        ? '<div><span class="chip blue">Empresa nova · reputação em construção</span></div>'
        : '<div class="row-sub" style="display:flex;align-items:center;gap:6px;font-weight:600;color:var(--ink)"><span style="color:var(--amber)">' +
            icon('star', 16, { fill: 'currentColor', stroke: 1.5 }) + '</span>Empresa ' + esc(v.notaEmpresa) + ' · ' + v.contratacoesEmpresa + ' contratações verificadas</div>';
      var extra = v.pagouConforme
        ? '<div class="row-sub" style="color:var(--green);font-weight:600">' + esc(v.pagouConforme) + ' pagou conforme combinado</div>'
        : (v.falta ? '<div class="row-sub">Falta: ' + esc(v.falta) + '</div>' : '');
      return '<a href="#" class="card" style="text-decoration:none;color:inherit" data-todo="' + TODO + '">' +
        '<div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start">' +
          '<div class="row-main"><div class="row-title" style="font-size:16px;font-weight:800">' + esc(v.titulo) + '</div>' +
          '<div class="row-sub">' + esc(v.empresa) + ' · ' + esc(v.modelo) + ' · ' + esc(v.tipo) + '</div></div>' +
          '<span class="chip ' + chipReq + '">' + esc(v.requisitos) + '</span></div>' +
        repEmpresa + extra + '</a>';
    }).join('');

    $('#content').innerHTML =
      '<div class="stack"><div class="greeting"><h1>Olá, ' + esc(d.nome) + '</h1>' +
        '<p>Você tem 2 pendências e vagas novas indicadas.</p></div>' +
        '<a href="#" class="row-link" style="min-height:52px;border-color:var(--line-strong);color:var(--muted);font-size:15px" data-todo="' + TODO + '">' +
          '<span style="color:var(--ink)">' + icon('search', 20, { stroke: 2 }) + '</span>Buscar vagas, cargos ou empresas</a></div>' +

      '<section class="section" aria-labelledby="h-pend"><h2 id="h-pend">Precisa da sua atenção</h2>' +
        '<div class="card card-highlight" id="confirm-card" aria-live="polite">' + confirmPending(d.confirmacao) + '</div>' +
        rowLink({ icone: 'star', tom: 'amber', titulo: 'Avalie a ' + d.avaliacao.empresa, texto: 'Prazo termina em ' + d.avaliacao.prazo + '. Sua avaliação fica oculta até a empresa enviar a dela.' }) +
      '</section>' +

      accordion('acc-rep', 'Minha reputação', 'Nota ' + rep.nota + ' · ' + plural(rep.trabalhos, 'trabalho', 'trabalhos'),
        '<div class="rep-grid">' + repStat(rep.nota, 'Nota geral') + repStat(rep.trabalhos, 'Trabalhos verificados') + repStat(rep.contratariamDeNovo, 'Contratariam de novo') + '</div>' +
        accMore('Ver perfil'), true) +

      accordion('acc-vagas', 'Vagas indicadas para você', plural(d.vagasIndicadas.length, 'vaga indicada', 'vagas indicadas'),
        '<p class="note">' + icon('check', 16, { stroke: 2.4 }) + '<span>Combinam com o seu perfil e são de empresas com reputação no mesmo nível da sua.</span></p>' +
        vagas + accMore('Ver todas'));

    // Simulação do fluxo de confirmação de contratação
    $('#confirm-card').addEventListener('click', function (e) {
      var b = e.target.closest('[data-confirm]');
      if (!b) return;
      var ok = b.getAttribute('data-confirm') === 'sim';
      this.innerHTML = '<div class="media"><div class="icon-tile ' + (ok ? 'blue' : '') + '">' + icon('check', 22, { stroke: 2 }) + '</div>' +
        '<div class="row-main"><div class="row-title">' + (ok ? 'Contratação confirmada' : 'Resposta enviada') + '</div>' +
        '<div class="row-sub">' + (ok
          ? 'O trabalho na ' + esc(d.confirmacao.empresa) + ' entrou no seu histórico verificado. A avaliação fica disponível ao fim do vínculo.'
          : 'A ' + esc(d.confirmacao.empresa) + ' foi avisada de que você não foi contratado para esta vaga.') + '</div></div></div>';
    });

    $('#nav').innerHTML = nav([
      { id: 'inicio', label: 'Início', icon: 'home', href: 'profissional.html' },
      { id: 'buscar', label: 'Buscar', icon: 'search' },
      { id: 'candidaturas', label: 'Candidaturas', icon: 'clipboard' },
      { id: 'mensagens', label: 'Mensagens', icon: 'message' },
      { id: 'perfil', label: 'Perfil', icon: 'user' }
    ], 'inicio');
  }

  function confirmPending(c) {
    return '<div class="media"><div class="icon-tile blue">' + icon('check', 22, { stroke: 2 }) + '</div>' +
      '<div class="row-main"><div class="row-title">Confirme sua contratação</div>' +
      '<div class="row-sub">A ' + esc(c.empresa) + ' indicou você como contratado para ' + esc(c.vaga) + '. Ao confirmar, o trabalho entra no seu histórico verificado.</div></div></div>' +
      '<div class="btn-row"><button type="button" class="btn btn-primary" data-confirm="sim">Confirmar</button>' +
      '<button type="button" class="btn btn-outline" data-confirm="nao">Não fui contratado</button></div>';
  }

  /* ---------- Início ---------- */

  var page = document.body.getAttribute('data-page');
  var PAGES = {
    login: initLogin,
    empresa: renderEmpresa,
    profissional: renderProfissional,
    'publicar-vaga': renderPublicar,
    candidatos: renderCandidatos,
    'perfil-profissional': renderPerfil,
    'preencher-vaga': renderPreencher,
    'avaliar-profissional': renderAvaliar
  };
  if (PAGES[page]) PAGES[page]();
})();
