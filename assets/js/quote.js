/* polarisweb — Ajánlatkérés multi-step quote wizard */
(function () {
  'use strict';

  var root = document.getElementById('wizardForm');
  if (!root) return;

  /* ---- Data ---- */
  var businessTypes = [
    { value: 'etterem', label: 'Étterem / kávézó' },
    { value: 'szepsegszalon', label: 'Szépségszalon / rendelő' },
    { value: 'vallalkozo', label: 'Vállalkozó / szolgáltató' },
    { value: 'studio', label: 'Stúdió / kreatív munka' },
    { value: 'webshop', label: 'Webshop' },
    { value: 'egyeb', label: 'Egyéb' }
  ];
  var pages = [
    { value: 'kezdolap', label: 'Kezdőlap' },
    { value: 'rolunk', label: 'Rólunk' },
    { value: 'szolgaltatasok', label: 'Szolgáltatások' },
    { value: 'arlista', label: 'Árlista' },
    { value: 'galeria', label: 'Galéria' },
    { value: 'blog', label: 'Blog' },
    { value: 'kapcsolat', label: 'Kapcsolat' },
    { value: 'foglalas', label: 'Online foglalás' },
    { value: 'webshop', label: 'Webshop' },
    { value: 'egyeb', label: 'Egyéb' }
  ];
  var features = [
    { value: 'idopont', label: 'Online időpontfoglalás' },
    { value: 'fizetes', label: 'Fizetés / webshop funkció' },
    { value: 'tobbnyelvu', label: 'Többnyelvű oldal' },
    { value: 'hirlevel', label: 'Hírlevél feliratkozás' },
    { value: 'terkep', label: 'Google térkép beágyazás' },
    { value: 'kozossegi', label: 'Közösségi média integráció' },
    { value: 'egyeb', label: 'Egyéb' }
  ];
  var styleOptions = [
    { value: 'minimalista', label: 'Letisztult / minimalista' },
    { value: 'modern', label: 'Modern / dinamikus' },
    { value: 'meleg', label: 'Meleg / barátságos' },
    { value: 'elegans', label: 'Elegáns / prémium' },
    { value: 'jatekos', label: 'Játékos / színes' },
    { value: 'klasszikus', label: 'Klasszikus / megbízható' },
    { value: 'egyeb', label: 'Egyéb' }
  ];

  /* ---- State ---- */
  var state = {
    step: 1,
    businessType: null,
    pages: {},
    features: {},
    hasSite: 'nincs',
    budget: 'nemtudom',
    name: '', company: '', email: '', phone: '', message: '',
    aszf: false,
    style: {}, audience: '', brandColor: '', reference: '',
    businessOther: '', pagesOther: '', featuresOther: '', styleOther: '',
    hasSiteOther: '', budgetOther: ''
  };

  /* Registry of the reveal-on-"Egyéb" free-text inputs, keyed by state field. */
  var others = {};
  var otherPlaceholders = {
    businessOther: 'pl. telefonszerelő kisvállalkozás',
    pagesOther: 'pl. Karrier / Állás oldal',
    featuresOther: 'pl. foglalási naptár, élő chat…',
    styleOther: 'pl. retró, art deco…',
    hasSiteOther: 'Írja le röviden a jelenlegi helyzetét',
    budgetOther: 'pl. inkább egyszeri díjat szeretnék'
  };

  /* ---- Elements ---- */
  var el = {
    progress: root.querySelector('[data-progress]'),
    stepLabel: root.querySelector('[data-step-label]'),
    panels: root.querySelectorAll('.step-panel'),
    business: root.querySelector('[data-business]'),
    pages: root.querySelector('[data-pages]'),
    features: root.querySelector('[data-features]'),
    style: root.querySelector('[data-style]'),
    back: root.querySelector('[data-back]'),
    backPlaceholder: root.querySelector('[data-back-placeholder]'),
    next: root.querySelector('[data-next]'),
    submit: root.querySelector('[data-submit]'),
    sumBusiness: root.querySelector('[data-sum-business]'),
    sumPages: root.querySelector('[data-sum-pages]'),
    sumFeatures: root.querySelector('[data-sum-features]'),
    sumHasSite: root.querySelector('[data-sum-hassite]'),
    sumBudget: root.querySelector('[data-sum-budget]'),
    success: document.getElementById('wizardSuccess'),
    successName: document.querySelector('[data-success-name]'),
    honeypot: root.querySelector('[data-honeypot]'),
    error: root.querySelector('[data-error]'),
    aszf: root.querySelector('[data-aszf]'),
    consentError: root.querySelector('[data-consent-error]'),
    submitWrap: root.querySelector('[data-submit-wrap]')
  };

  /* ---- Build option elements ---- */
  // Reveals a free-text input under a list/select when "Egyéb" is picked.
  function buildOther(container, stateKey) {
    var wrap = document.createElement('div');
    wrap.className = 'opt-other';
    wrap.hidden = true;
    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'input';
    input.placeholder = otherPlaceholders[stateKey] || 'Írja le röviden…';
    input.setAttribute('aria-label', 'Egyéb — saját válasz');
    input.addEventListener('input', function () { state[stateKey] = input.value; });
    wrap.appendChild(input);
    container.appendChild(wrap);
    others[stateKey] = { wrap: wrap, input: input };
  }

  function toggleOther(stateKey, show, focus) {
    var o = others[stateKey];
    if (!o) return;
    o.wrap.hidden = !show;
    if (!show) {
      o.input.value = '';
      state[stateKey] = '';
    } else if (focus) {
      o.input.focus();
    }
  }

  function buildRadio(container, list, compact, otherKey) {
    list.forEach(function (o) {
      var label = document.createElement('label');
      label.className = 'opt' + (compact ? ' compact' : '');
      label.innerHTML = '<input type="radio" name="businessType" value="' + o.value + '">' +
        '<span>' + o.label + '</span>';
      label.querySelector('input').addEventListener('change', function () {
        state.businessType = o.value;
        markSelection(container, 'businessType');
        if (otherKey) toggleOther(otherKey, o.value === 'egyeb', true);
        updateControls();
      });
      container.appendChild(label);
    });
    if (otherKey) buildOther(container, otherKey);
  }

  function buildChecks(container, list, mapKey, compact, otherKey) {
    list.forEach(function (o) {
      var label = document.createElement('label');
      label.className = 'opt' + (compact ? ' compact' : '');
      label.innerHTML = '<input type="checkbox" value="' + o.value + '">' +
        '<span>' + o.label + '</span>';
      label.querySelector('input').addEventListener('change', function (e) {
        state[mapKey][o.value] = e.target.checked;
        label.classList.toggle('checked', e.target.checked);
        if (otherKey && o.value === 'egyeb') toggleOther(otherKey, e.target.checked, true);
      });
      container.appendChild(label);
    });
    if (otherKey) buildOther(container, otherKey);
  }

  function markSelection(container, key) {
    container.querySelectorAll('.opt').forEach(function (opt) {
      var input = opt.querySelector('input');
      opt.classList.toggle('checked', state[key] === input.value);
    });
  }

  buildRadio(el.business, businessTypes, false, 'businessOther');
  buildChecks(el.pages, pages, 'pages', true, 'pagesOther');
  buildChecks(el.features, features, 'features', false, 'featuresOther');
  buildChecks(el.style, styleOptions, 'style', true, 'styleOther');

  /* ---- Selects & text inputs ---- */
  var hassiteSel = root.querySelector('[data-hassite]');
  hassiteSel.addEventListener('change', function (e) {
    state.hasSite = e.target.value;
    toggleOther('hasSiteOther', e.target.value === 'egyeb', true);
  });
  buildOther(hassiteSel.closest('.field'), 'hasSiteOther');

  var budgetSel = root.querySelector('[data-budget]');
  budgetSel.addEventListener('change', function (e) {
    state.budget = e.target.value;
    toggleOther('budgetOther', e.target.value === 'egyeb', true);
  });
  buildOther(budgetSel.closest('.field'), 'budgetOther');

  /* ---- Optional visual-preference inputs (never required) ---- */
  root.querySelector('[data-audience]').addEventListener('change', function (e) { state.audience = e.target.value; });
  root.querySelector('[data-brandcolor]').addEventListener('input', function (e) { state.brandColor = e.target.value; });
  root.querySelector('[data-reference]').addEventListener('input', function (e) { state.reference = e.target.value; });
  function showConsentError() {
    el.consentError.hidden = false;
    el.consentError.classList.remove('shake');
    void el.consentError.offsetWidth; // restart the shake animation on repeat clicks
    el.consentError.classList.add('shake');
  }

  el.aszf.addEventListener('change', function (e) {
    state.aszf = e.target.checked;
    if (state.aszf) el.consentError.hidden = true;
    updateControls();
  });

  if (el.submitWrap) {
    el.submitWrap.addEventListener('click', function () {
      if (el.submit.disabled && !state.aszf) {
        showConsentError();
        el.aszf.focus();
      }
    });
  }
  ['name', 'company', 'email', 'phone', 'message'].forEach(function (key) {
    var input = root.querySelector('[data-' + key + ']');
    input.addEventListener('input', function (e) {
      state[key] = e.target.value;
      if (key === 'name' || key === 'email') updateControls();
    });
  });

  /* ---- Summary ---- */
  // Turns a chosen list into labels, substituting the typed text for "Egyéb".
  function chosenArray(list, map, otherText) {
    return list.filter(function (o) { return map[o.value]; }).map(function (o) {
      if (o.value === 'egyeb') {
        return otherText && otherText.trim() ? 'Egyéb: ' + otherText.trim() : 'Egyéb';
      }
      return o.label;
    });
  }
  function labelsFor(list, map, otherText) {
    var arr = chosenArray(list, map, otherText);
    return arr.length ? arr.join(', ') : '—';
  }
  var budgetLabels = {
    '20-40': '20 000 – 40 000 Ft / hó',
    '40-80': '40 000 – 80 000 Ft / hó',
    '80+': '80 000 Ft felett / hó',
    'nemtudom': 'Még nem tudom'
  };
  var hasSiteLabels = {
    'nincs': 'Nincs még weboldala',
    'van': 'Van már weboldala',
    'kozossegi': 'Csak közösségi média oldala van'
  };
  function businessText() {
    if (state.businessType === 'egyeb') {
      return state.businessOther.trim() ? 'Egyéb: ' + state.businessOther.trim() : 'Egyéb';
    }
    var bt = businessTypes.filter(function (o) { return o.value === state.businessType; })[0];
    return bt ? bt.label : '—';
  }
  function hasSiteText() {
    if (state.hasSite === 'egyeb') {
      return state.hasSiteOther.trim() ? 'Egyéb: ' + state.hasSiteOther.trim() : 'Egyéb';
    }
    return hasSiteLabels[state.hasSite] || '—';
  }
  function budgetText() {
    if (state.budget === 'egyeb') {
      return state.budgetOther.trim() ? 'Egyéb: ' + state.budgetOther.trim() : 'Egyéb';
    }
    return budgetLabels[state.budget] || '—';
  }
  function updateSummary() {
    el.sumBusiness.textContent = businessText();
    el.sumPages.textContent = labelsFor(pages, state.pages, state.pagesOther);
    el.sumFeatures.textContent = labelsFor(features, state.features, state.featuresOther);
    el.sumHasSite.textContent = hasSiteText();
    el.sumBudget.textContent = budgetText();
  }

  /* ---- Render ---- */
  function render() {
    el.panels.forEach(function (p) {
      p.hidden = parseInt(p.getAttribute('data-step'), 10) !== state.step;
    });
    el.progress.querySelectorAll('.dot').forEach(function (dot, i) {
      dot.classList.toggle('on', (i + 1) <= state.step);
    });
    el.stepLabel.textContent = state.step + '. lépés / 5';

    el.back.hidden = state.step <= 1;
    el.backPlaceholder.hidden = state.step > 1;
    el.next.hidden = state.step >= 5;
    el.submitWrap.hidden = state.step < 5;

    if (state.step === 5) updateSummary();
    updateControls();
  }

  function updateControls() {
    el.next.disabled = state.step === 1 && !state.businessType;
    el.submit.disabled = !state.name.trim() || !state.email.trim() || !state.aszf;
  }

  /* ---- Navigation ---- */
  el.next.addEventListener('click', function () {
    if (state.step === 1 && !state.businessType) return;
    state.step = Math.min(5, state.step + 1);
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  el.back.addEventListener('click', function () {
    state.step = Math.max(1, state.step - 1);
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  function buildPayload() {
    return {
      name: state.name.trim(),
      company: state.company.trim(),
      email: state.email.trim(),
      phone: state.phone.trim(),
      message: state.message.trim(),
      businessType: businessText(),
      pages: chosenArray(pages, state.pages, state.pagesOther),
      features: chosenArray(features, state.features, state.featuresOther),
      hasSite: hasSiteText(),
      budget: budgetText(),
      style: chosenArray(styleOptions, state.style, state.styleOther),
      audience: state.audience,
      brandColor: state.brandColor.trim(),
      reference: state.reference.trim(),
      website: el.honeypot ? el.honeypot.value : ''
    };
  }

  function showError(msg) {
    el.error.textContent = msg;
    el.error.hidden = false;
  }

  el.submit.addEventListener('click', function () {
    if (!state.name.trim() || !state.email.trim()) return;
    if (!state.aszf) {
      showConsentError();
      el.aszf.focus();
      return;
    }
    el.error.hidden = true;
    el.submit.disabled = true;
    var originalLabel = el.submit.textContent;
    el.submit.textContent = 'Küldés…';

    fetch('/api/send-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload())
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!res.ok) throw new Error(data.error || 'Nem sikerült elküldeni az üzenetet.');
          return data;
        });
      })
      .then(function () {
        el.successName.textContent = state.name.trim();
        root.hidden = true;
        el.success.hidden = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch(function (err) {
        showError(err.message || 'Nem sikerült elküldeni az üzenetet. Próbálja újra.');
        el.submit.disabled = false;
        el.submit.textContent = originalLabel;
      });
  });

  render();
})();
