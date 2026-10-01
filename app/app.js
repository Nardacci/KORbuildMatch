/* KORbuild Match — versão real (beta), ligada ao Supabase.
 * Etapa 2: contas. Cadastro com confirmação de e-mail, entrar, sair, recuperar senha e perfis.
 * O protótipo com dados fictícios continua na raiz do site. */
(function () {
  'use strict';

  var CFG = window.KOR_CONFIG || {};
  var D = window.KOR_DADOS;
  var configurado = !!(CFG.url && CFG.chave && !/SEU-PROJETO/.test(CFG.url) && window.supabase);
  var sb = configurado ? window.supabase.createClient(CFG.url, CFG.chave, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  }) : null;

  /* ---------- Peças comuns ---------- */

  var ICONS = {
    logo: '<path d="M4 12l8-7 8 7v8H4z"/><path d="M9 15l2 2 4-4"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.2-6 8-6s7 2 8 6"/>',
    building: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1"/>',
    back: '<path d="M15 6l-6 6 6 6"/>',
    chevron: '<path d="M9 6l6 6-6 6"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    home: '<path d="M3 10.5L12 3l9 7.5V21h-6v-6H9v6H3z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14.8c2 .7 3.2 2.5 3.6 5.2"/>',
    clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6"/>',
    message: '<path d="M4 5h16v11H9l-5 4z"/>',
    star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>'
  };

  function icon(name, size, opts) {
    opts = opts || {};
    return '<svg width="' + (size || 22) + '" height="' + (size || 22) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' +
      (opts.stroke || 1.8) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + '</svg>';
  }

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  var params = new URLSearchParams(window.location.search);

  // Erro que o Supabase devolve no endereço (ex.: link de confirmação vencido).
  var hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  var erroNoLink = hashParams.get('error_code') || hashParams.get('error');

  var toastTimer;
  function toast(msg) {
    var el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 3200);
  }

  function urlDe(pagina) { return new URL(pagina, window.location.href).href.split('#')[0]; }
  function ir(pagina) { window.location.href = pagina; }

  function brand() {
    return '<div class="brand"><div class="brand-mark lg">' + icon('logo', 22, { stroke: 2.2 }) + '</div>' +
      '<div class="brand-name" style="font-size:18px">KORbuild <span>Match</span></div></div>';
  }

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

  function options(list, placeholder, selecionado) {
    return (placeholder != null ? '<option value="">' + esc(placeholder) + '</option>' : '') + list.map(function (it) {
      var v = typeof it === 'object' ? it.id : it, l = typeof it === 'object' ? it.rotulo : it;
      return '<option value="' + esc(v) + '"' + (String(v) === String(selecionado) ? ' selected' : '') + '>' + esc(l) + '</option>';
    }).join('');
  }

  function pills(name, items, selecionado, tipo) {
    return '<div class="pills">' + items.map(function (it) {
      var marcado = tipo === 'checkbox' ? (selecionado || []).indexOf(it.id) !== -1 : String(it.id) === String(selecionado);
      return '<label class="pill"><input type="' + (tipo || 'radio') + '" name="' + esc(name) + '" value="' + esc(it.id) + '" class="pill-input"' +
        (marcado ? ' checked' : '') + '><span>' + esc(it.rotulo) + '</span></label>';
    }).join('') + '</div>';
  }

  function marcados(name) { return $all('input[name="' + name + '"]:checked').map(function (i) { return i.value; }); }

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

  function limparErro(e) {
    var box = e.target.closest && e.target.closest('.field.invalid');
    if (!box) return;
    box.classList.remove('invalid');
    var err = box.querySelector('.field-error');
    if (err) { err.hidden = true; err.textContent = ''; }
    var ctl = box.querySelector('[data-ctl]');
    if (ctl) ctl.removeAttribute('aria-invalid');
    if (!document.querySelector('.field.invalid')) status('');
  }
  document.addEventListener('input', limparErro);
  document.addEventListener('change', limparErro);

  function status(msg) { var el = $('#form-status'); if (el) el.textContent = msg || ''; }

  // Botão ocupado enquanto espera o Supabase (evita envio duplicado).
  function ocupado(btn, sim, texto) {
    if (!btn) return;
    if (sim) { btn.dataset.txt = btn.textContent; btn.textContent = texto || 'Aguarde…'; btn.setAttribute('aria-disabled', 'true'); btn.disabled = true; }
    else { btn.textContent = btn.dataset.txt || btn.textContent; btn.removeAttribute('aria-disabled'); btn.disabled = false; }
  }

  var EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Mensagens do Supabase Auth em português.
  function traduzErro(err) {
    if (!err) return '';
    var code = err.code || err.error_code || '';
    var msg = (err.message || '').toLowerCase();
    if (code === 'invalid_credentials' || /invalid login credentials/.test(msg)) return 'E-mail ou senha incorretos.';
    if (code === 'email_not_confirmed' || /email not confirmed/.test(msg)) return 'Confirme seu e-mail antes de entrar. Procure o link que enviamos (veja também spam e promoções).';
    if (code === 'user_already_exists' || /already registered/.test(msg)) return 'Já existe uma conta com este e-mail. Entre ou recupere a senha.';
    if (code === 'weak_password' || /password should/.test(msg)) return 'Senha fraca. Use pelo menos 8 caracteres, misturando letras e números.';
    if (code === 'same_password' || /different from the old/.test(msg)) return 'A nova senha precisa ser diferente da atual.';
    if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || /rate limit|security purposes/.test(msg)) return 'Muitas tentativas em pouco tempo. Espere alguns minutos e tente de novo.';
    if (code === 'otp_expired' || /expired/.test(msg)) return 'Este link venceu ou já foi usado. Peça um novo.';
    if (code === 'email_address_invalid' || /invalid format|email address .* is invalid/.test(msg)) return 'Este e-mail não é aceito. Confira se está correto.';
    if (code === 'signup_disabled') return 'O cadastro está fechado no momento.';
    if (/failed to fetch|network|load failed/.test(msg)) return 'Sem conexão com o servidor. Confira sua internet e tente de novo.';
    if (code === '23514' || /violates check constraint/.test(msg)) return 'Algum campo está num formato que não aceitamos. Confira os dados.';
    return 'Não deu certo agora. Tente de novo em instantes.';
  }

  /* ---------- País e cidade ---------- */

  var nomesRegiao = null;
  try { nomesRegiao = new Intl.DisplayNames(['pt-BR'], { type: 'region' }); } catch (e) { /* navegador antigo: mostra o código */ }
  // Contas da primeira versão guardavam o nome do país; hoje é o código ISO (BR, US...).
  var NOMES_ANTIGOS = { 'Brasil': 'BR', 'Portugal': 'PT', 'Estados Unidos': 'US', 'Canadá': 'CA', 'Reino Unido': 'GB', 'Alemanha': 'DE', 'Espanha': 'ES', 'Argentina': 'AR', 'México': 'MX' };
  function codigoPais(v) { if (!v) return ''; return v.length === 2 ? v.toUpperCase() : (NOMES_ANTIGOS[v] || ''); }
  function paisNome(cod) {
    if (!cod) return '';
    try { return (nomesRegiao && nomesRegiao.of(cod)) || cod; } catch (e) { return cod; }
  }
  function paisPadrao() {
    var langs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
    for (var i = 0; i < langs.length; i++) {
      var m = /^[a-z]{2,3}[-_]([A-Za-z]{2})(?![A-Za-z])/i.exec(langs[i] || '');
      if (m && D.paises.indexOf(m[1].toUpperCase()) !== -1) return m[1].toUpperCase();
    }
    return 'BR';
  }
  function opcoesPaises(sel) {
    function op(c) { return '<option value="' + c + '"' + (c === sel ? ' selected' : '') + '>' + esc(paisNome(c)) + '</option>'; }
    var dest = D.paisesDestaque.filter(function (c) { return D.paises.indexOf(c) !== -1; });
    var resto = D.paises.filter(function (c) { return dest.indexOf(c) === -1; })
      .sort(function (a, b) { return paisNome(a).localeCompare(paisNome(b), 'pt-BR'); });
    return '<option value="">Selecione</option><optgroup label="Mais usados">' + dest.map(op).join('') + '</optgroup>' +
      '<optgroup label="Todos os países">' + resto.map(op).join('') + '</optgroup>';
  }
  function usaMilhas(pais) { return D.paisesMilhas.indexOf(pais) !== -1; }
  function opcoesDistancia(pais, sel) {
    return D.distancias.map(function (km) {
      var rot = usaMilhas(pais) ? 'Até ' + Math.round(km * 0.621371) + ' mi (' + km + ' km)' : 'Até ' + km + ' km';
      return '<option value="' + km + '"' + (km === sel ? ' selected' : '') + '>' + rot + '</option>';
    }).join('');
  }

  function normalizar(t) { return String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim(); }

  // Um arquivo por país (app/cidades/BR.json...), baixado só quando o país é escolhido.
  var cacheCidades = {};
  function carregarCidades(pais) {
    if (!cacheCidades[pais]) {
      cacheCidades[pais] = fetch('cidades/' + pais + '.json').then(function (r) {
        if (!r.ok) throw new Error('cidades ' + r.status);
        return r.json();
      }).then(function (d) {
        d.n = d.c.map(function (c) { return normalizar(c[0]); });
        d.en = d.e.map(function (e) { return normalizar(e[0]) + '|' + normalizar(e[1]); });
        return d;
      }).catch(function (err) { delete cacheCidades[pais]; throw err; });
    }
    return cacheCidades[pais];
  }

  // "laconia", "laconia, nh", "sao paulo": começa com o texto primeiro (mais populosas antes), depois palavras do meio.
  function buscarCidades(dados, pais, texto, limite) {
    var partes = normalizar(texto).split(',');
    var nome = partes[0].trim(), est = (partes[1] || '').trim();
    if (nome.length < 2) return [];
    var exatas = [], inicio = [], meio = [];
    for (var i = 0; i < dados.n.length; i++) {
      var n = dados.n[i];
      if (est && dados.en[dados.c[i][1]].split('|').every(function (x) { return x.indexOf(est) !== 0; })) continue;
      if (n === nome) exatas.push(i);
      else if (n.indexOf(nome) === 0) inicio.push(i);
      else if (n.indexOf(' ' + nome) !== -1 || n.indexOf('-' + nome) !== -1) meio.push(i);
    }
    return exatas.concat(inicio, meio).slice(0, limite).map(function (i) {
      var c = dados.c[i], e = dados.e[c[1]];
      return { cidade: c[0], estado: e[1] || e[0] || null, estadoNome: e[0] || '', pais: pais, lat: c[2], lng: c[3] };
    });
  }

  function rotuloCidade(c) { return c ? c.cidade + (c.estado ? ', ' + c.estado : '') : ''; }

  // Campo de cidade com sugestões (combobox acessível). Só vale cidade escolhida na lista.
  function campoCidade(id, label, o) {
    o = o || {};
    return '<div class="field" id="f-' + id + '"><label for="' + id + '">' + esc(label) + (o.req ? REQ : '') + '</label>' +
      '<div class="combo"><input id="' + id + '" data-ctl type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="' + id + '-lista"' +
        ' autocomplete="off" spellcheck="false" placeholder="Digite o nome da cidade" aria-describedby="' + id + '-hint ' + id + '-err"' + (o.req ? ' aria-required="true"' : '') + '>' +
        '<ul class="combo-lista" id="' + id + '-lista" role="listbox" aria-label="Cidades encontradas" hidden></ul></div>' +
      '<p class="field-hint" id="' + id + '-hint">' + esc(o.hint || 'Escolha na lista. Não achou? Escolha a cidade mais próxima.') + '</p>' +
      '<p class="field-error" id="' + id + '-err" hidden></p>' +
      '<p class="visually-hidden" role="status" id="' + id + '-status"></p></div>';
  }

  function ligarCidade(id, paisDe, inicial) {
    var input = $('#' + id), lista = $('#' + id + '-lista'), aviso = $('#' + id + '-status');
    var escolhida = null, itens = [], ativo = -1, timer = null, timerFechar = null, pedido = 0;

    function fechar() { lista.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); ativo = -1; }
    function marcar(i) {
      ativo = i;
      $all('#' + id + '-lista [role="option"]').forEach(function (li, k) { li.setAttribute('aria-selected', String(k === i)); });
      if (i >= 0) { input.setAttribute('aria-activedescendant', id + '-op-' + i); var el = $('#' + id + '-op-' + i); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' }); }
    }
    function escolher(i) {
      escolhida = itens[i];
      input.value = rotuloCidade(escolhida);
      fechar();
      aviso.textContent = 'Cidade escolhida: ' + rotuloCidade(escolhida) + '.';
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    function mostrar(msg) {
      lista.innerHTML = msg
        ? '<li class="combo-vazio" role="presentation">' + esc(msg) + '</li>'
        : itens.map(function (c, k) {
          return '<li role="option" id="' + id + '-op-' + k + '" aria-selected="false" data-k="' + k + '"><strong>' + esc(c.cidade) + '</strong>' +
            '<span>' + esc([c.estadoNome, paisNome(c.pais)].filter(Boolean).join(' · ')) + '</span></li>';
        }).join('');
      lista.hidden = false;
      input.setAttribute('aria-expanded', String(!msg));
      ativo = -1;
    }
    function procurar() {
      var pais = paisDe(), texto = input.value;
      if (normalizar(texto).length < 2) { fechar(); return; }
      if (!pais) { itens = []; mostrar('Escolha o país primeiro.'); return; }
      var meu = ++pedido;
      carregarCidades(pais).then(function (dados) {
        if (meu !== pedido) return;
        itens = buscarCidades(dados, pais, texto, 8);
        if (!itens.length) mostrar('Nenhuma cidade encontrada. Confira o nome ou escolha a cidade mais próxima.');
        else { mostrar(); aviso.textContent = itens.length + (itens.length === 1 ? ' cidade encontrada' : ' cidades encontradas') + '. Use as setas para escolher.'; }
      }).catch(function () {
        if (meu === pedido) { itens = []; mostrar('Não foi possível carregar as cidades. Confira sua internet.'); }
      });
    }

    input.addEventListener('input', function () {
      clearTimeout(timerFechar);
      escolhida = null;
      clearTimeout(timer);
      timer = setTimeout(procurar, 120);
    });
    input.addEventListener('keydown', function (e) {
      var aberta = !lista.hidden && itens.length;
      if (e.key === 'ArrowDown') { e.preventDefault(); if (!aberta) { procurar(); return; } marcar(Math.min(ativo + 1, itens.length - 1)); }
      else if (e.key === 'ArrowUp') { if (aberta) { e.preventDefault(); marcar(Math.max(ativo - 1, 0)); } }
      else if (e.key === 'Enter') { if (aberta && ativo >= 0) { e.preventDefault(); escolher(ativo); } else if (aberta && itens.length === 1) { e.preventDefault(); escolher(0); } }
      else if (e.key === 'Escape') { if (!lista.hidden) { e.preventDefault(); fechar(); } }
    });
    // mousedown (e não click) para escolher antes de o campo perder o foco.
    lista.addEventListener('mousedown', function (e) {
      var li = e.target.closest('[role="option"]');
      e.preventDefault();
      if (li) escolher(Number(li.getAttribute('data-k')));
    });
    input.addEventListener('blur', function () { timerFechar = setTimeout(fechar, 150); });
    input.addEventListener('focus', function () { clearTimeout(timerFechar); });

    function definir(c) { escolhida = c && c.cidade ? c : null; input.value = rotuloCidade(escolhida); }
    definir(inicial);
    return {
      valor: function () { return escolhida; },
      limpar: function () { definir(null); fechar(); },
      definir: definir
    };
  }

  function semConfig() {
    var alvo = $('#content') || $('#login');
    alvo.innerHTML = '<div class="login-card"><h1 class="page-title">Conexão pendente</h1>' +
      '<p class="row-sub">Falta informar o endereço do projeto Supabase em <code>app/config.js</code>.</p>' +
      '<a class="btn btn-outline" href="../demo.html">Ver a demonstração</a></div>';
  }

  /* ---------- Sessão ---------- */

  function sessaoAtual() {
    return sb.auth.getSession().then(function (r) { return r.data.session; });
  }

  // Páginas internas: sem sessão, vai para "Entrar" e volta depois.
  function exigirSessao() {
    return sessaoAtual().then(function (s) {
      if (!s) {
        var volta = window.location.pathname.split('/').pop() || 'inicio.html';
        ir('entrar.html?volta=' + encodeURIComponent(volta + window.location.search) + (erroNoLink ? '&link=vencido' : ''));
        return null;
      }
      return s;
    });
  }

  // Carrega o perfil da conta e a linha de empresa ou profissional.
  function carregarConta(s) {
    var uid = s.user.id;
    return sb.from('perfis').select('*').eq('id', uid).maybeSingle().then(function (r) {
      if (r.error) throw r.error;
      var perfil = r.data;
      if (!perfil) return { perfil: null, user: s.user };
      var q = perfil.tipo === 'empresa'
        ? sb.from('empresas').select('*').eq('dono', uid).maybeSingle()
        : sb.from('profissionais').select('*').eq('id', uid).maybeSingle();
      return Promise.all([q, sb.from('contatos').select('*').eq('user_id', uid).maybeSingle()]).then(function (rs) {
        if (rs[0].error) throw rs[0].error;
        return { perfil: perfil, user: s.user, dados: rs[0].data, contato: rs[1].data };
      });
    });
  }

  // Primeiro acesso: o que foi digitado no cadastro (guardado com a conta) completa o perfil.
  function completarDoCadastro(conta) {
    var m = conta.user.user_metadata || {};
    var d = conta.dados;
    if (!d || m.completado) return Promise.resolve(conta);
    var patch = {};
    if (conta.perfil.tipo === 'empresa') {
      if (!d.setor && m.setor) patch.setor = m.setor;
      if (!d.pais && m.pais) patch.pais = m.pais;
    } else {
      if (!d.resumo && m.resumo) patch.resumo = m.resumo;
      var c = m.local;
      if (!d.cidade && c && c.cidade) { patch.cidade = c.cidade; patch.estado = c.estado || null; patch.pais = c.pais; patch.lat = c.lat; patch.lng = c.lng; }
    }
    if (!Object.keys(patch).length) return Promise.resolve(conta);
    var tabela = conta.perfil.tipo === 'empresa' ? 'empresas' : 'profissionais';
    var chave = conta.perfil.tipo === 'empresa' ? 'dono' : 'id';
    return sb.from(tabela).update(patch).eq(chave, conta.user.id).select().maybeSingle().then(function (r) {
      if (!r.error && r.data) conta.dados = r.data;
      sb.auth.updateUser({ data: { completado: true } });
      return conta;
    });
  }

  function sair() {
    return sb.auth.signOut().then(function () { ir('entrar.html?saiu=1'); });
  }

  /* ---------- Topo e navegação das telas internas ---------- */

  var PROXIMA = 'Chega na próxima etapa da versão beta.';

  function iniciais(nome) {
    var p = String(nome || '').trim().split(/\s+/).filter(Boolean);
    return ((p[0] || '?')[0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
  }

  // Início: marca, nome e o avatar que leva ao perfil (como no protótipo).
  function topoInicio(conta) {
    var empresa = conta.perfil.tipo === 'empresa';
    $('#topbar').innerHTML = '<div class="brand-mark">' + icon('logo', 20, { stroke: 2.2 }) + '</div>' +
      '<div class="brand-name" style="flex-grow:1">KORbuild <span>Match</span></div>' +
      '<a href="perfil.html" class="avatar ' + (empresa ? 'avatar-empresa' : 'blue') + '" aria-label="' + (empresa ? 'Minha empresa' : 'Meu perfil') + '">' +
        esc(iniciais(conta.dados && conta.dados.nome)) + '</a>';
  }

  function topo(titulo, voltar) {
    $('#topbar').innerHTML = '<a href="' + esc(voltar) + '" class="icon-btn" aria-label="Voltar">' + icon('back', 22, { stroke: 2 }) + '</a>' +
      '<h1 class="topbar-title">' + esc(titulo) + '</h1>';
  }

  // Mesma navegação do protótipo; o que ainda não existe na beta avisa que chega na próxima etapa.
  function navBeta(tipo, atual) {
    var itens = tipo === 'empresa'
      ? [{ id: 'inicio', label: 'Início', icon: 'home', href: 'inicio.html' }, { id: 'vagas', label: 'Vagas', icon: 'briefcase' },
        { id: 'candidatos', label: 'Candidatos', icon: 'users' }, { id: 'mensagens', label: 'Mensagens', icon: 'message' },
        { id: 'perfil', label: 'Empresa', icon: 'building', href: 'perfil.html' }]
      : [{ id: 'inicio', label: 'Início', icon: 'home', href: 'inicio.html' }, { id: 'buscar', label: 'Buscar', icon: 'search' },
        { id: 'candidaturas', label: 'Candidaturas', icon: 'clipboard' }, { id: 'mensagens', label: 'Mensagens', icon: 'message' },
        { id: 'perfil', label: 'Perfil', icon: 'user', href: 'perfil.html' }];
    $('#nav').innerHTML = itens.map(function (it) {
      var ativo = it.id === atual;
      return '<a href="' + (it.href || '#') + '"' + (ativo ? ' aria-current="page"' : '') + (it.href ? '' : ' data-proxima') + '>' +
        icon(it.icon, 24, { stroke: ativo ? 2 : 1.8 }) + esc(it.label) + '</a>';
    }).join('');
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-proxima]');
    if (!a) return;
    e.preventDefault();
    toast(PROXIMA);
  });

  /* ---------- Entrar ---------- */

  function renderEntrar() {
    var root = $('#login');
    var aviso = '';
    if (params.get('saiu')) aviso = 'Você saiu da sua conta.';
    if (params.get('senha')) aviso = 'Senha alterada. Entre com a nova senha.';
    if (params.get('link') || erroNoLink) aviso = 'O link venceu ou já foi usado. Entre com e-mail e senha, ou peça um novo link.';

    root.innerHTML =
      '<div class="login-top">' + brand() + '<a href="cadastro.html" class="lang-btn" style="display:inline-flex;align-items:center;text-decoration:none">Criar conta</a></div>' +
      '<div class="hero"><h1>Entrar</h1><p>Empresas e profissionais, conectados com confiança.</p></div>' +
      '<form class="login-card form" id="entrar-form" novalidate>' +
        (aviso ? '<p class="note note-box" id="aviso">' + icon('check', 16, { stroke: 2.4 }) + '<span>' + esc(aviso) + '</span></p>' : '') +
        field('ent-email', 'E-mail', 'input', 'type="email" autocomplete="email" inputmode="email"', '', { req: true }) +
        field('ent-senha', 'Senha', 'input', 'type="password" autocomplete="current-password"', '', { req: true }) +
        '<p class="form-status" id="form-status" role="alert"></p>' +
        '<div id="reenviar-area"></div>' +
        '<button type="submit" class="btn btn-primary btn-lg" id="entrar-btn">Entrar</button>' +
        '<a href="recuperar.html" class="btn btn-outline btn-quiet">Esqueci minha senha</a>' +
      '</form>' +
      '<p class="login-foot">Ainda não tem conta? <a href="cadastro.html">Criar conta grátis</a></p>';

    // Já entrou: segue direto.
    sessaoAtual().then(function (s) { if (s && !params.get('saiu')) ir(params.get('volta') || 'inicio.html'); });

    $('#entrar-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var email = $('#ent-email').value.trim();
      var ok = check([
        { id: 'ent-email', ok: EMAIL_OK.test(email), msg: 'Informe um e-mail válido.' },
        { id: 'ent-senha', ok: $('#ent-senha').value.length > 0, msg: 'Informe a senha.' }
      ]);
      if (!ok) return;
      var btn = $('#entrar-btn');
      ocupado(btn, true, 'Entrando…');
      status('');
      $('#reenviar-area').innerHTML = '';
      sb.auth.signInWithPassword({ email: email, password: $('#ent-senha').value }).then(function (r) {
        if (r.error) {
          ocupado(btn, false);
          status(traduzErro(r.error));
          if ((r.error.code || '') === 'email_not_confirmed' || /not confirmed/i.test(r.error.message || '')) {
            $('#reenviar-area').innerHTML = '<button type="button" class="btn btn-outline" id="reenviar">Reenviar e-mail de confirmação</button>';
            $('#reenviar').addEventListener('click', function () {
              var b = this;
              ocupado(b, true, 'Enviando…');
              reenviarConfirmacao(email).then(function (err) {
                ocupado(b, false);
                status(err ? traduzErro(err) : 'Enviamos um novo link para ' + email + '.');
              });
            });
          }
          return;
        }
        ir(params.get('volta') || 'inicio.html');
      });
    });
  }

  function reenviarConfirmacao(email) {
    return sb.auth.resend({ type: 'signup', email: email, options: { emailRedirectTo: urlDe('inicio.html') } })
      .then(function (r) { return r.error; });
  }

  /* ---------- Cadastro ---------- */

  function renderCadastro() {
    var root = $('#login');
    var role = params.get('como') === 'empresa' ? 'empresa' : 'profissional';
    var dados = {};
    var timer = null;

    function paint() {
      var ehEmpresa = role === 'empresa';
      root.innerHTML =
        '<div class="login-top">' + brand() + '<a href="entrar.html" class="lang-btn" style="display:inline-flex;align-items:center;text-decoration:none">Entrar</a></div>' +
        '<div class="hero"><h1>Criar conta grátis</h1>' +
          '<p>' + (ehEmpresa ? 'Sua empresa ganha 3 meses do plano Essencial, contados a partir da primeira vaga publicada. O cartão só é pedido no fim.'
            : 'O profissional nunca paga. Seu histórico verificado acompanha você em cada nova oportunidade.') + '</p></div>' +
        '<form class="login-card form" id="cad-form" novalidate>' +
          '<div class="field"><span class="field-label" id="cad-role-label">Criar conta como</span>' +
            '<div class="segmented" role="group" aria-labelledby="cad-role-label">' +
              '<button type="button" data-cad-role="profissional" aria-pressed="' + !ehEmpresa + '">Profissional</button>' +
              '<button type="button" data-cad-role="empresa" aria-pressed="' + ehEmpresa + '">Empresa</button></div></div>' +
          (ehEmpresa
            ? field('cad-nome', 'Nome da empresa', 'input', 'type="text" maxlength="120" autocomplete="organization"', '', { req: true }) +
              field('cad-email', 'E-mail da empresa', 'input', 'type="email" autocomplete="email" inputmode="email" placeholder="voce@suaempresa.com"', '', { req: true, hint: 'Com o domínio da empresa, a verificação fica mais rápida.' }) +
              field('cad-pais', 'País da empresa', 'select', '', opcoesPaises(dados['cad-pais'] || paisPadrao()), { req: true }) +
              field('cad-setor', 'Setor', 'input', 'type="text" maxlength="60" placeholder="Ex.: Varejo"', '', { req: true })
            : field('cad-nome', 'Nome completo', 'input', 'type="text" maxlength="120" autocomplete="name"', '', { req: true }) +
              field('cad-email', 'E-mail', 'input', 'type="email" autocomplete="email" inputmode="email" placeholder="voce@email.com"', '', { req: true }) +
              field('cad-pais', 'País onde mora', 'select', '', opcoesPaises(dados['cad-pais'] || paisPadrao()), { req: true }) +
              campoCidade('cad-cidade', 'Cidade onde mora', { req: true, hint: 'Só a cidade aparece para as empresas, nunca o endereço. Não achou? Escolha a mais próxima.' }) +
              field('cad-titulo', 'O que você faz (opcional)', 'input', 'type="text" maxlength="60" placeholder="Ex.: Recepcionista"', '')) +
          field('cad-senha', 'Senha', 'input', 'type="password" autocomplete="new-password" minlength="8"', '', { req: true, hint: 'Pelo menos 8 caracteres.' }) +
          '<div class="field" id="f-cad-termos"><label class="check-row"><input type="checkbox" id="cad-termos" data-ctl aria-describedby="cad-termos-err">' +
            '<span>Li e aceito os Termos de uso e a Política de privacidade.</span></label>' +
            '<p class="field-error" id="cad-termos-err" hidden></p></div>' +
          '<p class="note">' + icon('check', 16, { stroke: 2.4 }) + '<span>Pedimos só o necessário: nada de idade, gênero, documentos pessoais ou foto no cadastro.</span></p>' +
          '<p class="form-status" id="form-status" role="alert"></p>' +
          '<button type="submit" class="btn btn-primary btn-lg" id="cad-btn">Criar conta</button>' +
        '</form>' +
        '<p class="login-foot">Já tem conta? <a href="entrar.html">Entrar</a></p>';

      $all('[data-cad-role]').forEach(function (b) {
        b.addEventListener('click', function () { role = b.getAttribute('data-cad-role'); dados = {}; paint(); });
      });
      ['cad-nome', 'cad-email', 'cad-setor', 'cad-titulo'].forEach(function (id) {
        if ($('#' + id) && dados[id] != null) $('#' + id).value = dados[id];
      });
      var cidadeCad = ehEmpresa ? null : ligarCidade('cad-cidade', function () { return $('#cad-pais').value; }, dados.local);
      $('#cad-pais').addEventListener('change', function () { if (cidadeCad) cidadeCad.limpar(); });
      if (dados.focoEmail) { $('#cad-email').focus(); $('#cad-email').select(); }

      $('#cad-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var email = $('#cad-email').value.trim().toLowerCase();
        var regras = [
          { id: 'cad-nome', ok: $('#cad-nome').value.trim().length >= 2, msg: ehEmpresa ? 'Informe o nome da empresa.' : 'Informe seu nome.' },
          { id: 'cad-email', ok: EMAIL_OK.test(email), msg: 'Informe um e-mail válido.' }
        ];
        regras.push({ id: 'cad-pais', ok: !!$('#cad-pais').value, msg: 'Selecione o país.' });
        if (ehEmpresa) {
          regras.push({ id: 'cad-setor', ok: $('#cad-setor').value.trim().length >= 2, msg: 'Informe o setor.' });
        } else {
          regras.push({ id: 'cad-cidade', ok: !!cidadeCad.valor(), msg: $('#cad-cidade').value.trim() ? 'Escolha a cidade na lista de sugestões.' : 'Informe a cidade onde você mora.' });
        }
        regras.push({ id: 'cad-senha', ok: $('#cad-senha').value.length >= 8, msg: 'A senha precisa ter pelo menos 8 caracteres.' });
        regras.push({ id: 'cad-termos', ok: $('#cad-termos').checked, msg: 'Para criar a conta, aceite os Termos e a Política de privacidade.' });
        var ok = check(regras);
        status(ok ? '' : 'Revise os campos destacados.');
        if (!ok) return;
        ['cad-nome', 'cad-email', 'cad-pais', 'cad-setor', 'cad-titulo'].forEach(function (id) { if ($('#' + id)) dados[id] = $('#' + id).value; });
        if (cidadeCad) dados.local = cidadeCad.valor();

        var nome = $('#cad-nome').value.trim();
        var meta = { tipo: role, nome: nome };
        meta.pais = $('#cad-pais').value;
        if (ehEmpresa) meta.setor = $('#cad-setor').value.trim();
        else {
          var l = cidadeCad.valor();
          meta.local = { cidade: l.cidade, estado: l.estado, pais: l.pais, lat: l.lat, lng: l.lng };
          meta.resumo = $('#cad-titulo').value.trim();
        }

        var btn = $('#cad-btn');
        ocupado(btn, true, 'Criando conta…');
        sb.auth.signUp({ email: email, password: $('#cad-senha').value, options: { data: meta, emailRedirectTo: urlDe('inicio.html') } })
          .then(function (r) {
            ocupado(btn, false);
            if (r.error) { status(traduzErro(r.error)); return; }
            if (r.data.session) { ir('inicio.html'); return; }  // projeto sem confirmação de e-mail
            confirmarEmail(nome, email);
          });
      });
    }

    function confirmarEmail(nome, email) {
      root.innerHTML =
        '<div class="login-top">' + brand() + '</div>' +
        '<div class="login-card email-card"><div class="icon-tile lg blue">' + icon('mail', 30, { stroke: 2 }) + '</div>' +
          '<h1 class="page-title" id="email-titulo" tabindex="-1">Confirme seu e-mail</h1>' +
          '<p class="row-sub">Enviamos um link de confirmação para <strong id="email-destino">' + esc(email) + '</strong>. Abra o e-mail e toque no link para ativar a conta.</p>' +
          '<ul class="check-list"><li>' + icon('check', 16, { stroke: 2.6 }) + '<span>Não chegou em alguns minutos? Confira as pastas de spam e promoções.</span></li>' +
            '<li>' + icon('check', 16, { stroke: 2.6 }) + '<span>Pode abrir o link no celular ou no computador. Depois, é só entrar com seu e-mail e senha.</span></li></ul>' +
          '<div class="btn-row"><button type="button" class="btn btn-outline" id="email-reenviar"></button>' +
            '<button type="button" class="btn btn-outline" id="email-corrigir">Corrigir o e-mail</button></div>' +
          '<p class="row-sub" id="email-status" role="status" aria-live="polite"></p>' +
          '<a href="entrar.html" class="btn btn-primary">Já confirmei, entrar</a></div>';
      $('#email-titulo').focus();

      function contagem(seg) {
        var b = $('#email-reenviar');
        clearInterval(timer);
        function tick() {
          if (!b.isConnected) { clearInterval(timer); return; }
          if (seg <= 0) { clearInterval(timer); b.textContent = 'Reenviar e-mail'; b.removeAttribute('aria-disabled'); return; }
          b.textContent = 'Reenviar em ' + seg + ' s'; b.setAttribute('aria-disabled', 'true'); seg--;
        }
        tick();
        timer = setInterval(tick, 1000);
      }
      contagem(60);

      $('#email-reenviar').addEventListener('click', function () {
        if (this.getAttribute('aria-disabled') === 'true') return;
        var b = this;
        b.setAttribute('aria-disabled', 'true');
        reenviarConfirmacao(email).then(function (err) {
          $('#email-status').textContent = err ? traduzErro(err) : 'Enviamos um novo link para ' + email + '.';
          contagem(60);
        });
      });
      $('#email-corrigir').addEventListener('click', function () {
        clearInterval(timer);
        dados.focoEmail = true;
        paint();
        dados.focoEmail = false;
      });
    }

    paint();
  }

  /* ---------- Recuperar senha ---------- */

  function renderRecuperar() {
    var root = $('#login');
    root.innerHTML =
      '<div class="login-top">' + brand() + '<a href="entrar.html" class="lang-btn" style="display:inline-flex;align-items:center;text-decoration:none">Entrar</a></div>' +
      '<div class="hero"><h1>Recuperar a senha</h1><p>Enviamos um link para você criar uma nova senha.</p></div>' +
      '<form class="login-card form" id="rec-form" novalidate>' +
        field('rec-email', 'E-mail da conta', 'input', 'type="email" autocomplete="email" inputmode="email"', '', { req: true }) +
        '<p class="form-status" id="form-status" role="alert"></p>' +
        '<button type="submit" class="btn btn-primary btn-lg" id="rec-btn">Enviar link</button>' +
      '</form>' +
      '<p class="login-foot"><a href="entrar.html">Voltar para entrar</a></p>';

    $('#rec-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var email = $('#rec-email').value.trim();
      if (!check([{ id: 'rec-email', ok: EMAIL_OK.test(email), msg: 'Informe um e-mail válido.' }])) return;
      var btn = $('#rec-btn');
      ocupado(btn, true, 'Enviando…');
      sb.auth.resetPasswordForEmail(email, { redirectTo: urlDe('nova-senha.html') }).then(function (r) {
        ocupado(btn, false);
        if (r.error && !/not found/i.test(r.error.message || '')) { status(traduzErro(r.error)); return; }
        // Mesma resposta exista ou não a conta (não revela quem está cadastrado).
        $('#rec-form').innerHTML =
          '<div class="icon-tile lg blue">' + icon('mail', 30, { stroke: 2 }) + '</div>' +
          '<h2 class="page-title" id="rec-ok" tabindex="-1">Confira seu e-mail</h2>' +
          '<p class="row-sub">Se existir uma conta com <strong>' + esc(email) + '</strong>, o link para criar uma nova senha chega em alguns minutos. Veja também spam e promoções.</p>';
        $('#rec-ok').focus();
      });
    });
  }

  /* ---------- Nova senha (chega pelo link do e-mail) ---------- */

  function renderNovaSenha() {
    var root = $('#login');
    function form() {
      root.innerHTML =
        '<div class="login-top">' + brand() + '</div>' +
        '<div class="hero"><h1>Criar nova senha</h1></div>' +
        '<form class="login-card form" id="ns-form" novalidate>' +
          field('ns-senha', 'Nova senha', 'input', 'type="password" autocomplete="new-password" minlength="8"', '', { req: true, hint: 'Pelo menos 8 caracteres.' }) +
          field('ns-senha2', 'Repita a nova senha', 'input', 'type="password" autocomplete="new-password"', '', { req: true }) +
          '<p class="form-status" id="form-status" role="alert"></p>' +
          '<button type="submit" class="btn btn-primary btn-lg" id="ns-btn">Salvar nova senha</button>' +
        '</form>';
      $('#ns-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var s1 = $('#ns-senha').value, s2 = $('#ns-senha2').value;
        if (!check([
          { id: 'ns-senha', ok: s1.length >= 8, msg: 'A senha precisa ter pelo menos 8 caracteres.' },
          { id: 'ns-senha2', ok: s1 === s2, msg: 'As senhas não são iguais.' }
        ])) return;
        var btn = $('#ns-btn');
        ocupado(btn, true, 'Salvando…');
        sb.auth.updateUser({ password: s1 }).then(function (r) {
          if (r.error) { ocupado(btn, false); status(traduzErro(r.error)); return; }
          sb.auth.signOut().then(function () { ir('entrar.html?senha=1'); });
        });
      });
    }
    function vencido() {
      root.innerHTML =
        '<div class="login-top">' + brand() + '</div>' +
        '<div class="login-card"><h1 class="page-title" id="ns-vencido">Link vencido</h1>' +
          '<p class="row-sub">Este link para criar uma nova senha venceu ou já foi usado. Peça outro; ele vale por 1 hora.</p>' +
          '<a href="recuperar.html" class="btn btn-primary">Pedir novo link</a></div>';
    }
    if (erroNoLink) { vencido(); return; }
    var pronto = false;
    sb.auth.onAuthStateChange(function (ev, s) {
      if (!pronto && s && (ev === 'PASSWORD_RECOVERY' || ev === 'SIGNED_IN' || ev === 'INITIAL_SESSION')) { pronto = true; form(); }
    });
    sessaoAtual().then(function (s) {
      if (s && !pronto) { pronto = true; form(); }
      else if (!s) setTimeout(function () { if (!pronto) vencido(); }, 1500);
    });
  }

  /* ---------- Início ---------- */

  function camposPerfil(conta) {
    var d = conta.dados || {}, c = conta.contato || {};
    if (conta.perfil.tipo === 'empresa') {
      return [
        { ok: !!d.setor, txt: 'Setor' },
        { ok: !!(d.cidade && d.lat != null), txt: 'Cidade da sede' },
        { ok: !!d.porte, txt: 'Porte' },
        { ok: !!(d.descricao && d.descricao.length >= 30), txt: 'Sobre a empresa' },
        { ok: !!(c.telefone || c.canal === 'email'), txt: 'Contato para os candidatos' }
      ];
    }
    return [
      { ok: !!(d.cidade && d.lat != null), txt: 'Cidade onde mora' },
      { ok: !!d.resumo, txt: 'O que você faz' },
      { ok: !!d.disponibilidade, txt: 'Disponibilidade' },
      { ok: (d.competencias || []).length >= 3, txt: 'Pelo menos 3 competências' },
      { ok: !!(c.telefone || c.canal === 'email'), txt: 'Contato para as empresas' }
    ];
  }

  function renderInicio() {
    exigirSessao().then(function (s) {
      if (!s) return;
      if (window.location.hash) history.replaceState(null, '', window.location.pathname);
      return carregarConta(s).then(completarDoCadastro).then(function (conta) {
        if (!conta.perfil) {
          $('#content').innerHTML = '<div class="card"><h2 class="card-title">Conta sem tipo</h2>' +
            '<p class="row-sub">Esta conta foi criada sem informar se é de empresa ou de profissional. Fale com o suporte.</p></div>';
          return;
        }
        var empresa = conta.perfil.tipo === 'empresa';
        var d = conta.dados || {};
        topoInicio(conta);
        navBeta(conta.perfil.tipo, 'inicio');
        var campos = camposPerfil(conta);
        var feitos = campos.filter(function (c) { return c.ok; }).length;
        var pct = Math.round(100 * feitos / campos.length);
        var primeiro = empresa ? d.nome : (d.nome || '').split(' ')[0];
        var pais = codigoPais(d.pais);
        var dist = d.distancia_max_km || 25;
        var stats = empresa
          ? [{ v: pct + '%', r: 'perfil completo', id: 'pct' }, { v: '0', r: 'vagas abertas' }, { v: '3 meses', r: 'grátis na 1ª vaga' }]
          : [{ v: pct + '%', r: 'perfil completo', id: 'pct' }, { v: String((d.competencias || []).length), r: 'competências' },
            { v: usaMilhas(pais) ? Math.round(dist * 0.621371) + ' mi' : dist + ' km', r: 'distância máxima' }];

        $('#content').innerHTML =
          '<section class="hero-c" aria-label="Resumo">' +
            '<div class="greeting"><h1 id="ola">Olá, ' + esc(primeiro) + '!</h1><p>' +
              (pct === 100 ? 'Perfil completo. ' + (empresa ? 'Publicar vagas chega na próxima etapa da beta.' : 'As vagas chegam na próxima etapa da beta.')
                : (empresa ? 'Complete o perfil da empresa para os profissionais conhecerem vocês.' : 'Complete seu perfil para aparecer nas indicações das empresas.')) + '</p></div>' +
            '<div class="hero-score"><b class="novo">Novo</b><div><strong>★ Reputação em construção</strong>' +
              '<span>' + (empresa ? 'Cada contratação confirmada conta aqui' : 'Cada trabalho confirmado conta aqui') + '</span></div></div>' +
            '<div class="hero-stats">' + stats.map(function (st) {
              return '<div class="hero-stat"><b' + (st.id ? ' id="' + st.id + '"' : '') + '>' + esc(st.v) + '</b><span>' + esc(st.r) + '</span></div>';
            }).join('') + '</div></section>' +

          '<section class="card sobre-hero" id="completar"><div class="head-row"><h2 class="card-title">' + (pct === 100 ? 'Seu perfil' : 'Complete seu perfil') + '</h2>' +
              '<span class="chip ' + (pct === 100 ? 'green' : 'blue') + '">' + feitos + ' de ' + campos.length + '</span></div>' +
            '<div class="meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '" aria-label="Perfil completo"><span style="width:' + pct + '%"></span></div>' +
            '<ul class="todo-list">' + campos.map(function (c) {
              return '<li class="' + (c.ok ? 'ok' : '') + '">' + icon(c.ok ? 'check' : 'clock', 16, { stroke: 2.4 }) + '<span>' + esc(c.txt) + '</span></li>';
            }).join('') + '</ul>' +
            '<a href="perfil.html" class="btn btn-primary" id="editar-perfil">' + (pct === 100 ? 'Ver e editar perfil' : 'Completar perfil') + '</a></section>' +

          '<section class="section" aria-labelledby="h-proximo"><h2 id="h-proximo">' + (empresa ? 'Vagas e candidatos' : 'Vagas para você') + '</h2>' +
            '<div class="card"><p class="row-sub" id="boas-vindas">' + icon('check', 14, { stroke: 2.6 }) + ' E-mail confirmado · ' + esc(conta.user.email) + '</p>' +
            '<p class="row-sub">' + (empresa
              ? 'Publicar vagas, receber candidatos e buscar profissionais chegam na próxima etapa da versão beta. Os 3 meses grátis do Essencial só começam na primeira vaga publicada.'
              : 'Buscar vagas e se candidatar chegam na próxima etapa da versão beta. Com o perfil completo, você aparece primeiro nas indicações.') + '</p>' +
            '<a href="../demo.html" class="btn btn-outline">Ver a demonstração</a></div></section>';
      });
    }).catch(function (err) {
      $('#content').innerHTML = '<div class="card"><h2 class="card-title">Não foi possível carregar sua conta</h2><p class="row-sub">' + esc(traduzErro(err)) + '</p>' +
        '<a href="inicio.html" class="btn btn-primary">Tentar de novo</a></div>';
    });
  }

  /* ---------- Perfil (empresa ou profissional) ---------- */

  function renderPerfil() {
    topo('Meu perfil', 'inicio.html');
    exigirSessao().then(function (s) {
      if (!s) return;
      return carregarConta(s).then(completarDoCadastro).then(function (conta) {
        if (!conta.perfil) { ir('inicio.html'); return; }
        var empresa = conta.perfil.tipo === 'empresa';
        if (empresa) topo('Minha empresa', 'inicio.html');
        navBeta(conta.perfil.tipo, 'perfil');
        var d = conta.dados || {};
        var c = conta.contato || { canal: 'whatsapp' };
        var paisAtual = codigoPais(d.pais) || paisPadrao();
        var localAtual = d.cidade && d.lat != null ? { cidade: d.cidade, estado: d.estado, pais: paisAtual, lat: d.lat, lng: d.lng } : null;

        var blocoEmpresa =
          field('p-nome', 'Nome da empresa', 'input', 'type="text" maxlength="120"', '', { req: true }) +
          field('p-setor', 'Setor', 'input', 'type="text" maxlength="60"', '', { req: true }) +
          field('p-porte', 'Porte', 'select', '', options(D.portes, 'Selecione', d.porte)) +
          field('p-pais', 'País da sede', 'select', '', opcoesPaises(paisAtual), { req: true }) +
          campoCidade('p-cidade', 'Cidade da sede', { req: true, hint: 'Ponto de partida da distância na busca de profissionais. Não achou? Escolha a mais próxima.' }) +
          field('p-site', 'Site (opcional)', 'input', 'type="text" maxlength="120" placeholder="suaempresa.com"', '') +
          field('p-descricao', 'Sobre a empresa', 'textarea', 'rows="4" maxlength="1000"', '', { hint: 'O que a empresa faz e como é trabalhar nela. Aparece no perfil público.' });

        var blocoProf =
          field('p-nome', 'Nome completo', 'input', 'type="text" maxlength="120" autocomplete="name"', '', { req: true }) +
          field('p-resumo', 'O que você faz', 'input', 'type="text" maxlength="160" placeholder="Ex.: Recepcionista · 4 anos de experiência"', '', { req: true }) +
          field('p-pais', 'País onde mora', 'select', '', opcoesPaises(paisAtual), { req: true }) +
          campoCidade('p-cidade', 'Cidade onde mora', { req: true, hint: 'Só a cidade aparece para as empresas, nunca o endereço. Não achou? Escolha a mais próxima.' }) +
          field('p-disp', 'Disponibilidade', 'select', '', options(D.disponibilidades, 'Selecione', d.disponibilidade), { req: true }) +
          field('p-dist', 'Distância máxima até o trabalho', 'select', '', opcoesDistancia(paisAtual, d.distancia_max_km || 25)) +
          group('p-modelos', 'Modelos de trabalho que aceito', pills('p-modelos', D.modelos, d.modelos || ['presencial'], 'checkbox'), { req: true }) +
          '<div class="field"><label class="check-row"><input type="checkbox" id="p-mudar"' + (d.aceita_mudar ? ' checked' : '') + '><span>Aceito me mudar de cidade por uma boa vaga</span></label></div>' +
          field('p-comp', 'Competências', 'input', 'type="text" maxlength="400" placeholder="Atendimento ao público, Caixa, Pacote Office"', '', { req: true, hint: 'Separe por vírgula. Até ' + D.limiteCompetencias + '.' }) +
          field('p-sobre', 'Sobre você (opcional)', 'textarea', 'rows="4" maxlength="1000"', '') +
          '<div class="field"><label class="check-row"><input type="checkbox" id="p-visivel"' + (d.visivel !== false ? ' checked' : '') + '><span>Aparecer nas buscas e indicações das empresas</span></label>' +
            '<p class="field-hint">Desligado, só as empresas a que você se candidatar veem seu perfil.</p></div>';

        $('#content').innerHTML =
          '<form class="form" id="perfil-form" novalidate>' +
            '<section class="card"><h2 class="card-title">' + (empresa ? 'Empresa' : 'Seu perfil') + '</h2>' + (empresa ? blocoEmpresa : blocoProf) + '</section>' +
            '<section class="card"><h2 class="card-title">Contato</h2>' +
              '<p class="row-sub">Só é mostrado quando os dois lados de uma conversa decidem compartilhar.</p>' +
              group('p-canal', 'Prefiro ser contatado por', pills('p-canal', D.canais, c.canal || 'whatsapp')) +
              field('p-tel', 'Celular com DDD', 'input', 'type="tel" autocomplete="tel" inputmode="tel" maxlength="20" placeholder="+55 11 91234-5678"', '', { hint: 'Obrigatório para WhatsApp e SMS.' }) +
            '</section>' +
            '<p class="form-status" id="form-status" role="alert"></p>' +
            '<button type="submit" class="btn btn-primary btn-lg" id="salvar">Salvar perfil</button>' +
          '</form>' +
          '<section class="card" id="conta"><h2 class="card-title">Conta</h2><p class="row-sub">E-mail: <strong>' + esc(conta.user.email) + '</strong></p>' +
            '<form class="form" id="senha-form" novalidate>' +
              field('p-senha', 'Nova senha', 'input', 'type="password" autocomplete="new-password" minlength="8"', '', { hint: 'Pelo menos 8 caracteres.' }) +
              '<p class="row-sub" id="senha-status" role="status"></p>' +
              '<button type="submit" class="btn btn-outline" id="senha-btn">Alterar senha</button></form>' +
            '<button type="button" class="btn btn-outline" id="sair">Sair da conta</button></section>';

        $('#p-nome').value = d.nome || '';
        if (empresa) {
          $('#p-setor').value = d.setor || '';
          $('#p-site').value = d.site || '';
          $('#p-descricao').value = d.descricao || '';
        } else {
          $('#p-resumo').value = d.resumo || '';
          $('#p-comp').value = (d.competencias || []).join(', ');
          $('#p-sobre').value = d.sobre || '';
        }
        $('#p-tel').value = c.telefone || '';
        var cidadePerfil = ligarCidade('p-cidade', function () { return $('#p-pais').value; }, localAtual);
        $('#p-pais').addEventListener('change', function () {
          cidadePerfil.limpar();
          if ($('#p-dist')) $('#p-dist').innerHTML = opcoesDistancia($('#p-pais').value, Number($('#p-dist').value));
        });

        $('#perfil-form').addEventListener('submit', function (e) {
          e.preventDefault();
          var canal = (marcados('p-canal')[0]) || 'whatsapp';
          var tel = $('#p-tel').value.trim();
          var regras = [
            { id: 'p-nome', ok: $('#p-nome').value.trim().length >= 2, msg: 'Informe o nome.' },
            { id: 'p-pais', ok: !!$('#p-pais').value, msg: 'Selecione o país.' },
            { id: 'p-cidade', ok: !!cidadePerfil.valor(), msg: $('#p-cidade').value.trim() ? 'Escolha a cidade na lista de sugestões.' : 'Informe a cidade.' },
            { id: 'p-tel', ok: canal === 'email' ? (!tel || /^\+?[0-9 ()-]{8,20}$/.test(tel)) : /^\+?[0-9 ()-]{8,20}$/.test(tel),
              msg: canal === 'email' ? 'Confira o número.' : 'Informe o celular com DDD (só números, espaços, parênteses e traço).' }
          ];
          var comp = [];
          if (empresa) {
            regras.push({ id: 'p-setor', ok: $('#p-setor').value.trim().length >= 2, msg: 'Informe o setor.' });
          } else {
            comp = $('#p-comp').value.split(',').map(function (x) { return x.trim(); }).filter(Boolean)
              .filter(function (x, i, a) { return a.indexOf(x) === i; });
            regras.push({ id: 'p-resumo', ok: $('#p-resumo').value.trim().length >= 2, msg: 'Conte o que você faz.' });
            regras.push({ id: 'p-disp', ok: !!$('#p-disp').value, msg: 'Escolha a disponibilidade.' });
            regras.push({ id: 'p-modelos', ok: marcados('p-modelos').length > 0, msg: 'Escolha pelo menos um modelo de trabalho.' });
            regras.push({ id: 'p-comp', ok: comp.length >= 1 && comp.length <= D.limiteCompetencias, msg: comp.length ? 'Use no máximo ' + D.limiteCompetencias + ' competências.' : 'Informe pelo menos uma competência.' });
          }
          var ok = check(regras);
          status(ok ? '' : 'Revise os campos destacados.');
          if (!ok) return;

          var cidade = cidadePerfil.valor();
          var patch = { nome: $('#p-nome').value.trim(), cidade: cidade.cidade, estado: cidade.estado || null, pais: cidade.pais, lat: cidade.lat, lng: cidade.lng };
          if (empresa) {
            patch.setor = $('#p-setor').value.trim();
            patch.porte = $('#p-porte').value || null;
            patch.site = $('#p-site').value.trim() || null;
            patch.descricao = $('#p-descricao').value.trim() || null;
          } else {
            patch.resumo = $('#p-resumo').value.trim();
            patch.sobre = $('#p-sobre').value.trim() || null;
            patch.disponibilidade = $('#p-disp').value;
            patch.distancia_max_km = Number($('#p-dist').value);
            patch.modelos = marcados('p-modelos');
            patch.aceita_mudar = $('#p-mudar').checked;
            patch.competencias = comp;
            patch.visivel = $('#p-visivel').checked;
          }
          var btn = $('#salvar');
          ocupado(btn, true, 'Salvando…');
          var q1 = empresa ? sb.from('empresas').update(patch).eq('dono', conta.user.id) : sb.from('profissionais').update(patch).eq('id', conta.user.id);
          var q2 = sb.from('contatos').upsert({ user_id: conta.user.id, canal: canal, telefone: tel || null, email: conta.user.email });
          Promise.all([q1, q2]).then(function (rs) {
            ocupado(btn, false);
            var err = rs[0].error || rs[1].error;
            if (err) { status(traduzErro(err)); return; }
            toast('Perfil salvo.');
            setTimeout(function () { ir('inicio.html'); }, 700);
          });
        });

        $('#sair').addEventListener('click', function () { ocupado(this, true, 'Saindo…'); sair(); });

        $('#senha-form').addEventListener('submit', function (e) {
          e.preventDefault();
          var nova = $('#p-senha').value;
          if (!check([{ id: 'p-senha', ok: nova.length >= 8, msg: 'A senha precisa ter pelo menos 8 caracteres.' }])) return;
          var b = $('#senha-btn');
          ocupado(b, true, 'Salvando…');
          sb.auth.updateUser({ password: nova }).then(function (r) {
            ocupado(b, false);
            $('#senha-status').textContent = r.error ? traduzErro(r.error) : 'Senha alterada.';
            if (!r.error) $('#p-senha').value = '';
          });
        });
      });
    }).catch(function (err) {
      $('#content').innerHTML = '<div class="card"><h2 class="card-title">Não foi possível carregar o perfil</h2><p class="row-sub">' + esc(traduzErro(err)) + '</p></div>';
    });
  }

  var PAGES = {
    entrar: renderEntrar,
    cadastro: renderCadastro,
    recuperar: renderRecuperar,
    'nova-senha': renderNovaSenha,
    inicio: renderInicio,
    perfil: renderPerfil
  };

  var page = document.body.dataset.page;
  if (!configurado) { semConfig(); return; }
  if (PAGES[page]) PAGES[page]();
})();
