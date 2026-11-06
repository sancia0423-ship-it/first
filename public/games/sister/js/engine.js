/* 姐姐的不对劲 · engine
 * Global namespace G: state, pages, screens, audio, memo, ui.
 * Classic script (no modules) so the game also runs from file://.
 */
(function () {
  'use strict';

  var G = (window.G = window.G || {});
  var STORE_KEY = 'jjbdj:v1';

  /* ---------- state ---------- */
  var data = load();
  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* storage blocked: play without saving */ }
    return { reached: 0, flags: {}, memo: [], screen: null, params: null, muted: false };
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
  }
  G.state = {
    get: function (k, d) { return k in data ? data[k] : d; },
    set: function (k, v) { data[k] = v; save(); },
    has: function (flag) { return !!data.flags[flag]; },
    flag: function (flag) { if (!data.flags[flag]) { data.flags[flag] = true; save(); } },
    reset: function () {
      try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ }
      location.href = location.pathname;
    }
  };

  /* ---------- pages (页码 = 进度) ---------- */
  // screen + params are what the page badge panel opens.
  G.pages = [
    { n: 0, title: '封面', screen: 'cover' },
    { n: 1, title: '妹妹的手机', screen: 'home' },
    { n: 2, title: '和姐姐的聊天', screen: 'wx-chat', params: { who: 'jie' } },
    { n: 3, title: '姐姐的异常', screen: 'album' },
    { n: 4, title: '和方方的聊天', screen: 'wx-chat', params: { who: 'fang' } },
    { n: 5, title: '学校官网', screen: 'web-school', params: { path: 'clubs' } },
    { n: 6, title: '隐藏入口 · 身份已确认', screen: 'web-gate' },
    { n: 7, title: '活动预告 · 完成', screen: 'web-event' },
    { n: 8, title: '纸条的另一半', screen: 'room' },
    { n: 9, title: '动物园的来历', screen: 'web-school', params: { path: 'history' } },
    { n: 10, title: '废弃动物园门口', screen: 'night-gate' },
    { n: 11, title: '躲到大树后面', screen: 'night-zoo' },
    { n: 12, title: '红衣人群', screen: 'night-crowd' },
    { n: 13, title: '仪式', screen: 'night-ritual' },
    { n: 14, title: '她想要逃走', screen: 'night-flee' },
    { n: 15, title: '孔雀与方方', screen: 'night-memo' },
    { n: 16, title: '组织的规矩', screen: 'night-rules' },
    { n: 17, title: '我的左手', screen: 'night-send' },
    { n: 18, title: '她回头', screen: 'night-turn' },
    { n: 19, title: '第二声', screen: 'ending' }
  ];
  G.TOTAL = G.pages.length - 1;
  G.pad = function (n) { return (n < 10 ? '0' : '') + n; };

  /** Mark page n as reached and show it on the badge. */
  G.reach = function (n) {
    if (n > data.reached) { data.reached = n; save(); }
    G.badge.set(n);
  };
  G.reached = function () { return data.reached; };

  /* ---------- screens ---------- */
  var screens = {};
  var current = null;
  var stage = null; // .screen element inside the phone

  /**
   * Register a screen.
   * def: { page?: number | function(params) -> number, theme?: 'light'|'dark', time?: 'HH:MM',
   *        mount(root, params) -> optional cleanup function }
   */
  G.screen = function (id, def) { screens[id] = def; };

  /** Show a screen inside the phone. */
  G.show = function (id, params) {
    var def = screens[id];
    if (!def) { console.warn('no screen', id); return; }
    if (!stage) stage = document.querySelector('.screen');
    if (current && current.cleanup) { try { current.cleanup(); } catch (e) { console.error(e); } }
    G.ui.closeOverlays();
    stage.innerHTML = '';
    stage.scrollTop = 0;
    var root = document.createElement('div');
    root.className = 'screen-root scr-' + id;
    stage.appendChild(root);
    var phone = document.querySelector('.phone');
    phone.setAttribute('data-theme', def.theme || 'light');
    if (def.time) G.phone.setTime(def.time);
    var page = typeof def.page === 'function' ? def.page(params || {}) : def.page;
    if (typeof page === 'number') G.reach(page);
    current = { id: id, cleanup: null };
    current.cleanup = def.mount(root, params || {}) || null;
    data.screen = id; data.params = params || null; save();
  };
  G.current = function () { return current && current.id; };

  /* ---------- phone chrome ---------- */
  G.phone = {
    setTime: function (t) {
      var el = document.querySelector('.sb-time');
      if (el) el.textContent = t;
      data.time = t; save();
    }
  };

  /* ---------- page badge (右上角 NN/19) ---------- */
  G.badge = {
    set: function (n) {
      var b = document.querySelector('.page-badge');
      if (b) b.textContent = G.pad(n) + '/' + G.TOTAL;
    },
    toggle: function () {
      var panel = document.querySelector('.page-panel');
      if (!panel) return;
      if (!panel.hidden) { panel.hidden = true; return; }
      var list = panel.querySelector('.page-list');
      list.innerHTML = '';
      G.pages.forEach(function (p) {
        if (p.n === 0 || p.n > data.reached) return;
        var li = document.createElement('button');
        li.className = 'page-item';
        li.innerHTML = '<span class="pi-no">' + G.pad(p.n) + '</span><span>' + G.esc(p.title) + '</span>';
        li.onclick = function () { panel.hidden = true; G.show(p.screen, p.params); };
        list.appendChild(li);
      });
      panel.hidden = false;
    }
  };

  /* ---------- memo (记录) ---------- */
  G.memo = {
    add: function (item) {
      if (G.memo.has(item.id)) { G.ui.toast('已经存过了'); return false; }
      data.memo.push({ id: item.id, title: item.title, text: item.text || '', time: item.time || '' });
      save();
      G.ui.toast('已存到备忘录');
      G.audio.play('tap');
      return true;
    },
    has: function (id) { return data.memo.some(function (m) { return m.id === id; }); },
    list: function () { return data.memo.slice(); }
  };

  /* ---------- helpers ---------- */
  G.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  /** Normalise free-text answers: trim, full-width → half-width, drop spaces/separators, lower-case. */
  G.normalize = function (s) {
    return String(s || '')
      .replace(/[！-～]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); })
      .replace(/[\s　.\-_/年月日]/g, '')
      .toLowerCase();
  };
  /** Long-press (and right-click) handler that works for touch and mouse. */
  G.longPress = function (el, fn) {
    var t = null;
    function start(e) { clear(); t = setTimeout(function () { t = null; fn(e); }, 550); }
    function clear() { if (t) { clearTimeout(t); t = null; } }
    el.addEventListener('pointerdown', start);
    el.addEventListener('pointerup', clear);
    el.addEventListener('pointerleave', clear);
    el.addEventListener('pointercancel', clear);
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); clear(); fn(e); });
  };
  G.wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  G.reducedMotion = function () {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  /* ---------- ui ---------- */
  G.ui = {
    toast: function (text) {
      var t = document.createElement('div');
      t.className = 'toast';
      t.textContent = text;
      document.querySelector('.phone').appendChild(t);
      setTimeout(function () { t.classList.add('out'); }, 1600);
      setTimeout(function () { t.remove(); }, 2000);
    },
    /**
     * Full-phone narration: lines appear one by one on black, tap to continue.
     * Resolves when the player taps past the last line.
     */
    narrate: function (lines, opts) {
      opts = opts || {};
      return new Promise(function (resolve) {
        var ov = document.createElement('div');
        ov.className = 'narration' + (opts.light ? ' light' : '');
        ov.innerHTML = '<div class="nar-body"></div><div class="nar-hint">轻触继续</div>';
        document.querySelector('.phone').appendChild(ov);
        var body = ov.querySelector('.nar-body');
        var i = 0;
        function next() {
          if (i >= lines.length) {
            ov.classList.add('out');
            setTimeout(function () { ov.remove(); resolve(); }, 450);
            return;
          }
          var p = document.createElement('p');
          p.textContent = lines[i++];
          body.appendChild(p);
          requestAnimationFrame(function () { p.classList.add('in'); });
        }
        ov.addEventListener('click', next);
        next();
      });
    },
    closeOverlays: function () {
      document.querySelectorAll('.phone .narration, .phone .sheet').forEach(function (n) { n.remove(); });
    },
    /** Bottom sheet with actions; resolves with the chosen value or null. */
    sheet: function (title, actions) {
      return new Promise(function (resolve) {
        var s = document.createElement('div');
        s.className = 'sheet';
        s.innerHTML = '<div class="sheet-card"><div class="sheet-title">' + G.esc(title) + '</div></div>';
        var card = s.querySelector('.sheet-card');
        actions.concat([{ label: '取消', value: null, cancel: true }]).forEach(function (a) {
          var b = document.createElement('button');
          b.className = 'sheet-btn' + (a.cancel ? ' cancel' : '');
          b.textContent = a.label;
          b.onclick = function (e) { e.stopPropagation(); s.remove(); resolve(a.value); };
          card.appendChild(b);
        });
        s.onclick = function () { s.remove(); resolve(null); };
        document.querySelector('.phone').appendChild(s);
      });
    },
    /** Small helper: build an element from an HTML string. */
    el: function (html) {
      var d = document.createElement('div');
      d.innerHTML = html.trim();
      return d.firstChild;
    },
    /**
     * Standard app bar: back arrow, centred title, optional right-hand node.
     * opts.dark for night/web dark pages.
     */
    bar: function (title, onBack, opts) {
      opts = opts || {};
      var b = G.ui.el('<div class="appbar' + (opts.dark ? ' dark' : '') + '">' +
        '<button class="ab-back" aria-label="返回">‹</button>' +
        '<div class="ab-title">' + G.esc(title) + '</div><div class="ab-right"></div></div>');
      b.querySelector('.ab-back').onclick = function () { G.audio.play('tap'); onBack(); };
      if (opts.right) b.querySelector('.ab-right').appendChild(opts.right);
      return b;
    },
    /** App launch: 1s loading screen with the app name, then show the screen. */
    launch: function (name, color, screenId, params) {
      var l = G.ui.el('<div class="app-loading"><div class="spin" style="border-top-color:' + color + '"></div><div>' + G.esc(name) + '</div></div>');
      document.querySelector('.screen').appendChild(l);
      setTimeout(function () { G.show(screenId, params); }, 900);
    }
  };
})();
