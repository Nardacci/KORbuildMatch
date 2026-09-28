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
    down: '<path d="M6 9l6 6 6-6"/>'
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
    return '<a href="#" class="row-link" data-todo="' + TODO + '">' +
      '<div class="' + tile + '">' + icon(p.icone) + '</div>' +
      '<div class="row-main"><div class="row-title">' + esc(p.titulo) + '</div>' +
      '<div class="row-sub">' + esc(p.texto) + '</div></div>' +
      '<span class="chevron">' + icon('chevron', 20, { stroke: 2 }) + '</span></a>';
  }

  function nav(items, current) {
    return items.map(function (it) {
      var active = it.id === current;
      return '<a href="' + (active ? it.href : '#') + '"' +
        (active ? ' aria-current="page"' : ' data-todo="' + TODO + '"') + '>' +
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
      window.location.href = role === 'empresa' ? 'empresa.html' : 'profissional.html';
    });

    update();
  }

  /* ---------- Empresa ---------- */

  function renderEmpresa() {
    var d = window.MOCK.empresa;
    var abertas = d.vagas.filter(function (v) { return d.indicados[v.id]; });
    var selecionada = abertas.length ? abertas[0].id : null;

    $('#topbar').innerHTML =
      brandMark() +
      '<button type="button" class="row-main" data-todo="' + TODO + '" style="border:0;background:transparent;padding:0;text-align:left;color:inherit;min-height:44px;flex-direction:row;align-items:center;gap:6px;cursor:pointer">' +
        '<span style="display:flex;flex-direction:column"><span style="font-size:11px;font-weight:600;color:var(--muted-2)">Empresa</span>' +
        '<span style="font-size:15px;font-weight:800">' + esc(d.nome) + '</span></span>' +
        '<span class="chevron">' + icon('down', 16, { stroke: 2 }) + '</span></button>' +
      bell(3) +
      '<a href="index.html" class="avatar" aria-label="Conta da empresa (sair)">' + esc(d.iniciais) + '</a>';

    var pend = d.pendencias.map(function (p) {
      if (p.destaque) {
        return '<div class="card card-highlight"><div class="media">' +
          '<div class="icon-tile blue">' + icon('check', 22, { stroke: 2 }) + '</div>' +
          '<div class="row-main"><div class="row-title">' + esc(p.titulo) + '</div>' +
          '<div class="row-sub">' + esc(p.texto) + '</div></div></div>' +
          '<a href="#" class="btn btn-primary" data-todo="' + TODO + '">' + esc(p.acao) + '</a></div>';
      }
      return rowLink(p);
    }).join('');

    var rep = d.reputacao;
    var vagas = d.vagas.map(function (v) {
      return '<div class="list-item"><div class="row-main"><div class="row-title">' + esc(v.titulo) + '</div>' +
        '<div class="row-sub">' + esc(v.detalhe) + '</div></div>' +
        '<span class="chip ' + (STATUS_CHIP[v.status] || 'grey') + '">' + esc(v.status) + '</span></div>';
    }).join('');

    var nAbertas = d.vagas.filter(function (v) { return v.status === 'Aberta'; }).length;

    function indSummary() {
      var v = d.vagas.filter(function (x) { return x.id === selecionada; })[0];
      return v ? d.indicados[v.id].length + ' para ' + v.titulo : 'Nenhum profissional indicado';
    }

    $('#content').innerHTML =
      '<div class="greeting-row"><div class="greeting"><h1>Bom dia, ' + esc(d.nome) + '</h1>' +
        '<p>' + d.pendencias.length + ' itens precisam da sua atenção hoje.</p></div>' +
        '<a href="#" class="btn btn-primary" data-todo="' + TODO + '">' + icon('plus', 16, { stroke: 2.2 }) + 'Publicar nova vaga</a></div>' +

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

      accordion('acc-vagas', 'Minhas vagas', plural(d.vagas.length, 'vaga', 'vagas') + ' · ' + plural(nAbertas, 'aberta', 'abertas'),
        '<div class="list">' + vagas + '</div>' + accMore('Ver todas'));

    function renderIndicados() {
      $('#acc-ind-sum').textContent = indSummary();
      $('#ind-filter').innerHTML = abertas.map(function (v) {
        var n = d.indicados[v.id].length;
        return '<button type="button" data-vaga="' + esc(v.id) + '" aria-pressed="' + (v.id === selecionada) + '">' + esc(v.titulo) + ' · ' + n + '</button>';
      }).join('');

      $('#ind-list').innerHTML = (d.indicados[selecionada] || []).map(function (p) {
        var nome = esc(p.nome) + (p.verificado ? ' <span style="color:var(--green)">' + icon('check', 16, { stroke: 2.6, label: 'Perfil verificado' }) + '</span>' : '');
        var rep = p.novo
          ? '<span class="chip blue">Novo na plataforma · reputação em construção</span>'
          : '<span class="chip">Nota ' + esc(p.nota) + ' · ' + p.trabalhos + ' trabalhos verificados</span>';
        return '<article class="card' + (p.novo ? ' card-new' : '') + '">' +
          '<div class="media center"><div class="avatar lg" style="background:' + esc(p.cor) + '">' + esc(p.iniciais) + '</div>' +
          '<div class="row-main"><div class="row-title" style="display:flex;align-items:center;gap:6px;font-weight:800">' + nome + '</div>' +
          '<div class="row-sub">' + esc(p.resumo) + '</div></div></div>' +
          '<div class="chips"><span class="chip green">Atende ' + esc(p.requisitos) + '</span>' + rep + '</div>' +
          '<div class="btn-row"><a href="#" class="btn btn-primary" data-todo="Convite enviado para ' + esc(p.nome) + ' (simulação).">Convidar para a vaga</a>' +
          '<a href="#" class="btn btn-outline" data-todo="' + TODO + '">Ver perfil</a></div></article>';
      }).join('');
    }

    $('#content').addEventListener('click', function (e) {
      var b = e.target.closest('[data-vaga]');
      if (!b) return;
      selecionada = b.getAttribute('data-vaga');
      renderIndicados();
    });

    if (selecionada) renderIndicados();

    $('#nav').innerHTML = nav([
      { id: 'inicio', label: 'Início', icon: 'home', href: 'empresa.html' },
      { id: 'vagas', label: 'Vagas', icon: 'briefcase' },
      { id: 'candidatos', label: 'Candidatos', icon: 'users' },
      { id: 'mensagens', label: 'Mensagens', icon: 'message' },
      { id: 'empresa', label: 'Empresa', icon: 'building' }
    ], 'inicio');
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
  if (page === 'login') initLogin();
  if (page === 'empresa') renderEmpresa();
  if (page === 'profissional') renderProfissional();
})();
