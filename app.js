(function () {
  'use strict';

  /* ---------- Piano (Web Audio) ---------- */
  var ctx = null;
  var SEMI = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };

  function freq(note) {
    var m = /^([A-G]#?)(\d)$/.exec(note);
    var n = SEMI[m[1]] + (parseInt(m[2], 10) - 4) * 12 - 9; // semitones from A4
    return 440 * Math.pow(2, n / 12);
  }

  function play(note) {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!ctx) ctx = new AC();
      if (ctx.state === 'suspended') ctx.resume();
      var t = ctx.currentTime, f = freq(note);
      var master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, t);
      master.gain.exponentialRampToValueAtTime(0.35, t + 0.012);
      master.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
      master.connect(ctx.destination);
      [[1, 1], [2, 0.35], [3, 0.12]].forEach(function (p) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.value = f * p[0];
        g.gain.value = p[1];
        o.connect(g); g.connect(master);
        o.start(t); o.stop(t + 1.7);
      });
    } catch (e) { /* audio unavailable */ }
  }

  var keysEl = document.getElementById('keys');
  var keyByNote = {}, keyByChar = {};
  Array.prototype.forEach.call(keysEl.querySelectorAll('.key'), function (k) {
    keyByNote[k.dataset.note] = k;
    keyByChar[k.dataset.key] = k;
    k.addEventListener('pointerdown', function (e) { e.preventDefault(); press(k); });
    k.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!e.repeat) press(k); }
    });
  });

  function press(k) {
    play(k.dataset.note);
    k.classList.add('down');
    setTimeout(function () { k.classList.remove('down'); }, 180);
  }

  document.addEventListener('keydown', function (e) {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    var k = keyByChar[e.key.toLowerCase()];
    if (k) press(k);
  });

  /* feature rows play their note */
  Array.prototype.forEach.call(document.querySelectorAll('.feature-list button'), function (b) {
    b.addEventListener('click', function () {
      play(b.dataset.note);
      var k = keyByNote[b.dataset.note];
      if (k) press(k);
      b.classList.add('hit');
      setTimeout(function () { b.classList.remove('hit'); }, 220);
    });
  });

  /* ---------- Lyrics ---------- */
  var lines = Array.prototype.slice.call(document.querySelectorAll('#lyric-lines li'));
  var toggle = document.getElementById('lyric-toggle');
  var cur = 0, timer = null;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var running = !reduce;

  function show(i) {
    cur = i;
    lines.forEach(function (li, n) {
      li.classList.toggle('on', n === i);
      if (n === i) li.firstElementChild.setAttribute('aria-current', 'true');
      else li.firstElementChild.removeAttribute('aria-current');
    });
  }
  function start() { stop(); timer = setInterval(function () { show((cur + 1) % lines.length); }, 2200); }
  function stop() { if (timer) clearInterval(timer); timer = null; }
  function sync() {
    toggle.textContent = running ? 'Pause lyrics' : 'Play lyrics';
    toggle.setAttribute('aria-pressed', String(!running));
    if (running) start(); else stop();
  }
  lines.forEach(function (li, n) {
    li.firstElementChild.addEventListener('click', function () { show(n); if (running) start(); });
  });
  toggle.addEventListener('click', function () { running = !running; sync(); });
  show(0); sync();

  /* ---------- Colour ---------- */
  var section = document.getElementById('colour');
  var sw = Array.prototype.slice.call(section.querySelectorAll('.swatches button'));
  sw.forEach(function (b) {
    b.addEventListener('click', function () {
      sw.forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
      section.style.setProperty('--album', b.dataset.c);
      document.getElementById('mp-title').textContent = b.dataset.t;
      document.getElementById('mp-artist').innerHTML = b.dataset.a;
    });
  });
})();
