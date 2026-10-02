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
    plus: '<path d="M12 5v14M5 12h14"/>',
    bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    send: '<path d="M4 12l16-8-6 16-3-6-7-2z"/>',
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
    if (code === 'P0001' && err.message) return err.message;
    if (code === '42501' || /row-level security/.test(msg)) return 'Você não tem permissão para fazer isso.';
    if (code === 'email_address_not_authorized' || /not authorized/.test(msg)) return 'O envio de e-mails do sistema ainda está em modo de teste e só aceita endereços da equipe. Avise o suporte do KORbuild Match.';
    if (/error sending .*email|sending email/.test(msg)) return 'Não conseguimos enviar o e-mail de confirmação agora. Tente de novo em alguns minutos.';
    if (/database error saving new user/.test(msg)) return 'Não conseguimos criar a conta agora. Tente de novo em instantes.';
    return 'Não deu certo agora. Tente de novo em instantes.';
  }

  // Mensagem para a pessoa + código técnico discreto (ajuda o suporte a achar a causa).
  function erroComDetalhe(err) {
    if (window.console) console.error('[KORbuild] erro do Supabase', err);
    var det = [err && (err.code || err.error_code), err && err.status, err && err.message].filter(Boolean).join(' · ');
    return traduzErro(err) + (det ? ' (Detalhe: ' + det + ')' : '');
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

  var contaCache = null;

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
        contaCache = { perfil: perfil, user: s.user, dados: rs[0].data, contato: rs[1].data };
        return contaCache;
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
      '<span id="sino-area"></span>' +
      '<a href="perfil.html" class="avatar' + (empresa ? '' : ' blue') + '" aria-label="' + (empresa ? 'Minha empresa' : 'Meu perfil') + '">' +
        esc(iniciais(conta.dados && conta.dados.nome)) + '</a>';
    sino().then(function (html) { var a = $('#sino-area'); if (a) a.outerHTML = html; });
  }

  function topo(titulo, voltar) {
    $('#topbar').innerHTML = '<a href="' + esc(voltar) + '" class="icon-btn" aria-label="Voltar">' + icon('back', 22, { stroke: 2 }) + '</a>' +
      '<h1 class="topbar-title">' + esc(titulo) + '</h1>';
  }

  // Mesma navegação do protótipo; o que ainda não existe na beta avisa que chega na próxima etapa.
  function navBeta(tipo, atual) {
    var itens = tipo === 'empresa'
      ? [{ id: 'inicio', label: 'Início', icon: 'home', href: 'inicio.html' }, { id: 'vagas', label: 'Vagas', icon: 'briefcase', href: 'vagas.html' },
        { id: 'candidatos', label: 'Candidatos', icon: 'users', href: 'candidatos.html' }, { id: 'mensagens', label: 'Mensagens', icon: 'message', href: 'mensagens.html' },
        { id: 'perfil', label: 'Empresa', icon: 'building', href: 'perfil.html' }]
      : [{ id: 'inicio', label: 'Início', icon: 'home', href: 'inicio.html' }, { id: 'buscar', label: 'Buscar', icon: 'search', href: 'buscar.html' },
        { id: 'candidaturas', label: 'Candidaturas', icon: 'clipboard', href: 'candidaturas.html' }, { id: 'mensagens', label: 'Mensagens', icon: 'message', href: 'mensagens.html' },
        { id: 'perfil', label: 'Perfil', icon: 'user', href: 'perfil.html' }];
    $('#nav').innerHTML = itens.map(function (it) {
      var ativo = it.id === atual;
      return '<a href="' + (it.href || '#') + '" data-nav="' + it.id + '"' + (ativo ? ' aria-current="page"' : '') + (it.href ? '' : ' data-proxima') + '>' +
        icon(it.icon, 24, { stroke: ativo ? 2 : 1.8 }) + esc(it.label) + '</a>';
    }).join('');
    if (atual !== 'mensagens') marcarNaoLidas(contaCache);
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
                status(err ? erroComDetalhe(err) : 'Enviamos um novo link para ' + email + '.');
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
            if (r.error) { status(erroComDetalhe(r.error)); return; }
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
          $('#email-status').textContent = err ? erroComDetalhe(err) : 'Enviamos um novo link para ' + email + '.';
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
        if (r.error && !/not found/i.test(r.error.message || '')) { status(erroComDetalhe(r.error)); return; }
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
        var completo = pct === 100;
        var distTxt = usaMilhas(pais) ? Math.round(dist * 0.621371) + ' mi' : dist + ' km';
        var ondeTxt = d.cidade ? d.cidade + (d.estado ? ', ' + d.estado : '') : '';

        function linha(href, ic, titulo, texto, id, tom) {
          return '<a href="' + href + '" class="row-link"' + (id ? ' id="' + id + '"' : '') + '>' +
            '<div class="icon-tile' + (tom ? ' ' + tom : '') + '">' + icon(ic) + '</div><div class="row-main"><div class="row-title">' + esc(titulo) + '</div>' +
            '<div class="row-sub">' + esc(texto) + '</div></div><span class="chevron">' + icon('chevron', 20, { stroke: 2 }) + '</span></a>';
        }

        // Dados reais: empresa (vagas e candidatos) ou profissional (vagas perto e candidaturas).
        var dados = empresa
          ? sb.from('vagas').select('*').eq('empresa_id', d.id).order('publicada_em', { ascending: false, nullsFirst: false }).then(function (r) {
              if (r.error) throw r.error;
              var vagas = r.data || [];
              var ids = vagas.filter(function (v) { return v.status !== 'rascunho'; }).map(function (v) { return v.id; });
              return (ids.length ? sb.from('candidaturas').select('vaga_id,status,criado_em').in('vaga_id', ids) : Promise.resolve({ data: [] })).then(function (r2) {
                if (r2.error) throw r2.error;
                return { vagas: vagas, cands: r2.data || [] };
              });
            })
          : Promise.all([vagasAbertas(), sb.from('candidaturas').select('vaga_id,status').eq('profissional_id', conta.user.id)]).then(function (rs) {
              if (rs[1].error) throw rs[1].error;
              return { vagas: rs[0], cands: rs[1].data || [] };
            });

        return dados.then(function (x) {
          return Promise.all([minhasConversas(conta), minhasContratacoes(conta), carregarReputacao(empresa ? 'empresa' : 'profissional', empresa ? d.id : conta.user.id),
            empresa ? sb.from('assinaturas').select('*').eq('empresa_id', d.id).maybeSingle() : Promise.resolve({ data: null })])
            .then(function (rs) { x.cvs = rs[0]; x.ks = rs[1].ks; x.avs = rs[1].avs; x.rep = rs[2].rep; x.assinatura = rs[3].data; return x; });
        }).then(function (x) {
          var stats, principal, resumo;
          var lado = empresa ? 'empresa' : 'profissional';
          var semResp = x.cvs.filter(function (cv) { return semResposta(cv, lado); });
          var linhaMsgs = semResp.length ? linha('mensagens.html?filtro=sem-resposta', 'message', plural(semResp.length, 'mensagem sem resposta', 'mensagens sem resposta'),
            semResp.map(function (cv) { return nomeDoOutro(cv, lado); }).slice(0, 3).join(', ') + (semResp.length > 3 ? '…' : ''), 'msgs-sem-resposta', 'amber') : '';
          // Contratações que pedem algo (confirmar, contestação, recusa, avaliar).
          var linhasContr = x.ks.filter(function (k) { return situacao(k, lado, x.avs).pend; }).map(function (k) {
            var st = situacao(k, lado, x.avs);
            var nome = empresa ? (k.profissionais && k.profissionais.nome) : (k.empresas && k.empresas.nome);
            return linha('contratacoes.html', st.acao === 'avaliar' ? 'star' : 'check', st.rotulo, (nome || '') + ' · ' + k.funcao, 'contr-' + k.id, st.acao === 'avaliar' ? 'amber' : '');
          }).join('');
          if (empresa) {
            var abertas = x.vagas.filter(function (v) { return v.status === 'aberta'; });
            var novos = x.cands.filter(function (c) { return c.status === 'novo'; });
            var atrasados = novos.filter(function (c) { return diasDesde(c.criado_em) > D.prazoRespostaDias; });
            var publicouAlguma = x.vagas.some(function (v) { return v.publicada_em; });
            stats = [{ v: String(abertas.length), r: abertas.length === 1 ? 'vaga aberta' : 'vagas abertas' }, { v: String(novos.length), r: plural(novos.length, 'candidato novo', 'candidatos novos').replace(/^\d+ /, '') },
              publicouAlguma ? { v: String(x.cands.length), r: x.cands.length === 1 ? 'candidatura no total' : 'candidaturas no total' } : { v: '3 meses', r: 'grátis na 1ª vaga' }];
            if (!completo) stats[0] = { v: pct + '%', r: 'perfil completo', id: 'pct' };
            resumo = !publicouAlguma ? 'Tudo pronto para publicar a primeira vaga.'
              : (novos.length ? 'Você tem ' + plural(novos.length, 'candidato novo', 'candidatos novos') + ' para responder.' : 'Tudo em dia com os candidatos.');
            var pend = [];
            var plano = situacaoPlano(x.assinatura);
            if (plano.alerta) pend.push(linha('plano.html', 'clock', plano.titulo, plano.texto, 'plano-alerta', 'amber'));
            if (linhasContr) pend.push(linhasContr);
            if (linhaMsgs) pend.push(linhaMsgs);
            if (atrasados.length) pend.push(linha('candidatos.html?status=novo', 'clock', plural(atrasados.length, 'candidato esperando', 'candidatos esperando') + ' há mais de ' + D.prazoRespostaDias + ' dias',
              'Chame para conversa ou marque como não selecionado. A resposta garantida conta na sua reputação.', 'atrasados', 'amber'));
            abertas.forEach(function (v) {
              var n = novos.filter(function (c) { return c.vaga_id === v.id; }).length;
              if (n) pend.push(linha('candidatos.html?vaga=' + encodeURIComponent(v.id), 'users', plural(n, 'candidato novo', 'candidatos novos'), v.titulo));
            });
            if (!publicouAlguma) pend.push('<div class="card card-highlight" id="primeira-vaga"><div class="row-title">Publique sua primeira vaga</div>' +
              '<p class="row-sub">Os 3 meses grátis do plano Essencial começam quando a primeira vaga for publicada. O cartão só é pedido no fim.</p>' +
              '<a href="publicar-vaga.html" class="btn btn-primary">Publicar vaga</a></div>');
            principal =
              '<a href="publicar-vaga.html" class="row-link search-c" id="busca"><span>' + icon('plus', 20, { stroke: 2 }) + '</span>Publicar uma vaga</a>' +
              '<section class="section" aria-labelledby="h-atencao"><h2 id="h-atencao">Precisa da sua atenção</h2>' +
                (pend.length ? pend.join('') : '<div class="empty" id="tudo-em-dia"><p class="row-title">Tudo em dia</p><p class="row-sub">Nenhum candidato esperando resposta.</p></div>') + '</section>' +
              (x.vagas.length ? '<section class="section" aria-labelledby="h-suas"><div class="section-head"><h2 id="h-suas">Suas vagas</h2><a href="vagas.html">Ver todas</a></div>' +
                x.vagas.filter(function (v) { return v.status === 'aberta' || v.status === 'pausada'; }).slice(0, 3).map(function (v) {
                  var n = x.cands.filter(function (c) { return c.vaga_id === v.id; }).length;
                  return linha('candidatos.html?vaga=' + encodeURIComponent(v.id), 'briefcase', v.titulo, STATUS_VAGA[v.status].rotulo + ' · ' + plural(n, 'candidato', 'candidatos'));
                }).join('') + '</section>' : '') +
              '<section class="section" aria-labelledby="h-empresa"><h2 id="h-empresa">Sua empresa</h2>' +
                linha('perfil.html', 'building', d.nome || 'Minha empresa', [completo ? 'Perfil completo' : 'Perfil ' + pct + '% completo', d.setor, ondeTxt].filter(Boolean).join(' · '), 'editar-perfil') + '</section>';
          } else {
            var perto = x.vagas.filter(function (v) { return vagaAlcanca(v, d).ok; })
              .sort(function (a, b) {
              var ka = vagaAlcanca(a, d).km, kb = vagaAlcanca(b, d).km;
              return (ka == null ? Infinity : ka) - (kb == null ? Infinity : kb);
            });
            var minhas = {}; x.cands.forEach(function (c) { minhas[c.vaga_id] = true; });
            var andamento = x.cands.filter(function (c) { return c.status === 'novo' || c.status === 'conversa'; }).length;
            stats = [{ v: String(perto.length), r: perto.length === 1 ? 'vaga perto de você' : 'vagas perto de você' }, { v: String(andamento), r: 'candidaturas em andamento' }, { v: distTxt, r: 'distância máxima' }];
            if (!completo) stats[0] = { v: pct + '%', r: 'perfil completo', id: 'pct' };
            var novasParaMim = perto.filter(function (v) { return !minhas[v.id]; });
            resumo = novasParaMim.length ? plural(novasParaMim.length, 'vaga combina', 'vagas combinam') + ' com você perto de ' + (d.cidade || 'você') + '.' : 'Seu perfil está completo e visível para as empresas.';
            principal =
              '<a href="buscar.html" class="row-link search-c" id="busca"><span>' + icon('search', 20, { stroke: 2 }) + '</span>Buscar vagas, cargos ou empresas</a>' +
              (linhaMsgs || linhasContr ? '<section class="section" aria-labelledby="h-atencao-p"><h2 id="h-atencao-p">Precisa da sua atenção</h2>' + linhasContr + linhaMsgs + '</section>' : '') +
              '<section class="section" aria-labelledby="h-vagas"><div class="section-head"><h2 id="h-vagas">Vagas para você</h2>' + (perto.length ? '<a href="buscar.html">Ver todas</a>' : '') + '</div>' +
                (perto.length ? perto.slice(0, 3).map(function (v) { return cartaoVaga(v, d, minhas); }).join('')
                  : '<div class="empty" id="sem-vagas"><p class="row-title">Ainda não há vagas perto de você</p>' +
                    '<p class="row-sub">Assim que uma empresa publicar uma vaga que combina com seu perfil' + (ondeTxt ? ', perto de ' + esc(ondeTxt) : '') +
                    ', ela aparece aqui e você recebe um aviso.</p></div>') + '</section>' +
              '<section class="section" aria-labelledby="h-perfil"><h2 id="h-perfil">Seu perfil</h2>' +
                linha('perfil.html', 'user', d.resumo || 'Meu perfil', [completo ? 'Perfil completo' : 'Perfil ' + pct + '% completo', ondeTxt, (d.competencias || []).length + ' competências'].filter(Boolean).join(' · '), 'editar-perfil') +
                linha('candidaturas.html', 'clipboard', 'Minhas candidaturas', x.cands.length ? plural(andamento, 'em andamento', 'em andamento') + ' · ' + plural(x.cands.length, 'no total', 'no total') : 'Nenhuma candidatura ainda', 'minhas-cand') + '</section>';
          }

          var hero =
            '<section class="hero-c" aria-label="Resumo">' +
              '<div class="greeting"><h1 id="ola">Olá, ' + esc(primeiro) + '!</h1><p id="resumo-topo">' +
                (completo ? resumo : (empresa ? 'Complete o perfil da empresa para os profissionais conhecerem vocês.' : 'Complete seu perfil para aparecer nas indicações das empresas.')) + '</p></div>' +
              (x.rep && !x.rep.em_construcao
                ? '<div class="hero-score" id="hero-rep"><b>' + esc(String(x.rep.nota).replace('.', ',')) + '</b><div><strong>★ ' + (empresa ? 'Reputação verificada' : 'Sua reputação') + '</strong>' +
                  '<span>' + (empresa ? plural(x.rep.contratacoes, 'contratação confirmada', 'contratações confirmadas') : plural(x.rep.trabalhos, 'trabalho verificado', 'trabalhos verificados')) + '</span></div></div>'
                : '<div class="hero-score" id="hero-rep"><b class="novo">Novo</b><div><strong>★ Reputação em construção</strong>' +
                  '<span>' + (x.rep && (empresa ? x.rep.contratacoes : x.rep.trabalhos) ? plural(empresa ? x.rep.contratacoes : x.rep.trabalhos, empresa ? 'contratação confirmada' : 'trabalho verificado', empresa ? 'contratações confirmadas' : 'trabalhos verificados') + ' · a nota aparece com 3 avaliações'
                    : (empresa ? 'Cada contratação confirmada conta aqui' : 'Cada trabalho confirmado conta aqui')) + '</span></div></div>') +
              '<div class="hero-stats">' + stats.map(function (st) {
                return '<div class="hero-stat"><b' + (st.id ? ' id="' + st.id + '"' : '') + '>' + esc(st.v) + '</b><span>' + esc(st.r) + '</span></div>';
              }).join('') + '</div></section>';

          var checklist =
            '<section class="card sobre-hero" id="completar"><div class="head-row"><h2 class="card-title">Complete seu perfil</h2>' +
                '<span class="chip blue">' + feitos + ' de ' + campos.length + '</span></div>' +
              '<div class="meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '" aria-label="Perfil completo"><span style="width:' + pct + '%"></span></div>' +
              '<ul class="todo-list">' + campos.map(function (c) {
                return '<li class="' + (c.ok ? 'ok' : '') + '">' + icon(c.ok ? 'check' : 'clock', 16, { stroke: 2.4 }) + '<span>' + esc(c.txt) + '</span></li>';
              }).join('') + '</ul>' +
              '<a href="perfil.html" class="btn btn-primary" id="editar-perfil">Completar perfil</a></section>';

          var rodape = '<p class="row-sub" id="boas-vindas">' + icon('check', 14, { stroke: 2.6 }) + ' E-mail confirmado · ' + esc(conta.user.email) + '</p>';
          // Perfil incompleto: o checklist vem primeiro; o resto da página continua disponível abaixo.
          $('#content').innerHTML = hero + (completo ? principal : checklist + principal.replace('class="row-link search-c"', 'class="row-link"').replace(' id="editar-perfil"', '')) + rodape;
        });
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
          '<section class="section" id="minha-reputacao"><h2>Minha reputação</h2><div id="rep-area"><p class="row-sub">Carregando…</p></div>' +
            '<a href="contratacoes.html" class="row-link" id="link-contratacoes"><div class="icon-tile">' + icon('briefcase') + '</div><div class="row-main"><div class="row-title">Contratações e avaliações</div>' +
            '<div class="row-sub">Confirmar, contestar, registrar o fim do vínculo e avaliar</div></div><span class="chevron">' + icon('chevron', 20, { stroke: 2 }) + '</span></a>' +
            '<a href="notificacoes.html#prefs" class="row-link" id="link-avisos"><div class="icon-tile">' + icon('bell') + '</div><div class="row-main"><div class="row-title">Avisos</div>' +
            '<div class="row-sub">O que receber no app e por e-mail</div></div><span class="chevron">' + icon('chevron', 20, { stroke: 2 }) + '</span></a>' +
            (empresa ? '<a href="plano.html" class="row-link" id="link-plano"><div class="icon-tile">' + icon('star') + '</div><div class="row-main"><div class="row-title">Plano</div>' +
              '<div class="row-sub">Período grátis, limite de vagas e assinatura</div></div><span class="chevron">' + icon('chevron', 20, { stroke: 2 }) + '</span></a>' : '') + '</section>' +
          (empresa ? '' : '<section class="section" id="exp-verificadas"><h2>Experiência verificada</h2><div id="exp-area"></div></section>') +
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

        function pintarReputacao() {
          carregarReputacao(empresa ? 'empresa' : 'profissional', empresa ? d.id : conta.user.id).then(function (x) {
            $('#rep-area').innerHTML = repHtml(x.rep, empresa ? 'empresa' : 'profissional') +
              (x.avs.length ? '<h3 class="sub-h">Avaliações recebidas</h3>' + avaliacoesHtml(x.avs, empresa ? 'empresa' : 'profissional', true) : '');
          }).catch(function () { $('#rep-area').innerHTML = ''; });
        }
        pintarReputacao();
        ligarRespostas($('#rep-area'), pintarReputacao);

        function pintarExperiencias() {
          if (empresa) return;
          sb.from('experiencias').select('*').eq('profissional_id', conta.user.id).not('contratacao_id', 'is', null).order('inicio', { ascending: false }).then(function (r) {
            var xs = r.data || [];
            $('#exp-area').innerHTML = xs.length ? '<ul class="card exp-list">' + xs.map(function (x) {
              return '<li class="exp-item"><div class="row-title">' + esc(x.cargo) + '</div><div class="row-sub">' + esc(x.empresa_nome) +
                (x.inicio ? ' · ' + new Date(x.inicio + 'T12:00:00').getFullYear() + ' – ' + (x.fim ? new Date(x.fim + 'T12:00:00').getFullYear() : 'atual') : '') + '</div>' +
                '<label class="check-row"><input type="checkbox" data-exp="' + x.id + '"' + (x.mostrar_empresa !== false ? ' checked' : '') + '><span>Mostrar o nome da empresa no meu perfil</span></label></li>';
            }).join('') + '</ul><p class="row-sub">Oculto, as empresas veem “Empresa não divulgada”, mas o trabalho continua contando na sua reputação.</p>'
              : '<p class="row-sub">Quando uma contratação for confirmada pelos dois lados, o trabalho aparece aqui, verificado.</p>';
          });
        }
        pintarExperiencias();
        if (!empresa) $('#exp-area').addEventListener('change', function (e) {
          var cb = e.target.closest('[data-exp]');
          if (!cb) return;
          sb.from('experiencias').update({ mostrar_empresa: cb.checked }).eq('id', cb.getAttribute('data-exp')).then(function (r) {
            if (r.error) { cb.checked = !cb.checked; toast(erroComDetalhe(r.error)); return; }
            toast(cb.checked ? 'O nome da empresa aparece no seu perfil.' : 'O nome da empresa ficou oculto.');
          });
        });

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

  /* =====================================================================
   * ETAPA 3 — VAGAS E CANDIDATURAS
   * ===================================================================== */

  function rotuloDe(lista, id) { var x = lista.filter(function (i) { return i.id === id; })[0]; return x ? x.rotulo : ''; }
  var MODELOS_ROT = { presencial: 'Presencial', hibrido: 'Híbrido', remoto: 'Remoto' };

  function hojeISO() {
    var d = new Date();
    function dois(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + dois(d.getMonth() + 1) + '-' + dois(d.getDate());
  }

  function dataBR(iso) {
    if (!iso) return '';
    var d = new Date(iso.length <= 10 ? iso + 'T12:00:00' : iso);
    function dois(n) { return (n < 10 ? '0' : '') + n; }
    return dois(d.getDate()) + '/' + dois(d.getMonth() + 1) + '/' + d.getFullYear();
  }
  function diasDesde(iso) { return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000); }
  function plural(n, um, varios) { return n + ' ' + (n === 1 ? um : varios); }

  function dinheiro(valor, moeda) {
    try { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: moeda || 'BRL', maximumFractionDigits: valor % 1 ? 2 : 0 }).format(valor); }
    catch (e) { return (moeda || '') + ' ' + valor; }
  }
  function salarioTexto(v) {
    var min = v.salario_min, max = v.salario_max;
    if (min == null && max == null) return 'A combinar';
    var per = rotuloDe(D.periodos, v.periodo);
    if (min != null && max != null && Number(min) !== Number(max)) return dinheiro(Number(min), v.moeda) + ' – ' + dinheiro(Number(max), v.moeda) + ' ' + per;
    return dinheiro(Number(min != null ? min : max), v.moeda) + ' ' + per;
  }

  // Distância em linha reta (km) entre dois pontos aproximados.
  function distanciaKm(a, b) {
    if (!a || !b || a.lat == null || b.lat == null) return null;
    var R = 6371, rad = Math.PI / 180;
    var dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(x));
  }
  function distanciaTexto(km, pais) {
    if (km == null) return '';
    if (usaMilhas(pais)) return '≈ ' + Math.max(1, Math.round(km * 0.621371)) + ' mi';
    return '≈ ' + Math.max(1, Math.round(km)) + ' km';
  }
  function raioKm(v) { return v.raio_valor == null ? null : (v.raio_unidade === 'mi' ? v.raio_valor * 1.609344 : v.raio_valor); }

  function localVagaTexto(v) {
    if (v.modelo === 'remoto') return 'Remoto' + (v.fuso != null ? ' · ' + (rotuloDe(D.fusos, v.fuso) || 'UTC' + (v.fuso >= 0 ? '+' : '') + v.fuso) : ' · qualquer fuso');
    return (v.cidade || '') + (v.estado ? ', ' + v.estado : '') + (v.pais ? ' · ' + paisNome(codigoPais(v.pais)) : '');
  }

  // A vaga entra para o profissional? Remota: se ele aceita remoto. Presencial/híbrida: dentro do raio da
  // vaga e da distância máxima dele (ou ele aceita se mudar). Regras do documento, seções 6 e 10.
  function vagaAlcanca(v, p) {
    if (v.modelo === 'remoto') return { ok: (p.modelos || []).indexOf('remoto') !== -1, km: null };
    if ((p.modelos || []).indexOf(v.modelo) === -1 && !((p.modelos || []).indexOf('presencial') !== -1 && v.modelo === 'hibrido')) return { ok: false, km: null };
    var km = distanciaKm(p, v);
    if (km == null) return { ok: false, km: null };
    var dentro = km <= (raioKm(v) || 40) && (km <= (p.distancia_max_km || 25) || p.aceita_mudar);
    return { ok: dentro, km: km };
  }

  function comum(a, b) {
    var nb = (b || []).map(normalizar);
    return (a || []).filter(function (x) { return nb.indexOf(normalizar(x)) !== -1; });
  }

  var STATUS_VAGA = {
    rascunho: { rotulo: 'Rascunho', chip: 'grey' }, aberta: { rotulo: 'Aberta', chip: 'green' }, pausada: { rotulo: 'Pausada', chip: 'amber' },
    preenchida: { rotulo: 'Preenchida', chip: 'blue' }, cancelada: { rotulo: 'Cancelada', chip: 'grey' }, expirada: { rotulo: 'Expirada', chip: 'grey' }
  };
  var STATUS_CAND = {
    novo: { rotulo: 'Novo', grupo: 'Novos', chip: 'blue' }, conversa: { rotulo: 'Em conversa', grupo: 'Em conversa', chip: 'green' },
    nao: { rotulo: 'Não selecionado', grupo: 'Não selecionados', chip: 'grey' }, contratado: { rotulo: 'Contratado', grupo: 'Contratados', chip: 'green' },
    retirada: { rotulo: 'Retirou a candidatura', grupo: 'Retiraram', chip: 'grey' }, encerrada: { rotulo: 'Vaga encerrada', grupo: 'Vaga encerrada', chip: 'grey' }
  };
  // Como o profissional vê o status da própria candidatura.
  var STATUS_MINHA = {
    novo: { rotulo: 'Enviada', chip: 'blue', texto: 'A empresa tem até 7 dias para responder.' },
    conversa: { rotulo: 'Em conversa', chip: 'green', texto: 'A empresa quer conhecer você melhor.' },
    nao: { rotulo: 'Não selecionado', chip: 'grey', texto: 'Desta vez a empresa seguiu com outro perfil. Seu perfil continua visível para as próximas vagas.' },
    contratado: { rotulo: 'Contratado', chip: 'green', texto: 'Contratação confirmada pelos dois lados.' },
    retirada: { rotulo: 'Retirada', chip: 'grey', texto: 'Você retirou esta candidatura.' },
    encerrada: { rotulo: 'Vaga encerrada', chip: 'grey', texto: 'A vaga foi encerrada pela empresa.' }
  };

  function prazoResposta(c) {
    if (c.status !== 'novo') return '';
    var limite = new Date(new Date(c.criado_em).getTime() + D.prazoRespostaDias * 86400000);
    var vencido = limite < new Date();
    return '<span class="chip ' + (vencido ? 'red' : 'amber') + '">' + icon('clock', 12, { stroke: 2.4 }) +
      (vencido ? 'Prazo de resposta vencido' : 'Responder até ' + dataBR(limite.toISOString())) + '</span>';
  }

  function chipsLista(lista) {
    return (lista || []).length ? '<ul class="chips chip-list">' + lista.map(function (x) { return '<li class="chip">' + esc(x) + '</li>'; }).join('') + '</ul>' : '';
  }

  function aviso(msg, tom) {
    return '<p class="note note-box"' + (tom === 'amber' ? ' style="background:var(--amber-tint)"' : '') + '>' + icon(tom === 'amber' ? 'clock' : 'check', 16, { stroke: 2.4 }) + '<span>' + esc(msg) + '</span></p>';
  }

  function vazio(titulo, texto, acao) {
    return '<div class="empty"><p class="row-title">' + esc(titulo) + '</p><p class="row-sub">' + esc(texto) + '</p>' + (acao || '') + '</div>';
  }

  function erroCarregar(err, voltar) {
    $('#content').innerHTML = '<div class="card"><h2 class="card-title">Não foi possível carregar</h2><p class="row-sub">' + esc(erroComDetalhe(err)) + '</p>' +
      '<a href="' + (voltar || 'inicio.html') + '" class="btn btn-primary">Voltar ao início</a></div>';
  }

  // Sessão + conta, exigindo um tipo (empresa ou profissional). Outro tipo volta para o início.
  function contaDoTipo(tipo) {
    return exigirSessao().then(function (s) {
      if (!s) return null;
      return carregarConta(s).then(function (conta) {
        if (!conta.perfil || (tipo && conta.perfil.tipo !== tipo)) { ir('inicio.html'); return null; }
        return conta;
      });
    });
  }

  function triagemProibida(texto) {
    var t = ' ' + normalizar(texto).replace(/[^a-z0-9 ]/g, ' ') + ' ';
    for (var i = 0; i < D.termosProibidosTriagem.length; i++) {
      if (t.indexOf(' ' + normalizar(D.termosProibidosTriagem[i]) + ' ') !== -1) return D.termosProibidosTriagem[i];
    }
    return null;
  }

  /* ---------- Empresa: publicar ou editar vaga ---------- */

  function renderPublicarVaga() {
    var vagaId = params.get('id');
    topo(vagaId ? 'Editar vaga' : 'Publicar vaga', 'vagas.html');
    contaDoTipo('empresa').then(function (conta) {
      if (!conta) return;
      navBeta('empresa', 'vagas');
      var emp = conta.dados;
      var q = vagaId ? sb.from('vagas').select('*').eq('id', vagaId).maybeSingle() : Promise.resolve({ data: null });
      return q.then(function (r) {
        if (r.error) throw r.error;
        var v = r.data;
        if (vagaId && !v) { $('#content').innerHTML = vazio('Vaga não encontrada', 'Ela pode ter sido apagada.', '<a href="vagas.html" class="btn btn-primary">Minhas vagas</a>'); return; }
        if (v && ['preenchida', 'cancelada', 'expirada'].indexOf(v.status) !== -1) {
          $('#content').innerHTML = vazio('Vaga encerrada', 'Vagas encerradas não podem ser editadas. Publique uma nova vaga.', '<a href="publicar-vaga.html" class="btn btn-primary">Publicar nova vaga</a>');
          return;
        }
        formulario(emp, v);
      });
    }).catch(function (err) { erroCarregar(err, 'vagas.html'); });

    function formulario(emp, v) {
      v = v || {};
      var paisV = codigoPais(v.pais) || codigoPais(emp.pais) || paisPadrao();
      var localV = v.cidade && v.lat != null ? { cidade: v.cidade, estado: v.estado, pais: paisV, lat: v.lat, lng: v.lng }
        : (!v.id && emp.cidade && emp.lat != null ? { cidade: emp.cidade, estado: emp.estado, pais: codigoPais(emp.pais), lat: emp.lat, lng: emp.lng } : null);
      var modelo = v.modelo || 'presencial';
      var triagem = (v.triagem || []).slice();
      var editando = !!v.id;

      function opcoesRaio(pais, sel) {
        var un = usaMilhas(pais) ? 'mi' : 'km';
        var padrao = sel || D.raioPadrao[un];
        return D.raios[un].map(function (n) { return '<option value="' + n + '"' + (n === padrao ? ' selected' : '') + '>Até ' + n + ' ' + un + '</option>'; }).join('');
      }

      function triagemHtml() {
        return triagem.map(function (t, i) {
          return '<div class="triagem-item" data-i="' + i + '">' +
            field('tr-texto-' + i, 'Pergunta ' + (i + 1), 'input', 'type="text" maxlength="140" data-tr="texto" value="' + esc(t.texto || '') + '"', '', { req: true }) +
            '<div class="field"><span class="field-label">Tipo de resposta</span>' +
              pills('tr-tipo-' + i, [{ id: 'sim_nao', rotulo: 'Sim ou não' }, { id: 'opcoes', rotulo: 'Opções' }], t.tipo || 'sim_nao') + '</div>' +
            (t.tipo === 'opcoes' ? field('tr-opcoes-' + i, 'Opções (separe por vírgula, até ' + D.limiteOpcoesTriagem + ')', 'input', 'type="text" maxlength="200" value="' + esc((t.opcoes || []).join(', ')) + '"', '', { req: true }) : '') +
            '<button type="button" class="btn btn-outline btn-quiet" data-tr-remover="' + i + '">Remover pergunta</button></div>';
        }).join('') +
        (triagem.length < D.limitePerguntasTriagem ? '<button type="button" class="btn btn-outline" id="tr-add">' + icon('plus', 16, { stroke: 2.4 }) + 'Adicionar pergunta</button>' : '');
      }

      function lerTriagem() {
        triagem = triagem.map(function (t, i) {
          var tipo = (marcados('tr-tipo-' + i)[0]) || t.tipo || 'sim_nao';
          var txt = $('#tr-texto-' + i) ? $('#tr-texto-' + i).value.trim() : t.texto;
          var ops = $('#tr-opcoes-' + i) ? $('#tr-opcoes-' + i).value.split(',').map(function (x) { return x.trim(); }).filter(Boolean) : (t.opcoes || []);
          return { texto: txt, tipo: tipo, opcoes: tipo === 'opcoes' ? ops : [] };
        });
      }

      function pintarTriagem() { lerTriagem(); $('#triagem-area').innerHTML = triagemHtml(); }

      $('#content').innerHTML =
        '<form class="form" id="vaga-form" novalidate>' +
          (editando && v.status === 'aberta' ? aviso('Esta vaga está aberta. As mudanças aparecem para os profissionais assim que você salvar.') : '') +
          '<section class="card"><h2 class="card-title">A vaga</h2>' +
            field('v-titulo', 'Cargo ou título da vaga', 'input', 'type="text" maxlength="120" placeholder="Ex.: Atendente de loja"', '', { req: true }) +
            field('v-tipo', 'Tipo de contratação', 'select', '', options(D.tipos, 'Selecione', v.tipo), { req: true }) +
            field('v-descricao', 'Descrição', 'textarea', 'rows="5" maxlength="4000"', '', { hint: 'O que a pessoa vai fazer, como é o dia a dia e o que a empresa oferece.' }) +
            field('v-posicoes', 'Quantas pessoas', 'input', 'type="number" min="1" max="100" inputmode="numeric"', '', { req: true }) +
          '</section>' +
          '<section class="card"><h2 class="card-title">Onde</h2>' +
            group('v-modelo', 'Modelo de trabalho', pills('v-modelo', D.modelos, modelo), { req: true }) +
            '<div id="local-presencial"' + (modelo === 'remoto' ? ' hidden' : '') + '>' +
              field('v-pais', 'País', 'select', '', opcoesPaises(paisV), { req: true }) +
              campoCidade('v-cidade', 'Cidade', { req: true, hint: 'Ponto aproximado da vaga. Só a cidade aparece para os profissionais.' }) +
              field('v-raio', 'Buscar profissionais a até', 'select', '', opcoesRaio(paisV, v.raio_valor), { hint: 'Quem mora dentro desse raio recebe a indicação da vaga.' }) +
            '</div>' +
            '<div id="local-remoto"' + (modelo === 'remoto' ? '' : ' hidden') + '>' +
              field('v-fuso', 'Fuso de referência', 'select', '', '<option value="">Qualquer fuso</option>' + options(D.fusos, null, v.fuso), { hint: 'Com um fuso, entram profissionais a até 3 horas de diferença.' }) +
            '</div>' +
          '</section>' +
          '<section class="card"><h2 class="card-title">Salário</h2>' +
            '<p class="row-sub">Opcional, mas vagas com salário recebem mais candidaturas.</p>' +
            field('v-moeda', 'Moeda', 'select', '', options(D.moedas, null, v.moeda || D.moedaPorPais[paisV] || 'USD')) +
            '<div class="grid-2">' + field('v-min', 'De', 'input', 'type="number" min="0" step="0.01" inputmode="decimal"', '') +
              field('v-max', 'Até', 'input', 'type="number" min="0" step="0.01" inputmode="decimal"', '') + '</div>' +
            field('v-periodo', 'Período', 'select', '', options(D.periodos, null, v.periodo || 'mes')) +
          '</section>' +
          '<section class="card"><h2 class="card-title">Requisitos</h2>' +
            field('v-exp', 'Experiência', 'select', '', options(D.experiencias, 'Não exigir', v.experiencia)) +
            field('v-req', 'Requisitos (um por linha)', 'textarea', 'rows="4" maxlength="1500" placeholder="Atendimento ao público\nEnsino médio completo"', '', { hint: 'Até ' + D.limiteRequisitos + '. Não peça idade, gênero, foto ou estado civil.' }) +
            field('v-comp', 'Competências desejadas', 'input', 'type="text" maxlength="400" placeholder="Atendimento, Caixa, Organização"', '', { hint: 'Separe por vírgula. Até ' + D.limiteCompetencias + '. Elas ajudam a indicar quem combina com a vaga.' }) +
          '</section>' +
          '<section class="card"><h2 class="card-title">Perguntas de triagem</h2>' +
            '<p class="row-sub">Até ' + D.limitePerguntasTriagem + ' perguntas. Nenhuma resposta elimina o candidato: você só vê as respostas e decide.</p>' +
            '<div id="triagem-area">' + triagemHtml() + '</div>' +
          '</section>' +
          '<p class="form-status" id="form-status" role="alert"></p>' +
          '<div class="btn-row">' +
            '<button type="submit" class="btn btn-primary btn-lg" id="v-publicar">' + (editando && v.status !== 'rascunho' ? 'Salvar alterações' : 'Publicar vaga') + '</button>' +
            (!editando || v.status === 'rascunho' ? '<button type="button" class="btn btn-outline" id="v-rascunho">Salvar como rascunho</button>' : '') +
          '</div>' +
        '</form>';

      $('#v-titulo').value = v.titulo || '';
      $('#v-descricao').value = v.descricao || '';
      $('#v-posicoes').value = v.posicoes || 1;
      $('#v-min').value = v.salario_min != null ? v.salario_min : '';
      $('#v-max').value = v.salario_max != null ? v.salario_max : '';
      $('#v-req').value = (v.requisitos || []).join('\n');
      $('#v-comp').value = (v.competencias || []).join(', ');

      var cidade = ligarCidade('v-cidade', function () { return $('#v-pais').value; }, localV);
      $('#v-pais').addEventListener('change', function () {
        cidade.limpar();
        $('#v-raio').innerHTML = opcoesRaio($('#v-pais').value);
        var m = D.moedaPorPais[$('#v-pais').value]; if (m && !v.id) $('#v-moeda').value = m;
      });
      $('#f-v-modelo').addEventListener('change', function () {
        var remoto = marcados('v-modelo')[0] === 'remoto';
        $('#local-presencial').hidden = remoto; $('#local-remoto').hidden = !remoto;
      });
      $('#triagem-area').addEventListener('click', function (e) {
        if (e.target.closest('#tr-add')) { lerTriagem(); triagem.push({ texto: '', tipo: 'sim_nao', opcoes: [] }); $('#triagem-area').innerHTML = triagemHtml(); $('#tr-texto-' + (triagem.length - 1)).focus(); }
        var rm = e.target.closest('[data-tr-remover]');
        if (rm) { lerTriagem(); triagem.splice(Number(rm.getAttribute('data-tr-remover')), 1); $('#triagem-area').innerHTML = triagemHtml(); }
      });
      $('#triagem-area').addEventListener('change', function (e) { if (/^tr-tipo-/.test(e.target.name || '')) pintarTriagem(); });

      function montar(publicar) {
        lerTriagem();
        var mod = marcados('v-modelo')[0] || 'presencial';
        var local = mod === 'remoto' ? null : cidade.valor();
        var min = $('#v-min').value === '' ? null : Number($('#v-min').value);
        var max = $('#v-max').value === '' ? null : Number($('#v-max').value);
        var reqs = $('#v-req').value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
        var comp = $('#v-comp').value.split(',').map(function (x) { return x.trim(); }).filter(Boolean).filter(function (x, i, a) { return a.indexOf(x) === i; });
        var regras = [{ id: 'v-titulo', ok: $('#v-titulo').value.trim().length >= 3, msg: 'Informe o cargo (pelo menos 3 letras).' }];
        if (publicar) {
          regras.push({ id: 'v-tipo', ok: !!$('#v-tipo').value, msg: 'Escolha o tipo de contratação.' });
          regras.push({ id: 'v-posicoes', ok: Number($('#v-posicoes').value) >= 1 && Number($('#v-posicoes').value) <= 100, msg: 'Informe de 1 a 100 pessoas.' });
          if (mod !== 'remoto') {
            regras.push({ id: 'v-pais', ok: !!$('#v-pais').value, msg: 'Selecione o país.' });
            regras.push({ id: 'v-cidade', ok: !!local, msg: $('#v-cidade').value.trim() ? 'Escolha a cidade na lista de sugestões.' : 'Informe a cidade da vaga.' });
          }
        }
        regras.push({ id: 'v-max', ok: min == null || max == null || max >= min, msg: 'O valor máximo precisa ser maior ou igual ao mínimo.' });
        regras.push({ id: 'v-req', ok: reqs.length <= D.limiteRequisitos, msg: 'Use no máximo ' + D.limiteRequisitos + ' requisitos.' });
        var proibidoReq = reqs.map(triagemProibida).filter(Boolean)[0];
        if (proibidoReq) regras.push({ id: 'v-req', ok: false, msg: 'Requisitos não podem falar de "' + proibidoReq + '". Esse tema é proibido em processos seletivos.' });
        regras.push({ id: 'v-comp', ok: comp.length <= D.limiteCompetencias, msg: 'Use no máximo ' + D.limiteCompetencias + ' competências.' });
        triagem.forEach(function (t, i) {
          var proibido = triagemProibida(t.texto + ' ' + (t.opcoes || []).join(' '));
          regras.push({ id: 'tr-texto-' + i, ok: t.texto.length >= 5 && !proibido,
            msg: proibido ? 'A pergunta não pode falar de "' + proibido + '". Esse tema é proibido em processos seletivos.' : 'Escreva a pergunta.' });
          if (t.tipo === 'opcoes') regras.push({ id: 'tr-opcoes-' + i, ok: t.opcoes.length >= 2 && t.opcoes.length <= D.limiteOpcoesTriagem, msg: 'Informe de 2 a ' + D.limiteOpcoesTriagem + ' opções.' });
        });
        var ok = check(regras);
        status(ok ? '' : 'Revise os campos destacados.');
        if (!ok) return null;
        return {
          titulo: $('#v-titulo').value.trim(), tipo: $('#v-tipo').value || null, descricao: $('#v-descricao').value.trim() || null,
          posicoes: Math.max(1, Number($('#v-posicoes').value) || 1), modelo: mod,
          cidade: local ? local.cidade : null, estado: local ? (local.estado || null) : null, pais: local ? local.pais : (mod === 'remoto' ? null : ($('#v-pais').value || null)),
          lat: local ? local.lat : null, lng: local ? local.lng : null,
          raio_valor: mod === 'remoto' ? null : Number($('#v-raio').value), raio_unidade: mod === 'remoto' ? null : (usaMilhas($('#v-pais').value) ? 'mi' : 'km'),
          fuso: mod === 'remoto' && $('#v-fuso').value !== '' ? Number($('#v-fuso').value) : null,
          moeda: (min != null || max != null) ? $('#v-moeda').value : null, salario_min: min, salario_max: max,
          periodo: (min != null || max != null) ? $('#v-periodo').value : null,
          experiencia: $('#v-exp').value || null, requisitos: reqs, competencias: comp, triagem: triagem
        };
      }

      function salvar(publicar, btn) {
        var dados = montar(publicar);
        if (!dados) return;
        if (publicar) dados.status = editando && v.status !== 'rascunho' ? v.status : 'aberta';
        else dados.status = 'rascunho';
        ocupado(btn, true, 'Salvando…');
        var q = editando
          ? sb.from('vagas').update(dados).eq('id', v.id).select().maybeSingle()
          : sb.from('vagas').insert(Object.assign({ empresa_id: emp.id }, dados)).select().maybeSingle();
        q.then(function (r) {
          ocupado(btn, false);
          if (r.error) { status(erroComDetalhe(r.error)); return; }
          var salva = r.data;
          var publicada = salva.status === 'aberta' && (!editando || v.status === 'rascunho');
          $('#content').innerHTML = '<div class="done"><div class="icon-tile lg blue">' + icon('check', 30, { stroke: 2 }) + '</div>' +
            '<h2 id="done-title" tabindex="-1">' + (publicada ? 'Vaga publicada' : (salva.status === 'rascunho' ? 'Rascunho salvo' : 'Vaga atualizada')) + '</h2>' +
            '<p class="done-text">' + (publicada ? 'Profissionais da região já podem encontrar e se candidatar a <strong>' + esc(salva.titulo) + '</strong>. Responda cada candidato em até 7 dias.'
              : (salva.status === 'rascunho' ? 'A vaga fica guardada e só aparece para os profissionais quando você publicar.' : 'As mudanças em <strong>' + esc(salva.titulo) + '</strong> foram salvas.')) + '</p>' +
            '<div class="btn-row done-actions">' +
              (salva.status === 'aberta' ? '<a href="candidatos.html?vaga=' + encodeURIComponent(salva.id) + '" class="btn btn-primary">Ver candidatos</a>' : '') +
              '<a href="vagas.html" class="btn btn-outline">Minhas vagas</a>' +
              '<a href="vaga.html?id=' + encodeURIComponent(salva.id) + '" class="btn btn-outline">Ver como o profissional vê</a></div></div>';
          window.scrollTo(0, 0);
          $('#done-title').focus();
        });
      }

      $('#vaga-form').addEventListener('submit', function (e) { e.preventDefault(); salvar(true, $('#v-publicar')); });
      var bR = $('#v-rascunho');
      if (bR) bR.addEventListener('click', function () { salvar(false, bR); });
    }
  }

  /* ---------- Empresa: minhas vagas ---------- */

  function renderVagas() {
    topo('Minhas vagas', 'inicio.html');
    var grupo = params.get('grupo') || 'abertas';
    var GRUPOS = [
      { id: 'abertas', rotulo: 'Abertas', status: ['aberta'] }, { id: 'pausadas', rotulo: 'Pausadas', status: ['pausada'] },
      { id: 'rascunhos', rotulo: 'Rascunhos', status: ['rascunho'] }, { id: 'encerradas', rotulo: 'Encerradas', status: ['preenchida', 'cancelada', 'expirada'] }
    ];
    var conta, vagas = [], cands = [], confirmando = null;

    contaDoTipo('empresa').then(function (c) {
      if (!c) return;
      conta = c;
      navBeta('empresa', 'vagas');
      return carregar();
    }).catch(function (err) { erroCarregar(err); });

    function carregar() {
      return sb.from('vagas').select('*').eq('empresa_id', conta.dados.id).order('criado_em', { ascending: false }).then(function (r) {
        if (r.error) throw r.error;
        vagas = r.data || [];
        if (!vagas.length) return { data: [] };
        return sb.from('candidaturas').select('vaga_id,status').in('vaga_id', vagas.map(function (v) { return v.id; }));
      }).then(function (r) {
        if (r.error) throw r.error;
        cands = r.data || [];
        pintar();
      });
    }

    function pintar() {
      var g = GRUPOS.filter(function (x) { return x.id === grupo; })[0] || GRUPOS[0];
      var lista = vagas.filter(function (v) { return g.status.indexOf(v.status) !== -1; });
      $('#content').innerHTML =
        '<a href="publicar-vaga.html" class="btn btn-primary" id="nova-vaga">' + icon('plus', 16, { stroke: 2.4 }) + 'Publicar vaga</a>' +
        '<div class="filter" role="group" aria-label="Filtrar vagas" id="vagas-filtro">' + GRUPOS.map(function (x) {
          var n = vagas.filter(function (v) { return x.status.indexOf(v.status) !== -1; }).length;
          return '<button type="button" data-grupo="' + x.id + '" aria-pressed="' + (x.id === g.id) + '">' + x.rotulo + ' · ' + n + '</button>';
        }).join('') + '</div>' +
        (lista.length ? lista.map(cartao).join('') : vazio(
          g.id === 'abertas' ? 'Nenhuma vaga aberta' : 'Nada por aqui',
          g.id === 'abertas' ? 'Publique uma vaga para começar a receber candidatos da sua região.' : 'Quando houver vagas neste estado, elas aparecem aqui.',
          g.id === 'abertas' ? '<a href="publicar-vaga.html" class="btn btn-primary">Publicar vaga</a>' : '')) +
        '<p class="form-status" id="form-status" role="alert"></p>';
    }

    function cartao(v) {
      var dela = cands.filter(function (c) { return c.vaga_id === v.id; });
      var novos = dela.filter(function (c) { return c.status === 'novo'; }).length;
      var st = STATUS_VAGA[v.status];
      var acoes = [];
      if (['aberta', 'pausada'].indexOf(v.status) !== -1) acoes.push('<a href="candidatos.html?vaga=' + encodeURIComponent(v.id) + '" class="btn btn-primary">Ver candidatos</a>');
      if (v.status === 'rascunho') acoes.push('<button type="button" class="btn btn-primary" data-acao="publicar" data-id="' + v.id + '">Publicar</button>');
      if (['rascunho', 'aberta', 'pausada'].indexOf(v.status) !== -1) acoes.push('<a href="publicar-vaga.html?id=' + encodeURIComponent(v.id) + '" class="btn btn-outline">Editar</a>');
      if (v.status === 'aberta') acoes.push('<button type="button" class="btn btn-outline" data-acao="pausar" data-id="' + v.id + '">Pausar</button>');
      if (v.status === 'pausada') acoes.push('<button type="button" class="btn btn-outline" data-acao="reativar" data-id="' + v.id + '">Reativar</button>');
      if (['aberta', 'pausada'].indexOf(v.status) !== -1) acoes.push('<button type="button" class="btn btn-outline btn-quiet" data-acao="cancelar" data-id="' + v.id + '">Cancelar vaga</button>');
      if (v.status === 'rascunho') acoes.push('<button type="button" class="btn btn-outline btn-quiet" data-acao="apagar" data-id="' + v.id + '">Apagar</button>');
      var confirmar = confirmando && confirmando.id === v.id
        ? '<div class="card-warn confirmar" role="alert"><p class="row-sub">' + (confirmando.acao === 'cancelar'
            ? 'Cancelar a vaga avisa os ' + plural(dela.filter(function (c) { return c.status === 'novo' || c.status === 'conversa'; }).length, 'candidato', 'candidatos') + ' em andamento. Ela não pode ser reaberta.'
            : 'Apagar o rascunho? Não dá para desfazer.') + '</p>' +
          '<div class="btn-row"><button type="button" class="btn btn-primary" data-acao="confirmar-' + confirmando.acao + '" data-id="' + v.id + '">' + (confirmando.acao === 'cancelar' ? 'Sim, cancelar vaga' : 'Sim, apagar') + '</button>' +
          '<button type="button" class="btn btn-outline" data-acao="voltar" data-id="' + v.id + '">Voltar</button></div></div>' : '';
      return '<article class="card vaga-card" data-vaga="' + v.id + '"><div class="head-row"><h3 class="row-title">' + esc(v.titulo) + '</h3>' +
          '<span class="chip ' + st.chip + '">' + st.rotulo + '</span></div>' +
        '<p class="row-sub">' + esc(localVagaTexto(v)) + (v.tipo ? ' · ' + esc(rotuloDe(D.tipos, v.tipo)) : '') + '</p>' +
        '<p class="row-sub">' + (v.publicada_em ? 'Publicada em ' + dataBR(v.publicada_em) : 'Criada em ' + dataBR(v.criado_em)) +
          (v.encerrada_em ? ' · encerrada em ' + dataBR(v.encerrada_em) : '') + '</p>' +
        (v.status !== 'rascunho' ? '<div class="chips"><span class="chip">' + plural(dela.length, 'candidato', 'candidatos') + '</span>' +
          (novos ? '<span class="chip blue">' + plural(novos, 'novo', 'novos') + '</span>' : '') + '</div>' : '') +
        confirmar + (confirmar ? '' : '<div class="btn-row">' + acoes.join('') + '</div>') + '</article>';
    }

    $('#content').addEventListener('click', function (e) {
      var f = e.target.closest('[data-grupo]');
      if (f) { grupo = f.getAttribute('data-grupo'); confirmando = null; pintar(); return; }
      var b = e.target.closest('[data-acao]');
      if (!b) return;
      var acao = b.getAttribute('data-acao'), id = b.getAttribute('data-id');
      if (acao === 'cancelar' || acao === 'apagar') { confirmando = { id: id, acao: acao }; pintar(); return; }
      if (acao === 'voltar') { confirmando = null; pintar(); return; }
      var novoStatus = { publicar: 'aberta', pausar: 'pausada', reativar: 'aberta', 'confirmar-cancelar': 'cancelada' }[acao];
      ocupado(b, true, 'Aguarde…');
      var q = acao === 'confirmar-apagar' ? sb.from('vagas').delete().eq('id', id) : sb.from('vagas').update({ status: novoStatus }).eq('id', id);
      q.then(function (r) {
        confirmando = null;
        if (r.error) { ocupado(b, false); status(erroComDetalhe(r.error)); return; }
        toast({ publicar: 'Vaga publicada.', pausar: 'Vaga pausada. Ela some das buscas até você reativar.', reativar: 'Vaga reativada.',
          'confirmar-cancelar': 'Vaga cancelada. Os candidatos em andamento foram avisados.', 'confirmar-apagar': 'Rascunho apagado.' }[acao]);
        carregar();
      });
    });
  }

  /* ---------- Empresa: candidatos de uma vaga ---------- */

  function cartaoCandidato(c, v, comAcoes) {
    var p = c.profissionais || {};
    var km = v && v.modelo !== 'remoto' ? distanciaKm(p, v) : null;
    var emComum = comum(p.competencias, (v && v.competencias) || []);
    var st = STATUS_CAND[c.status];
    var triagem = (v && v.triagem) || [];
    var resp = c.respostas_triagem || {};
    var acoes = '';
    if (comAcoes) {
      acoes = '<div class="btn-row">' +
        '<a href="ver-profissional.html?id=' + encodeURIComponent(c.profissional_id) + '&vaga=' + encodeURIComponent(c.vaga_id) + '" class="btn btn-outline">Ver perfil</a>' +
        (c.status === 'novo' ? '<button type="button" class="btn btn-primary" data-cand="conversa" data-id="' + c.id + '">Chamar para conversa</button>' : '') +
        (c.status === 'conversa' ? '<button type="button" class="btn btn-primary" data-msg="' + c.id + '">' + icon('message', 16, { stroke: 2 }) + 'Mensagem</button>' +
          '<a href="registrar-contratacao.html?prof=' + encodeURIComponent(c.profissional_id) + '&vaga=' + encodeURIComponent(c.vaga_id) + '" class="btn btn-outline">Registrar contratação</a>' : '') +
        (c.status === 'novo' || c.status === 'conversa' ? '<button type="button" class="btn btn-outline btn-quiet" data-cand="nao" data-id="' + c.id + '">Não selecionar</button>' : '') +
        (c.status === 'nao' ? '<button type="button" class="btn btn-outline btn-quiet" data-cand="novo" data-id="' + c.id + '">Desfazer</button>' : '') +
        '</div>';
    }
    return '<article class="card cand-card" data-cand-id="' + c.id + '">' +
      '<div class="media center"><div class="avatar lg blue">' + esc(iniciais(p.nome)) + '</div>' +
        '<div class="row-main"><div class="row-title" style="font-weight:800">' + esc(p.nome || 'Profissional') + '</div>' +
        '<div class="row-sub">' + esc(p.resumo || '') + '</div>' +
        '<div class="row-sub loc-line">' + esc([p.cidade ? p.cidade + (p.estado ? ', ' + p.estado : '') : '', distanciaTexto(km, codigoPais(v && v.pais)) ? distanciaTexto(km, codigoPais(v.pais)) + ' da vaga' : ''].filter(Boolean).join(' · ')) + '</div></div></div>' +
      '<div class="chips"><span class="chip ' + st.chip + '">' + st.rotulo + '</span>' + prazoResposta(c) +
        (emComum.length ? '<span class="chip green">' + plural(emComum.length, 'competência em comum', 'competências em comum') + '</span>' : '') +
        (p.disponibilidade ? '<span class="chip">' + esc(p.disponibilidade) + '</span>' : '') + '</div>' +
      '<div class="cand-block"><p class="row-sub">Candidatura em ' + dataBR(c.criado_em) + '</p>' +
        (c.mensagem ? '<blockquote class="sr-msg">' + esc(c.mensagem) + '</blockquote>' : '') +
        (triagem.length ? '<dl class="summary">' + triagem.map(function (t, i) {
          return '<div><dt>' + esc(t.texto) + '</dt><dd>' + esc(resp[i] || resp[String(i)] || '—') + '</dd></div>';
        }).join('') + '</dl>' : '') +
        (c.pretensao_valor != null ? '<p class="row-sub">Pretensão: <strong>' + esc(dinheiro(Number(c.pretensao_valor), c.pretensao_moeda) + ' ' + rotuloDe(D.periodos, c.pretensao_periodo)) + '</strong></p>' : '') +
      '</div>' + acoes + '</article>';
  }

  function renderCandidatos() {
    topo('Candidatos', 'vagas.html');
    var vagaId = params.get('vaga');
    var filtro = params.get('status') || 'novo';
    var conta, vagas = [], v = null, cands = [];

    contaDoTipo('empresa').then(function (c) {
      if (!c) return;
      conta = c;
      navBeta('empresa', 'candidatos');
      return sb.from('vagas').select('*').eq('empresa_id', conta.dados.id).in('status', ['aberta', 'pausada', 'preenchida', 'cancelada', 'expirada'])
        .order('publicada_em', { ascending: false, nullsFirst: false }).then(function (r) {
          if (r.error) throw r.error;
          vagas = r.data || [];
          if (!vagas.length) {
            $('#content').innerHTML = vazio('Nenhuma vaga publicada', 'Os candidatos aparecem aqui quando você publicar uma vaga.', '<a href="publicar-vaga.html" class="btn btn-primary">Publicar vaga</a>');
            return;
          }
          v = vagas.filter(function (x) { return x.id === vagaId; })[0] || vagas.filter(function (x) { return x.status === 'aberta'; })[0] || vagas[0];
          return carregar();
        });
    }).catch(function (err) { erroCarregar(err); });

    function carregar() {
      return sb.from('candidaturas').select('*, profissionais(*)').eq('vaga_id', v.id).order('criado_em', { ascending: true }).then(function (r) {
        if (r.error) throw r.error;
        cands = r.data || [];
        pintar();
      });
    }

    function pintar() {
      var etapas = ['novo', 'conversa', 'nao', 'retirada', 'encerrada', 'contratado'].filter(function (s) {
        return s === 'novo' || s === 'conversa' || s === 'nao' || cands.some(function (c) { return c.status === s; });
      });
      if (etapas.indexOf(filtro) === -1) filtro = 'novo';
      var lista = cands.filter(function (c) { return c.status === filtro; });
      var st = STATUS_VAGA[v.status];
      $('#content').innerHTML =
        (vagas.length > 1 ? field('trocar-vaga', 'Vaga', 'select', '', vagas.map(function (x) {
          return '<option value="' + x.id + '"' + (x.id === v.id ? ' selected' : '') + '>' + esc(x.titulo + ' · ' + STATUS_VAGA[x.status].rotulo) + '</option>';
        }).join('')) : '') +
        '<div class="card" id="vaga-head"><div class="head-row"><h2 class="card-title">' + esc(v.titulo) + '</h2><span class="chip ' + st.chip + '">' + st.rotulo + '</span></div>' +
          '<p class="row-sub">' + esc(localVagaTexto(v)) + ' · ' + plural(cands.length, 'candidato', 'candidatos') + '</p></div>' +
        '<div class="filter" role="group" aria-label="Filtrar por status" id="cand-filter">' + etapas.map(function (s) {
          return '<button type="button" data-status="' + s + '" aria-pressed="' + (s === filtro) + '">' + STATUS_CAND[s].grupo + ' · ' + cands.filter(function (c) { return c.status === s; }).length + '</button>';
        }).join('') + '</div>' +
        (filtro === 'novo' && lista.length ? aviso('Responda cada candidato em até ' + D.prazoRespostaDias + ' dias: chame para conversa ou marque como não selecionado. A resposta garantida conta na reputação da empresa.') : '') +
        (lista.length ? lista.map(function (c) { return cartaoCandidato(c, v, true); }).join('')
          : vazio(cands.length ? 'Ninguém nesta etapa' : 'Ainda não há candidatos', cands.length ? 'Escolha outra etapa acima.' : 'Quando alguém se candidatar, aparece aqui. Vagas com salário e descrição completa recebem mais candidaturas.')) +
        '<p class="form-status" id="form-status" role="alert"></p>';
      var sel = $('#trocar-vaga');
      if (sel) sel.addEventListener('change', function () {
        v = vagas.filter(function (x) { return x.id === sel.value; })[0];
        filtro = 'novo';
        history.replaceState(null, '', 'candidatos.html?vaga=' + encodeURIComponent(v.id));
        carregar();
      });
    }

    $('#content').addEventListener('click', function (e) {
      var f = e.target.closest('[data-status]');
      if (f) { filtro = f.getAttribute('data-status'); pintar(); return; }
      var m = e.target.closest('[data-msg]');
      if (m) {
        var cm = cands.filter(function (x) { return x.id === m.getAttribute('data-msg'); })[0];
        ocupado(m, true, 'Abrindo…');
        abrirConversa(conta.dados.id, cm.profissional_id, v.id).catch(function (err) { ocupado(m, false); status(erroComDetalhe(err)); });
        return;
      }
      var b = e.target.closest('[data-cand]');
      if (!b) return;
      var novo = b.getAttribute('data-cand');
      var cand = cands.filter(function (x) { return x.id === b.getAttribute('data-id'); })[0];
      ocupado(b, true, 'Salvando…');
      sb.from('candidaturas').update({ status: novo }).eq('id', cand.id).then(function (r) {
        if (r.error) { ocupado(b, false); status(erroComDetalhe(r.error)); return; }
        if (novo === 'conversa') {
          var primeiro = ((cand.profissionais && cand.profissionais.nome) || '').split(' ')[0];
          return abrirConversa(conta.dados.id, cand.profissional_id, v.id,
            'Oi, ' + primeiro + '! Vimos sua candidatura para ' + v.titulo + ' e gostaríamos de conversar. Você tem disponibilidade esta semana?');
        }
        toast({ nao: 'Candidato marcado como não selecionado. Ele vê o retorno nas candidaturas dele.', novo: 'Status desfeito.' }[novo]);
        carregar();
      }).catch(function (err) { ocupado(b, false); status(erroComDetalhe(err)); });
    });
  }

  /* ---------- Empresa: perfil de um profissional ---------- */

  function renderVerProfissional() {
    var id = params.get('id'), vagaId = params.get('vaga');
    topo('Perfil do profissional', vagaId ? 'candidatos.html?vaga=' + encodeURIComponent(vagaId) : 'candidatos.html');
    contaDoTipo('empresa').then(function (conta) {
      if (!conta) return;
      navBeta('empresa', 'candidatos');
      return Promise.all([
        sb.from('profissionais').select('*').eq('id', id).maybeSingle(),
        sb.from('experiencias').select('*').eq('profissional_id', id).order('inicio', { ascending: false, nullsFirst: false }),
        carregarReputacao('profissional', id),
        vagaId ? sb.from('vagas').select('*').eq('id', vagaId).maybeSingle() : Promise.resolve({ data: null })
      ]).then(function (rs) {
        var p = rs[0].data;
        if (rs[0].error) throw rs[0].error;
        if (!p) { $('#content').innerHTML = vazio('Perfil indisponível', 'O profissional pode ter ocultado o perfil ou apagado a conta.', '<a href="candidatos.html" class="btn btn-primary">Voltar</a>'); return; }
        var exps = rs[1].data || [], rep = rs[2].rep, avsPub = rs[2].avs, v = rs[3].data;
        var km = v && v.modelo !== 'remoto' ? distanciaKm(p, v) : null;
        var verificadas = exps.filter(function (x) { return x.contratacao_id; }), declaradas = exps.filter(function (x) { return !x.contratacao_id; });
        function exp(x) {
          return '<li class="exp-item"><div class="row-title">' + esc(x.cargo) + '</div><div class="row-sub">' + esc(x.mostrar_empresa === false ? 'Empresa não divulgada' : x.empresa_nome) +
            (x.inicio ? ' · ' + new Date(x.inicio + 'T12:00:00').getFullYear() + ' – ' + (x.fim ? new Date(x.fim + 'T12:00:00').getFullYear() : 'atual') : '') + '</div></li>';
        }
        $('#content').innerHTML =
          '<section class="card"><div class="media center"><div class="avatar xl blue">' + esc(iniciais(p.nome)) + '</div>' +
            '<div class="row-main"><h2 class="page-title">' + esc(p.nome) + '</h2><div class="row-sub">' + esc(p.resumo || '') + '</div>' +
            '<div class="row-sub loc-line">' + esc([p.cidade ? p.cidade + (p.estado ? ', ' + p.estado : '') + ' · ' + paisNome(codigoPais(p.pais)) : '', km != null ? distanciaTexto(km, codigoPais(v.pais)) + ' da vaga' : ''].filter(Boolean).join(' · ')) + '</div></div></div>' +
            '<div class="chips">' + (rep && !rep.em_construcao ? '<span class="chip">Nota ' + String(rep.nota).replace('.', ',') + ' · ' + plural(rep.trabalhos, 'trabalho verificado', 'trabalhos verificados') + '</span>'
              : '<span class="chip blue">Novo na plataforma · reputação em construção</span>') +
              (p.disponibilidade ? '<span class="chip green">' + esc(p.disponibilidade) + '</span>' : '') + '</div></section>' +
          '<section class="section"><h2>Trabalho que procura</h2><div class="card"><dl class="summary">' +
            '<div><dt>Modelos</dt><dd>' + esc((p.modelos || []).map(function (m) { return MODELOS_ROT[m]; }).join(', ')) + '</dd></div>' +
            '<div><dt>Distância máxima</dt><dd>' + esc(usaMilhas(codigoPais(p.pais)) ? Math.round(p.distancia_max_km * 0.621371) + ' mi' : p.distancia_max_km + ' km') + (p.aceita_mudar ? ' · aceita se mudar' : '') + '</dd></div></dl></div></section>' +
          ((p.competencias || []).length ? '<section class="section"><h2>Competências</h2>' + chipsLista(p.competencias) +
            (v && comum(p.competencias, v.competencias).length ? '<p class="row-sub">Em comum com a vaga: ' + esc(comum(p.competencias, v.competencias).join(', ')) + '</p>' : '') + '</section>' : '') +
          (p.sobre ? '<section class="section"><h2>Sobre</h2><p class="prose">' + esc(p.sobre) + '</p></section>' : '') +
          '<section class="section"><h2>Experiência verificada</h2>' + (verificadas.length ? '<ul class="card exp-list">' + verificadas.map(exp).join('') + '</ul>'
            : '<p class="row-sub">Ainda sem trabalhos verificados. Eles aparecem quando uma contratação é confirmada pelos dois lados.</p>') + '</section>' +
          (declaradas.length ? '<section class="section"><h2>Experiência declarada</h2><ul class="card exp-list">' + declaradas.map(exp).join('') + '</ul></section>' : '') +
          '<section class="section" id="reputacao"><h2>Reputação</h2>' + repHtml(rep, 'profissional') + avaliacoesHtml(avsPub, 'profissional', false) + '</section>';
      });
    }).catch(function (err) { erroCarregar(err, 'candidatos.html'); });
  }

  /* ---------- Profissional: vagas abertas ---------- */

  // Vagas abertas com o nome da empresa (as do próprio profissional também vêm, se ele se candidatou).
  function vagasAbertas() {
    return sb.from('vagas').select('*, empresas(id, nome, verificada, setor)').eq('status', 'aberta')
      .order('publicada_em', { ascending: false }).limit(500).then(function (r) { if (r.error) throw r.error; return r.data || []; });
  }

  function cartaoVaga(v, p, minhas) {
    var alc = p ? vagaAlcanca(v, p) : { ok: true, km: null };
    var em = p ? comum(p.competencias, v.competencias) : [];
    var ja = minhas && minhas[v.id];
    return '<article class="card card-tap vaga-item">' +
      '<div class="row-main"><h3 class="row-title vaga-title"><a href="vaga.html?id=' + encodeURIComponent(v.id) + '" class="card-link">' + esc(v.titulo) + '</a></h3>' +
      '<div class="row-sub">' + esc((v.empresas && v.empresas.nome) || 'Empresa') + ' · ' + esc(MODELOS_ROT[v.modelo]) + (v.tipo ? ' · ' + esc(rotuloDe(D.tipos, v.tipo)) : '') + '</div>' +
      '<div class="row-sub loc-line">' + esc(localVagaTexto(v)) + (alc.km != null ? ' · ' + esc(distanciaTexto(alc.km, codigoPais(p.pais))) + ' de você' : '') + '</div></div>' +
      '<div class="chips"><span class="chip">' + esc(salarioTexto(v)) + '</span>' +
        (em.length ? '<span class="chip green">' + plural(em.length, 'competência em comum', 'competências em comum') + '</span>' : '') +
        (ja ? '<span class="chip blue">' + icon('check', 12, { stroke: 2.6 }) + 'Você se candidatou</span>' : '') +
        (v.empresas && !v.empresas.verificada ? '' : '') + '</div></article>';
  }

  function renderBuscar() {
    topo('Buscar vagas', 'inicio.html');
    var conta, vagas = [], minhas = {};
    contaDoTipo('profissional').then(function (c) {
      if (!c) return;
      conta = c;
      navBeta('profissional', 'buscar');
      return Promise.all([vagasAbertas(), sb.from('candidaturas').select('vaga_id').eq('profissional_id', conta.user.id)]).then(function (rs) {
        vagas = rs[0];
        (rs[1].data || []).forEach(function (x) { minhas[x.vaga_id] = true; });
        montar();
      });
    }).catch(function (err) { erroCarregar(err); });

    function montar() {
      var p = conta.dados;
      $('#content').innerHTML =
        '<form class="search-form" id="busca-form" role="search" onsubmit="return false">' +
          '<label class="visually-hidden" for="busca-q">Buscar vagas</label>' +
          '<input id="busca-q" type="search" placeholder="Cargo, competência ou empresa" autocomplete="off" value="' + esc(params.get('q') || '') + '"></form>' +
        '<div class="filter" role="group" aria-label="Modelo de trabalho" id="busca-modelo">' +
          [{ id: '', rotulo: 'Todos' }].concat(D.modelos).map(function (m, i) {
            return '<button type="button" data-modelo="' + m.id + '" aria-pressed="' + (i === 0) + '">' + m.rotulo + '</button>';
          }).join('') + '</div>' +
        '<div class="field"><label class="check-row"><input type="checkbox" id="busca-perto" checked><span>Só vagas dentro da minha distância (' +
          esc(usaMilhas(codigoPais(p.pais)) ? Math.round(p.distancia_max_km * 0.621371) + ' mi' : p.distancia_max_km + ' km') + ' de ' + esc(p.cidade || 'onde moro') + ') e remotas</span></label></div>' +
        '<p class="row-sub" id="busca-total" role="status"></p><div id="busca-lista"></div>';
      var modelo = '';
      function filtrar() {
        var q = normalizar($('#busca-q').value);
        var perto = $('#busca-perto').checked;
        var lista = vagas.filter(function (v) {
          if (modelo && v.modelo !== modelo) return false;
          if (perto && !vagaAlcanca(v, p).ok) return false;
          if (q) {
            var alvo = normalizar([v.titulo, v.descricao, (v.empresas && v.empresas.nome), (v.competencias || []).join(' '), (v.requisitos || []).join(' ')].join(' '));
            if (alvo.indexOf(q) === -1) return false;
          }
          return true;
        }).sort(function (a, b) {
          var ka = vagaAlcanca(a, p).km, kb = vagaAlcanca(b, p).km;
          return (ka == null ? Infinity : ka) - (kb == null ? Infinity : kb);  // remotas depois das presenciais mais próximas
        });
        $('#busca-total').textContent = plural(lista.length, 'vaga encontrada', 'vagas encontradas');
        $('#busca-lista').innerHTML = lista.length ? lista.map(function (v) { return cartaoVaga(v, p, minhas); }).join('')
          : vazio('Nenhuma vaga encontrada', perto ? 'Tente desmarcar "Só vagas dentro da minha distância" ou buscar outro termo.' : 'Tente outro termo de busca.');
      }
      $('#busca-q').addEventListener('input', filtrar);
      $('#busca-perto').addEventListener('change', filtrar);
      $('#busca-modelo').addEventListener('click', function (e) {
        var b = e.target.closest('[data-modelo]'); if (!b) return;
        modelo = b.getAttribute('data-modelo');
        $all('#busca-modelo button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        filtrar();
      });
      filtrar();
    }
  }

  /* ---------- Vaga (profissional se candidata; empresa e visitante só veem) ---------- */

  function renderVaga() {
    var id = params.get('id');
    topo('Detalhe da vaga', 'buscar.html');
    var conta = null, v, cand = null;
    sessaoAtual().then(function (s) {
      return (s ? carregarConta(s) : Promise.resolve(null)).then(function (c) {
        conta = c && c.perfil ? c : null;
        if (conta) navBeta(conta.perfil.tipo, conta.perfil.tipo === 'empresa' ? 'vagas' : 'buscar');
        else { $('#nav').hidden = true; $('#topbar').innerHTML = '<a href="entrar.html" class="icon-btn" aria-label="Entrar">' + icon('back', 22, { stroke: 2 }) + '</a><h1 class="topbar-title">Vaga</h1>'; }
        if (conta && conta.perfil.tipo === 'empresa') topo('Detalhe da vaga', 'vagas.html');
        return Promise.all([
          sb.from('vagas').select('*, empresas(id, nome, verificada, setor, porte, site, descricao, cidade, estado, pais)').eq('id', id).maybeSingle(),
          conta && conta.perfil.tipo === 'profissional' ? sb.from('candidaturas').select('*').eq('vaga_id', id).eq('profissional_id', conta.user.id).maybeSingle() : Promise.resolve({ data: null })
        ]);
      });
    }).then(function (rs) {
      if (rs[0].error) throw rs[0].error;
      v = rs[0].data; cand = rs[1].data;
      if (!v) { $('#content').innerHTML = vazio('Vaga não encontrada', 'Ela pode ter sido encerrada ou removida pela empresa.', '<a href="buscar.html" class="btn btn-primary">Buscar vagas</a>'); return; }
      pintar();
    }).catch(function (err) { erroCarregar(err, 'buscar.html'); });

    function pintar() {
      var p = conta && conta.perfil.tipo === 'profissional' ? conta.dados : null;
      var e = v.empresas || {};
      var alc = p ? vagaAlcanca(v, p) : { ok: true, km: null };
      var em = p ? comum(p.competencias, v.competencias) : [];
      var minha = cand ? STATUS_MINHA[cand.status] : null;
      var aberta = v.status === 'aberta';
      var acao;
      if (!conta) acao = '<a href="entrar.html?volta=' + encodeURIComponent('vaga.html?id=' + v.id) + '" class="btn btn-primary">Entrar para se candidatar</a>' +
        '<a href="cadastro.html" class="btn btn-outline">Criar conta grátis</a>';
      else if (conta.perfil.tipo === 'empresa') acao = conta.dados && conta.dados.id === v.empresa_id
        ? '<a href="publicar-vaga.html?id=' + encodeURIComponent(v.id) + '" class="btn btn-outline">Editar vaga</a><a href="candidatos.html?vaga=' + encodeURIComponent(v.id) + '" class="btn btn-primary">Ver candidatos</a>'
        : '';
      else if (cand) acao = '<a href="candidaturas.html" class="btn btn-outline">' + icon('check', 16, { stroke: 2.4 }) + 'Candidatura ' + esc(minha.rotulo.toLowerCase()) + ' · ver status</a>';
      else if (aberta) acao = '<button type="button" class="btn btn-primary" id="candidatar">Candidatar-se</button>';
      else acao = '';
      if (conta && conta.perfil.tipo === 'profissional') acao += '<button type="button" class="btn btn-outline" id="duvida">' + icon('message', 16, { stroke: 2 }) + 'Tirar dúvida com a empresa</button>';

      $('#content').innerHTML =
        '<section class="card"><h2 class="page-title vaga-h">' + esc(v.titulo) + '</h2>' +
          '<div class="row-sub">' + esc(e.nome || '') + (e.verificada ? ' · empresa verificada' : '') + '</div>' +
          '<div class="chips"><span class="chip">' + esc(MODELOS_ROT[v.modelo]) + '</span>' + (v.tipo ? '<span class="chip">' + esc(rotuloDe(D.tipos, v.tipo)) + '</span>' : '') +
            (em.length ? '<span class="chip green">' + plural(em.length, 'competência em comum', 'competências em comum') + '</span>' : '') + '</div>' +
          '<dl class="summary"><div><dt>Local</dt><dd>' + esc(localVagaTexto(v)) + (alc.km != null ? ' · ' + esc(distanciaTexto(alc.km, codigoPais(p.pais))) + ' de você' : '') + '</dd></div>' +
            '<div><dt>Salário</dt><dd>' + esc(salarioTexto(v)) + '</dd></div>' +
            '<div><dt>Posições</dt><dd>' + v.posicoes + '</dd></div>' +
            (v.experiencia ? '<div><dt>Experiência</dt><dd>' + esc(v.experiencia) + '</dd></div>' : '') +
            (v.publicada_em ? '<div><dt>Publicada em</dt><dd>' + dataBR(v.publicada_em) + '</dd></div>' : '') + '</dl>' +
          (p && !alc.ok && aberta ? aviso('Esta vaga fica fora da sua distância máxima ou do modelo de trabalho que você aceita. Você ainda pode se candidatar.', 'amber') : '') +
          (!aberta && !cand ? aviso('Esta vaga não está recebendo candidaturas no momento.', 'amber') : '') +
          (minha ? aviso(minha.texto) : '') +
          '<div class="btn-row" id="vaga-acoes">' + acao + '</div></section>' +
        '<div id="candidatura-area"></div>' +
        (v.descricao ? '<section class="section"><h2>Descrição</h2><p class="prose">' + esc(v.descricao) + '</p></section>' : '') +
        ((v.requisitos || []).length ? '<section class="section"><h2>Requisitos</h2><div class="card"><ul class="req-list">' +
          v.requisitos.map(function (r) { return '<li><span class="req-ico">' + icon('check', 16, { stroke: 2.6 }) + '</span><span>' + esc(r) + '</span></li>'; }).join('') + '</ul></div></section>' : '') +
        ((v.competencias || []).length ? '<section class="section"><h2>Competências</h2>' + chipsLista(v.competencias) + '</section>' : '') +
        '<section class="section"><h2>Sobre a empresa</h2><div class="card"><div class="row-title">' + esc(e.nome || '') + '</div>' +
          '<p class="row-sub">' + esc([e.setor, e.porte, e.cidade ? e.cidade + (e.estado ? ', ' + e.estado : '') : ''].filter(Boolean).join(' · ')) + '</p>' +
          (e.descricao ? '<p class="prose">' + esc(e.descricao) + '</p>' : '') +
          '</div><div id="rep-empresa"></div></section>';
      carregarReputacao('empresa', v.empresa_id).then(function (x) {
        $('#rep-empresa').innerHTML = repHtml(x.rep, 'empresa') + avaliacoesHtml(x.avs.slice(0, 3), 'empresa', false);
      }).catch(function () { $('#rep-empresa').innerHTML = ''; });
      var b = $('#candidatar');
      if (b) b.addEventListener('click', formCandidatura);
      var d = $('#duvida');
      if (d) d.addEventListener('click', function () {
        ocupado(d, true, 'Abrindo…');
        abrirConversa(v.empresa_id, conta.user.id, v.id, 'Olá! Tenho uma dúvida sobre a vaga de ' + v.titulo + ': ')
          .catch(function (err) { ocupado(d, false); status(erroComDetalhe(err)); });
      });
    }

    function formCandidatura() {
      var p = conta.dados;
      var faltam = [];
      if (!p.resumo) faltam.push('o que você faz');
      if (!(p.competencias || []).length) faltam.push('competências');
      if (!p.cidade) faltam.push('cidade');
      if (faltam.length) {
        $('#candidatura-area').innerHTML = '<section class="card card-warn" id="perfil-minimo"><div class="row-title">Complete o perfil antes</div>' +
          '<p class="row-sub">A empresa decide pelo seu perfil. Falta: ' + esc(faltam.join(', ')) + '.</p>' +
          '<a href="perfil.html" class="btn btn-primary">Completar perfil</a></section>';
        $('#perfil-minimo').scrollIntoView({ block: 'center' });
        return;
      }
      var tri = v.triagem || [];
      $('#vaga-acoes').hidden = true;
      $('#candidatura-area').innerHTML =
        '<form class="card form" id="cand-form" novalidate><h2 class="card-title">Sua candidatura</h2>' +
          '<p class="row-sub">A empresa vê seu perfil (' + esc(p.resumo) + ', ' + esc(p.cidade) + ', competências e experiências) junto com o que você escrever aqui.</p>' +
          tri.map(function (t, i) {
            var ops = t.tipo === 'opcoes' ? t.opcoes : ['Sim', 'Não'];
            return group('tr-' + i, t.texto, pills('tr-' + i, ops.map(function (o) { return { id: o, rotulo: o }; })), { req: true });
          }).join('') +
          field('c-msg', 'Mensagem para a empresa (opcional)', 'textarea', 'rows="3" maxlength="1000" placeholder="Por que você combina com a vaga?"', '') +
          '<fieldset class="field group"><legend>Pretensão salarial (opcional)</legend><div class="grid-2">' +
            field('c-valor', 'Valor', 'input', 'type="number" min="0" step="0.01" inputmode="decimal"', '') +
            field('c-moeda', 'Moeda', 'select', '', options(D.moedas, null, v.moeda || D.moedaPorPais[codigoPais(p.pais)] || 'USD')) + '</div>' +
            field('c-periodo', 'Período', 'select', '', options(D.periodos, null, v.periodo || 'mes')) + '</fieldset>' +
          '<p class="form-status" id="form-status" role="alert"></p>' +
          '<div class="btn-row"><button type="submit" class="btn btn-primary btn-lg" id="enviar">Enviar candidatura</button>' +
            '<button type="button" class="btn btn-outline" id="cand-cancelar">Cancelar</button></div></form>';
      $('#cand-form').scrollIntoView({ block: 'start' });
      $('#cand-cancelar').addEventListener('click', function () { $('#candidatura-area').innerHTML = ''; $('#vaga-acoes').hidden = false; });
      $('#cand-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var respostas = {};
        var regras = tri.map(function (t, i) {
          var r = marcados('tr-' + i)[0]; if (r) respostas[i] = r;
          return { id: 'tr-' + i, ok: !!r, msg: 'Responda a pergunta.' };
        });
        var valor = $('#c-valor').value === '' ? null : Number($('#c-valor').value);
        regras.push({ id: 'c-valor', ok: valor == null || valor >= 0, msg: 'Informe um valor válido.' });
        if (!check(regras)) { status('Revise os campos destacados.'); return; }
        var btn = $('#enviar');
        ocupado(btn, true, 'Enviando…');
        sb.from('candidaturas').insert({
          vaga_id: v.id, profissional_id: conta.user.id, mensagem: $('#c-msg').value.trim() || null, respostas_triagem: respostas,
          pretensao_valor: valor, pretensao_moeda: valor != null ? $('#c-moeda').value : null, pretensao_periodo: valor != null ? $('#c-periodo').value : null
        }).select().maybeSingle().then(function (r) {
          if (r.error) {
            ocupado(btn, false);
            status(r.error.code === '23505' ? 'Você já se candidatou a esta vaga.' : erroComDetalhe(r.error));
            return;
          }
          cand = r.data;
          $('#content').innerHTML = '<div class="done"><div class="icon-tile lg blue">' + icon('check', 30, { stroke: 2 }) + '</div>' +
            '<h2 id="done-title" tabindex="-1">Candidatura enviada</h2>' +
            '<p class="done-text">' + esc((v.empresas && v.empresas.nome) || 'A empresa') + ' recebeu sua candidatura para <strong>' + esc(v.titulo) + '</strong> e tem até ' + D.prazoRespostaDias + ' dias para responder.</p>' +
            '<div class="btn-row done-actions"><a href="candidaturas.html" class="btn btn-primary">Minhas candidaturas</a><a href="buscar.html" class="btn btn-outline">Buscar mais vagas</a></div></div>';
          window.scrollTo(0, 0);
          $('#done-title').focus();
        });
      });
    }
  }

  /* ---------- Profissional: minhas candidaturas ---------- */

  function renderCandidaturas() {
    topo('Minhas candidaturas', 'inicio.html');
    var conta, lista = [], aba = params.get('aba') === 'encerradas' ? 'encerradas' : 'andamento', retirando = null;
    contaDoTipo('profissional').then(function (c) {
      if (!c) return;
      conta = c;
      navBeta('profissional', 'candidaturas');
      return carregar();
    }).catch(function (err) { erroCarregar(err); });

    function carregar() {
      return sb.from('candidaturas').select('*, vagas(id, titulo, status, modelo, cidade, estado, pais, fuso, empresas(nome))')
        .eq('profissional_id', conta.user.id).order('criado_em', { ascending: false }).then(function (r) {
          if (r.error) throw r.error;
          lista = r.data || [];
          pintar();
        });
    }

    function pintar() {
      var andamento = lista.filter(function (c) { return c.status === 'novo' || c.status === 'conversa'; });
      var encerradas = lista.filter(function (c) { return !(c.status === 'novo' || c.status === 'conversa'); });
      var mostrar = aba === 'andamento' ? andamento : encerradas;
      $('#content').innerHTML =
        '<div class="filter" role="group" aria-label="Filtrar candidaturas" id="cand-filter">' +
          '<button type="button" data-aba="andamento" aria-pressed="' + (aba === 'andamento') + '">Em andamento · ' + andamento.length + '</button>' +
          '<button type="button" data-aba="encerradas" aria-pressed="' + (aba === 'encerradas') + '">Encerradas · ' + encerradas.length + '</button></div>' +
        (mostrar.length ? mostrar.map(cartao).join('') : vazio(
          aba === 'andamento' ? 'Nenhuma candidatura em andamento' : 'Nenhuma candidatura encerrada',
          aba === 'andamento' ? 'Encontre vagas perto de você e candidate-se em poucos toques.' : 'Candidaturas não selecionadas, retiradas ou de vagas encerradas aparecem aqui.',
          aba === 'andamento' ? '<a href="buscar.html" class="btn btn-primary">Buscar vagas</a>' : '')) +
        '<p class="form-status" id="form-status" role="alert"></p>';
    }

    function cartao(c) {
      var v = c.vagas || {}, st = STATUS_MINHA[c.status];
      var prazo = '';
      if (c.status === 'novo') {
        var limite = new Date(new Date(c.criado_em).getTime() + D.prazoRespostaDias * 86400000);
        prazo = limite < new Date() ? '<p class="row-sub" style="color:var(--amber)">Sem resposta no prazo. A empresa recebeu um lembrete.</p>'
          : '<p class="row-sub">Resposta até ' + dataBR(limite.toISOString()) + '</p>';
      }
      var podeRetirar = c.status === 'novo' || c.status === 'conversa';
      return '<article class="card cand-minha" data-id="' + c.id + '"><div class="head-row"><h3 class="row-title"><a href="vaga.html?id=' + encodeURIComponent(c.vaga_id) + '" class="card-link">' + esc(v.titulo || 'Vaga') + '</a></h3>' +
          '<span class="chip ' + st.chip + '">' + st.rotulo + '</span></div>' +
        '<p class="row-sub">' + esc((v.empresas && v.empresas.nome) || '') + ' · ' + esc(v.modelo ? localVagaTexto(v) : '') + '</p>' +
        '<p class="row-sub">Enviada em ' + dataBR(c.criado_em) + (c.status !== 'novo' ? ' · atualizada em ' + dataBR(c.status_em) : '') + '</p>' +
        prazo + '<p class="row-sub">' + esc(st.texto) + '</p>' +
        (podeRetirar ? (retirando === c.id
          ? '<div class="card-warn confirmar"><p class="row-sub">Retirar a candidatura? A empresa é avisada e você não pode se candidatar de novo a esta vaga.</p>' +
            '<div class="btn-row"><button type="button" class="btn btn-primary" data-retirar="confirmar" data-id="' + c.id + '">Sim, retirar</button>' +
            '<button type="button" class="btn btn-outline" data-retirar="voltar">Voltar</button></div></div>'
          : '<div class="btn-row"><button type="button" class="btn btn-outline btn-quiet" data-retirar="abrir" data-id="' + c.id + '">Retirar candidatura</button></div>') : '') +
        '</article>';
    }

    $('#content').addEventListener('click', function (e) {
      var a = e.target.closest('[data-aba]');
      if (a) { aba = a.getAttribute('data-aba'); retirando = null; pintar(); return; }
      var b = e.target.closest('[data-retirar]');
      if (!b) return;
      var acao = b.getAttribute('data-retirar');
      if (acao === 'abrir') { retirando = b.getAttribute('data-id'); pintar(); return; }
      if (acao === 'voltar') { retirando = null; pintar(); return; }
      ocupado(b, true, 'Retirando…');
      sb.from('candidaturas').update({ status: 'retirada' }).eq('id', b.getAttribute('data-id')).then(function (r) {
        retirando = null;
        if (r.error) { ocupado(b, false); status(erroComDetalhe(r.error)); return; }
        toast('Candidatura retirada.');
        carregar();
      });
    });
  }


  /* =====================================================================
   * ETAPA 4 — MENSAGENS
   * ===================================================================== */

  function horaCurta(iso) {
    var d = new Date(iso), hoje = new Date();
    function dois(n) { return (n < 10 ? '0' : '') + n; }
    if (d.toDateString() === hoje.toDateString()) return dois(d.getHours()) + ':' + dois(d.getMinutes());
    return dois(d.getDate()) + '/' + dois(d.getMonth() + 1);
  }

  function ladoDe(conta) { return conta.perfil.tipo === 'empresa' ? 'empresa' : 'profissional'; }
  function outroLado(lado) { return lado === 'empresa' ? 'profissional' : 'empresa'; }

  // Não lida: a última mensagem é do outro lado e chegou depois da última leitura.
  function naoLida(cv, lado) {
    if (!cv.ultima_mensagem_em || cv.ultima_mensagem_de === lado) return false;
    var lido = cv['lido_' + lado + '_em'];
    return !lido || new Date(lido) < new Date(cv.ultima_mensagem_em);
  }
  function semResposta(cv, lado) { return !!cv.ultima_mensagem_em && cv.ultima_mensagem_de !== lado; }

  function esperandoHa(iso) {
    var dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (dias <= 0) return 'Esperando desde hoje';
    if (dias === 1) return 'Esperando desde ontem';
    return 'Esperando há ' + dias + ' dias';
  }

  function nomeDoOutro(cv, lado) {
    return lado === 'empresa' ? ((cv.profissionais && cv.profissionais.nome) || 'Profissional') : ((cv.empresas && cv.empresas.nome) || 'Empresa');
  }

  var SELECT_CONVERSA = '*, profissionais(id, nome, resumo, cidade, estado), empresas(id, nome), vagas(id, titulo, empresa_id)';

  function minhasConversas(conta) {
    var q = sb.from('conversas').select(SELECT_CONVERSA).order('ultima_mensagem_em', { ascending: false, nullsFirst: false });
    q = ladoDe(conta) === 'empresa' ? q.eq('empresa_id', conta.dados.id) : q.eq('profissional_id', conta.user.id);
    return q.then(function (r) { if (r.error) throw r.error; return r.data || []; });
  }

  // Abre (ou reaproveita) a conversa do par empresa–profissional e vai para ela.
  function abrirConversa(empresaId, profissionalId, vagaId, texto) {
    return sb.from('conversas').select('id, vaga_id').eq('empresa_id', empresaId).eq('profissional_id', profissionalId).maybeSingle().then(function (r) {
      if (r.error) throw r.error;
      if (r.data) return r.data;
      return sb.from('conversas').insert({ empresa_id: empresaId, profissional_id: profissionalId, vaga_id: vagaId || null })
        .select('id, vaga_id').maybeSingle().then(function (r2) {
          if (r2.error) {
            // Outra aba criou ao mesmo tempo: busca de novo.
            if (r2.error.code === '23505') return sb.from('conversas').select('id, vaga_id').eq('empresa_id', empresaId).eq('profissional_id', profissionalId).maybeSingle().then(function (r3) { return r3.data; });
            throw r2.error;
          }
          return r2.data;
        });
    }).then(function (cv) {
      ir('conversa.html?id=' + encodeURIComponent(cv.id) + (texto ? '&texto=' + encodeURIComponent(texto) : ''));
    });
  }

  // Número de conversas não lidas no item "Mensagens" da navegação.
  function marcarNaoLidas(conta) {
    if (!conta || !conta.perfil) return;
    minhasConversas(conta).then(function (lista) {
      var n = lista.filter(function (cv) { return naoLida(cv, ladoDe(conta)); }).length;
      var a = document.querySelector('#nav a[data-nav="mensagens"]');
      if (!a || !n) return;
      a.insertAdjacentHTML('beforeend', '<span class="nav-badge" aria-hidden="true">' + n + '</span>');
      a.setAttribute('aria-label', 'Mensagens, ' + n + (n === 1 ? ' não lida' : ' não lidas'));
    }).catch(function () { /* o número é só uma ajuda */ });
  }

  /* ---------- Lista de conversas ---------- */

  function renderMensagens() {
    topo('Mensagens', 'inicio.html');
    var conta, lado, lista = [], ultimas = {}, filtro = params.get('filtro') === 'sem-resposta' ? 'sem-resposta' : 'todas';
    contaDoTipo().then(function (c) {
      if (!c) return;
      conta = c; lado = ladoDe(c);
      navBeta(conta.perfil.tipo, 'mensagens');
      return carregar();
    }).catch(function (err) { erroCarregar(err); });

    function carregar() {
      return minhasConversas(conta).then(function (l) {
        lista = l.filter(function (cv) { return cv.ultima_mensagem_em; });
        if (!lista.length) return { data: [] };
        return sb.from('mensagens').select('conversa_id, de, texto, criado_em').in('conversa_id', lista.map(function (cv) { return cv.id; }))
          .order('criado_em', { ascending: false }).limit(1000);
      }).then(function (r) {
        if (r.error) throw r.error;
        ultimas = {};
        (r.data || []).forEach(function (m) { if (!ultimas[m.conversa_id]) ultimas[m.conversa_id] = m; });
        pintar();
      });
    }

    var rapidas = function () {
      return lado === 'empresa'
        ? ['Podemos conversar amanhã?', 'Já te explico os detalhes.', 'Voltamos com uma resposta até sexta.']
        : ['Obrigado pelo retorno!', 'Tenho disponibilidade esta semana.', 'Pode me passar mais detalhes?'];
    };

    function pintar() {
      var pendentes = lista.filter(function (cv) { return semResposta(cv, lado); })
        .sort(function (a, b) { return new Date(a.ultima_mensagem_em) - new Date(b.ultima_mensagem_em); });
      var html = '';
      if (lista.length) {
        html += '<div class="filter" role="group" aria-label="Filtrar conversas" id="msg-filter">' +
          '<button type="button" data-filtro="todas" aria-pressed="' + (filtro === 'todas') + '">Todas · ' + lista.length + '</button>' +
          '<button type="button" data-filtro="sem-resposta" aria-pressed="' + (filtro === 'sem-resposta') + '">Sem resposta · ' + pendentes.length + '</button></div>';
      }
      if (!lista.length) {
        html += vazio('Nenhuma conversa ainda', lado === 'empresa'
          ? 'Chame um candidato para conversa na lista de candidatos de uma vaga.'
          : 'Quando uma empresa chamar você, ou quando você tirar uma dúvida numa vaga, a conversa aparece aqui.',
          lado === 'empresa' ? '<a href="candidatos.html" class="btn btn-primary">Ver candidatos</a>' : '<a href="buscar.html" class="btn btn-primary">Buscar vagas</a>');
      } else if (filtro === 'sem-resposta') {
        html += pendentes.length ? '<p class="row-sub sr-intro">Quem escreveu por último foi ' + (lado === 'empresa' ? 'o profissional' : 'a empresa') +
          '. Responder rápido conta na sua reputação de resposta. As mais antigas aparecem primeiro.</p>' + pendentes.map(function (cv) {
            var m = ultimas[cv.id] || {};
            return '<div class="card sr-card" data-conv="' + cv.id + '"><div class="media"><span class="avatar ' + (lado === 'empresa' ? 'blue' : 'avatar-empresa') + '">' + esc(iniciais(nomeDoOutro(cv, lado))) + '</span>' +
                '<div class="row-main"><div class="row-title">' + esc(nomeDoOutro(cv, lado)) + '</div>' +
                (cv.vagas ? '<span class="chat-vaga-lbl">' + esc(cv.vagas.titulo) + '</span>' : '') +
                '<span class="chip amber sr-espera">' + icon('clock', 12, { stroke: 2.4 }) + esc(esperandoHa(cv.ultima_mensagem_em)) + '</span></div></div>' +
              '<blockquote class="sr-msg">' + esc(m.texto || '') + '</blockquote>' +
              '<div class="sr-rapidas" role="group" aria-label="Respostas rápidas">' + rapidas().map(function (t) {
                return '<button type="button" class="sr-rapida" data-rapida="' + esc(t) + '">' + esc(t) + '</button>';
              }).join('') + '</div>' +
              '<form class="sr-form" data-conv="' + cv.id + '"><label class="visually-hidden" for="sr-in-' + cv.id + '">Resposta para ' + esc(nomeDoOutro(cv, lado)) + '</label>' +
                '<textarea id="sr-in-' + cv.id + '" rows="2" maxlength="2000" placeholder="Escreva sua resposta…"></textarea>' +
                '<div class="btn-row"><button type="submit" class="btn btn-primary">' + icon('send', 16, { stroke: 2.2 }) + 'Responder</button>' +
                '<a class="btn btn-outline" href="conversa.html?id=' + encodeURIComponent(cv.id) + '">Abrir conversa</a></div></form></div>';
          }).join('')
          : '<div class="empty" id="sr-vazio"><p class="row-title">Tudo respondido.</p><p class="row-sub">Ninguém está esperando sua resposta.</p>' +
            '<button type="button" class="btn btn-outline" data-filtro="todas">Ver todas as conversas</button></div>';
      } else {
        html += '<div class="list chat-list">' + lista.map(function (cv) {
          var m = ultimas[cv.id] || {}, nl = naoLida(cv, lado);
          var liberado = cv.compartilhou_empresa && cv.compartilhou_profissional;
          return '<a class="chat-row' + (nl ? ' chat-unread' : '') + '" href="conversa.html?id=' + encodeURIComponent(cv.id) + '">' +
            '<span class="avatar ' + (lado === 'empresa' ? 'blue' : 'avatar-empresa') + '">' + esc(iniciais(nomeDoOutro(cv, lado))) + '</span>' +
            '<span class="row-main"><span class="chat-row-top"><span class="row-title">' + esc(nomeDoOutro(cv, lado)) + '</span>' +
              '<span class="chat-time">' + horaCurta(cv.ultima_mensagem_em) + '</span></span>' +
              (cv.vagas ? '<span class="chat-vaga-lbl">' + esc(cv.vagas.titulo) + '</span>' : '') +
              '<span class="row-sub chat-preview">' + esc((m.de === lado ? 'Você: ' : '') + (m.texto || '')) + '</span>' +
              (liberado ? '<span class="chip green chat-wa-badge">' + icon('check', 12, { stroke: 2.6 }) + 'Contato liberado</span>' : '') +
              (!nl && semResposta(cv, lado) ? '<span class="chip amber chat-wa-badge">Aguardando sua resposta</span>' : '') + '</span>' +
            (nl ? '<span class="chat-dot" aria-hidden="true"></span><span class="visually-hidden">, não lida</span>' : '') + '</a>';
        }).join('') + '</div>';
      }
      html += '<p class="form-status" id="form-status" role="alert"></p>';
      $('#content').innerHTML = html;
    }

    $('#content').addEventListener('click', function (e) {
      var f = e.target.closest('[data-filtro]');
      if (f) {
        filtro = f.getAttribute('data-filtro');
        history.replaceState(null, '', 'mensagens.html' + (filtro === 'sem-resposta' ? '?filtro=sem-resposta' : ''));
        pintar();
        return;
      }
      var r = e.target.closest('[data-rapida]');
      if (r) { var ta = r.closest('.sr-card').querySelector('textarea'); ta.value = r.getAttribute('data-rapida'); ta.focus(); }
    });
    $('#content').addEventListener('submit', function (e) {
      var form = e.target.closest('.sr-form');
      if (!form) return;
      e.preventDefault();
      var ta = form.querySelector('textarea'), texto = ta.value.trim();
      if (!texto) { ta.focus(); toast('Escreva a resposta ou escolha uma resposta rápida.'); return; }
      var btn = form.querySelector('button[type=submit]');
      ocupado(btn, true, 'Enviando…');
      var cv = lista.filter(function (x) { return x.id === form.getAttribute('data-conv'); })[0];
      sb.from('mensagens').insert({ conversa_id: cv.id, de: lado, texto: texto }).then(function (res) {
        if (res.error) { ocupado(btn, false); status(erroComDetalhe(res.error)); return; }
        toast('Resposta enviada para ' + nomeDoOutro(cv, lado) + '.');
        carregar();
      });
    });
  }

  /* ---------- Conversa ---------- */

  function renderConversa() {
    var id = params.get('id');
    topo('Conversa', 'mensagens.html');
    var conta, lado, cv, msgs = [], canal = null, timer = null;

    contaDoTipo().then(function (c) {
      if (!c) return;
      conta = c; lado = ladoDe(c);
      navBeta(conta.perfil.tipo, 'mensagens');
      return Promise.all([
        sb.from('conversas').select(SELECT_CONVERSA).eq('id', id).maybeSingle(),
        sb.from('mensagens').select('*').eq('conversa_id', id).order('criado_em', { ascending: true })
      ]).then(function (rs) {
        if (rs[0].error) throw rs[0].error;
        cv = rs[0].data; msgs = rs[1].data || [];
        if (!cv) { $('#content').innerHTML = vazio('Conversa não encontrada', 'Ela pode ter sido apagada.', '<a href="mensagens.html" class="btn btn-primary">Mensagens</a>'); return; }
        topo(nomeDoOutro(cv, lado), 'mensagens.html');
        montar();
        marcarLida();
        ouvir();
      });
    }).catch(function (err) { erroCarregar(err, 'mensagens.html'); });

    function marcarLida() {
      var patch = {}; patch['lido_' + lado + '_em'] = new Date().toISOString();
      sb.from('conversas').update(patch).eq('id', cv.id).then(function () { /* silencioso */ });
    }

    function estadoContato() {
      var eu = cv['compartilhou_' + lado], outro = cv['compartilhou_' + outroLado(lado)];
      return eu && outro ? 'liberado' : (eu ? 'aguardando' : (outro ? 'pedido' : 'nenhum'));
    }

    function barraContato() {
      var est = estadoContato(), nome = nomeDoOutro(cv, lado).split(' ')[0];
      if (est === 'nenhum') return '<div class="wa-bar"><span class="wa-msg">Contato direto ainda não liberado</span>' +
        '<button type="button" class="btn btn-outline" data-contato="compartilhar">Compartilhar meu contato</button></div>';
      if (est === 'aguardando') return '<div class="wa-bar"><span class="wa-msg">Você compartilhou seu contato. Aguardando ' + esc(nome) + '.</span></div>';
      if (est === 'pedido') return '<div class="wa-bar"><span class="wa-msg">' + esc(nome) + ' quer trocar contato. Compartilhar o seu?</span>' +
        '<button type="button" class="btn btn-primary" data-contato="compartilhar">Compartilhar o meu contato</button></div>';
      return '<div class="wa-bar wa-liberado"><span class="wa-msg">' + icon('check', 16, { stroke: 2.4 }) + 'Contato liberado</span>' +
        '<button type="button" class="btn btn-primary" data-contato="ver">Ver contato</button></div>';
    }

    function bolhas() {
      if (!msgs.length) return '<li class="bubble-sys">Nenhuma mensagem ainda. Escreva para começar a conversa.</li>';
      return msgs.map(function (m) {
        return '<li class="bubble ' + (m.de === lado ? 'bubble-out' : 'bubble-in') + '"><span class="bubble-text">' + esc(m.texto) + '</span>' +
          '<span class="bubble-time">' + horaCurta(m.criado_em) + '</span></li>';
      }).join('');
    }

    function vagaLink() {
      if (!cv.vagas) return '';
      var href = lado === 'empresa' ? 'candidatos.html?vaga=' + encodeURIComponent(cv.vagas.id) : 'vaga.html?id=' + encodeURIComponent(cv.vagas.id);
      return '<div class="chat-vaga">' + icon('briefcase', 16, { stroke: 2 }) + '<a href="' + href + '">' + esc(cv.vagas.titulo) + '</a>' +
        (lado === 'empresa' && cv.profissionais ? ' · <a href="ver-profissional.html?id=' + encodeURIComponent(cv.profissional_id) + '&vaga=' + encodeURIComponent(cv.vagas.id) + '">Ver perfil</a>' : '') + '</div>';
    }

    function montar() {
      $('#content').innerHTML = vagaLink() +
        '<div id="wa-area">' + barraContato() + '</div>' +
        '<div id="deu-certo"></div>' +
        '<ul class="bubbles" id="msgs" aria-live="polite">' + bolhas() + '</ul>' +
        '<form id="msg-form" class="chat-compose"><label class="visually-hidden" for="msg-in">Mensagem</label>' +
          '<textarea id="msg-in" rows="1" maxlength="2000" placeholder="Escreva uma mensagem…"></textarea>' +
          '<button type="submit" class="btn btn-primary chat-send" aria-label="Enviar">' + icon('send', 18, { stroke: 2.2 }) + '</button></form>' +
        '<p class="row-sub chat-aviso">Para sua segurança, combine tudo por aqui até os dois liberarem o contato. Nunca pague para conseguir uma vaga.</p>' +
        '<div id="den-area"><div class="btn-row den-row"><button type="button" class="btn btn-outline btn-quiet" data-den="abrir">Denunciar conversa</button></div></div>' +
        '<p class="form-status" id="form-status" role="alert"></p>';
      if (params.get('texto') && !msgs.length) $('#msg-in').value = params.get('texto');
      rolar();
      ligar();
      deuCerto();
    }

    // "Deu certo?" (seção 7.2): depois de liberar o contato, a conversa pergunta se houve contratação,
    // para o vínculo não se perder quando o resto acontece fora da plataforma.
    function deuCerto() {
      var area = $('#deu-certo');
      if (!area || estadoContato() !== 'liberado' || cv['deu_certo_' + lado] === 'nao') { if (area) area.innerHTML = ''; return; }
      sb.from('contratacoes').select('id, status').eq('empresa_id', cv.empresa_id).eq('profissional_id', cv.profissional_id).then(function (r) {
        var ks = r.data || [];
        if (ks.some(function (k) { return k.status !== 'recusado'; })) { area.innerHTML = ''; return; }
        var href = lado === 'empresa'
          ? 'registrar-contratacao.html?prof=' + encodeURIComponent(cv.profissional_id) + (cv.vaga_id ? '&vaga=' + encodeURIComponent(cv.vaga_id) : '')
          : 'registrar-contratacao.html?empresa=' + encodeURIComponent(cv.empresa_id) + (cv.vaga_id ? '&vaga=' + encodeURIComponent(cv.vaga_id) : '');
        area.innerHTML = '<div class="card card-highlight" id="deu-certo-card"><div class="row-title">Deu certo?</div>' +
          '<p class="row-sub">' + (lado === 'empresa' ? 'Vocês fecharam a contratação de ' + esc(nomeDoOutro(cv, lado).split(' ')[0]) + '?' : 'Você foi contratado(a) por ' + esc(nomeDoOutro(cv, lado)) + '?') +
          ' Registre aqui para o vínculo entrar no histórico e na reputação dos dois.</p>' +
          '<div class="btn-row"><a href="' + href + '" class="btn btn-primary">' + (lado === 'empresa' ? 'Sim, registrar contratação' : 'Sim, fui contratado(a)') + '</a>' +
          '<button type="button" class="btn btn-outline" id="deu-certo-nao">Ainda não</button></div></div>';
        $('#deu-certo-nao').addEventListener('click', function () {
          var patch = {}; patch['deu_certo_' + lado] = 'nao';
          sb.from('conversas').update(patch).eq('id', cv.id).then(function () { cv['deu_certo_' + lado] = 'nao'; area.innerHTML = ''; toast('Tudo bem. Você pode registrar a contratação depois, em Contratações.'); });
        });
      });
    }

    function rolar() { var el = $('#msgs'); if (el) el.scrollTop = el.scrollHeight; }
    function repintarMsgs() { $('#msgs').innerHTML = bolhas(); rolar(); }

    function novas() {
      var ultima = msgs.length ? msgs[msgs.length - 1].criado_em : '1970-01-01T00:00:00Z';
      return Promise.all([
        sb.from('mensagens').select('*').eq('conversa_id', cv.id).gt('criado_em', ultima).order('criado_em', { ascending: true }),
        sb.from('conversas').select('compartilhou_empresa, compartilhou_profissional').eq('id', cv.id).maybeSingle()
      ]).then(function (rs) {
        var chegou = (rs[0].data || []).filter(function (m) { return !msgs.some(function (x) { return x.id === m.id; }); });
        if (chegou.length) { msgs = msgs.concat(chegou); repintarMsgs(); marcarLida(); }
        if (rs[1].data && (rs[1].data.compartilhou_empresa !== cv.compartilhou_empresa || rs[1].data.compartilhou_profissional !== cv.compartilhou_profissional)) {
          cv.compartilhou_empresa = rs[1].data.compartilhou_empresa; cv.compartilhou_profissional = rs[1].data.compartilhou_profissional;
          $('#wa-area').innerHTML = barraContato();
          deuCerto();
        }
      });
    }

    // Tempo real pelo Supabase Realtime; enquanto não conecta (ou se cair), confere a cada poucos segundos.
    function ouvir() {
      var intervalo = 5000;
      try {
        canal = sb.channel('conversa-' + cv.id)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens', filter: 'conversa_id=eq.' + cv.id }, function () { novas(); })
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversas', filter: 'id=eq.' + cv.id }, function () { novas(); })
          .subscribe(function (st) { intervalo = st === 'SUBSCRIBED' ? 20000 : 5000; });
      } catch (e) { /* segue com a conferência periódica */ }
      (function ciclo() { timer = setTimeout(function () { novas().then(ciclo, ciclo); }, intervalo); })();
      window.addEventListener('pagehide', function () { clearTimeout(timer); if (canal) sb.removeChannel(canal); });
    }

    function ligar() {
      $('#msg-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var input = $('#msg-in'), texto = input.value.trim();
        if (!texto) return;
        var btn = $('#msg-form button');
        ocupado(btn, true, '…');
        sb.from('mensagens').insert({ conversa_id: cv.id, de: lado, texto: texto }).select().maybeSingle().then(function (r) {
          ocupado(btn, false);
          btn.innerHTML = icon('send', 18, { stroke: 2.2 });
          if (r.error) { status(erroComDetalhe(r.error)); return; }
          input.value = '';
          if (!msgs.some(function (x) { return x.id === r.data.id; })) msgs.push(r.data);
          repintarMsgs();
          input.focus();
        });
      });
      $('#msg-in').addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('#msg-form').requestSubmit(); }
      });

      $('#wa-area').addEventListener('click', function (e) {
        var b = e.target.closest('[data-contato]');
        if (!b) return;
        if (b.getAttribute('data-contato') === 'compartilhar') {
          ocupado(b, true, 'Compartilhando…');
          var patch = {}; patch['compartilhou_' + lado] = true;
          sb.from('conversas').update(patch).eq('id', cv.id).then(function (r) {
            if (r.error) { ocupado(b, false); status(erroComDetalhe(r.error)); return; }
            cv['compartilhou_' + lado] = true;
            $('#wa-area').innerHTML = barraContato();
            deuCerto();
            toast(estadoContato() === 'liberado' ? 'Contato liberado para os dois.' : 'Contato compartilhado. Ele aparece para a outra pessoa quando ela compartilhar o dela.');
          });
          return;
        }
        if (b.getAttribute('data-contato') === 'fechar') { var p = $('#wa-area .wa-preview'); if (p) p.remove(); return; }
        if ($('#wa-area .wa-preview')) { $('#wa-area .wa-preview').remove(); return; }
        ocupado(b, true, 'Carregando…');
        sb.rpc('contato_da_conversa', { p_conversa: cv.id }).then(function (r) {
          ocupado(b, false);
          if (r.error) { status(erroComDetalhe(r.error)); return; }
          var ct = (r.data || [])[0] || {};
          var tel = (ct.telefone || '').replace(/[^\d+]/g, '');
          var nome = nomeDoOutro(cv, lado);
          var msg = 'Olá! Aqui é ' + conta.dados.nome + ', pelo KORbuild Match' + (cv.vagas ? ', sobre a vaga de ' + cv.vagas.titulo : '') + '.';
          var acoes = [];
          if (tel && ct.canal !== 'email') {
            if (ct.canal === 'sms') acoes.push('<a class="btn btn-primary" href="sms:' + esc(tel) + '?body=' + encodeURIComponent(msg) + '">Enviar SMS</a>');
            else acoes.push('<a class="btn btn-primary" target="_blank" rel="noopener" href="https://wa.me/' + esc(tel.replace('+', '')) + '?text=' + encodeURIComponent(msg) + '">Abrir WhatsApp</a>');
          }
          if (ct.email) acoes.push('<a class="btn btn-outline" href="mailto:' + esc(ct.email) + '?subject=' + encodeURIComponent('KORbuild Match' + (cv.vagas ? ' · ' + cv.vagas.titulo : '')) + '">Enviar e-mail</a>');
          $('#wa-area').insertAdjacentHTML('beforeend', '<div class="wa-preview" id="contato-liberado"><p class="wa-preview-lbl">Contato de ' + esc(nome) + '</p>' +
            '<dl class="summary">' + (ct.telefone ? '<div><dt>Telefone</dt><dd>' + esc(ct.telefone) + '</dd></div>' : '') +
              (ct.email ? '<div><dt>E-mail</dt><dd>' + esc(ct.email) + '</dd></div>' : '') +
              '<div><dt>Prefere</dt><dd>' + esc(rotuloDe(D.canais, ct.canal) || 'WhatsApp') + '</dd></div></dl>' +
            (!ct.telefone && !ct.email ? '<p class="row-sub">' + esc(nome) + ' ainda não cadastrou um contato. Continue a conversa por aqui.</p>' : '') +
            '<div class="btn-row">' + acoes.join('') + '<button type="button" class="btn btn-outline btn-quiet" data-contato="fechar">Fechar</button></div></div>');
        });
      });

      $('#den-area').addEventListener('click', function (e) {
        var b = e.target.closest('[data-den]');
        if (!b) return;
        var acao = b.getAttribute('data-den');
        if (acao === 'abrir') {
          $('#den-area').innerHTML = '<div class="card card-warn" id="den-form">' + group('den-motivo', 'Por que denunciar esta conversa?',
            pills('den-motivo', [{ id: 'Spam', rotulo: 'Spam' }, { id: 'Golpe ou fraude', rotulo: 'Golpe ou fraude' }, { id: 'Ofensa', rotulo: 'Ofensa' }, { id: 'Outro', rotulo: 'Outro' }]), { req: true }) +
            '<div class="btn-row"><button type="button" class="btn btn-primary" data-den="enviar">Enviar denúncia</button>' +
            '<button type="button" class="btn btn-outline" data-den="cancelar">Cancelar</button></div></div>';
          return;
        }
        if (acao === 'cancelar') { $('#den-area').innerHTML = '<div class="btn-row den-row"><button type="button" class="btn btn-outline btn-quiet" data-den="abrir">Denunciar conversa</button></div>'; return; }
        var motivo = marcados('den-motivo')[0];
        if (!check([{ id: 'den-motivo', ok: !!motivo, msg: 'Escolha o motivo da denúncia.' }])) return;
        ocupado(b, true, 'Enviando…');
        sb.from('denuncias').insert({ alvo_tipo: 'conversa', alvo_id: cv.id, motivo: motivo }).then(function (r) {
          if (r.error) { ocupado(b, false); status(erroComDetalhe(r.error)); return; }
          $('#den-area').innerHTML = '<p class="row-sub den-ok" id="den-ok">' + icon('eye', 14, { stroke: 2 }) + ' Denúncia enviada. A moderação vai analisar a conversa.</p>';
        });
      });
    }
  }


  /* =====================================================================
   * ETAPA 5 — CONTRATAÇÃO E REPUTAÇÃO
   * ===================================================================== */

  var RESPOSTAS_AV = ['Sim', 'Parcialmente', 'Não'];
  // Perguntas objetivas (seção 8.4). "ref" mostra o combinado como referência.
  var PERGUNTAS = {
    empresa: [  // a empresa avalia o profissional
      { id: 'entregou', texto: 'Entregou o trabalho combinado?', ref: 'funcao' },
      { id: 'horarios', texto: 'Cumpriu horários e prazos?', ref: 'jornada' },
      { id: 'comunicacao', texto: 'Comunicação clara e profissional?' },
      { id: 'novamente', texto: 'Contrataria novamente?' }
    ],
    profissional: [  // o profissional avalia a empresa
      { id: 'pagamento', texto: 'O pagamento foi feito conforme combinado?', ref: 'valor' },
      { id: 'anuncio', texto: 'A vaga correspondia ao anúncio?', ref: 'funcao' },
      { id: 'condicoes', texto: 'Condições e prazos foram cumpridos?', ref: 'jornada' },
      { id: 'ambiente', texto: 'Ambiente de trabalho respeitoso?' },
      { id: 'novamente', texto: 'Trabalharia novamente para esta empresa?' }
    ]
  };

  var SELECT_CONTRATACAO = '*, empresas(id, nome), profissionais(id, nome), vagas(id, titulo, status, posicoes)';

  function combinadoValor(k) {
    return k.valor != null ? dinheiro(Number(k.valor), k.moeda) + ' ' + rotuloDe(D.periodos, k.periodo) : 'A combinar';
  }
  function combinadoHtml(k) {
    return '<dl class="summary combinado">' +
      '<div><dt>Função</dt><dd>' + esc(k.funcao) + '</dd></div>' +
      (k.tipo ? '<div><dt>Contratação</dt><dd>' + esc(rotuloDe(D.tipos, k.tipo)) + '</dd></div>' : '') +
      '<div><dt>Valor</dt><dd>' + esc(combinadoValor(k)) + '</dd></div>' +
      (k.data_inicio ? '<div><dt>Início</dt><dd>' + dataBR(k.data_inicio) + '</dd></div>' : '') +
      (k.jornada ? '<div><dt>Jornada</dt><dd>' + esc(k.jornada) + '</dd></div>' : '') + '</dl>';
  }
  function refCombinado(k, ref) {
    if (ref === 'valor') return 'Combinado: ' + combinadoValor(k);
    if (ref === 'funcao') return 'Combinado: ' + k.funcao;
    if (ref === 'jornada') return k.jornada ? 'Combinado: ' + k.jornada : '';
    return '';
  }

  // Último dia para avaliar (o prazo vai até o fim desse dia).
  function prazoAvaliacao(k) { return dataBR(new Date(new Date(k.avaliar_ate).getTime() - 1000).toISOString()); }

  function minhasContratacoes(conta) {
    var q = sb.from('contratacoes').select(SELECT_CONTRATACAO).order('criado_em', { ascending: false });
    q = ladoDe(conta) === 'empresa' ? q.eq('empresa_id', conta.dados.id) : q.eq('profissional_id', conta.user.id);
    return q.then(function (r) {
      if (r.error) throw r.error;
      var ks = r.data || [];
      if (!ks.length) return { ks: [], avs: [] };
      // Volta a minha avaliação e as já publicadas (a do outro lado fica oculta até publicar).
      return sb.from('avaliacoes').select('*').in('contratacao_id', ks.map(function (k) { return k.id; })).then(function (r2) {
        if (r2.error) throw r2.error;
        return { ks: ks, avs: r2.data || [] };
      });
    });
  }

  // O que cada contratação pede de quem está vendo (e se é uma pendência).
  function situacao(k, lado, avs) {
    var outro = lado === 'empresa' ? ((k.profissionais && k.profissionais.nome) || 'O profissional') : ((k.empresas && k.empresas.nome) || 'A empresa');
    var primeiro = outro.split(' ')[0];
    var registrei = k.registrada_por === lado;
    var minha = avs.filter(function (a) { return a.contratacao_id === k.id && a.autor_tipo === lado; })[0];
    var dele = avs.filter(function (a) { return a.contratacao_id === k.id && a.autor_tipo !== lado; })[0];
    var aberta = k.avaliar_ate && new Date(k.avaliar_ate) > new Date();
    if (k.status === 'aguardando') {
      if (registrei) return { chip: 'amber', rotulo: 'Aguardando confirmação', texto: (k.resposta_texto ? 'Você respondeu à contestação. ' : '') + 'O vínculo só conta no histórico depois que ' + outro + ' confirmar.', pend: false };
      return { chip: 'blue', rotulo: 'Confirme a contratação', pend: true, acao: 'confirmar',
        texto: (k.resposta_texto ? outro + ' respondeu à sua contestação: “' + k.resposta_texto + '”. ' : '') +
          (lado === 'profissional' ? outro + ' registrou sua contratação. Confira o combinado: ao confirmar, o trabalho entra no seu histórico verificado.'
            : outro + ' registrou que foi contratado(a). Confira o combinado: ao confirmar, o vínculo passa a contar para os dois.') };
    }
    if (k.status === 'contestado') {
      if (registrei) return { chip: 'amber', rotulo: 'Combinado contestado', pend: true, acao: 'contestado', texto: primeiro + ' contestou: “' + (k.contestacao_texto || '') + '”. Corrija o combinado ou mantenha e responda.' };
      return { chip: 'amber', rotulo: 'Você contestou', texto: 'Sua contestação foi enviada. ' + outro + ' vai corrigir o combinado ou responder.', pend: false };
    }
    if (k.status === 'recusado') {
      if (registrei) return { chip: 'grey', rotulo: 'Contratação recusada', pend: !k.recusa_contestada, acao: k.recusa_contestada ? null : 'recusado',
        texto: k.recusa_contestada ? 'Você contestou a recusa. A moderação está analisando.' : outro + ' disse que a contratação não aconteceu. Se aconteceu, conteste: a moderação analisa.' };
      return { chip: 'grey', rotulo: 'Você recusou', texto: 'O vínculo não entra no histórico de ninguém.' + (k.recusa_contestada ? ' ' + outro + ' contestou a recusa; a moderação está analisando.' : ''), pend: false };
    }
    // confirmado
    if (!k.encerrada_em) return { chip: 'green', rotulo: 'Vínculo ativo', acao: 'ativo', pend: false,
      texto: 'Confirmada em ' + dataBR(k.confirmada_em) + '. Quando o trabalho terminar, registre o fim do vínculo: a avaliação dos dois lados abre por ' + D.prazoRespostaDias + ' dias.' };
    if (!minha && aberta) return { chip: 'blue', rotulo: 'Avalie ' + primeiro, pend: true, acao: 'avaliar',
      texto: 'Vínculo encerrado em ' + dataBR(k.encerrada_em) + '. A avaliação fica aberta até ' + prazoAvaliacao(k) + ' e só é publicada quando os dois avaliarem ou o prazo terminar.' };
    if (minha && !dele && aberta) return { chip: 'green', rotulo: 'Avaliação enviada', pend: false, texto: 'Fica oculta até ' + outro + ' avaliar ou o prazo terminar, em ' + prazoAvaliacao(k) + '.' };
    return { chip: 'green', rotulo: 'Concluída', pend: false, texto: 'Vínculo encerrado em ' + dataBR(k.encerrada_em) + '.' + (minha || dele ? ' As avaliações estão publicadas.' : ' A avaliação fechou sem envios.') };
  }

  // Reputação (seção 8.6): "em construção" com menos de 3 avaliações.
  function repHtml(rep, tipo) {
    if (!rep || rep.em_construcao) {
      var n = rep ? (tipo === 'empresa' ? rep.contratacoes : rep.trabalhos) : 0;
      return '<div class="card"><div class="chips"><span class="chip blue">' + (tipo === 'empresa' ? 'Empresa nova' : 'Novo na plataforma') + ' · reputação em construção</span></div>' +
        '<p class="row-sub">' + (n ? plural(n, tipo === 'empresa' ? 'contratação verificada' : 'trabalho verificado', tipo === 'empresa' ? 'contratações verificadas' : 'trabalhos verificados') + '. ' : '') +
        'A nota aparece a partir de 3 avaliações de vínculos confirmados pelos dois lados.</p></div>';
    }
    var nota = String(rep.nota).replace('.', ',');
    var itens = tipo === 'empresa'
      ? [{ v: nota, r: 'nota média' }, { v: String(rep.contratacoes), r: 'contratações verificadas' }, { v: rep.pagou_conforme_pct + '%', r: 'pagou conforme combinado' }, { v: rep.trabalhariam_de_novo_pct + '%', r: 'trabalhariam de novo' }]
      : [{ v: nota, r: 'nota média' }, { v: String(rep.trabalhos), r: 'trabalhos verificados' }, { v: rep.contratariam_de_novo_pct + '%', r: 'contratariam de novo' }];
    return '<div class="card rep-light"><div class="rep-grid">' + itens.map(function (i) {
      return '<div><div class="rep-value">' + esc(i.v) + '</div><div class="rep-label">' + esc(i.r) + '</div></div>';
    }).join('') + '</div><p class="row-sub">Com base em ' + plural(rep.avaliacoes, 'avaliação', 'avaliações') + ' de vínculos confirmados pelos dois lados.</p></div>';
  }

  function estrelas(n) {
    var s = '';
    for (var i = 1; i <= 5; i++) s += '<span class="estrela' + (i <= n ? ' on' : '') + '">' + icon('star', 14, { stroke: 1.6 }) + '</span>';
    return '<span class="estrelas" role="img" aria-label="Nota ' + n + ' de 5">' + s + '</span>';
  }

  // Lista de avaliações publicadas. "responder": o dono do perfil escreve a resposta.
  function avaliacoesHtml(avs, tipoAvaliado, responder) {
    if (!avs.length) return '<p class="row-sub">Nenhuma avaliação publicada ainda.</p>';
    var perguntas = PERGUNTAS[tipoAvaliado === 'profissional' ? 'empresa' : 'profissional'];
    return avs.map(function (a) {
      return '<article class="card avaliacao" data-av="' + a.id + '"><div class="head-row"><div><div class="row-title">' + esc(a.autor_nome) + '</div>' +
          '<div class="row-sub">' + esc(a.funcao) + ' · ' + dataBR(a.criado_em) + '</div></div>' + estrelas(a.nota) + '</div>' +
        '<ul class="av-respostas">' + perguntas.map(function (p) {
          var r = (a.respostas || {})[p.id];
          return r ? '<li><span>' + esc(p.texto) + '</span><span class="chip ' + (r === 'Sim' ? 'green' : r === 'Não' ? 'red' : 'amber') + '">' + esc(r) + '</span></li>' : '';
        }).join('') + '</ul>' +
        (a.comentario ? '<p class="prose">“' + esc(a.comentario) + '”</p>' : '') +
        (a.resposta ? '<div class="av-resposta"><div class="row-sub"><strong>Resposta</strong></div><p class="prose">' + esc(a.resposta) + '</p></div>'
          : (responder ? '<form class="av-responder" data-av="' + a.id + '"><label class="visually-hidden" for="resp-' + a.id + '">Sua resposta</label>' +
              '<textarea id="resp-' + a.id + '" rows="2" maxlength="300" placeholder="Responda publicamente (opcional, até 300 caracteres)"></textarea>' +
              '<button type="submit" class="btn btn-outline">Publicar resposta</button></form>' : '')) +
        '</article>';
    }).join('');
  }

  function carregarReputacao(tipo, id) {
    var view = tipo === 'empresa' ? 'reputacao_empresas' : 'reputacao_profissionais';
    var col = tipo === 'empresa' ? 'empresa_id' : 'profissional_id';
    return Promise.all([
      sb.from(view).select('*').eq(col, id).maybeSingle(),
      sb.from('avaliacoes_publicas').select('*').eq(col, id).eq('autor_tipo', tipo === 'empresa' ? 'profissional' : 'empresa').order('criado_em', { ascending: false })
    ]).then(function (rs) { return { rep: rs[0].data, avs: rs[1].data || [] }; });
  }

  // Respostas às avaliações recebidas (o banco só aceita de quem foi avaliado).
  function ligarRespostas(container, recarregar) {
    container.addEventListener('submit', function (e) {
      var f = e.target.closest('.av-responder');
      if (!f) return;
      e.preventDefault();
      var t = f.querySelector('textarea').value.trim();
      if (!t) { f.querySelector('textarea').focus(); return; }
      var b = f.querySelector('button');
      ocupado(b, true, 'Publicando…');
      sb.from('avaliacoes').update({ resposta: t }).eq('id', f.getAttribute('data-av')).then(function (r) {
        if (r.error) { ocupado(b, false); toast(erroComDetalhe(r.error)); return; }
        toast('Resposta publicada.');
        recarregar();
      });
    });
  }

  /* ---------- Registrar (ou corrigir) a contratação ---------- */

  function renderRegistrarContratacao() {
    var editarId = params.get('editar');
    topo(editarId ? 'Corrigir o combinado' : 'Registrar contratação', 'contratacoes.html');
    var conta, lado, k = null, prof = null, emp = null, vaga = null, cand = null;
    contaDoTipo().then(function (c) {
      if (!c) return;
      conta = c; lado = ladoDe(c);
      navBeta(conta.perfil.tipo, lado === 'empresa' ? 'candidatos' : 'candidaturas');
      if (editarId) {
        return sb.from('contratacoes').select(SELECT_CONTRATACAO).eq('id', editarId).maybeSingle().then(function (r) {
          if (r.error) throw r.error;
          k = r.data;
          if (!k || k.status !== 'contestado' || k.registrada_por !== lado) { $('#content').innerHTML = vazio('Nada para corrigir', 'O combinado só pode ser corrigido por quem registrou, depois de uma contestação.', '<a href="contratacoes.html" class="btn btn-primary">Contratações</a>'); return; }
          prof = k.profissionais; emp = k.empresas; vaga = k.vagas;
          form();
        });
      }
      var profId = lado === 'empresa' ? params.get('prof') : conta.user.id;
      var empId = lado === 'empresa' ? conta.dados.id : params.get('empresa');
      return Promise.all([
        sb.from('profissionais').select('id, nome').eq('id', profId).maybeSingle(),
        sb.from('empresas').select('id, nome').eq('id', empId).maybeSingle(),
        params.get('vaga') ? sb.from('vagas').select('*').eq('id', params.get('vaga')).maybeSingle() : Promise.resolve({ data: null }),
        params.get('vaga') ? sb.from('candidaturas').select('id, status').eq('vaga_id', params.get('vaga')).eq('profissional_id', profId).maybeSingle() : Promise.resolve({ data: null })
      ]).then(function (rs) {
        prof = rs[0].data; emp = rs[1].data; vaga = rs[2].data; cand = rs[3].data;
        if (!prof || !emp) { $('#content').innerHTML = vazio('Não encontramos a outra parte', 'Abra o registro a partir de um candidato ou de uma conversa.', '<a href="inicio.html" class="btn btn-primary">Início</a>'); return; }
        form();
      });
    }).catch(function (err) { erroCarregar(err, 'contratacoes.html'); });

    function form() {
      var base = k || {
        funcao: vaga ? vaga.titulo : '', tipo: vaga ? vaga.tipo : null, moeda: vaga && vaga.moeda ? vaga.moeda : (D.moedaPorPais[codigoPais(conta.dados.pais)] || 'BRL'),
        valor: vaga ? (vaga.salario_min != null ? vaga.salario_min : vaga.salario_max) : null, periodo: vaga && vaga.periodo ? vaga.periodo : 'mes'
      };
      var outroNome = lado === 'empresa' ? prof.nome : emp.nome;
      var podePreencher = !k && lado === 'empresa' && vaga && (vaga.status === 'aberta' || vaga.status === 'pausada');
      $('#content').innerHTML =
        '<form class="form" id="contr-form" novalidate>' +
          (k ? aviso((prof.nome.split(' ')[0]) + ' contestou: “' + (k.contestacao_texto || '') + '”. Corrija o que for preciso; ' + prof.nome.split(' ')[0] + ' recebe o pedido de confirmação de novo.', 'amber') : '') +
          '<section class="card"><h2 class="card-title">' + esc(lado === 'empresa' ? 'Contratação de ' + outroNome : 'Contratação por ' + outroNome) + '</h2>' +
            '<p class="row-sub">' + (lado === 'empresa' ? esc(outroNome) + ' confirma' : esc(outroNome) + ' confirma') + ' o combinado. Só depois disso o vínculo entra no histórico e na reputação dos dois, e vira a referência da avaliação.</p>' +
            field('k-funcao', 'Função', 'input', 'type="text" maxlength="120"', '', { req: true }) +
            field('k-tipo', 'Tipo de contratação', 'select', '', options(D.tipos, 'Selecione', base.tipo)) +
            '<div class="grid-2">' + field('k-valor', 'Valor', 'input', 'type="number" min="0" step="0.01" inputmode="decimal"', '') +
              field('k-moeda', 'Moeda', 'select', '', options(D.moedas, null, base.moeda)) + '</div>' +
            field('k-periodo', 'Período', 'select', '', options(D.periodos, null, base.periodo || 'mes')) +
            field('k-inicio', 'Data de início', 'input', 'type="date"', '', { req: true }) +
            field('k-jornada', 'Jornada (opcional)', 'input', 'type="text" maxlength="120" placeholder="Ex.: Seg a sex, 9h às 18h"', '') +
            (k ? field('k-resposta', 'Mensagem para ' + prof.nome.split(' ')[0] + ' (opcional)', 'textarea', 'rows="2" maxlength="500"', '') : '') +
            (podePreencher ? '<div class="field"><label class="check-row"><input type="checkbox" id="k-preencher"' + ((vaga.posicoes || 1) === 1 ? ' checked' : '') + '>' +
              '<span>Marcar a vaga “' + esc(vaga.titulo) + '” como preenchida (os outros candidatos em andamento são avisados)</span></label></div>' : '') +
          '</section>' +
          '<p class="form-status" id="form-status" role="alert"></p>' +
          '<button type="submit" class="btn btn-primary btn-lg" id="k-salvar">' + (k ? 'Enviar combinado corrigido' : 'Registrar e pedir confirmação') + '</button></form>';
      $('#k-funcao').value = base.funcao || '';
      $('#k-valor').value = base.valor != null ? base.valor : '';
      $('#k-inicio').value = base.data_inicio || hojeISO();
      $('#k-jornada').value = base.jornada || '';
      $('#contr-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var valor = $('#k-valor').value === '' ? null : Number($('#k-valor').value);
        if (!check([
          { id: 'k-funcao', ok: $('#k-funcao').value.trim().length >= 2, msg: 'Informe a função.' },
          { id: 'k-valor', ok: valor == null || valor >= 0, msg: 'Informe um valor válido.' },
          { id: 'k-inicio', ok: !!$('#k-inicio').value, msg: 'Informe a data de início.' }
        ])) { status('Revise os campos destacados.'); return; }
        var dados = { funcao: $('#k-funcao').value.trim(), tipo: $('#k-tipo').value || null, valor: valor, moeda: valor != null ? $('#k-moeda').value : null,
          periodo: valor != null ? $('#k-periodo').value : null, data_inicio: $('#k-inicio').value, jornada: $('#k-jornada').value.trim() || null };
        var btn = $('#k-salvar');
        ocupado(btn, true, 'Enviando…');
        var q;
        if (k) {
          dados.status = 'aguardando';
          if ($('#k-resposta').value.trim()) dados.resposta_texto = $('#k-resposta').value.trim();
          q = sb.from('contratacoes').update(dados).eq('id', k.id);
        } else {
          q = sb.from('contratacoes').insert(Object.assign(dados, { empresa_id: emp.id, profissional_id: prof.id, registrada_por: lado,
            vaga_id: vaga ? vaga.id : null, candidatura_id: cand ? cand.id : null }));
        }
        q.then(function (r) {
          if (r.error) { ocupado(btn, false); status(erroComDetalhe(r.error)); return null; }
          return $('#k-preencher') && $('#k-preencher').checked ? sb.from('vagas').update({ status: 'preenchida' }).eq('id', vaga.id) : { error: null };
        }).then(function (r2) {
          if (!r2) return;
          var nome = (lado === 'empresa' ? prof.nome : emp.nome);
          $('#content').innerHTML = '<div class="done"><div class="icon-tile lg blue">' + icon('check', 30, { stroke: 2 }) + '</div>' +
            '<h2 id="done-title" tabindex="-1">' + (k ? 'Combinado corrigido' : 'Contratação registrada') + '</h2>' +
            '<p class="done-text">' + esc(nome) + ' recebe o pedido para confirmar o combinado. O vínculo entra no histórico verificado depois da confirmação.' +
              (r2.error ? ' (A vaga não foi marcada como preenchida: ' + esc(traduzErro(r2.error)) + ')' : '') + '</p>' +
            '<div class="btn-row done-actions"><a href="contratacoes.html" class="btn btn-primary">Ver contratações</a><a href="inicio.html" class="btn btn-outline">Início</a></div></div>';
          window.scrollTo(0, 0); $('#done-title').focus();
        });
      });
    }
  }

  /* ---------- Contratações (as duas jornadas) ---------- */

  function renderContratacoes() {
    topo('Contratações', 'inicio.html');
    var conta, lado, ks = [], avs = [], aberto = null;
    contaDoTipo().then(function (c) {
      if (!c) return;
      conta = c; lado = ladoDe(c);
      navBeta(conta.perfil.tipo, 'perfil');
      return carregar();
    }).catch(function (err) { erroCarregar(err); });

    function carregar() {
      return minhasContratacoes(conta).then(function (x) { ks = x.ks; avs = x.avs; pintar(); });
    }

    function formulario(k, acao) {
      var primeiro = (lado === 'empresa' ? (k.profissionais && k.profissionais.nome) : (k.empresas && k.empresas.nome) || '').split(' ')[0];
      if (acao === 'contestar') return '<div class="card-warn confirmar">' + field('t-' + k.id, 'O que está diferente do combinado?', 'textarea', 'rows="3" maxlength="500"', '', { req: true, hint: 'Isso vai para ' + primeiro + ' corrigir ou responder.' }) +
        '<div class="btn-row"><button type="button" class="btn btn-primary" data-k="enviar-contestacao" data-id="' + k.id + '">Enviar contestação</button><button type="button" class="btn btn-outline" data-k="voltar">Voltar</button></div></div>';
      if (acao === 'recusar') return '<div class="card-warn confirmar"><p class="row-sub">Confirmar que a contratação não aconteceu? ' + esc(primeiro) + ' é avisado(a) e o vínculo não entra no histórico de ninguém.</p>' +
        '<div class="btn-row"><button type="button" class="btn btn-primary" data-k="confirmar-recusa" data-id="' + k.id + '">Sim, não aconteceu</button><button type="button" class="btn btn-outline" data-k="voltar">Voltar</button></div></div>';
      if (acao === 'responder') return '<div class="card-warn confirmar">' + field('t-' + k.id, 'Sua resposta para ' + primeiro, 'textarea', 'rows="3" maxlength="500"', '', { req: true, hint: 'O combinado fica como está e ' + primeiro + ' recebe o pedido de confirmação de novo.' }) +
        '<div class="btn-row"><button type="button" class="btn btn-primary" data-k="enviar-resposta" data-id="' + k.id + '">Manter e responder</button><button type="button" class="btn btn-outline" data-k="voltar">Voltar</button></div></div>';
      if (acao === 'encerrar') return '<div class="card-warn confirmar">' + field('t-' + k.id, 'Último dia de trabalho', 'input', 'type="date" max="' + hojeISO() + '"' + (k.data_inicio ? ' min="' + k.data_inicio + '"' : ''), '', { req: true }) +
        '<p class="row-sub">A avaliação dos dois lados abre por ' + D.prazoRespostaDias + ' dias a partir dessa data.</p>' +
        '<div class="btn-row"><button type="button" class="btn btn-primary" data-k="enviar-fim" data-id="' + k.id + '">Registrar fim do vínculo</button><button type="button" class="btn btn-outline" data-k="voltar">Voltar</button></div></div>';
      return '';
    }

    function cartao(k) {
      var st = situacao(k, lado, avs);
      var outro = lado === 'empresa' ? (k.profissionais && k.profissionais.nome) : (k.empresas && k.empresas.nome);
      var acoes = '';
      if (st.acao === 'confirmar') acoes = '<button type="button" class="btn btn-primary" data-k="confirmar" data-id="' + k.id + '">Confirmar</button>' +
        '<button type="button" class="btn btn-outline" data-k="contestar" data-id="' + k.id + '">Algo está diferente</button>' +
        '<button type="button" class="btn btn-outline btn-quiet" data-k="recusar" data-id="' + k.id + '">Não aconteceu</button>';
      if (st.acao === 'contestado') acoes = '<a href="registrar-contratacao.html?editar=' + encodeURIComponent(k.id) + '" class="btn btn-primary">Corrigir o combinado</a>' +
        '<button type="button" class="btn btn-outline" data-k="responder" data-id="' + k.id + '">Manter e responder</button>';
      if (st.acao === 'recusado') acoes = '<button type="button" class="btn btn-outline" data-k="contestar-recusa" data-id="' + k.id + '">Contestar a recusa</button>';
      if (st.acao === 'ativo') acoes = '<button type="button" class="btn btn-outline" data-k="encerrar" data-id="' + k.id + '">Registrar fim do vínculo</button>';
      if (st.acao === 'avaliar') acoes = '<a href="avaliar.html?id=' + encodeURIComponent(k.id) + '" class="btn btn-primary">Avaliar agora</a>';
      var form = aberto && aberto.id === k.id ? formulario(k, aberto.acao) : '';
      return '<article class="card contr-card" data-k-id="' + k.id + '"><div class="head-row"><h3 class="row-title">' + esc(k.funcao) + '</h3><span class="chip ' + st.chip + '">' + esc(st.rotulo) + '</span></div>' +
        '<p class="row-sub">' + esc(outro || '') + (k.vagas ? ' · vaga ' + esc(k.vagas.titulo) : '') + ' · registrada ' + (k.registrada_por === lado ? 'por você' : (lado === 'empresa' ? 'pelo profissional' : 'pela empresa')) + '</p>' +
        combinadoHtml(k) + '<p class="row-sub">' + esc(st.texto) + '</p>' +
        (form || (acoes ? '<div class="btn-row">' + acoes + '</div>' : '')) + '</article>';
    }

    function pintar() {
      var pend = ks.filter(function (k) { return situacao(k, lado, avs).pend; });
      var resto = ks.filter(function (k) { return !situacao(k, lado, avs).pend; });
      $('#content').innerHTML =
        (ks.length ? '' : vazio('Nenhuma contratação ainda', lado === 'empresa'
          ? 'Quando você contratar alguém pela plataforma, registre a contratação na lista de candidatos ou na conversa. O vínculo verificado conta na reputação dos dois.'
          : 'Quando uma empresa registrar sua contratação, você confirma aqui. Você também pode registrar pela conversa com a empresa.')) +
        (pend.length ? '<section class="section"><h2>Precisa da sua atenção</h2>' + pend.map(cartao).join('') + '</section>' : '') +
        (resto.length ? '<section class="section"><h2>' + (pend.length ? 'Outras' : 'Suas contratações') + '</h2>' + resto.map(cartao).join('') + '</section>' : '') +
        '<p class="form-status" id="form-status" role="alert"></p>';
    }

    $('#content').addEventListener('click', function (e) {
      var b = e.target.closest('[data-k]');
      if (!b) return;
      var acao = b.getAttribute('data-k'), id = b.getAttribute('data-id');
      if (['contestar', 'recusar', 'responder', 'encerrar'].indexOf(acao) !== -1) { aberto = { id: id, acao: acao }; pintar(); var f = $('#t-' + id); if (f) f.focus(); return; }
      if (acao === 'voltar') { aberto = null; pintar(); return; }
      var patch, msg;
      if (acao === 'confirmar') { patch = { status: 'confirmado' }; msg = 'Contratação confirmada. O vínculo entrou no histórico verificado.'; }
      if (acao === 'confirmar-recusa') { patch = { status: 'recusado' }; msg = 'Recusa enviada.'; }
      if (acao === 'contestar-recusa') { patch = { recusa_contestada: true }; msg = 'Recusa contestada. A moderação vai analisar.'; }
      if (acao === 'enviar-contestacao' || acao === 'enviar-resposta' || acao === 'enviar-fim') {
        var t = $('#t-' + id).value.trim();
        if (!check([{ id: 't-' + id, ok: !!t, msg: acao === 'enviar-fim' ? 'Informe a data.' : 'Escreva a mensagem.' }])) return;
        if (acao === 'enviar-contestacao') { patch = { status: 'contestado', contestacao_texto: t }; msg = 'Contestação enviada.'; }
        if (acao === 'enviar-resposta') { patch = { status: 'aguardando', resposta_texto: t }; msg = 'Resposta enviada. O pedido de confirmação foi reenviado.'; }
        if (acao === 'enviar-fim') { patch = { encerrada_em: t }; msg = 'Fim do vínculo registrado. A avaliação está aberta.'; }
      }
      if (!patch) return;
      ocupado(b, true, 'Enviando…');
      sb.from('contratacoes').update(patch).eq('id', id).then(function (r) {
        if (r.error) { ocupado(b, false); status(erroComDetalhe(r.error)); return; }
        aberto = null;
        toast(msg);
        carregar();
      });
    });
  }

  /* ---------- Avaliar (avaliação cega) ---------- */

  function renderAvaliar() {
    var id = params.get('id');
    topo('Avaliar', 'contratacoes.html');
    var conta, lado, k;
    contaDoTipo().then(function (c) {
      if (!c) return;
      conta = c; lado = ladoDe(c);
      navBeta(conta.perfil.tipo, 'perfil');
      return Promise.all([
        sb.from('contratacoes').select(SELECT_CONTRATACAO).eq('id', id).maybeSingle(),
        sb.from('avaliacoes').select('id, autor_tipo').eq('contratacao_id', id)
      ]).then(function (rs) {
        if (rs[0].error) throw rs[0].error;
        k = rs[0].data;
        var ja = (rs[1].data || []).some(function (a) { return a.autor_tipo === lado; });
        if (!k) { $('#content').innerHTML = vazio('Contratação não encontrada', '', '<a href="contratacoes.html" class="btn btn-primary">Contratações</a>'); return; }
        if (ja) { $('#content').innerHTML = vazio('Avaliação já enviada', 'Ela fica oculta até a outra parte avaliar ou o prazo terminar.', '<a href="contratacoes.html" class="btn btn-primary">Contratações</a>'); return; }
        if (k.status !== 'confirmado' || !k.avaliar_ate || new Date(k.avaliar_ate) < new Date()) {
          $('#content').innerHTML = vazio('Avaliação fechada', 'A avaliação abre quando o fim do vínculo é registrado e fica aberta por ' + D.prazoRespostaDias + ' dias.', '<a href="contratacoes.html" class="btn btn-primary">Contratações</a>');
          return;
        }
        form();
      });
    }).catch(function (err) { erroCarregar(err, 'contratacoes.html'); });

    function form() {
      var outro = lado === 'empresa' ? k.profissionais.nome : k.empresas.nome;
      var perguntas = PERGUNTAS[lado];
      $('#content').innerHTML =
        '<form class="form" id="av-form" novalidate>' +
          '<section class="card"><h2 class="card-title">Como foi trabalhar com ' + esc(outro) + '?</h2>' +
            '<p class="row-sub">' + esc(k.funcao) + ' · ' + (k.data_inicio ? dataBR(k.data_inicio) + ' a ' : '') + dataBR(k.encerrada_em) + '</p>' +
            aviso('Avaliação cega: ' + outro.split(' ')[0] + ' não vê a sua antes de enviar a dele(a), e você também não. As duas são publicadas juntas, ou quando o prazo terminar em ' + prazoAvaliacao(k) + '.') +
          '</section>' +
          '<section class="card"><h2 class="card-title">Perguntas objetivas</h2>' +
            perguntas.map(function (p) {
              var ref = refCombinado(k, p.ref);
              return group('q-' + p.id, p.texto, (ref ? '<p class="row-sub av-ref">' + esc(ref) + '</p>' : '') +
                pills('q-' + p.id, RESPOSTAS_AV.map(function (r) { return { id: r, rotulo: r }; })), { req: true });
            }).join('') +
          '</section>' +
          '<section class="card"><h2 class="card-title">Nota geral</h2>' +
            group('q-nota', 'De 1 a 5', '<div class="stars">' + [1, 2, 3, 4, 5].map(function (n) {
              return '<label class="star"><input type="radio" name="q-nota" value="' + n + '" class="pill-input"><span class="star-ico">' + icon('star', 34, { stroke: 1.6 }) + '</span><span class="visually-hidden">' + n + '</span></label>';
            }).join('') + '</div>', { req: true }) +
            field('q-coment', 'Comentário (opcional)', 'textarea', 'rows="3" maxlength="300"', '', { hint: 'Até 300 caracteres. Sem ofensas nem dados pessoais: avaliações assim podem ser removidas pela moderação.' }) +
          '</section>' +
          '<p class="form-status" id="form-status" role="alert"></p>' +
          '<button type="submit" class="btn btn-primary btn-lg" id="av-enviar">Enviar avaliação</button></form>';
      $('#av-form').addEventListener('change', function (e) {
        if (e.target.name === 'q-nota') $all('.star').forEach(function (s) { s.classList.toggle('on', Number(s.querySelector('input').value) <= Number(e.target.value)); });
      });
      $('#av-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var respostas = {}, regras = perguntas.map(function (p) {
          var r = marcados('q-' + p.id)[0]; if (r) respostas[p.id] = r;
          return { id: 'q-' + p.id, ok: !!r, msg: 'Responda esta pergunta.' };
        });
        var nota = Number(marcados('q-nota')[0] || 0);
        regras.push({ id: 'q-nota', ok: nota >= 1, msg: 'Escolha a nota.' });
        if (!check(regras)) { status('Responda todas as perguntas.'); return; }
        var btn = $('#av-enviar');
        ocupado(btn, true, 'Enviando…');
        sb.from('avaliacoes').insert({ contratacao_id: k.id, autor_tipo: lado, respostas: respostas, nota: nota, comentario: $('#q-coment').value.trim() || null }).then(function (r) {
          if (r.error) { ocupado(btn, false); status(erroComDetalhe(r.error)); return; }
          $('#content').innerHTML = '<div class="done"><div class="icon-tile lg blue">' + icon('check', 30, { stroke: 2 }) + '</div>' +
            '<h2 id="done-title" tabindex="-1">Avaliação enviada</h2>' +
            '<p class="done-text">Ela fica oculta até ' + esc(outro) + ' avaliar ou o prazo terminar, em ' + prazoAvaliacao(k) + '. Depois disso, as duas são publicadas juntas.</p>' +
            '<div class="btn-row done-actions"><a href="contratacoes.html" class="btn btn-primary">Contratações</a><a href="inicio.html" class="btn btn-outline">Início</a></div></div>';
          window.scrollTo(0, 0); $('#done-title').focus();
        });
      });
    }
  }


  /* =====================================================================
   * ETAPA 6 — AVISOS E PLANO
   * ===================================================================== */

  var CATEGORIAS_AVISO = {
    mensagens: { rotulo: 'Mensagens', texto: 'Nova mensagem numa conversa', icone: 'message' },
    candidaturas: { rotulo: 'Candidaturas', texto: 'Candidatura nova, retorno da empresa, vaga encerrada', icone: 'clipboard' },
    contratacao: { rotulo: 'Contratação e combinado', texto: 'Pedido de confirmação, contestação, recusa', icone: 'check' },
    avaliacoes: { rotulo: 'Avaliações', texto: 'Avaliação aberta, a outra parte avaliou, avaliações publicadas', icone: 'star' }
  };

  function tempoRelativo(iso) {
    var min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (min < 1) return 'agora';
    if (min < 60) return 'há ' + min + ' min';
    var h = Math.floor(min / 60);
    if (h < 24) return 'há ' + h + ' h';
    var d = Math.floor(h / 24);
    return d === 1 ? 'ontem' : (d < 7 ? 'há ' + d + ' dias' : dataBR(iso));
  }

  // Sino do topo do início, com o número de avisos não lidos.
  function sino() {
    return sb.from('notificacoes').select('id', { count: 'exact', head: true }).is('lida_em', null).then(function (r) {
      var n = r.count || 0;
      return '<a href="notificacoes.html" class="icon-btn" id="sino" aria-label="Avisos' + (n ? ', ' + n + (n === 1 ? ' novo' : ' novos') : '') + '">' +
        icon('bell') + (n ? '<span class="bell-count" aria-hidden="true">' + (n > 99 ? '99+' : n) + '</span>' : '') + '</a>';
    }).catch(function () { return '<a href="notificacoes.html" class="icon-btn" id="sino" aria-label="Avisos">' + icon('bell') + '</a>'; });
  }

  /* ---------- Avisos ---------- */

  function renderNotificacoes() {
    topo('Avisos', 'inicio.html');
    var conta, lista = [], prefs = {};
    contaDoTipo().then(function (c) {
      if (!c) return;
      conta = c;
      navBeta(conta.perfil.tipo, 'inicio');
      return Promise.all([
        sb.from('notificacoes').select('*').order('criado_em', { ascending: false }).limit(60),
        sb.from('notificacao_prefs').select('*').eq('user_id', conta.user.id)
      ]).then(function (rs) {
        if (rs[0].error) throw rs[0].error;
        lista = rs[0].data || [];
        (rs[1].data || []).forEach(function (p) { prefs[p.categoria] = p; });
        pintar();
        // Abrir a tela marca tudo como lido (as novas continuam destacadas até sair).
        if (lista.some(function (n) { return !n.lida_em; })) sb.from('notificacoes').update({ lida_em: new Date().toISOString() }).is('lida_em', null).then(function () {});
      });
    }).catch(function (err) { erroCarregar(err); });

    function item(n) {
      var cat = CATEGORIAS_AVISO[n.categoria] || { icone: 'bell' };
      return '<a class="row-link notif' + (n.lida_em ? '' : ' notif-nova') + '" href="' + esc(n.link || 'inicio.html') + '">' +
        '<div class="icon-tile' + (n.lida_em ? '' : ' blue') + '">' + icon(cat.icone) + '</div>' +
        '<div class="row-main"><div class="row-title">' + esc(n.titulo) + '</div>' + (n.texto ? '<div class="row-sub">' + esc(n.texto) + '</div>' : '') +
        '<div class="row-sub notif-quando">' + tempoRelativo(n.criado_em) + (n.lida_em ? '' : '<span class="visually-hidden">, novo</span>') + '</div></div>' +
        '<span class="chevron">' + icon('chevron', 20, { stroke: 2 }) + '</span></a>';
    }

    function pintar() {
      var novas = lista.filter(function (n) { return !n.lida_em; }), antigas = lista.filter(function (n) { return n.lida_em; });
      $('#content').innerHTML =
        (lista.length ? '' : vazio('Nenhum aviso ainda', 'Mensagens, candidaturas, contratações e avaliações aparecem aqui.')) +
        (novas.length ? '<section class="section" aria-labelledby="h-novas"><h2 id="h-novas">Novos</h2>' + novas.map(item).join('') + '</section>' : '') +
        (antigas.length ? '<section class="section" aria-labelledby="h-antigas"><h2 id="h-antigas">' + (novas.length ? 'Anteriores' : 'Avisos') + '</h2>' + antigas.map(item).join('') + '</section>' : '') +
        '<section class="section" id="prefs" aria-labelledby="h-prefs"><h2 id="h-prefs">Como receber</h2>' +
          '<div class="card"><p class="row-sub">Escolha o que aparece aqui no app e o que chega por e-mail.</p>' +
          Object.keys(CATEGORIAS_AVISO).map(function (k) {
            var c = CATEGORIAS_AVISO[k], p = prefs[k] || { push: true, email: true };
            return '<fieldset class="pref-linha"><legend class="row-title">' + esc(c.rotulo) + '</legend><p class="row-sub">' + esc(c.texto) + '</p>' +
              '<label class="check-row"><input type="checkbox" data-pref="' + k + '" data-canal="push"' + (p.push ? ' checked' : '') + '><span>No app</span></label>' +
              '<label class="check-row"><input type="checkbox" data-pref="' + k + '" data-canal="email"' + (p.email ? ' checked' : '') + '><span>Por e-mail</span></label></fieldset>';
          }).join('') +
          '<p class="row-sub">Os avisos por e-mail começam a ser enviados em breve; sua escolha já fica guardada.</p></div></section>';
    }

    $('#content').addEventListener('change', function (e) {
      var cb = e.target.closest('[data-pref]');
      if (!cb) return;
      var cat = cb.getAttribute('data-pref');
      var atual = prefs[cat] || { push: true, email: true };
      var novo = { user_id: conta.user.id, categoria: cat, push: atual.push, email: atual.email };
      novo[cb.getAttribute('data-canal')] = cb.checked;
      sb.from('notificacao_prefs').upsert(novo).then(function (r) {
        if (r.error) { cb.checked = !cb.checked; toast(erroComDetalhe(r.error)); return; }
        prefs[cat] = novo;
        toast('Preferência salva.');
      });
    });
  }

  /* ---------- Plano da empresa ---------- */

  function situacaoPlano(a, ativas) {
    if (!a) return { fase: 'antes', titulo: '3 meses grátis', texto: 'O período grátis do plano Essencial começa quando você publicar a primeira vaga. O cartão só é pedido no fim.' };
    var dias = Math.ceil((new Date(a.gratis_ate).getTime() - Date.now()) / 86400000);
    if (a.status === 'ativa') return { fase: 'ativa', titulo: 'Plano Essencial ativo', texto: 'Até ' + a.limite_vagas_ativas + ' vagas ativas e ' + a.limite_convites_mes + ' convites diretos por mês.' };
    if (a.status === 'encerrada' || dias <= 0) return { fase: 'encerrado', titulo: 'O período grátis terminou', alerta: true,
      texto: 'Suas vagas continuam guardadas, mas não dá para publicar nem reativar vagas até escolher um plano.' };
    return { fase: 'gratis', dias: dias, titulo: 'Período grátis · ' + plural(dias, 'dia restante', 'dias restantes'), alerta: dias <= 7,
      texto: 'Grátis até ' + dataBR(a.gratis_ate) + '. Depois disso, escolha o Essencial para continuar publicando. Suas vagas não são apagadas.' };
  }

  function renderPlano() {
    topo('Plano', 'perfil.html');
    contaDoTipo('empresa').then(function (conta) {
      if (!conta) return;
      navBeta('empresa', 'perfil');
      return Promise.all([
        sb.from('assinaturas').select('*').eq('empresa_id', conta.dados.id).maybeSingle(),
        sb.from('vagas').select('id', { count: 'exact', head: true }).eq('empresa_id', conta.dados.id).eq('status', 'aberta')
      ]).then(function (rs) {
        var a = rs[0].data, ativas = rs[1].count || 0;
        var st = situacaoPlano(a, ativas);
        var limite = a ? a.limite_vagas_ativas : 3;
        $('#content').innerHTML =
          '<section class="card' + (st.alerta ? ' card-warn' : '') + '" id="plano-situacao"><div class="head-row"><h2 class="card-title">' + esc(st.titulo) + '</h2>' +
            '<span class="chip ' + (st.fase === 'encerrado' ? 'red' : st.fase === 'ativa' ? 'green' : 'blue') + '">' + (st.fase === 'ativa' ? 'Ativo' : st.fase === 'encerrado' ? 'Encerrado' : 'Grátis') + '</span></div>' +
            '<p class="row-sub">' + esc(st.texto) + '</p>' +
            '<dl class="summary"><div><dt>Vagas ativas</dt><dd id="uso-vagas">' + ativas + ' de ' + limite + '</dd></div>' +
              (a ? '<div><dt>Grátis desde</dt><dd>' + dataBR(a.gratis_desde) + '</dd></div>' : '') + '</dl></section>' +
          '<section class="section"><h2>Plano Essencial</h2><div class="card plano-card">' +
            '<div class="plano-preco"><b>US$ 79</b><span>por mês</span></div>' +
            '<ul class="check-list">' + ['Até 3 vagas ativas', 'Indicações completas de profissionais', '30 convites diretos por mês', 'Filtros avançados na busca'].map(function (x) {
              return '<li>' + icon('check', 16, { stroke: 2.6 }) + '<span>' + esc(x) + '</span></li>';
            }).join('') + '</ul>' +
            (st.fase === 'ativa' ? '' : '<button type="button" class="btn btn-primary" id="assinar" data-proxima>Assinar o Essencial</button>' +
              '<p class="row-sub">A assinatura pelo app chega na próxima etapa da beta. Até lá, o período grátis segue valendo.</p>') +
          '</div></section>' +
          '<section class="section"><h2>Sempre grátis</h2><div class="card"><ul class="check-list">' +
            ['Confirmar contratações e avaliar', 'Conversar com candidatos', 'Responder candidaturas'].map(function (x) {
              return '<li>' + icon('check', 16, { stroke: 2.6 }) + '<span>' + esc(x) + '</span></li>';
            }).join('') + '</ul><p class="row-sub">Cobrar pelo preenchimento faria empresas deixarem de marcar vagas como preenchidas, e sem vínculo verificado não existe reputação.</p></div></section>';
      });
    }).catch(function (err) { erroCarregar(err, 'perfil.html'); });
  }

  var PAGES = {
    entrar: renderEntrar,
    cadastro: renderCadastro,
    recuperar: renderRecuperar,
    'nova-senha': renderNovaSenha,
    inicio: renderInicio,
    perfil: renderPerfil,
    'publicar-vaga': renderPublicarVaga,
    vagas: renderVagas,
    candidatos: renderCandidatos,
    'ver-profissional': renderVerProfissional,
    buscar: renderBuscar,
    vaga: renderVaga,
    candidaturas: renderCandidaturas,
    mensagens: renderMensagens,
    conversa: renderConversa,
    'registrar-contratacao': renderRegistrarContratacao,
    contratacoes: renderContratacoes,
    avaliar: renderAvaliar,
    notificacoes: renderNotificacoes,
    plano: renderPlano
  };

  var page = document.body.dataset.page;
  if (!configurado) { semConfig(); return; }
  if (PAGES[page]) PAGES[page]();
})();
