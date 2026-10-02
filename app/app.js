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
      '<a href="perfil.html" class="avatar' + (empresa ? '' : ' blue') + '" aria-label="' + (empresa ? 'Minha empresa' : 'Meu perfil') + '">' +
        esc(iniciais(conta.dados && conta.dados.nome)) + '</a>';
  }

  function topo(titulo, voltar) {
    $('#topbar').innerHTML = '<a href="' + esc(voltar) + '" class="icon-btn" aria-label="Voltar">' + icon('back', 22, { stroke: 2 }) + '</a>' +
      '<h1 class="topbar-title">' + esc(titulo) + '</h1>';
  }

  // Mesma navegação do protótipo; o que ainda não existe na beta avisa que chega na próxima etapa.
  function navBeta(tipo, atual) {
    var itens = tipo === 'empresa'
      ? [{ id: 'inicio', label: 'Início', icon: 'home', href: 'inicio.html' }, { id: 'vagas', label: 'Vagas', icon: 'briefcase', href: 'vagas.html' },
        { id: 'candidatos', label: 'Candidatos', icon: 'users', href: 'candidatos.html' }, { id: 'mensagens', label: 'Mensagens', icon: 'message' },
        { id: 'perfil', label: 'Empresa', icon: 'building', href: 'perfil.html' }]
      : [{ id: 'inicio', label: 'Início', icon: 'home', href: 'inicio.html' }, { id: 'buscar', label: 'Buscar', icon: 'search', href: 'buscar.html' },
        { id: 'candidaturas', label: 'Candidaturas', icon: 'clipboard', href: 'candidaturas.html' }, { id: 'mensagens', label: 'Mensagens', icon: 'message' },
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
          var stats, principal, resumo;
          if (empresa) {
            var abertas = x.vagas.filter(function (v) { return v.status === 'aberta'; });
            var novos = x.cands.filter(function (c) { return c.status === 'novo'; });
            var atrasados = novos.filter(function (c) { return diasDesde(c.criado_em) > D.prazoRespostaDias; });
            var publicouAlguma = x.vagas.some(function (v) { return v.publicada_em; });
            stats = [{ v: String(abertas.length), r: 'vagas abertas' }, { v: String(novos.length), r: plural(novos.length, 'candidato novo', 'candidatos novos').replace(/^\d+ /, '') },
              publicouAlguma ? { v: String(x.cands.length), r: 'candidaturas no total' } : { v: '3 meses', r: 'grátis na 1ª vaga' }];
            if (!completo) stats[0] = { v: pct + '%', r: 'perfil completo', id: 'pct' };
            resumo = !publicouAlguma ? 'Tudo pronto para publicar a primeira vaga.'
              : (novos.length ? 'Você tem ' + plural(novos.length, 'candidato novo', 'candidatos novos') + ' para responder.' : 'Tudo em dia com os candidatos.');
            var pend = [];
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
              '<div class="hero-score"><b class="novo">Novo</b><div><strong>★ Reputação em construção</strong>' +
                '<span>' + (empresa ? 'Cada contratação confirmada conta aqui' : 'Cada trabalho confirmado conta aqui') + '</span></div></div>' +
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

  /* =====================================================================
   * ETAPA 3 — VAGAS E CANDIDATURAS
   * ===================================================================== */

  function rotuloDe(lista, id) { var x = lista.filter(function (i) { return i.id === id; })[0]; return x ? x.rotulo : ''; }
  var MODELOS_ROT = { presencial: 'Presencial', hibrido: 'Híbrido', remoto: 'Remoto' };

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
      var b = e.target.closest('[data-cand]');
      if (!b) return;
      var novo = b.getAttribute('data-cand');
      ocupado(b, true, 'Salvando…');
      sb.from('candidaturas').update({ status: novo }).eq('id', b.getAttribute('data-id')).then(function (r) {
        if (r.error) { ocupado(b, false); status(erroComDetalhe(r.error)); return; }
        toast({ conversa: 'Candidato chamado para conversa. As mensagens chegam na próxima etapa da beta.', nao: 'Candidato marcado como não selecionado. Ele vê o retorno nas candidaturas dele.', novo: 'Status desfeito.' }[novo]);
        carregar();
      });
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
        sb.from('reputacao_profissionais').select('*').eq('profissional_id', id).maybeSingle(),
        vagaId ? sb.from('vagas').select('*').eq('id', vagaId).maybeSingle() : Promise.resolve({ data: null })
      ]).then(function (rs) {
        var p = rs[0].data;
        if (rs[0].error) throw rs[0].error;
        if (!p) { $('#content').innerHTML = vazio('Perfil indisponível', 'O profissional pode ter ocultado o perfil ou apagado a conta.', '<a href="candidatos.html" class="btn btn-primary">Voltar</a>'); return; }
        var exps = rs[1].data || [], rep = rs[2].data, v = rs[3].data;
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
          (declaradas.length ? '<section class="section"><h2>Experiência declarada</h2><ul class="card exp-list">' + declaradas.map(exp).join('') + '</ul></section>' : '');
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
          '<div class="chips"><span class="chip blue">Empresa nova · reputação em construção</span></div></div></section>';
      var b = $('#candidatar');
      if (b) b.addEventListener('click', formCandidatura);
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
    candidaturas: renderCandidaturas
  };

  var page = document.body.dataset.page;
  if (!configurado) { semConfig(); return; }
  if (PAGES[page]) PAGES[page]();
})();
