/* 10–19 夜里的废弃动物园 → 第二声
 * 所有剧情文字逐字取自 ../storyboard/data.js（v6）：s10–s20（第 18 页是 s19，第 19 页是 s20）。
 * G.night 是本文件和 room.js 共用的小工具：轻触继续、字幕、手电筒、背景画（G.art，可平移）、胶片颗粒。
 */
(function () {
  'use strict';

  var NK = (G.night = G.night || {});

  /* ---------- 文字（逐字取自分镜 v6） ---------- */
  var T = {
    s10: '孔雀的羽毛失去了光泽，其他动物瘦骨嶙峋，整个园区弥漫着腐朽、潮湿的气味。',
    s11: '夜晚几乎没有灯光，只有远处校园的灯火隐约透过树林。',
    s11a: '用手电找到一棵大树',
    s11b: '躲到树后面',
    s12v: '午夜十二点，一群穿着红色衣服的人陆续出现。',
    s12a: '他们围绕着火堆站成一个圆圈，没有人交谈，仿佛每个人都知道自己应该站在哪里。',
    s12b: '妹妹起初以为这只是一场奇怪的秘密集会。',
    s13who: '红衣人（齐声，很低）',
    s13chant: '第一份供奉，献给门后的存在。',
    s13v: '直到她看清火堆周围的情景：那些人正在杀害动物。',
    s13story: ['这不是普通的校园组织活动，而是一场真正的献祭仪式。', '纸条上那句话的意思，她现在明白了。'],
    s14: '她想要逃走，却发现自己已经看到了不该看到的东西。',
    s15who: '红衣人（低声）',
    s15low: '这一次够了',
    s15v: '我缩在树后，打开备忘录，把存下的记录摆在一起。',
    s15fang: '方方的最后一条消息：9月29日 00:13「kt」',
    s15step: '在备忘录里把方方的消息和那晚的孔雀叫声对上',
    s15q: '孔雀什么时候会叫？',
    s15end: '孔雀只会在某个人被献祭后叫。',
    s15story: [
      '孔雀是他们的标志。每一次献祭后，孔雀才会叫。',
      '9 月 29 日那天夜里，方方发来「kt」，之后我听见了孔雀叫。',
      '那个被献祭的人，是姐姐的好友方方。那次我没有去。'
    ],
    s16place: '校内组织 · 内部系统',
    s16org: '本组织为古老秘密团体之分支，与光明会存在联系。人可以通过献祭换取超自然的力量。',
    s16r1: '其一：献祭生灵。献祭的数量越多，力量越强。',
    s16r2: '其二：献祭至亲。以自己最亲近的人作为代价，换取最重要的愿望。',
    s17: '我想报警。', // 作者改稿：不发朋友圈，改成报警
    s17num: '110',
    s17call: '正在呼叫…',
    s17fail: '呼叫失败 · 无服务',
    s19v: ['火堆对面，一个红衣人慢慢回过头，摘下兜帽。', '是姐姐。'],
    s19a: '最令人不安的愿望：姐姐想要的东西，只有妹妹能够给予她。她并非一时冲动，而是经过漫长的准备，主动把妹妹带到了仪式现场。',
    s19b: '她只是露出了一个妹妹从未见过的笑容。',
    s19story: '妈妈的病压垮了这个家，姐妹俩一直互相扶持。姐姐知道妹妹会好奇，知道妹妹讨厌被蒙在鼓里，也知道妹妹一旦觉得姐姐可能遇到危险，就很难袖手旁观。',
    s20: '她一直在等的，是妹妹的到来。',
    s20story: '第一次是方方。第二次，妹妹去了。'
  };

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }
  function reduced() { return G.reducedMotion(); }
  function reflow(n) { return n.offsetWidth; }
  function seeded(seed) {
    return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  }

  /* ======================================================================
   * kit：每个屏幕一份。负责计时器、事件、循环音效的清理，轻触继续，字幕。
   * ====================================================================== */
  NK.kit = function (root) {
    var alive = true;
    var timers = [];
    var offs = [];
    var loops = [];
    var extra = [];
    var waiters = [];
    var boxes = {};
    var hint = null;
    var hintTimer = null;
    var task = null;
    var going = false;
    var k = { root: root };

    k.alive = function () { return alive; };
    k.w = function () { return root.clientWidth || 420; };
    k.h = function () { return root.clientHeight || 750; };
    k.later = function (fn, ms) {
      var t = setTimeout(function () { if (alive) fn(); }, ms || 0);
      timers.push(t);
      return t;
    };
    k.wait = function (ms) { return new Promise(function (res) { k.later(res, ms); }); };
    k.on = function (target, type, fn, opt) {
      target.addEventListener(type, fn, opt);
      offs.push(function () { target.removeEventListener(type, fn, opt); });
    };
    /** fn(seconds, dt) every animation frame until it returns false or the screen is left. */
    k.frame = function (fn) {
      var last = 0;
      function tick(now) {
        if (!alive) return;
        var dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
        last = now;
        if (fn(now / 1000, dt) === false) return;
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    };
    k.loop = function (name) { G.audio.loop(name); if (loops.indexOf(name) < 0) loops.push(name); };
    k.unloop = function (name, fadeMs) {
      G.audio.stop(name, fadeMs);
      loops = loops.filter(function (n) { return n !== name; });
    };
    k.add = function (html, parent) {
      var n = typeof html === 'string' ? G.ui.el(html) : html;
      (parent || root).appendChild(n);
      return n;
    };
    /** Append, then add class 'in' on the next style pass so CSS transitions run. */
    k.reveal = function (html, parent) { var n = k.add(html, parent); reflow(n); n.classList.add('in'); return n; };
    k.onCleanup = function (fn) { extra.push(fn); };

    /* --- 轻触继续 --- */
    function onTap(e) {
      if (!waiters.length) return;
      if (e && e.target && e.target.closest && e.target.closest('button, a, input, textarea, [data-notap]')) return;
      var w = waiters[0];
      if (performance.now() - w.at < (w.guard || 350)) return;
      waiters.shift();
      w.done();
    }
    k.on(root, 'click', onTap);
    k.on(document, 'keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && waiters.length) {
        var a = document.activeElement;
        if (a && a.closest && a.closest('button, a, input, textarea')) return;
        e.preventDefault();
        onTap(null);
      }
    });
    // 调试直达时音频还没解锁：第一次触摸时补上
    k.on(root, 'pointerdown', function () { G.audio.unlock(); });
    // 光圈、颗粒层比屏幕大；不让聚焦按钮时把整个画面滚走
    k.on(root, 'scroll', function () { if (root.scrollTop || root.scrollLeft) { root.scrollTop = 0; root.scrollLeft = 0; } });

    function showHint(delay, text) {
      if (!hint) hint = k.add('<div class="nt-hint" aria-hidden="true"></div>');
      hint.textContent = text || '轻触继续';
      clearTimeout(hintTimer);
      hintTimer = setTimeout(function () { if (alive) hint.classList.add('on'); }, delay);
    }
    function hideHint() { clearTimeout(hintTimer); if (hint) hint.classList.remove('on'); }
    k.unhint = hideHint;

    /** Resolves on the next tap (or Enter/Space). Shows 「轻触继续」 after hintDelay. */
    k.tap = function (o) {
      o = o || {};
      return new Promise(function (res) {
        waiters.push({ at: performance.now(), guard: o.guard, done: function () { hideHint(); res(); } });
        if (o.hint !== false) showHint(o.hintDelay == null ? 1100 : o.hintDelay, o.hintText);
      });
    };
    /** Resolves after ms, or earlier on a tap. */
    k.beat = function (ms) {
      return new Promise(function (res) {
        var fired = false;
        var w = { at: performance.now(), done: fin };
        function fin() {
          if (fired) return;
          fired = true;
          var i = waiters.indexOf(w);
          if (i >= 0) waiters.splice(i, 1);
          res();
        }
        waiters.push(w);
        k.later(fin, ms);
      });
    };

    /* --- 字幕 --- */
    function box(pos) {
      if (!boxes[pos]) boxes[pos] = k.add('<div class="nt-caps ' + pos + '" aria-live="polite"></div>');
      return boxes[pos];
    }
    function clearBox(b) {
      Array.prototype.slice.call(b.children).forEach(function (c) {
        if (c.classList.contains('out')) return;
        c.classList.add('out');
        setTimeout(function () { c.remove(); }, 800);
      });
    }
    /** Show a caption card (replaces the previous card at that position). */
    k.cap = function (lines, o) {
      o = o || {};
      var b = box(o.pos || 'bottom');
      clearBox(b);
      var card = document.createElement('div');
      card.className = 'nt-card' + (o.cls ? ' ' + o.cls : '');
      if (o.who) card.innerHTML = '<span class="nt-who">' + G.esc(o.who) + '</span>';
      b.appendChild(card);
      (Array.isArray(lines) ? lines : [lines]).forEach(function (t) { k.line(card, t); });
      b.classList.add('on');
      return card;
    };
    /** Add one more line to a caption card. */
    k.line = function (card, text) {
      var p = document.createElement('p');
      p.textContent = text;
      card.appendChild(p);
      reflow(p);
      p.classList.add('in');
      return p;
    };
    k.uncap = function (pos) {
      Object.keys(boxes).forEach(function (p) {
        if (pos && p !== pos) return;
        clearBox(boxes[p]);
        boxes[p].classList.remove('on');
      });
    };
    k.say = function (lines, o) { k.cap(lines, o); return k.tap(o); };

    /** Small place title at the top (fades out by itself). */
    k.place = function (text, ms) {
      var n = k.reveal('<div class="nt-place">' + G.esc(text) + '</div>');
      k.later(function () { n.classList.remove('in'); }, ms || 3400);
      return n;
    };
    /** One-line instruction under the place title. */
    k.task = function (text) {
      if (!task) task = k.add('<div class="nt-task"></div>');
      task.textContent = text;
      reflow(task);
      task.classList.add('in');
      return task;
    };
    k.untask = function () { if (task) task.classList.remove('in'); };

    /** Fade to black, then switch screens. */
    k.go = function (id, params, ms) {
      if (going) return;
      going = true;
      ms = ms == null ? 900 : ms;
      var f = k.add('<div class="nt-fade"></div>');
      f.style.transitionDuration = ms + 'ms';
      reflow(f);
      f.classList.add('on');
      setTimeout(function () { if (alive) G.show(id, params); }, ms + 60);
    };

    k.cleanup = function () {
      alive = false;
      timers.forEach(clearTimeout);
      clearTimeout(hintTimer);
      offs.forEach(function (f) { f(); });
      loops.forEach(function (n) { G.audio.stop(n, 500); });
      extra.forEach(function (f) { try { f(); } catch (e) { /* ignore */ } });
      waiters = [];
    };
    return k;
  };

  /* ---------- 胶片颗粒 + 暗角 ---------- */
  var grainURL = null;
  function grainTile() {
    if (grainURL !== null) return grainURL;
    try {
      var c = document.createElement('canvas');
      c.width = c.height = 160;
      var x = c.getContext('2d');
      var d = x.createImageData(160, 160);
      for (var i = 0; i < d.data.length; i += 4) {
        var v = Math.random() * 255 | 0;
        d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
        d.data[i + 3] = 40 + (Math.random() * 90 | 0);
      }
      x.putImageData(d, 0, 0);
      grainURL = c.toDataURL('image/png');
    } catch (e) { grainURL = ''; }
    return grainURL;
  }
  NK.fx = function (k, o) {
    o = o || {};
    var v = k.add('<div class="nt-vig' + (o.vig ? ' ' + o.vig : '') + '"></div>');
    var g = k.add('<div class="nt-grain"></div>');
    var url = grainTile();
    if (url) g.style.backgroundImage = 'url(' + url + ')';
    return { vig: v, grain: g };
  };

  /* ---------- 背景画：G.art 的场景（js/art.js），铺满，可随手电平移 ---------- */
  /**
   * o.span 画面宽度是屏幕的几倍（给手电跟随平移留余地）；o.fx 画面中心对准的横向位置（0–1）；
   * o.fx0/o.fx1 跟随手电时的平移范围；o.art 交给 G.art（fit / fx / fy）；o.delay 淡入的延迟；o.manual 不自动淡入。
   * 颗粒和暗角由 NK.fx 负责，画面自带的关掉。s.f 是 G.art.features（按画面的比例）。
   */
  NK.scene = function (k, name, o) {
    o = o || {};
    var wrap = k.add('<div class="nt-scene"><div class="nt-pan"></div></div>');
    var pan = wrap.firstChild;
    var span = o.span || 1;
    var opt = Object.assign({}, o.art, { grain: false, vignette: false });
    var spots = [];
    var s = { wrap: wrap, pan: pan, lw: 0, lh: 0, off: 0, goal: 0, fx: o.fx == null ? 0.5 : o.fx, f: {} };

    // 圆形的 feature 也换成框（比例）
    function box(f) {
      if (!('r' in f)) return f;
      var ry = f.r * s.lw / s.lh;
      return { x: f.x - f.r, y: f.y - ry, w: f.r * 2, h: ry * 2 };
    }
    function put(n) {
      var b = box(s.f[n.key]);
      n.el.style.left = b.x * 100 + '%';
      n.el.style.top = b.y * 100 + '%';
      n.el.style.width = b.w * 100 + '%';
      n.el.style.height = b.h * 100 + '%';
    }
    function layout() {
      s.lw = k.w() * span;
      s.lh = k.h();
      pan.style.width = s.lw + 'px';
      pan.style.height = s.lh + 'px';
      s.f = G.art.features(name, s.lw, s.lh, opt);
      spots.forEach(put);
      s.look(s.fx);
      s.off = s.goal;
      place();
    }
    function place() { pan.style.transform = 'translate3d(' + (-s.off).toFixed(2) + 'px,0,0)'; }
    s.look = function (fx) { s.fx = fx; s.goal = clamp(fx * s.lw - k.w() / 2, 0, Math.max(0, s.lw - k.w())); };
    s.follow = function (p) { s.look(o.fx0 + clamp(p, 0, 1) * (o.fx1 - o.fx0)); };
    s.step = function (dt) {
      var d = s.goal - s.off;
      if (Math.abs(d) < 0.05) return;
      s.off += d * (reduced() ? 1 : Math.min(1, dt * (o.ease || 3)));
      place();
    };
    s.toScreen = function (fx, fy) { return { x: fx * s.lw - s.off, y: fy * s.lh }; };
    /** A feature on screen now: centre x, y and w, h, r in px. */
    s.at = function (key) {
      var f = s.f[key], b = box(f), c = s.toScreen(b.x + b.w / 2, b.y + b.h / 2);
      c.w = b.w * s.lw;
      c.h = b.h * s.lh;
      c.r = 'r' in f ? f.r * s.lw : Math.min(c.w, c.h) / 2;
      return c;
    };
    /** An element laid over a feature (hotspot, button); follows it on resize. */
    s.spot = function (cls, key, html, tag) {
      var el = document.createElement(tag || 'div');
      el.className = cls;
      if (html) el.innerHTML = html;
      pan.appendChild(el);
      var n = { el: el, key: key };
      spots.push(n);
      put(n);
      return el;
    };
    layout();
    var art = G.art.mount(pan, name, opt);
    s.art = art.canvas;
    s.art.classList.add('nt-art');
    s.stop = art.stop;
    k.onCleanup(art.stop);
    s.fadeIn = function () { s.art.classList.add('in'); };
    if (!o.manual) k.later(s.fadeIn, o.delay || 0);
    k.on(window, 'resize', layout);
    return s;
  };

  /* ---------- 手电筒：光圈跟随手指 / 鼠标 ---------- */
  NK.torch = function (k, o) {
    o = o || {};
    var root = k.root;
    var r = o.r || 80;
    var dark = o.dark == null ? 0.955 : o.dark;
    var shade = k.add('<div class="nt-torch"></div>');
    var beam = k.add('<div class="nt-beam"></div>');
    function a(v) { return 'rgba(0,0,0,' + v.toFixed(3) + ')'; }
    shade.style.background = 'radial-gradient(circle at 50% 50%, ' +
      a(0) + ' 0px, ' + a(0) + ' ' + (r * 0.5) + 'px, ' + a(dark * 0.4) + ' ' + r + 'px, ' +
      a(dark * 0.86) + ' ' + (r * 1.55) + 'px, ' + a(dark) + ' ' + (r * 2.3) + 'px)';
    beam.style.background = 'radial-gradient(circle at 50% 50%, rgba(255,226,180,.75) 0px, rgba(255,226,180,.3) ' +
      (r * 0.6) + 'px, rgba(255,226,180,0) ' + (r * 1.4) + 'px)';
    var t = { x: o.x == null ? k.w() / 2 : o.x, y: o.y == null ? k.h() * 0.5 : o.y, last: -99, on: true, active: false };
    t.tx = t.ax = t.x;
    t.ty = t.ay = t.y;
    function size() {
      var w = k.w() * 2 + 80, h = k.h() * 2 + 80;
      shade.style.width = w + 'px';
      shade.style.height = h + 'px';
      shade.style.marginLeft = -w / 2 + 'px';
      shade.style.marginTop = -h / 2 + 'px';
      var b = r * 3;
      beam.style.width = beam.style.height = b + 'px';
      beam.style.marginLeft = beam.style.marginTop = -b / 2 + 'px';
    }
    size();
    k.on(window, 'resize', size);
    function input(e) {
      if (!t.on) return;
      var rect = root.getBoundingClientRect();
      var sc = root.offsetWidth / (rect.width || 1);
      t.tx = t.ax = (e.clientX - rect.left) * sc;
      t.ty = t.ay = (e.clientY - rect.top) * sc;
      t.last = performance.now() / 1000;
    }
    k.on(root, 'pointermove', input);
    k.on(root, 'pointerdown', input);
    var flickAt = -9, nextFlick = 7 + Math.random() * 6;
    k.frame(function (now, dt) {
      var rm = reduced();
      t.active = now - t.last < 0.35;
      if (!rm && now - t.last > 2.2) { // 手里的手电轻轻晃
        t.tx = t.ax + Math.sin(now * 0.55) * 24 + Math.sin(now * 1.3) * 5;
        t.ty = t.ay + Math.sin(now * 0.8 + 1) * 14;
      }
      var px = t.x, py = t.y;
      var e = rm ? 1 : Math.min(1, dt * 9);
      t.x += (t.tx - t.x) * e;
      t.y += (t.ty - t.y) * e;
      var sp = Math.sqrt((t.x - px) * (t.x - px) + (t.y - py) * (t.y - py));
      if (!rm && now > nextFlick) { flickAt = now; nextFlick = now + 8 + Math.random() * 10; }
      var f = now - flickAt;
      var dim = f < 0.06 || (f > 0.13 && f < 0.19);
      var tr = 'translate3d(' + t.x.toFixed(1) + 'px,' + t.y.toFixed(1) + 'px,0)';
      shade.style.transform = tr + (dim ? ' scale(.86)' : '');
      beam.style.transform = tr;
      beam.style.opacity = dim ? 0.3 : 1;
      if (o.onFrame) o.onFrame(t.x, t.y, dt, sp, now, t.active);
    });
    /** Fade the darkness away (or back). */
    t.lift = function () { t.on = false; shade.classList.add('lift'); beam.classList.add('lift'); };
    return t;
  };

  /* ---------- 低声的字（齐声念诵 / 低语） ---------- */
  function whisper(k, who, text) {
    var chars = Array.from(text);
    function line(cls, delay) {
      return '<div class="nw-line' + cls + '">' + chars.map(function (ch, i) {
        return '<span style="transition-delay:' + (delay + i * 0.11).toFixed(2) + 's">' + G.esc(ch) + '</span>';
      }).join('') + '</div>';
    }
    return k.reveal('<div class="nt-whisper"><span class="nt-who">' + G.esc(who) + '</span>' +
      '<div class="nw-wrap">' + line('', 0.6) + line(' echo', 1.3) + '</div></div>');
  }

  /* ---------- 画布用的柔光点 ---------- */
  var sprites = {};
  function sprite(rgb) {
    if (sprites[rgb]) return sprites[rgb];
    var c = document.createElement('canvas');
    c.width = c.height = 64;
    var x = c.getContext('2d');
    var g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(' + rgb + ',1)');
    g.addColorStop(0.4, 'rgba(' + rgb + ',.42)');
    g.addColorStop(1, 'rgba(' + rgb + ',0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 64, 64);
    return (sprites[rgb] = c);
  }
  function paint(w, h, fn) {
    var c = document.createElement('canvas');
    c.width = Math.round(w * 1.5);
    c.height = Math.round(h * 1.5);
    var x = c.getContext('2d');
    x.scale(1.5, 1.5);
    fn(x);
    return c;
  }
  function rgb(r, g, b) { return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')'; }

  /* ======================================================================
   * 10 废弃动物园门口
   * ====================================================================== */
  G.screen('night-gate', {
    page: 10,
    theme: 'dark',
    time: '23:41',
    mount: function (root) {
      var k = NK.kit(root);
      root.classList.add('nt-touch');
      var sc = NK.scene(k, 'zoo-gate', { span: 1.14, fx0: 0.3, fx1: 0.72, fx: 0.5, delay: 500 });
      var gate = sc.spot('ng-gate', 'gate', '<i></i>', 'button');
      gate.setAttribute('aria-label', '铁门');
      NK.fx(k);
      k.loop('wind');
      var shown = false, lit = 0, busy = false;
      NK.torch(k, {
        r: 100,
        onFrame: function (x, y, dt) {
          sc.follow(x / k.w());
          sc.step(dt);
          if (shown) return;
          var b = sc.at('peacock'); // 墙头的孔雀，尾巴垂下来
          if (Math.abs(x - b.x) < b.r + 30 && y > b.y - b.r - 50 && y < b.y + b.r + 110) { lit += dt; if (lit > 0.8) reveal(); }
        }
      });
      k.place('夜 · 废弃动物园');
      k.later(function () { if (!shown) k.task('移动光圈，照亮四周'); }, 1800);
      k.later(reveal, 8000);
      function reveal() {
        if (shown) return;
        shown = true;
        k.untask();
        k.cap(T.s10);
        k.later(function () { gate.classList.add('pulse'); }, 2600);
        k.later(function () { if (!busy) k.task('轻触铁门'); }, 6500);
      }
      gate.addEventListener('click', function () {
        if (busy) return;
        busy = true;
        G.audio.play('creak');
        k.untask();
        gate.classList.remove('pulse');
        if (!reduced()) {
          var c = sc.at('gate');
          sc.wrap.style.transformOrigin = c.x.toFixed(1) + 'px ' + (c.y + c.h * 0.1).toFixed(1) + 'px';
          sc.wrap.classList.add('ng-enter');
        }
        k.later(function () { k.uncap(); k.go('night-zoo', null, 1400); }, 1000);
      });
      return k.cleanup;
    }
  });

  /* ======================================================================
   * 11 躲到大树后面
   * ====================================================================== */
  G.screen('night-zoo', {
    page: 11,
    theme: 'dark',
    time: '23:48',
    mount: function (root) {
      var k = NK.kit(root);
      root.classList.add('nt-touch');
      var sc = NK.scene(k, 'cages', { span: 1.2, fx0: 0.3, fx1: 0.86, fx: 0.42, delay: 300 });
      var tree = sc.spot('nz-tree', 'tree'); // 找到时树干被照亮
      NK.fx(k);
      k.loop('wind');
      var found = false, acc = 0, lastStep = 0, act = null;
      NK.torch(k, {
        r: 100,
        onFrame: function (x, y, dt, sp, now, active) {
          sc.follow(x / k.w());
          sc.step(dt);
          if (active) acc += sp;
          if (acc > 70 && now - lastStep > 0.38) { acc = 0; lastStep = now; G.audio.play('step'); } // 脚踩碎石
          if (found) return;
          var c = sc.at('tree');
          if (Math.abs(x - c.x) < c.w / 2 + 24 && y > 110) find();
        }
      });
      k.later(function () { k.cap(T.s11); }, 1400);
      k.later(function () { if (!found) k.task(T.s11a); }, 3000);
      function find() {
        found = true;
        tree.classList.add('found');
        k.untask();
        act = k.reveal('<button class="nt-act">' + G.esc(T.s11b) + '</button>');
        act.onclick = function () {
          act.disabled = true;
          [0, 360, 720, 1060].forEach(function (ms) { k.later(function () { G.audio.play('step'); }, ms); });
          k.uncap();
          act.classList.remove('in');
          sc.look(1);
          k.go('night-crowd', null, 1500);
        };
      }
      return k.cleanup;
    }
  });

  /* ======================================================================
   * 12 红衣人群：树后 → 火堆点燃 → 一个个红衣人走进火光，站成一圈
   * ====================================================================== */
  G.screen('night-crowd', {
    page: 12,
    theme: 'dark',
    time: '00:00',
    mount: function (root) {
      var k = NK.kit(root);
      var cv = k.add('<canvas class="nc-canvas"></canvas>');
      var sc = NK.scene(k, 'hiding', { delay: 200 });
      if (!reduced()) sc.wrap.classList.add('nc-push');
      NK.fx(k);
      [600, 1150, 1700, 2450, 3050].forEach(function (ms) { k.later(function () { G.audio.play('step'); }, ms); });
      k.later(function () { k.cap(T.s12v); }, 900);
      var scene = null;
      k.later(function () {
        sc.wrap.classList.add('out');
        k.later(sc.stop, 2000); // 淡出以后不用再画
        k.uncap();
        scene = crowd(k, cv, function () { run(); });
      }, 3600);
      // 在人群站好之前轻触：加快时间
      k.on(root, 'click', function () { if (scene) scene.hurry(); });
      async function run() {
        await k.say(T.s12a, { hintDelay: 2400 });
        await k.say(T.s12b, { hintDelay: 1800 });
        k.go('night-ritual', null, 1200);
      }
      return k.cleanup;
    }
  });

  function crowd(k, cv, onCircle) {
    var VW = 420, VH = 750;
    var ctx = cv.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var s = 1, ox = 0, oy = 0;
    function size() {
      var w = k.w(), h = k.h();
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      s = Math.max(w / VW, h / VH);
      ox = (w - VW * s) / 2;
      oy = (h - VH * s) / 2;
    }
    size();
    k.on(window, 'resize', size);
    var rnd = seeded(20241028);
    var woods = paint(VW, VH, function (x) { drawWoods(x, VW, VH, rnd); });
    var trunk = paint(VW, VH, function (x) { drawTrunk(x, VW, VH, rnd); });
    var SY = sprite('255,232,180'), SO = sprite('255,128,44'), SR = sprite('170,36,14'), SF = sprite('118,136,140');
    var FX = 192, FY = 540, RX = 146, RY = 40;
    var N = 11, gap = Math.PI * 2 / 12 * 1.5, WALK = 2.4;
    var order = [], i;
    for (i = 0; i < N; i++) order.push(i);
    for (i = N - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), tmp = order[i]; order[i] = order[j]; order[j] = tmp; }
    var figs = [];
    for (i = 0; i < N; i++) {
      var a = Math.PI / 2 + gap / 2 + i * (Math.PI * 2 - gap) / (N - 1);
      var depth = (Math.sin(a) + 1) / 2;
      figs.push({
        x: FX + Math.cos(a) * RX, y: FY + Math.sin(a) * RY, h: 62 + depth * 58,
        sx: FX + Math.cos(a) * RX * 2.5, sy: FY + Math.sin(a) * RY * 2.8,
        st: 3.8 + order[i] * 0.6, cx: -999, cy: 0, al: 0, walk: false, stepped: -9, ph: rnd() * 6
      });
    }
    var last = 3.8 + (N - 1) * 0.6 + WALK;
    var parts = [], embers = [], fog = [];
    for (i = 0; i < 6; i++) fog.push({ x: rnd() * VW, y: 380 + rnd() * 300, r: 140 + rnd() * 140, v: (rnd() - 0.5) * 10 });
    var t = 0, fire = 0, lit = false, told = false, speed = 1;

    k.frame(function (now, dt) {
      t += dt * speed;
      if (!lit && t > 1.9) { lit = true; G.audio.play('paper'); k.loop('fire'); }
      if (lit) fire = Math.min(1, fire + dt * speed / 3.2);
      var fl = 0.82 + 0.1 * Math.sin(now * 12.7) + 0.06 * Math.sin(now * 29.3 + 2) + Math.random() * 0.05;
      var L = fire * fl;
      ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.drawImage(woods, 0, 0, VW, VH);
      if (L > 0) {
        ctx.globalCompositeOperation = 'lighter';
        var g = ctx.createRadialGradient(FX, FY - 30, 4, FX, FY - 30, 340);
        g.addColorStop(0, 'rgba(255,140,60,' + (0.34 * L).toFixed(3) + ')');
        g.addColorStop(0.3, 'rgba(190,60,20,' + (0.14 * L).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, VW, VH);
        ctx.save();
        ctx.translate(FX, FY + 6);
        ctx.scale(1, 0.26);
        var gp = ctx.createRadialGradient(0, 0, 0, 0, 0, 240);
        gp.addColorStop(0, 'rgba(255,120,50,' + (0.3 * L).toFixed(3) + ')');
        gp.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gp;
        ctx.beginPath();
        ctx.arc(0, 0, 240, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.globalCompositeOperation = 'source-over';
      }
      figs.forEach(function (f) {
        var p = clamp((t - f.st) / WALK, 0, 1);
        var e = 1 - (1 - p) * (1 - p);
        f.cx = f.sx + (f.x - f.sx) * e;
        f.cy = f.sy + (f.y - f.sy) * e;
        f.al = clamp((t - f.st) / (WALK * 0.75), 0, 1);
        f.walk = p > 0 && p < 1;
        if (f.walk && t - f.stepped > 0.62) { f.stepped = t; if (Math.random() < 0.6) G.audio.play('step'); }
      });
      var sorted = figs.slice().sort(function (p, q) { return p.cy - q.cy; });
      sorted.forEach(function (f) { if (f.cy < FY) figure(f, L); });
      if (t > 0.9) logs(L);
      flames(dt * speed, L);
      sorted.forEach(function (f) { if (f.cy >= FY) figure(f, L); });
      ctx.globalCompositeOperation = 'lighter';
      fog.forEach(function (m) {
        m.x += m.v * dt;
        if (m.x < -m.r) m.x = VW + m.r;
        if (m.x > VW + m.r) m.x = -m.r;
        ctx.globalAlpha = 0.05;
        ctx.drawImage(SF, m.x - m.r, m.y - m.r * 0.5, m.r * 2, m.r);
      });
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(trunk, 0, 0, VW, VH);
      if (!told && t > last + 0.6) { told = true; speed = 1; onCircle(); }
    });

    function robePath(h) {
      var w = h * 0.34;
      ctx.beginPath();
      ctx.moveTo(-w * 0.55, 0);
      ctx.bezierCurveTo(-w * 0.5, -h * 0.3, -w * 0.44, -h * 0.58, -w * 0.4, -h * 0.7);
      ctx.bezierCurveTo(-w * 0.36, -h * 0.78, -w * 0.27, -h * 0.82, -w * 0.22, -h * 0.86);
      ctx.bezierCurveTo(-w * 0.2, -h * 0.97, -w * 0.08, -h * 1.02, 0, -h * 1.04);
      ctx.bezierCurveTo(w * 0.1, -h * 1.02, w * 0.2, -h * 0.97, w * 0.22, -h * 0.86);
      ctx.bezierCurveTo(w * 0.27, -h * 0.82, w * 0.36, -h * 0.78, w * 0.4, -h * 0.7);
      ctx.bezierCurveTo(w * 0.44, -h * 0.58, w * 0.5, -h * 0.3, w * 0.55, 0);
      ctx.quadraticCurveTo(0, h * 0.025, -w * 0.55, 0);
      ctx.closePath();
    }
    function figure(f, L) {
      if (f.al <= 0) return;
      var lum = L * clamp(1.15 - Math.abs(f.cx - FX) / 260, 0.15, 1);
      var h = f.h;
      ctx.save();
      ctx.globalAlpha = f.al;
      ctx.translate(f.cx, f.cy - (f.walk ? Math.abs(Math.sin(t * 5 + f.ph)) * h * 0.012 : 0));
      ctx.fillStyle = 'rgba(0,0,0,.5)';
      ctx.beginPath();
      ctx.ellipse(0, 0, h * 0.2, h * 0.035, 0, 0, Math.PI * 2);
      ctx.fill();
      robePath(h);
      if (f.y < FY) {
        // 火堆对面：正面被火照亮，兜帽里是黑的
        var gr = ctx.createLinearGradient(0, -h, 0, 0);
        gr.addColorStop(0, rgb(34 + 110 * lum, 5 + 16 * lum, 4 + 10 * lum));
        gr.addColorStop(0.45, rgb(26 + 134 * lum, 4 + 24 * lum, 4 + 14 * lum));
        gr.addColorStop(1, rgb(12 + 40 * lum, 2 + 6 * lum, 2 + 4 * lum));
        ctx.fillStyle = gr;
        ctx.fill();
        ctx.fillStyle = 'rgba(4,0,0,.92)';
        ctx.beginPath();
        ctx.ellipse(0, -h * 0.855, h * 0.045, h * 0.056, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-h * 0.03, -h * 0.62); ctx.lineTo(-h * 0.06, 0);
        ctx.moveTo(h * 0.04, -h * 0.58); ctx.lineTo(h * 0.07, 0);
        ctx.stroke();
      } else {
        // 背对我们：逆光的剪影，边缘一圈火光
        ctx.strokeStyle = 'rgba(255,110,45,' + (0.55 * lum).toFixed(3) + ')';
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.fillStyle = rgb(14 + 30 * lum, 3 + 4 * lum, 2 + 2 * lum);
        ctx.fill();
      }
      ctx.restore();
    }
    function logs(L) {
      ctx.strokeStyle = 'rgb(' + (18 + 40 * L | 0) + ',8,4)';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(FX - 20, FY + 4); ctx.lineTo(FX + 6, FY - 16);
      ctx.moveTo(FX + 20, FY + 4); ctx.lineTo(FX - 6, FY - 16);
      ctx.moveTo(FX - 16, FY + 6); ctx.lineTo(FX + 16, FY + 6);
      ctx.stroke();
    }
    function flames(dt, L) {
      ctx.globalCompositeOperation = 'lighter';
      if ((t > 1.0 && t < 1.1) || (t > 1.42 && t < 1.5) || (t > 1.75 && t < 1.85)) { // 一下、两下，点着了
        ctx.globalAlpha = 0.9;
        ctx.drawImage(SY, FX - 7, FY - 9, 14, 14);
      }
      var n = L * 150 * dt;
      while (n > 0) {
        if (Math.random() < n) {
          parts.push({
            x: FX + (Math.random() - 0.5) * 26 * (0.4 + 0.6 * L), y: FY - 2,
            vx: (Math.random() - 0.5) * 12, vy: -(30 + Math.random() * 46) * (0.5 + 0.5 * L),
            life: 0, max: 0.45 + Math.random() * 0.55, r: (7 + Math.random() * 9) * (0.5 + 0.5 * L), ph: Math.random() * 6
          });
        }
        n -= 1;
      }
      if (Math.random() < dt * 7 * L) {
        embers.push({ x: FX + (Math.random() - 0.5) * 20, y: FY - 20, vx: (Math.random() - 0.5) * 20, vy: -(50 + Math.random() * 50), life: 0, max: 1.5 + Math.random() * 1.2 });
      }
      var i, p, q, r;
      for (i = parts.length - 1; i >= 0; i--) {
        p = parts[i];
        p.life += dt;
        if (p.life > p.max) { parts.splice(i, 1); continue; }
        q = p.life / p.max;
        p.x += p.vx * dt + Math.sin(t * 9 + p.ph) * 0.25;
        p.y += p.vy * dt;
        p.vy -= 18 * dt;
        r = p.r * (1 - q * 0.55);
        ctx.globalAlpha = (q < 0.12 ? q / 0.12 : 1) * (1 - q) * 0.6;
        ctx.drawImage(q < 0.22 ? SY : q < 0.6 ? SO : SR, p.x - r, p.y - r * 1.3, r * 2, r * 2.6);
      }
      for (i = embers.length - 1; i >= 0; i--) {
        p = embers[i];
        p.life += dt;
        if (p.life > p.max) { embers.splice(i, 1); continue; }
        q = p.life / p.max;
        p.x += (p.vx + Math.sin(t * 3 + i) * 10) * dt;
        p.y += p.vy * dt;
        ctx.globalAlpha = (1 - q) * 0.9;
        ctx.drawImage(SO, p.x - 3, p.y - 3, 6, 6);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    return { hurry: function () { if (!told) speed = 3; } };
  }

  function drawWoods(x, w, h, rnd) {
    var g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#010203');
    g.addColorStop(0.5, '#05090b');
    g.addColorStop(0.66, '#0a1113');
    g.addColorStop(0.72, '#060909');
    g.addColorStop(1, '#020303');
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
    var hz = x.createRadialGradient(w * 0.45, h * 0.62, 10, w * 0.45, h * 0.62, w);
    hz.addColorStop(0, 'rgba(60,80,86,.12)');
    hz.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = hz;
    x.fillRect(0, 0, w, h);
    var i;
    for (i = 0; i < 48; i++) {
      x.fillStyle = 'rgba(10,17,19,' + (0.55 + rnd() * 0.4).toFixed(2) + ')';
      trunkShape(x, rnd() * w, 1.5 + rnd() * 4.5, -20 + rnd() * h * 0.25, h * (0.62 + rnd() * 0.05), (rnd() - 0.5) * 10);
    }
    for (i = 0; i < 26; i++) {
      x.fillStyle = 'rgba(2,4,5,' + (0.6 + rnd() * 0.3).toFixed(2) + ')';
      x.beginPath();
      x.ellipse(rnd() * w, rnd() * h * 0.28 - 20, 40 + rnd() * 70, 26 + rnd() * 40, 0, 0, Math.PI * 2);
      x.fill();
    }
    for (i = 0; i < 9; i++) {
      x.fillStyle = 'rgba(3,6,7,.95)';
      trunkShape(x, rnd() * w, 9 + rnd() * 12, -30, h * (0.68 + rnd() * 0.08), (rnd() - 0.5) * 16);
    }
    for (i = 0; i < 140; i++) {
      x.fillStyle = 'rgba(' + (rnd() < 0.5 ? '20,22,20' : '0,0,0') + ',' + (0.25 + rnd() * 0.3).toFixed(2) + ')';
      x.beginPath();
      x.ellipse(rnd() * w, h * 0.68 + rnd() * h * 0.32, 2 + rnd() * 9, 1 + rnd() * 2.5, 0, 0, Math.PI * 2);
      x.fill();
    }
  }
  function trunkShape(x, cx, w, top, bot, lean) {
    x.beginPath();
    x.moveTo(cx - w / 2, bot);
    x.lineTo(cx - w * 0.32 + lean, top);
    x.lineTo(cx + w * 0.32 + lean, top);
    x.lineTo(cx + w / 2, bot);
    x.closePath();
    x.fill();
  }
  function drawTrunk(x, w, h, rnd) {
    if ('filter' in x) x.filter = 'blur(3px)';
    var g = x.createLinearGradient(w - 110, 0, w, 0);
    g.addColorStop(0, '#000');
    g.addColorStop(0.25, '#0b0907');
    g.addColorStop(0.6, '#050403');
    g.addColorStop(1, '#000');
    x.fillStyle = g;
    x.beginPath();
    x.moveTo(w - 66, -10);
    x.bezierCurveTo(w - 82, h * 0.3, w - 74, h * 0.6, w - 96, h + 10);
    x.lineTo(w + 10, h + 10);
    x.lineTo(w + 10, -10);
    x.closePath();
    x.fill();
    x.fillStyle = 'rgba(0,0,0,.9)';
    for (var i = 0; i < 18; i++) {
      x.beginPath();
      x.ellipse(rnd() * 170, rnd() * 90 - 10, 10 + rnd() * 16, 4 + rnd() * 6, rnd() * 3, 0, Math.PI * 2);
      x.fill();
    }
    if ('filter' in x) x.filter = 'none';
  }

  /* ======================================================================
   * 13 仪式：低声念诵 → 火光中的剪影 → 声音骤停 → 很长的寂静
   * ====================================================================== */
  G.screen('night-ritual', {
    page: 13,
    theme: 'dark',
    time: '00:00',
    mount: function (root) {
      var k = NK.kit(root);
      var sc = NK.scene(k, 'ritual', { delay: 300 });
      var glow = k.add('<canvas class="ri-glow"></canvas>', sc.wrap);
      var sil = k.add('<canvas class="ri-sil"></canvas>', sc.wrap);
      NK.fx(k);
      k.loop('fire');
      if (!reduced()) sc.wrap.classList.add('ri-push');
      var fx = ritualFx(k, sc, glow, sil);
      (async function () {
        await k.wait(2600);
        k.loop('drone');
        var w = whisper(k, T.s13who, T.s13chant);
        await k.tap({ hintDelay: 3600 });
        w.classList.add('out');
        k.cap(T.s13v);
        root.classList.add('ri-dim');
        await fx.silhouette();
        // 声音骤停
        G.audio.cut();
        root.classList.add('ri-cut');
        fx.stop();
        sc.stop();
        await k.wait(3600);
        root.classList.add('ri-after');
        var card = k.cap(T.s13story[0], { pos: 'center' });
        await k.beat(2600);
        k.line(card, T.s13story[1]);
        await k.tap({ hintDelay: 1800 });
        k.go('night-flee', null, 1000);
      })();
      return k.cleanup;
    }
  });

  function ritualFx(k, sc, glow, sil) {
    var gx = glow.getContext('2d');
    var sx = sil.getContext('2d');
    var mk = document.createElement('canvas'), mx = mk.getContext('2d'); // 剪影的形状，先画在这里
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    function size() {
      [glow, sil, mk].forEach(function (c) { c.width = Math.round(k.w() * dpr); c.height = Math.round(k.h() * dpr); });
    }
    size();
    k.on(window, 'resize', size);
    var SO = sprite('255,140,50'), SY = sprite('255,225,170');
    var embers = [], silStart = null, silDone = null, running = true;
    k.frame(function (now, dt) {
      if (!running) return false;
      var w = k.w(), h = k.h();
      var F = sc.at('fire');
      var P = silStart !== null ? pose(now - silStart, F, w, h) : null;
      gx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gx.clearRect(0, 0, w, h);
      var fl = 0.8 + 0.1 * Math.sin(now * 10.7) + 0.07 * Math.sin(now * 23.3 + 1.3) + Math.random() * 0.05;
      var g = gx.createRadialGradient(F.x, F.y, 4, F.x, F.y, 330);
      g.addColorStop(0, 'rgba(255,170,90,' + (0.3 * fl).toFixed(3) + ')');
      g.addColorStop(0.22, 'rgba(220,90,30,' + (0.14 * fl).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      gx.fillStyle = g;
      gx.fillRect(0, 0, w, h);
      if (P && P.arm > 0) { // 火光照亮的烟，让举起的剪影看得清
        var sy = P.top - P.H * 0.2, sg = gx.createRadialGradient(P.bx, sy, 4, P.bx, sy, P.H * 0.42);
        sg.addColorStop(0, 'rgba(255,150,70,' + (0.4 * P.arm * fl).toFixed(3) + ')');
        sg.addColorStop(1, 'rgba(0,0,0,0)');
        gx.fillStyle = sg;
        gx.fillRect(0, 0, w, h);
      }
      if (Math.random() < dt * 10) {
        embers.push({ x: F.x + (Math.random() - 0.5) * 30, y: F.y + 10, vx: (Math.random() - 0.5) * 16, vy: -(40 + Math.random() * 60), life: 0, max: 1.6 + Math.random() * 1.8, r: 1.4 + Math.random() * 1.8 });
      }
      gx.globalCompositeOperation = 'lighter';
      for (var i = embers.length - 1; i >= 0; i--) {
        var e = embers[i];
        e.life += dt;
        if (e.life > e.max) { embers.splice(i, 1); continue; }
        e.x += (e.vx + Math.sin(now * 3 + i) * 8) * dt;
        e.y += e.vy * dt;
        var q = e.life / e.max, r = e.r * 3;
        gx.globalAlpha = (1 - q) * 0.9;
        gx.drawImage(q < 0.3 ? SY : SO, e.x - r, e.y - r, r * 2, r * 2);
      }
      gx.globalAlpha = 1;
      gx.globalCompositeOperation = 'source-over';
      if (P) {
        drawSil(P, w, h, now);
        if (P.down >= 1 && silDone) { var d = silDone; silDone = null; d(); }
      }
    });

    // 前景的一个红衣人背影：抬起双手，手里是一只小鸟的剪影；双手落下的一瞬间，全部切断。
    function pose(t, F, w, h) {
      var rise = ease(clamp(t / 1.5, 0, 1));
      var up = ease(clamp((t - 1.1) / 0.9, 0, 1));
      var down = clamp((t - 3.8) / 0.16, 0, 1);
      var arm = up * (1 - down);
      var H = Math.min(h, w * 1.8) * 0.36;
      var bx = F.x + H * 0.22;
      var top = F.y - H * 0.04 + (1 - rise) * H * 0.9;
      var P = { H: H, bx: bx, top: top, sh: top + H * 0.22, arm: arm, down: down };
      function mix(a0, a1) { return a0 + (a1 - a0) * arm; }
      P.el = [mix(H * 0.25, H * 0.3), mix(P.sh + H * 0.26, P.sh - H * 0.1)];   // elbow offset x, y
      P.hd = [mix(H * 0.22, H * 0.075), mix(P.sh + H * 0.52, top - H * 0.17)]; // hand offset x, y
      P.bird = arm > 0.6 && down === 0 ? [bx, top - H * 0.25] : null;
      return P;
    }
    function drawSil(P, w, h, now) {
      var H = P.H, bx = P.bx, top = P.top, sh = P.sh, hw = H * 0.17;
      mx.setTransform(dpr, 0, 0, dpr, 0, 0);
      mx.clearRect(0, 0, w, h);
      mx.fillStyle = '#030101';
      mx.beginPath();
      mx.moveTo(bx - hw * 2, h + 20);
      mx.bezierCurveTo(bx - hw * 1.8, sh + H * 0.3, bx - hw * 1.6, sh + 4, bx - hw * 0.95, sh - 2);
      mx.bezierCurveTo(bx - hw * 0.9, top + H * 0.08, bx - hw * 0.5, top + 2, bx + hw * 0.08, top - 8);
      mx.bezierCurveTo(bx + hw * 0.5, top + 1, bx + hw * 0.88, top + H * 0.07, bx + hw * 0.95, sh - 2);
      mx.bezierCurveTo(bx + hw * 1.6, sh + 4, bx + hw * 1.8, sh + H * 0.3, bx + hw * 2, h + 20);
      mx.closePath();
      mx.fill();
      if (P.arm > 0.02) {
        [-1, 1].forEach(function (sd) {
          var s0 = [bx + sd * H * 0.2, sh + H * 0.05], e = [bx + sd * P.el[0], P.el[1]], hd = [bx + sd * P.hd[0], P.hd[1]];
          limb(s0, e, H * 0.05, H * 0.04);
          limb(e, hd, H * 0.04, H * 0.028);
          // 宽袖子从小臂垂下来
          var mxx = (e[0] + hd[0]) / 2 + sd * H * 0.07 * P.arm, myy = (e[1] + hd[1]) / 2 + H * 0.1 * P.arm;
          mx.beginPath();
          mx.moveTo(e[0] - sd * H * 0.03, e[1] + H * 0.03);
          mx.quadraticCurveTo(mxx + sd * H * 0.03, myy + H * 0.05, e[0] + (hd[0] - e[0]) * 0.75, e[1] + (hd[1] - e[1]) * 0.75);
          mx.lineTo(hd[0], hd[1]);
          mx.lineTo(e[0], e[1]);
          mx.closePath();
          mx.fill();
        });
      }
      if (P.bird) bird(P.bird[0], P.bird[1], H, now);
      // 剪影是黑的；火在它身后，边上透出一圈柔和的火光（不描边）
      sx.setTransform(1, 0, 0, 1, 0, 0);
      sx.clearRect(0, 0, sil.width, sil.height);
      sx.shadowColor = 'rgba(255,116,44,.62)';
      sx.shadowBlur = 12 * dpr;
      sx.drawImage(mk, 0, 0);
      sx.shadowBlur = 0;
      sx.shadowColor = 'rgba(0,0,0,0)';
    }
    /** Tapered limb a → b (widths are half-widths), round ends. */
    function limb(a, b, wa, wb) {
      var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / l, ny = dx / l;
      mx.beginPath();
      mx.moveTo(a[0] + nx * wa, a[1] + ny * wa);
      mx.lineTo(b[0] + nx * wb, b[1] + ny * wb);
      mx.lineTo(b[0] - nx * wb, b[1] - ny * wb);
      mx.lineTo(a[0] - nx * wa, a[1] - ny * wa);
      mx.closePath();
      mx.fill();
      mx.beginPath(); mx.arc(a[0], a[1], wa, 0, Math.PI * 2); mx.fill();
      mx.beginPath(); mx.arc(b[0], b[1], wb, 0, Math.PI * 2); mx.fill();
    }
    function bird(x, y, H, now) {
      var s = H / 270, f = Math.sin(now * 9) * 0.55;
      mx.save();
      mx.translate(x, y);
      mx.scale(s, s);
      mx.fillStyle = '#030101';
      mx.beginPath(); mx.ellipse(0, 0, 15, 9, -0.15, 0, Math.PI * 2); mx.fill();      // body
      mx.beginPath(); mx.arc(-15, -6, 5.5, 0, Math.PI * 2); mx.fill();               // head
      mx.beginPath(); mx.moveTo(-20, -7); mx.lineTo(-27, -5); mx.lineTo(-20, -4); mx.fill(); // beak
      mx.beginPath(); mx.moveTo(-6, -4); mx.quadraticCurveTo(-22, -26 - f * 18, -40, -30 - f * 26); mx.lineTo(4, -6); mx.closePath(); mx.fill();
      mx.beginPath(); mx.moveTo(2, -4); mx.quadraticCurveTo(18, -24 - f * 16, 38, -26 - f * 24); mx.lineTo(12, -2); mx.closePath(); mx.fill();
      mx.beginPath(); mx.moveTo(12, 1); mx.lineTo(30, 6); mx.lineTo(28, 11); mx.lineTo(11, 6); mx.closePath(); mx.fill(); // tail
      mx.restore();
    }
    return {
      silhouette: function () {
        return new Promise(function (res) { silStart = performance.now() / 1000; silDone = res; });
      },
      stop: function () {
        running = false;
        gx.setTransform(1, 0, 0, 1, 0, 0);
        gx.clearRect(0, 0, glow.width, glow.height);
        sx.setTransform(1, 0, 0, 1, 0, 0);
        sx.clearRect(0, 0, sil.width, sil.height);
      }
    };
  }

  /* ======================================================================
   * 14 她想要逃走：远处的灯火走不过去，只有心跳
   * ====================================================================== */
  G.screen('night-flee', {
    page: 14,
    theme: 'dark',
    time: '00:03',
    mount: function (root) {
      var k = NK.kit(root);
      NK.scene(k, 'distant-lights', { delay: 200 }); // 灯火自己会闪
      k.add('<div class="nf-tunnel"></div>');
      NK.fx(k);
      (async function () {
        await k.wait(1800);
        for (var i = 0; i < 3; i++) {
          await k.tap({ hintDelay: i ? 1500 : 500 });
          tremble(i + 1);
        }
        await k.wait(1300);
        await k.say(T.s14, { hintDelay: 2200 });
        k.go('night-memo', null, 1200);
      })();
      function tremble(n) {
        if (n === 1) k.loop('heart'); else G.audio.play('heartbeat');
        root.style.setProperty('--tunnel', n);
        root.setAttribute('data-try', n);
        if (reduced()) return;
        root.classList.remove('nf-shake');
        reflow(root);
        root.classList.add('nf-shake');
      }
      return k.cleanup;
    }
  });

  /* ======================================================================
   * 15 孔雀与方方：备忘录 + 谜题 3
   * ====================================================================== */
  G.screen('night-memo', {
    page: 15,
    theme: 'dark',
    time: '00:05',
    mount: function (root) {
      var k = NK.kit(root);
      k.add('<div class="nm-ember"></div>');
      NK.fx(k);
      k.loop('wind');
      (async function () {
        await k.wait(900);
        var w = whisper(k, T.s15who, T.s15low);
        await k.tap({ hintDelay: 2600 });
        w.classList.add('out');
        await k.wait(600);
        await k.say(T.s15v, { pos: 'center', hintDelay: 1800 });
        k.uncap();
        await k.wait(500);
        var app = memoApp(k);
        await app.solved;
        await k.wait(900);
        var sc = NK.scene(k, 'peacock-cage', { manual: true });
        sc.wrap.classList.add('nm-cage');
        app.el.classList.add('out');
        k.later(sc.fadeIn, 300);
        await k.wait(1800);
        await k.say(T.s15end, { who: '结论', hintDelay: 1800 });
        for (var i = 0; i < T.s15story.length; i++) await k.say(T.s15story[i], { hintDelay: 2000 });
        k.go('night-rules', null, 1000);
      })();
      return k.cleanup;
    }
  });

  function memoApp(k) {
    var list = G.memo.list();
    // 方方的「kt」：weixin.js 存成 msg-fang-10；以防万一也按内容认
    var isKt = function (m) { return m.id === 'msg-fang-10' || /\bkt\b/i.test((m.title || '') + ' ' + (m.text || '')); };
    var hasKt = list.some(isKt);
    var rows = list.map(function (m) { return item(m.title, m.text, m.time, isKt(m)); });
    if (!hasKt) {
      var c = T.s15fang.indexOf('：');
      rows.push(item(T.s15fang.slice(0, c), T.s15fang.slice(c + 1), '', true));
    }
    var opts = [['每天半夜', false], ['只在有人被献祭之后', true], ['有人走近的时候', false]];
    var el = k.reveal('<div class="nm-app">' +
      '<div class="nm-top"><span>‹ 文件夹</span><span class="nm-dots">···</span></div>' +
      '<div class="nm-scroll"><div class="nm-h1">备忘录</div><div class="nm-count">' + rows.length + ' 条记录</div>' +
      '<div class="nm-list">' + rows.join('') + '</div></div>' +
      '<div class="nm-quiz"><div class="nm-step">' + G.esc(T.s15step) + '</div>' +
      '<div class="nm-q">' + G.esc(T.s15q) + '</div>' +
      opts.map(function (o, i) { return '<button class="nm-opt" data-i="' + i + '"><i></i><span>' + G.esc(o[0]) + '</span></button>'; }).join('') +
      '</div></div>');
    var solved = new Promise(function (res) {
      var done = false;
      el.querySelectorAll('.nm-opt').forEach(function (b) {
        b.onclick = function () {
          if (done) return;
          if (opts[+b.getAttribute('data-i')][1]) {
            done = true;
            b.classList.add('ok');
            G.audio.play('heartbeat');
            res();
            return;
          }
          G.audio.play('tap');
          b.classList.remove('no');
          reflow(b);
          b.classList.add('no');
          k.later(function () { b.classList.remove('no'); }, 700);
        };
      });
    });
    return { el: el, solved: solved };
  }
  function item(title, text, time, key) {
    return '<div class="nm-item' + (key ? ' key' : '') + '"><div class="nm-t">' + G.esc(title || '') + '</div>' +
      '<div class="nm-s">' + (time ? '<b>' + G.esc(time) + '</b>' : '') + G.esc(text || '') + '</div></div>';
  }

  /* ======================================================================
   * 16 组织的规矩：内部系统自己刷新，规矩一条一条显现
   * ====================================================================== */
  var EMBLEM = '<svg class="ru-emblem" viewBox="0 0 64 120" aria-hidden="true">' +
    '<path d="M32 6C50 18 57 44 51 70C47 86 39 97 32 102C25 97 17 86 13 70C7 44 14 18 32 6Z" fill="rgba(31,143,92,.08)" stroke="#2fbf7a" stroke-width="1.4"/>' +
    '<g stroke="#1f8f5c" stroke-width=".8" fill="none">' +
    '<path d="M32 70L16 58M32 78L18 70M32 86L22 82M32 62L15 48M32 70L48 58M32 78L46 70M32 86L42 82M32 62L49 48M32 30L20 20M32 30L44 20"/></g>' +
    '<path d="M32 12V116" stroke="#2fbf7a" stroke-width="1.3"/>' +
    '<path d="M17 44Q32 30 47 44Q32 58 17 44Z" fill="#04100b" stroke="#3ad08a" stroke-width="1.3"/>' +
    '<circle cx="32" cy="44" r="6.2" fill="#233a8f"/><circle cx="32" cy="44" r="2.7" fill="#000"/>' +
    '<circle cx="33.8" cy="42.3" r="1.1" fill="#d8f5e6"/></svg>';

  /** 社徽：优先用 web.js 的同一枚羽毛（G.webArt.feather），保持和内部系统一致。 */
  function emblem() {
    try {
      if (G.webArt && typeof G.webArt.feather === 'function') {
        var svg = G.webArt.feather('ru-emblem');
        if (typeof svg === 'string' && svg.indexOf('<svg') === 0) return svg;
      }
    } catch (e) { /* fall back */ }
    return EMBLEM;
  }

  G.screen('night-rules', {
    page: 16,
    theme: 'dark',
    time: '00:06',
    mount: function (root) {
      var k = NK.kit(root);
      var sys = k.add('<div class="ru-sys"><div class="ru-bar"><i></i></div>' +
        '<div class="ru-head">' + emblem() + '<div class="ru-place">' + G.esc(T.s16place) + '</div></div>' +
        '<div class="ru-status"><i class="ru-spin"></i><span>正在刷新</span></div>' +
        '<div class="ru-body"></div></div>');
      var body = sys.querySelector('.ru-body');
      var bar = sys.querySelector('.ru-bar i');
      NK.fx(k);
      k.loop('drone');
      function refresh(ms) {
        G.audio.play('tap');
        bar.style.animationDuration = ms + 'ms';
        sys.classList.remove('busy', 'flash');
        reflow(sys);
        sys.classList.add('busy');
        return k.wait(ms).then(function () {
          sys.classList.remove('busy');
          sys.classList.add('flash');
        });
      }
      function block(label, text, cls) {
        return k.reveal('<div class="ru-block' + (cls ? ' ' + cls : '') + '"><div class="ru-label">' + G.esc(label) +
          '</div><div class="ru-text">' + G.esc(text) + '</div></div>', body);
      }
      function rule(line, cls) {
        var c = line.indexOf('：');
        return block(line.slice(0, c), line.slice(c + 1), cls);
      }
      (async function () {
        await k.wait(400);
        sys.classList.add('in');
        await k.wait(700);
        await refresh(1500);
        block('组织', T.s16org);
        await k.beat(4400);
        await refresh(1100);
        rule(T.s16r1, 'one');
        await k.beat(3800);
        await refresh(1100);
        rule(T.s16r2, 'two');
        G.audio.play('heartbeat');
        await k.tap({ guard: 1200, hintDelay: 3400 });
        k.go('night-send', null, 1000);
      })();
      return k.cleanup;
    }
  });

  /* ======================================================================
   * 17 我的左手：想报警 → 拨 110 → 呼叫失败 · 无服务
   * ====================================================================== */
  var PAD = [['1', ''], ['2', 'ABC'], ['3', 'DEF'], ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'],
    ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'], ['*', ''], ['0', '+'], ['#', '']];
  var ICON = {
    phone: '<svg viewBox="0 0 24 24"><path d="M6.6 10.8a15.2 15.2 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z" fill="currentColor"/></svg>',
    del: '<svg viewBox="0 0 28 24"><path d="M9.5 4H24a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H9.5L2.5 12z" fill="currentColor"/><path d="M13 8.5l7 7M20 8.5l-7 7" stroke="#000" stroke-width="2" stroke-linecap="round"/></svg>',
    who: '<svg viewBox="0 0 96 96"><circle cx="48" cy="38" r="17" fill="currentColor"/><path d="M12 100c2-24 17-37 36-37s34 13 36 37z" fill="currentColor"/></svg>',
    mute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M4 4l16 16"/></svg>',
    pad: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="6" cy="5" r="1.7"/><circle cx="12" cy="5" r="1.7"/><circle cx="18" cy="5" r="1.7"/><circle cx="6" cy="11" r="1.7"/><circle cx="12" cy="11" r="1.7"/><circle cx="18" cy="11" r="1.7"/><circle cx="6" cy="17" r="1.7"/><circle cx="12" cy="17" r="1.7"/><circle cx="18" cy="17" r="1.7"/><circle cx="12" cy="22" r="1.7"/></svg>',
    spk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>'
  };

  G.screen('night-send', {
    page: 17,
    theme: 'dark',
    time: '00:07',
    mount: function (root) {
      var k = NK.kit(root);
      var sc = NK.scene(k, 'hand-phone', { art: { fit: 'cover', fx: 0.59 }, delay: 100 });
      sc.wrap.classList.add('ns-hand');
      NK.fx(k);
      var dial = k.add('<div class="ns-dial">' +
        '<div class="ns-show"><div class="ns-digits" aria-live="polite"></div>' +
          '<button class="ns-quick">' + G.esc('拨打 ' + T.s17num) + '</button></div>' +
        '<div class="ns-pad">' + PAD.map(function (p) {
          return '<button class="ns-key' + (/[*#]/.test(p[0]) ? ' sym' : '') + '" data-d="' + G.esc(p[0]) + '" aria-label="' + G.esc(p[0]) + '">' +
            '<b>' + G.esc(p[0]) + '</b>' + (p[1] ? '<small aria-hidden="true">' + G.esc(p[1]) + '</small>' : '') + '</button>';
        }).join('') +
          '<span></span><button class="ns-dialbtn" aria-label="呼叫">' + ICON.phone + '</button>' +
          '<button class="ns-del" aria-label="删除" hidden>' + ICON.del + '</button>' +
        '</div></div>');
      var digits = dial.querySelector('.ns-digits');
      var del = dial.querySelector('.ns-del');
      var keys = {};
      var num = '';
      var live = false;
      var nudge = 0;
      dial.querySelectorAll('.ns-key').forEach(function (b) {
        keys[b.getAttribute('data-d')] = b;
        b.onclick = function () { press(b.getAttribute('data-d')); };
      });

      function show() {
        digits.textContent = num;
        digits.classList.toggle('long', num.length > 11);
        del.hidden = !num;
      }
      function flash(b) {
        if (!b) return;
        b.classList.remove('hit');
        reflow(b);
        b.classList.add('hit');
        k.later(function () { b.classList.remove('hit'); }, 160);
      }
      // 停住几秒，轻轻提示下一个该按的键（不加文字）
      function idle() {
        clearTimeout(nudge);
        dial.querySelectorAll('.nudge').forEach(function (n) { n.classList.remove('nudge'); });
        if (!live) return;
        nudge = k.later(function () {
          var want = T.s17num;
          var n = num === want ? dial.querySelector('.ns-dialbtn') : want.indexOf(num) === 0 ? keys[want.charAt(num.length)] : del;
          if (n) n.classList.add('nudge');
        }, 4200);
      }
      function press(d) {
        if (!live) return;
        G.audio.play('tap');
        flash(keys[d]);
        if (num.length < 15) num += d;
        show();
        idle();
      }
      function back() {
        if (!live || !num) return;
        G.audio.play('tap');
        num = num.slice(0, -1);
        show();
        idle();
      }
      del.onclick = back;
      dial.querySelector('.ns-dialbtn').onclick = function () {
        if (!live) return;
        if (num === T.s17num) { call(); return; }
        G.audio.play('tap');
        if (!num) return;
        digits.classList.remove('no');
        reflow(digits);
        digits.classList.add('no');
        k.later(function () { digits.classList.remove('no'); num = ''; show(); idle(); }, 520);
      };
      dial.querySelector('.ns-quick').onclick = function () {
        if (!live) return;
        num = T.s17num;
        show();
        call();
      };
      k.on(document, 'keydown', function (e) {
        if (!live || e.metaKey || e.ctrlKey || e.altKey) return;
        if (/^[0-9*#]$/.test(e.key)) { e.preventDefault(); press(e.key); }
        else if (e.key === 'Backspace') { e.preventDefault(); back(); }
      });

      function call() {
        live = false;
        idle();
        G.audio.play('tap');
        dial.classList.add('out');
        var c = k.reveal('<div class="ns-call">' +
          '<div class="ns-head"><div class="ns-num">' + G.esc(T.s17num) + '</div>' +
            '<div class="ns-state" aria-live="polite">' + G.esc(T.s17call) + '</div></div>' +
          '<div class="ns-ava" aria-hidden="true"><i></i><i></i><i></i><span>' + ICON.who + '</span></div>' +
          '<div class="ns-ctl" aria-hidden="true"><span>' + ICON.mute + '</span><span>' + ICON.pad + '</span><span>' + ICON.spk + '</span></div>' +
          '<button class="ns-end" aria-label="挂断">' + ICON.phone + '</button>' +
          '</div>');
        var state = c.querySelector('.ns-state');
        var end = c.querySelector('.ns-end');
        var over = false;
        var done = null;
        end.onclick = function () { G.audio.play('tap'); if (over && done) done(); };
        // 状态栏的信号一格一格掉光
        [3, 2, 1].forEach(function (n, i) {
          k.later(function () { root.classList.remove('ns-sig' + (n + 1)); root.classList.add('ns-sig' + n); }, 700 + i * 800);
        });
        k.later(async function () {
          over = true;
          root.classList.remove('ns-sig1');
          root.classList.add('ns-sig0');
          c.classList.add('fail');
          state.textContent = T.s17fail;
          G.audio.play('error');
          await new Promise(function (res) { done = res; k.tap({ guard: 1200, hintDelay: 2400 }).then(res); });
          done = null;
          k.unhint();
          c.classList.add('dead');
          sc.wrap.classList.remove('dim');
          sc.wrap.classList.add('ghost');
          k.later(function () { k.go('night-turn', null, 1600); }, 1900);
        }, 3200);
      }

      (async function () {
        await k.wait(1900);
        k.cap(T.s17);
        await k.beat(3000);
        k.uncap();
        await k.wait(500);
        sc.wrap.classList.add('dim');
        dial.classList.add('in');
        live = true;
        idle();
      })();
      return k.cleanup;
    }
  });

  /* ======================================================================
   * 18 她回头（分镜 s19）
   * ====================================================================== */
  G.screen('night-turn', {
    page: 18,
    theme: 'dark',
    time: '00:09',
    mount: function (root) {
      var k = NK.kit(root);
      var sc = NK.scene(k, 'red-hood', { delay: 1000 });
      var face = sc.f.face;
      sc.wrap.style.transformOrigin = (face.x * 100).toFixed(1) + '% ' + (face.y * 100).toFixed(1) + '%'; // 慢慢推近她的脸
      if (!reduced()) sc.wrap.classList.add('tu-push');
      k.add('<div class="tu-fire"></div>');
      NK.fx(k);
      k.loop('fire');
      (async function () {
        await k.wait(2400);
        var card = k.cap(T.s19v[0]);
        await k.beat(3000);
        root.classList.add('tu-lit');
        k.line(card, T.s19v[1]);
        await k.tap({ hintDelay: 2600 });
        await k.say(T.s19a, { hintDelay: 3000 });
        await k.say(T.s19b, { hintDelay: 2600 });
        await k.say(T.s19story, { hintDelay: 3200 });
        k.go('ending', null, 2200);
      })();
      return k.cleanup;
    }
  });

  /* ======================================================================
   * 19 第二声 → 制作名单
   * ====================================================================== */
  G.screen('ending', {
    page: 19,
    theme: 'dark',
    time: '00:09',
    mount: function (root) {
      var k = NK.kit(root);
      G.audio.cut();
      var sc = NK.scene(k, 'two-sisters', { art: { fit: 'cover', fx: 0.5 }, manual: true });
      NK.fx(k);
      (async function () {
        await k.wait(3200);           // 很久的寂静
        G.audio.play('peacock');      // 孔雀第二次叫
        await k.wait(300);
        sc.art.classList.add('ghost');
        await k.wait(2400);
        sc.art.classList.remove('ghost');
        await k.wait(2600);
        sc.stop();                    // 已经淡没了
        var card = k.cap(T.s20, { pos: 'center' });
        await k.beat(4200);
        k.line(card, T.s20story);
        await k.beat(5200);
        k.uncap();
        await k.wait(1600);
        credits();
      })();
      function credits() {
        var c = k.reveal('<div class="ne-credits">' +
          '<div class="ne-title">《姐姐的不对劲》</div>' +
          '<div class="ne-sub">孔雀之眼的诅咒</div>' +
          '<div class="ne-rule"></div>' +
          '<div class="ne-by"><span>制作</span>sancia</div>' +
          '<div class="ne-fic">本故事纯属虚构</div>' +
          '<button class="ne-restart">重新开始</button></div>');
        c.querySelector('.ne-restart').onclick = function () { G.audio.play('tap'); G.state.reset(); };
      }
      return k.cleanup;
    }
  });
})();
