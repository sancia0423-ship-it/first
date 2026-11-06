/* 姐姐的不对劲 · audio
 * Every sound is synthesised with the Web Audio API; there are no audio files.
 * G.audio.unlock() must run inside a user gesture (the cover's start button does it).
 */
(function () {
  'use strict';

  var G = window.G;
  var ctx = null;
  var master = null;
  var loops = {};
  var muted = G.state.get('muted', false);

  function now() { return ctx.currentTime; }

  function noiseBuffer(seconds) {
    var len = Math.floor(ctx.sampleRate * seconds);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  function env(gainNode, t0, attack, peak, decay) {
    var g = gainNode.gain;
    g.cancelScheduledValues(t0);
    g.setValueAtTime(0.0001, t0);
    g.exponentialRampToValueAtTime(peak, t0 + attack);
    g.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
  }

  function tone(type, freq, t0, attack, peak, decay, dest) {
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    env(g, t0, attack, peak, decay);
    o.connect(g).connect(dest || master);
    o.start(t0);
    o.stop(t0 + attack + decay + 0.05);
    return o;
  }

  function noise(t0, dur, filterType, freq, peak, dest) {
    var src = ctx.createBufferSource();
    src.buffer = noiseBuffer(Math.max(dur, 0.05));
    var f = ctx.createBiquadFilter();
    f.type = filterType;
    f.frequency.value = freq;
    var g = ctx.createGain();
    env(g, t0, 0.005, peak, dur);
    src.connect(f).connect(g).connect(dest || master);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  var sfx = {
    tap: function (t) { tone('sine', 920, t, 0.002, 0.08, 0.05); },
    ding: function (t) {
      tone('sine', 880, t, 0.005, 0.18, 0.25);
      tone('sine', 1320, t + 0.11, 0.005, 0.14, 0.35);
    },
    shutter: function (t) {
      noise(t, 0.04, 'highpass', 2500, 0.5);
      noise(t + 0.07, 0.05, 'highpass', 1800, 0.4);
    },
    error: function (t) { tone('square', 140, t, 0.005, 0.08, 0.16); },
    chime: function (t) {
      tone('sine', 660, t, 0.01, 0.2, 1.4);
      tone('sine', 990, t, 0.01, 0.08, 1.1);
      tone('sine', 1320, t + 0.02, 0.01, 0.04, 0.8);
    },
    stamp: function (t) {
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(90, t);
      o.frequency.exponentialRampToValueAtTime(38, t + 0.35);
      env(g, t, 0.004, 0.9, 0.5);
      o.connect(g).connect(master);
      o.start(t); o.stop(t + 0.6);
      noise(t, 0.12, 'lowpass', 600, 0.5);
    },
    heartbeat: function (t) {
      [0, 0.22].forEach(function (d, i) {
        var o = ctx.createOscillator();
        var g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(62, t + d);
        o.frequency.exponentialRampToValueAtTime(40, t + d + 0.15);
        env(g, t + d, 0.01, i ? 0.35 : 0.5, 0.2);
        o.connect(g).connect(master);
        o.start(t + d); o.stop(t + d + 0.3);
      });
    },
    paper: function (t) { noise(t, 0.25, 'bandpass', 3200, 0.18); noise(t + 0.12, 0.2, 'bandpass', 2400, 0.12); },
    creak: function (t) {
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      var f = ctx.createBiquadFilter();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(70, t);
      o.frequency.linearRampToValueAtTime(110, t + 0.7);
      o.frequency.linearRampToValueAtTime(85, t + 1.2);
      f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 8;
      env(g, t, 0.08, 0.12, 1.1);
      o.connect(f).connect(g).connect(master);
      o.start(t); o.stop(t + 1.3);
    },
    step: function (t) { noise(t, 0.09, 'lowpass', 900, 0.25); },
    // Peacock call: a harsh rising "may-AWE", heard twice, close to a human scream.
    peacock: function (t) {
      var out = ctx.createGain();
      out.gain.value = 0.55;
      // a little room: feedback delay
      var dl = ctx.createDelay(); dl.delayTime.value = 0.21;
      var fb = ctx.createGain(); fb.gain.value = 0.32;
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
      out.connect(master);
      out.connect(dl); dl.connect(lp).connect(fb).connect(dl); dl.connect(master);
      function call(t0) {
        var o = ctx.createOscillator();
        var o2 = ctx.createOscillator();
        var vib = ctx.createOscillator();
        var vibAmt = ctx.createGain();
        var f1 = ctx.createBiquadFilter();
        var f2 = ctx.createBiquadFilter();
        var g = ctx.createGain();
        o.type = 'sawtooth'; o2.type = 'square';
        o.frequency.setValueAtTime(520, t0);
        o.frequency.exponentialRampToValueAtTime(1150, t0 + 0.12);
        o.frequency.setValueAtTime(1150, t0 + 0.12);
        o.frequency.exponentialRampToValueAtTime(1500, t0 + 0.45);
        o.frequency.exponentialRampToValueAtTime(980, t0 + 0.7);
        o2.frequency.setValueAtTime(523, t0);
        o2.frequency.exponentialRampToValueAtTime(1157, t0 + 0.12);
        o2.frequency.exponentialRampToValueAtTime(1508, t0 + 0.45);
        o2.frequency.exponentialRampToValueAtTime(990, t0 + 0.7);
        vib.frequency.value = 9; vibAmt.gain.value = 28;
        vib.connect(vibAmt); vibAmt.connect(o.frequency); vibAmt.connect(o2.frequency);
        f1.type = 'bandpass'; f1.frequency.value = 1400; f1.Q.value = 2.5;
        f2.type = 'peaking'; f2.frequency.value = 2700; f2.gain.value = 9;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.9, t0 + 0.06);
        g.gain.setValueAtTime(0.9, t0 + 0.5);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.78);
        var mix = ctx.createGain(); mix.gain.value = 0.5;
        o.connect(f1); o2.connect(mix).connect(f1);
        f1.connect(f2).connect(g).connect(out);
        [o, o2, vib].forEach(function (n) { n.start(t0); n.stop(t0 + 0.8); });
      }
      call(t);
      call(t + 0.95);
    }
  };

  var loopDefs = {
    // night wind through the cages
    wind: function () {
      var src = ctx.createBufferSource();
      src.buffer = noiseBuffer(4); src.loop = true;
      var f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 420; f.Q.value = 0.7;
      var lfo = ctx.createOscillator(); var lfoAmt = ctx.createGain();
      lfo.frequency.value = 0.08; lfoAmt.gain.value = 260;
      lfo.connect(lfoAmt).connect(f.frequency);
      var g = ctx.createGain(); g.gain.value = 0.0001;
      g.gain.exponentialRampToValueAtTime(0.16, now() + 2);
      src.connect(f).connect(g).connect(master);
      src.start(); lfo.start();
      return { gain: g, stop: function () { src.stop(); lfo.stop(); } };
    },
    // low, uneasy drone under the phone pages
    drone: function () {
      var g = ctx.createGain(); g.gain.value = 0.0001;
      g.gain.exponentialRampToValueAtTime(0.06, now() + 3);
      var oscs = [55, 58.3, 110.4].map(function (fq) {
        var o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = fq;
        o.connect(g); o.start(); return o;
      });
      g.connect(master);
      return { gain: g, stop: function () { oscs.forEach(function (o) { o.stop(); }); } };
    },
    // bonfire crackle
    fire: function () {
      var src = ctx.createBufferSource();
      src.buffer = noiseBuffer(3); src.loop = true;
      var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700;
      var g = ctx.createGain(); g.gain.value = 0.0001;
      g.gain.exponentialRampToValueAtTime(0.22, now() + 1.5);
      src.connect(f).connect(g).connect(master);
      src.start();
      var alive = true;
      (function pop() {
        if (!alive) return;
        noise(now(), 0.03 + Math.random() * 0.05, 'highpass', 1500 + Math.random() * 2500, 0.15 + Math.random() * 0.3, g);
        setTimeout(pop, 60 + Math.random() * 380);
      })();
      return { gain: g, stop: function () { alive = false; src.stop(); } };
    },
    heart: function () {
      var alive = true;
      (function beat() {
        if (!alive) return;
        sfx.heartbeat(now());
        setTimeout(beat, 900);
      })();
      return { gain: null, stop: function () { alive = false; } };
    }
  };

  G.audio = {
    /** Create the AudioContext; call from a click/tap handler. */
    unlock: function () {
      if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.9;
      master.connect(ctx.destination);
    },
    play: function (name) {
      if (!ctx || !sfx[name]) return;
      try { sfx[name](now() + 0.01); } catch (e) { console.warn(e); }
    },
    loop: function (name) {
      if (!ctx || !loopDefs[name] || loops[name]) return;
      loops[name] = loopDefs[name]();
    },
    stop: function (name, fadeMs) {
      var l = loops[name];
      if (!l) return;
      delete loops[name];
      var f = (fadeMs == null ? 600 : fadeMs) / 1000;
      if (l.gain && l.gain.gain) {
        try {
          l.gain.gain.cancelScheduledValues(now());
          l.gain.gain.setValueAtTime(Math.max(l.gain.gain.value, 0.0001), now());
          l.gain.gain.exponentialRampToValueAtTime(0.0001, now() + Math.max(f, 0.01));
        } catch (e) { /* ignore */ }
      }
      setTimeout(function () { try { l.stop(); } catch (e) { /* ignore */ } }, f * 1000 + 50);
    },
    /** Cut every loop at once — the sudden silence. */
    cut: function () { Object.keys(loops).forEach(function (k) { G.audio.stop(k, 30); }); },
    stopAll: function (fadeMs) { Object.keys(loops).forEach(function (k) { G.audio.stop(k, fadeMs); }); },
    muted: function () { return muted; },
    setMuted: function (m) {
      muted = !!m;
      G.state.set('muted', muted);
      if (master) master.gain.setTargetAtTime(muted ? 0 : 0.9, now(), 0.05);
    }
  };
})();
