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
    krudy:      { name:'Krúdy-fröccs', emoji:'💀', wine:9, soda:1, ratio:'9+1' }
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
    'Egészségedre, Misi -- és a szódavíznek is, hogy bírja a tempót!',
    'Aki bírja, karja -- aki Misi, az bulizza!',
    'Igyunk arra, hogy jövőre is legalább ilyen jó társaságban ünnepelj!',
    'Fenékig, de csak azért, mert Misi szülinapja van!',
    'Legyen az élet olyan kerek, mint egy jó nagyfröccs aránya!',
    'Ürítsük poharunkat a mai hősünkre -- Misi, Isten éltessen!'
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
    var beer=0, froccs=0, wineDl=0, sodaDl=0, all=0;
    Object.keys(DRINKS).forEach(function(k){
      var count = state[k]||0;
      var d = DRINKS[k];
      all += count;
      if(d.isBeer) beer += count; else froccs += count;
      wineDl += count * d.wine;
      sodaDl += count * d.soda;
    });
    return { beer:beer, froccs:froccs, wineDl:wineDl, sodaDl:sodaDl, all:all };
  }

  function meterInfo(t){
    var units = t.beer*1 + t.wineDl*0.35;
    var pct = Math.max(0, Math.min(100, (units/10)*100));
    var label;
    if(units<=0) label='Még józan, mint a ma reggeli kávé';
    else if(units<=2) label='Még szalonnázik';
    else if(units<=4) label='Filozofál a világ nagy dolgairól';
    else if(units<=6.5) label='Mindenkit szeret, tényleg mindenkit';
    else if(units<=9) label='Hazakísérné a villamost';
    else label='Legenda lesz belőle a buli végére';
    return { pct:pct, label:label };
  }

  function render(){
    var t = totals();
    $('#statBeer').textContent = t.beer;
    $('#statFroccs').textContent = t.froccs;
    $('#statWine').textContent = t.wineDl.toFixed(1).replace('.0','') + ' dl';
    $('#statSoda').textContent = t.sodaDl.toFixed(1).replace('.0','') + ' dl';

    var m = meterInfo(t);
    $('#meterFill').style.width = m.pct + '%';
    $('#meterStatus').textContent = m.label;

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

  function loadGuestbook(){
    try{
      var raw = localStorage.getItem('misi-guestbook');
      return raw ? JSON.parse(raw) : [];
    }catch(e){ return []; }
  }
  function saveGuestbook(list){
    try{ localStorage.setItem('misi-guestbook', JSON.stringify(list)); }catch(e){}
  }
  function renderGuestbook(){
    var list = loadGuestbook();
    var wrap = $('#gbList');
    wrap.innerHTML = '';
    if(!list.length){
      wrap.innerHTML = '<div class="gb-empty">Még senki nem írt -- legyél te az első!</div>';
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
  function handleGuestbookSubmit(e){
    e.preventDefault();
    var nameEl = $('#gbName');
    var msgEl = $('#gbMsg');
    var name = nameEl.value.trim();
    var msg = msgEl.value.trim();
    if(!name || !msg) return;
    var list = loadGuestbook();
    list.push({ name:name, msg:msg, ts:Date.now() });
    saveGuestbook(list);
    nameEl.value = '';
    msgEl.value = '';
    renderGuestbook();
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
  });
})();
