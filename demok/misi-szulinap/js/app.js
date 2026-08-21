(function(){
  'use strict';

  var DRINKS = {
    ser:        { name:'Sör',          emoji:'🍺', wine:0, soda:0, isBeer:true },
    kisfroccs:  { name:'Kisfröccs',    emoji:'🥂', wine:1, soda:1, ratio:'1+1' },
    nagyfroccs: { name:'Nagyfröccs',   emoji:'🍷', wine:2, soda:1, ratio:'2+1' },
    hosszulepes:{ name:'Hosszúlépés',  emoji:'🚶', wine:1, soda:2, ratio:'1+2' },
    hazmester:  { name:'Házmester',    emoji:'🔑', wine:3, soda:2, ratio:'3+2' },
    vicehaz:    { name:'Viceházmester',emoji:'🗝️', wine:2, soda:3, ratio:'2+3' },
    sportfroccs:{ name:'Sportfröccs',  emoji:'🏃', wine:1, soda:4, ratio:'1+4' },
    krudy:      { name:'Krúdy-fröccs', emoji:'💀', wine:9, soda:1, ratio:'9+1' },
    palinka:    { name:'Pálinka',      emoji:'🥃', wine:0, soda:0, isShot:true }
  };

  var BADGES = [
    { at:1,  name:'Első kör',        emoji:'🥇' },
    { at:3,  name:'Bemelegítés',     emoji:'🔥' },
    { at:5,  name:'Fröccsöntő mester', emoji:'🏆' },
    { at:8,  name:'Az éjszaka bajnoka', emoji:'🌙' },
    { at:12, name:'Élő legenda',     emoji:'👑' }
  ];

  var TOASTS = [
    'Igyunk arra, hogy Misi ma is túlélte a szülinapját!',
    'Legyen ez az év olyan jó, mint a legjobb fröccsöd aránya!',
    'Sör legyen a kezedben, fröccs a szívedben!',
    'Kívánom, hogy annyi boldogság érjen, ahány pohárt ma felhajtasz!',
    'Egészségedre, Misi – és a szódavíznek is, hogy bírja a tempót!',
    'Aki bírja, karja – aki Misi, az bulizza!',
    'Igyunk arra, hogy jövőre is legalább ilyen jó társaságban ünnepelj!',
    'Fenékig, de csak azért, mert Misi szülinapja van!',
    'Legyen az élet olyan kerek, mint egy jó nagyfröccs aránya!',
    'Ürítsük poharunkat a mai hősünkre – Misi, Isten éltessen!',
    'Igyunk arra, hogy Misi, baszd meg, megint egy évvel öregebb lett, de a lelke még mindig egy huszonéves balfaszé!',
    'Legyen ez az este annyira jó, hogy holnapra kibaszottul semmire se emlékezz, csak arra, hogy állat volt!',
    'Ha ma este nem leszel seggrészeg, Misi, akkor valamit nagyon elszúrtunk!',
    'Egészségedre, baszki – ennyi év után is te vagy a legjobb arc, akit ismerünk!',
    'Igyunk arra, hogy a barátságunk olyan szilárd, mint a másnaposságod lesz holnap reggel nyolckor!',
    'Fenékig, mert ha valaki megérdemli a jó bulit, az bassza meg, te vagy az, Misi!',
    'Annyi boldogságot kívánok, amennyi fröccsöt ma még sikeresen el fogsz baszni!',
    'Igyunk arra, hogy jövőre is ilyen kibaszottul jó társaságban ünnepeljünk!'
  ];

  var $ = function(sel){ return document.querySelector(sel); };
  var $$ = function(sel){ return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  function loadState(){
    try{
      var raw = localStorage.getItem('misi-drinks');
      if(raw) return JSON.parse(raw);
    }catch(e){}
    var s = {};
    Object.keys(DRINKS).forEach(function(k){ s[k]=0; });
    return s;
  }
  function saveState(state){
    try{ localStorage.setItem('misi-drinks', JSON.stringify(state)); }catch(e){}
  }

  var state = loadState();

  function totals(){
    var beer=0, froccs=0, shots=0, wineDl=0, sodaDl=0, all=0;
    Object.keys(DRINKS).forEach(function(k){
      var count = state[k]||0;
      var d = DRINKS[k];
      all += count;
      if(d.isBeer) beer += count;
      else if(d.isShot) shots += count;
      else froccs += count;
      wineDl += count * d.wine;
      sodaDl += count * d.soda;
    });
    return { beer:beer, froccs:froccs, shots:shots, wineDl:wineDl, sodaDl:sodaDl, all:all };
  }

  var PROMILLE_TIERS = [
    {
      max: 0.5,
      label: 'Még józan, mint a ma reggeli kávé',
      fact: 'Tudtad? Magyarországon a vezetési határ 0,0 ‰ (nulla tolerancia), Németországban és Olaszországban 0,5 ‰-ig, az USA nagy részén pedig egészen 0,8 ‰-ig szabad vezetni.'
    },
    {
      max: 1.2,
      label: 'Becsípve – hirtelen minden szimpatikusabb',
      fact: 'Ez a híres "sörszemüveg-effektus": az alkohol tompítja az agy aszimmetria-érzékelését, ezért mindenki egy fokkal szimmetrikusabbnak, vagyis vonzóbbnak tűnik.'
    },
    {
      max: 2.0,
      label: 'Filozofál a világ nagy dolgairól',
      fact: 'Az egyensúly és a beszéd látványosan romlik (ataxia). Extra tudtad: a szonda nem a nyáladból mér, hanem a kilélegzett levegőből, mert az alkohol 1:2100 arányban pontosan párolog át a véredből a tüdődbe.'
    },
    {
      max: 3.0,
      label: 'Hazakísérné a villamost',
      fact: 'Ez a klasszikus filmszakadás: az alkohol blokkolja a hippokampuszt, úgyhogy az agyad ilyenkor nem felejt – eleve le sem menti az estét.'
    }
  ];
  var SERIOUS_LABEL = 'Na jó, ez már nem vicc';
  var SERIOUS_FACT = 'Igyál egy nagy pohár vizet, ülj le, és lassíts. A haverok jövőre is szeretnének látni.';

  function estimatePromille(t){
    // Egyszerűsített, JOKE Widmark-becslés – nem orvosi számítás.
    var alcoholG = (t.wineDl*100*0.11 + t.beer*500*0.05 + t.shots*40*0.40) * 0.8;
    var promille = alcoholG / (80 * 0.7); // m=80kg, r=0.7 (átlag férfi feltevés)
    return promille;
  }

  function meterInfo(t){
    var promille = estimatePromille(t);
    var pct = Math.max(0, Math.min(100, (promille/3.5)*100));
    var serious = promille > 3.0;
    var tier = null;
    for(var i=0;i<PROMILLE_TIERS.length;i++){
      if(promille <= PROMILLE_TIERS[i].max){ tier = PROMILLE_TIERS[i]; break; }
    }
    if(!tier) tier = PROMILLE_TIERS[PROMILLE_TIERS.length-1];
    return {
      pct: pct,
      promille: promille,
      serious: serious,
      label: serious ? SERIOUS_LABEL : tier.label,
      fact: serious ? SERIOUS_FACT : tier.fact
    };
  }

  function render(){
    var t = totals();
    $('#statBeer').textContent = t.beer;
    $('#statFroccs').textContent = t.froccs;
    $('#statWine').textContent = t.wineDl.toFixed(1).replace('.0','') + ' dl';
    $('#statSoda').textContent = t.sodaDl.toFixed(1).replace('.0','') + ' dl';
    $('#statShots').textContent = t.shots;

    var m = meterInfo(t);
    $('#meterFill').style.width = m.pct + '%';
    var promilleText = m.promille <= 0 ? '' : ' (kb. ' + m.promille.toFixed(1).replace('.', ',') + ' ‰, JOKE becslés)';
    $('#meterStatus').textContent = m.label + promilleText;
    $('#meterFact').textContent = m.fact;
    $('#meterWrap').classList.toggle('serious', m.serious);

    $$('.badge').forEach(function(el){
      var at = parseInt(el.getAttribute('data-at'), 10);
      el.classList.toggle('unlocked', t.all >= at);
    });
  }

  function fireConfetti(){
    var emojis = ['🎉','🎊','🥳','✨','🍾'];
    for(var i=0;i<24;i++){
      (function(){
        var span = document.createElement('span');
        span.className = 'confetti-piece';
        span.textContent = emojis[Math.floor(Math.random()*emojis.length)];
        var left = Math.random()*100;
        var duration = 1800 + Math.random()*1200;
        var rotate = (Math.random()*720-360).toFixed(0);
        span.style.left = left + 'vw';
        span.style.transition = 'transform '+duration+'ms ease-in, opacity '+duration+'ms ease-in';
        document.body.appendChild(span);
        requestAnimationFrame(function(){
          span.style.transform = 'translateY(100vh) rotate('+rotate+'deg)';
          span.style.opacity = '0.15';
        });
        setTimeout(function(){ span.remove(); }, duration+80);
      })();
    }
  }

  function handleDrinkClick(key){
    var before = totals().all;
    state[key] = (state[key]||0) + 1;
    saveState(state);
    var after = totals().all;
    render();
    var newlyUnlocked = BADGES.some(function(b){ return b.at===after && before<b.at; });
    if(newlyUnlocked) fireConfetti();
  }

  function buildCounterButtons(){
    var grid = $('#counterGrid');
    Object.keys(DRINKS).forEach(function(key){
      var d = DRINKS[key];
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'drink-btn';
      btn.innerHTML = '<span class="emoji">'+d.emoji+'</span>' +
        '<span class="name">'+d.name+' +1</span>' +
        (d.ratio ? '<span class="ratio">'+d.ratio+' (bor+szóda)</span>' : '<span class="ratio">&nbsp;</span>');
      btn.addEventListener('click', function(){ handleDrinkClick(key); });
      grid.appendChild(btn);
    });
  }

  function buildBadges(){
    var row = $('#badgeRow');
    BADGES.forEach(function(b){
      var el = document.createElement('div');
      el.className = 'badge';
      el.setAttribute('data-at', b.at);
      el.innerHTML = '<span class="bi">'+b.emoji+'</span> '+b.name+' ('+b.at+')';
      row.appendChild(el);
    });
  }

  function newToast(){
    var t = TOASTS[Math.floor(Math.random()*TOASTS.length)];
    $('#toastText').textContent = t;
  }

  var easterHideTimer = null;
  function triggerEasterEgg(){
    var overlay = $('#easterOverlay');
    if(!overlay) return;
    if(easterHideTimer) clearTimeout(easterHideTimer);
    overlay.classList.add('show');
    easterHideTimer = setTimeout(function(){
      overlay.classList.remove('show');
      easterHideTimer = null;
    }, 3200);
  }
  function dismissEasterEgg(){
    var overlay = $('#easterOverlay');
    if(!overlay) return;
    if(easterHideTimer){ clearTimeout(easterHideTimer); easterHideTimer = null; }
    overlay.classList.remove('show');
  }

  function loadGuestbook(){
    try{
      var raw = localStorage.getItem('misi-guestbook-2');
      return raw ? JSON.parse(raw) : [];
    }catch(e){ return []; }
  }
  function saveGuestbook(list){
    try{ localStorage.setItem('misi-guestbook-2', JSON.stringify(list)); }catch(e){}
  }
  function renderGuestbook(){
    var list = loadGuestbook();
    var wrap = $('#gbList');
    wrap.innerHTML = '';
    if(!list.length){
      wrap.innerHTML = '<div class="gb-empty">Még senki nem írt – legyél te az első!</div>';
      return;
    }
    list.slice().reverse().forEach(function(item){
      var div = document.createElement('div');
      div.className = 'gb-item';
      div.innerHTML = '<div class="who"></div><div class="msg"></div>';
      div.querySelector('.who').textContent = item.name;
      div.querySelector('.msg').textContent = item.msg;
      wrap.appendChild(div);
    });
  }
  var GB_ENDPOINT = 'https://www.polarisweb.hu/api/send-guestbook';
  function gbSay(text, ok){
    var s = $('#gbStatus');
    if(!s) return;
    s.textContent = text;
    s.className = 'gb-status ' + (ok ? 'ok' : 'err');
    s.hidden = false;
  }
  function handleGuestbookSubmit(e){
    e.preventDefault();
    var nameEl = $('#gbName');
    var msgEl = $('#gbMsg');
    var name = nameEl.value.trim();
    var msg = msgEl.value.trim();
    if(!name || !msg) return;
    // Helyben megjelenik es megmarad a telefonon.
    var list = loadGuestbook();
    list.push({ name:name, msg:msg, ts:Date.now() });
    saveGuestbook(list);
    renderGuestbook();
    // Es emailben is elmegy Misinek. A cimzettet a szerver donti el (key='misi'),
    // igy a bongeszobol nem lehet mas cimre kuldeni.
    nameEl.value = '';
    msgEl.value = '';
    gbSay('Küldés Misinek...', true);
    fetch(GB_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'misi', name: name, message: msg })
    })
      .then(function(r){ return r.json().then(function(j){ return { ok: r.ok, body: j }; }); })
      .then(function(r){
        if(!r.ok) throw new Error((r.body && r.body.error) || 'hiba');
        gbSay('Elküldve Misinek! 🎉 (és itt is megmaradt)', true);
      })
      .catch(function(){
        gbSay('Az email most nem ment el, de a bejegyzésed itt megmaradt a telefonon.', false);
      });
  }

  document.addEventListener('DOMContentLoaded', function(){
    buildCounterButtons();
    buildBadges();
    render();
    renderGuestbook();

    $('#resetBtn').addEventListener('click', function(){
      if(!confirm('Biztosan nullázod a számlálót? (Új meccs indul)')) return;
      Object.keys(DRINKS).forEach(function(k){ state[k]=0; });
      saveState(state);
      render();
    });

    $('#toastBtn').addEventListener('click', newToast);
    newToast();

    $('#gbForm').addEventListener('submit', handleGuestbookSubmit);

    var easterBtn = $('#easterBtn');
    if(easterBtn) easterBtn.addEventListener('click', triggerEasterEgg);
    var easterOverlay = $('#easterOverlay');
    if(easterOverlay) easterOverlay.addEventListener('click', dismissEasterEgg);
  });
})();
