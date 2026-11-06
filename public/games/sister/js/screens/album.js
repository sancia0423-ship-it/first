/* 03 相册 · 姐姐的异常
 * Also defines G.tornPaperSVG(opts): the half-torn peacock paper (s03), reused by the chat and the room.
 * Story text comes only from storyboard/data.js (s03).
 */
(function () {
  'use strict';

  /* ---------- 撕掉一半的纸 ---------- */
  var W = 600, H = 430;          // the whole sheet; the tear runs top→bottom near x≈310
  var INK = '#22283a';           // 钢笔墨水
  var seq = 0;

  function rng(seed) {
    return function () {
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function f(n) { return Math.round(n * 10) / 10; }

  // torn edge, fixed seed so both halves always fit together
  var TEAR = (function () {
    var r = rng(17), pts = [], y = 0;
    while (y < H) {
      pts.push([f(314 - y * 0.05 + 7 * Math.sin(y / 41) + 3 * Math.sin(y / 13 + 2) + (r() - 0.5) * 5), f(y)]);
      y += 3 + r() * 4;
    }
    pts.push([f(314 - H * 0.05 + 7 * Math.sin(H / 41)), H]);
    return pts;
  })();
  var TEAR_D = 'M' + TEAR.map(function (p) { return p[0] + ' ' + p[1]; }).join(' L');
  var CLIP_L = 'M-12 0 L' + TEAR.map(function (p) { return p[0] + ' ' + p[1]; }).join(' L') + ' L-12 ' + H + 'Z';
  var CLIP_R = 'M' + (W + 12) + ' 0 L' + TEAR.map(function (p) { return p[0] + ' ' + p[1]; }).join(' L') + ' L' + (W + 12) + ' ' + H + 'Z';

  // peacock: head + neck + body in one outline (facing left), fan pivot behind the rump
  var BODY = 'M141 172 L151 167 C153 161 162 158 167 161 C172 164 173 171 171 178 C169 196 176 214 190 228 ' +
    'C202 238 222 244 236 252 C246 258 250 270 244 280 C234 296 214 304 196 302 C176 300 162 288 160 270 ' +
    'C158 252 162 238 160 222 C158 206 154 192 155 182 L151 176 Z';
  var FAN = { x: 215, y: 250 };

  function feather(deg, len, k, r, inner) {
    // hand-drawn: every feather a little off
    deg += (r() - 0.5) * 5; len += (r() - 0.5) * 10; k *= 0.92 + r() * 0.16;
    var t = deg * Math.PI / 180, ux = Math.cos(t), uy = Math.sin(t), bend = (r() - 0.5) * 6;
    function P(d, o) { return f(FAN.x + ux * d - uy * o) + ' ' + f(FAN.y + uy * d + ux * o); }
    var ex = len - 12 * k, s = '';
    // quill
    s += '<path d="M' + P(34, 0) + ' Q' + P(len * 0.55, bend) + ' ' + P(ex - 12 * k, 0) + '" stroke-width="' + (inner ? '.7' : '.85') + '"/>';
    // loose barbs along the quill (outer row only)
    for (var i = 0; !inner && i < 3; i++) {
      var d = len * (0.48 + i * 0.11) + (r() - 0.5) * 6, L = (5 + i * 2.4) * k, b = bend * (0.5 + i * 0.15);
      s += '<path d="M' + P(d + L * 0.8, b + L) + ' Q' + P(d + L * 0.15, b + L * 0.5) + ' ' + P(d, b) + ' Q' + P(d + L * 0.15, b - L * 0.5) + ' ' + P(d + L * 0.8, b - L) + '" stroke-width=".55"/>';
    }
    // the eye: outer ring, inner wash, pupil, fringe
    function E(d, rx, ry, extra) {
      var c = P(d, 0).split(' ');
      return '<ellipse cx="' + c[0] + '" cy="' + c[1] + '" rx="' + f(rx * k) + '" ry="' + f(ry * k) + '" transform="rotate(' + f(deg) + ' ' + c[0] + ' ' + c[1] + ')"' + extra + '/>';
    }
    s += E(ex, 13, 9, ' stroke-width=".9"');
    s += E(ex - 2.2 * k, 8.4, 6, ' stroke-width=".7" fill="' + INK + '" fill-opacity=".09"');
    s += E(ex - 3.6 * k, 4.3, 3.5, ' fill="' + INK + '" stroke="none"');
    var n = inner ? 9 : 15;
    for (var j = 0; j < n; j++) {
      var a = (j + r() * 0.5) / n * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      var a1 = 13.8 * k, b1 = 9.8 * k, q = (2 + r() * 3) * k;
      s += '<path d="M' + P(ex + ca * a1, sa * b1) + ' L' + P(ex + ca * (a1 + q), sa * (b1 + q)) + '" stroke-width=".5"/>';
    }
    return s;
  }

  function peacock() {
    var s = '', a, r = rng(23);
    // fan behind the bird (masked by the body outline)
    var fan = '';
    for (a = -162; a <= -18; a += 12) fan += feather(a, 104, 0.7, r, true);
    for (a = -168; a <= -12; a += 12) fan += feather(a, 162, 1, r, false);
    s += '<g mask="url(#MASK)">' + fan + '</g>';
    // body
    s += '<path d="' + BODY + '" stroke-width="1.2"/>';
    s += '<circle cx="160" cy="166" r="1.8" fill="' + INK + '" stroke="none"/>';
    s += '<path d="M154 170.5 Q159 173.5 165 169.5 M156 163 Q160 161 164 163 M142 172.5 L150 171.6"/>';
    // crest
    [[151, 142], [156.5, 138.5], [163, 138], [169.5, 141.5]].forEach(function (p) {
      s += '<path d="M162 160 Q' + f((162 + p[0]) / 2 + 1) + ' ' + f((160 + p[1]) / 2) + ' ' + p[0] + ' ' + p[1] + '" stroke-width=".7"/><ellipse cx="' + p[0] + '" cy="' + (p[1] - 1.5) + '" rx="1.6" ry="2.4" fill="' + INK + '" stroke="none"/>';
    });
    // neck / breast scales
    [[164, 184], [161, 193], [167, 197], [162, 203], [168, 208], [163, 214], [169, 220], [164, 228], [170, 234],
     [165, 242], [172, 248], [167, 257], [174, 262], [169, 271], [177, 276], [173, 285], [183, 289]].forEach(function (p) {
      s += '<path d="M' + f(p[0] - 2.6 + (r() - 0.5)) + ' ' + p[1] + ' q2.6 ' + f(2.6 + r()) + ' 5.2 0" stroke-width=".6"/>';
    });
    // shading on the belly: short parallel strokes
    for (var i = 0; i < 16; i++) {
      var x = 184 + i * 3.6, y = 300 - Math.pow((i - 7) / 8, 2) * 10 - 1;
      s += '<path d="M' + f(x) + ' ' + f(y) + ' l' + f(3.5 + r()) + ' ' + f(-7 - r() * 3) + '" stroke-width=".45" opacity=".7"/>';
    }
    // folded wing + hatching
    s += '<path d="M184 236 C198 246 222 258 240 270 C230 281 212 287 194 285 C188 270 186 252 184 236" stroke-width="1"/>';
    s += '<path d="M193 250 C205 257 217 264 229 271 M191 262 C202 268 212 273 222 278 M192 274 C199 278 206 281 212 283" stroke-width=".6"/>';
    for (i = 0; i < 7; i++) s += '<path d="M' + (204 + i * 4.5) + ' ' + (262 + i * 2.6) + ' l-3 ' + f(6 + r() * 2) + '" stroke-width=".4" opacity=".7"/>';
    // legs, feet, ground
    s += '<path d="M197 301 L194 326 M194 326 L184 332 M194 326 L196 336 M194 326 L204 330 M194 326 L190 320" stroke-width="1.1"/>';
    s += '<path d="M213 300 L216 324 M216 324 L208 331 M216 324 L219 334 M216 324 L226 327" stroke-width="1.1"/>';
    s += '<path d="M166 338 Q200 335 242 339 M176 342 Q196 341 214 343" stroke-width=".6" opacity=".5"/>';
    return s;
  }

  // handwritten digits, 22×36 box; written with the left hand: back-slanted, a little shaky
  var DIGIT = {
    '0': 'M13 3 C6 1 2.5 10 2.5 19 C2.5 28 6 35 11 35 C17 35 20 27 20 17 C20 9 17 2.5 10 3.5',
    '1': 'M5 9 Q9 6.5 12.5 2 Q11.6 18 11 35',
    '2': 'M3 10 C4 5 8 2 12 2 C17 2 19.5 6 19 10 C18 17 9 25 2 34 Q8 31.5 13 33 Q17 34.5 21 33',
    '4': 'M12.5 2 Q8 13 3 24 Q12 22.5 21.5 23 M15.5 12 Q15 24 14 35',
    '6': 'M16 3 C9 6 3 14 3 24 C3 31 7 35 11.5 35 C16.5 35 19.5 31 19.5 26 C19.5 21 16 18 12 18 C7.5 18 4 21 3 25',
    '7': 'M3 6 Q6 3.5 11 4 Q16 4.5 20 3 Q14 15 10 35'
  };
  function digits(str, x, y) {
    var r = rng(5), s = '', i = 0;
    str.split('').forEach(function (ch) {
      if (ch === ' ') { x += 18; return; }
      var tr = 'translate(' + f(x) + ' ' + f(y + (r() - 0.5) * 3 - i * 0.7) + ') rotate(' + f((r() - 0.5) * 5) + ' 11 18) scale(' + f(1.06 + (r() - 0.5) * 0.08) + ') skewX(8)';
      var start = DIGIT[ch].match(/^M([\d.]+) ([\d.]+)/);
      // main stroke + a thinner second pass (pen pressure) + ink pooled where the nib touched down
      s += '<g transform="' + tr + '"><path d="' + DIGIT[ch] + '"/>' +
        '<path d="' + DIGIT[ch] + '" transform="translate(.7 .3)" stroke-width="1.1" opacity=".55"/>' +
        '<circle cx="' + start[1] + '" cy="' + start[2] + '" r="1.7" fill="' + INK + '" stroke="none"/></g>';
      x += 29; i++;
    });
    return '<g stroke-width="2.4">' + s + '</g>';
  }

  /**
   * SVG string of the torn peacock paper.
   * opts.part: 'left' (default, the half in the album) | 'right' | 'whole' (both halves side by side, seam visible)
   * opts.photo: true → as a night photo on a desk (3:4), the way it appears in 相册 / 聊天
   * opts.fit: 'cover' to fill the box (preserveAspectRatio slice), else contain
   * opts.lines: optional array of handwritten lines for the right half (the room can pass its own text)
   */
  G.tornPaperSVG = function (opts) {
    opts = opts || {};
    var part = opts.part || 'left';
    var id = 'tp' + (++seq) + '-';
    var defs =
      '<linearGradient id="' + id + 'pg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#efe4c9"/><stop offset=".55" stop-color="#e9dbbb"/><stop offset="1" stop-color="#dcc69c"/></linearGradient>' +
      '<radialGradient id="' + id + 'edge" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#7a5528" stop-opacity="0"/><stop offset="1" stop-color="#7a5528" stop-opacity=".32"/></radialGradient>' +
      '<radialGradient id="' + id + 'fox"><stop offset="0" stop-color="#8a5a24" stop-opacity=".3"/><stop offset="1" stop-color="#8a5a24" stop-opacity="0"/></radialGradient>' +
      '<filter id="' + id + 'mot" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".012" numOctaves="4" seed="9"/>' +
        '<feColorMatrix values="0 0 0 0 .45  0 0 0 0 .31  0 0 0 0 .13  1.5 0 0 0 -.62"/></filter>' +
      '<filter id="' + id + 'grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="1" seed="4"/>' +
        '<feColorMatrix values="0 0 0 0 .25  0 0 0 0 .2  0 0 0 0 .12  1.2 0 0 0 -.5"/></filter>' +
      '<filter id="' + id + 'ink" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="2" seed="3"/>' +
        '<feDisplacementMap in="SourceGraphic" scale="1.5" xChannelSelector="R" yChannelSelector="G"/></filter>' +
      '<filter id="' + id + 'fib" x="-5%" y="-2%" width="110%" height="104%"><feTurbulence type="fractalNoise" baseFrequency=".9 .25" numOctaves="2" seed="11"/>' +
        '<feDisplacementMap in="SourceGraphic" scale="3.2" xChannelSelector="R" yChannelSelector="G"/></filter>' +
      '<mask id="' + id + 'm" maskUnits="userSpaceOnUse" x="-20" y="-20" width="' + (W + 40) + '" height="' + (H + 40) + '">' +
        '<rect x="-20" y="-20" width="' + (W + 40) + '" height="' + (H + 40) + '" fill="#fff"/><path d="' + BODY + '" fill="#000" stroke="#000" stroke-width="7"/></mask>' +
      '<clipPath id="' + id + 'cl"><path d="' + CLIP_L + '"/></clipPath>' +
      '<clipPath id="' + id + 'cr"><path d="' + CLIP_R + '"/></clipPath>';

    var lines = '';
    (opts.lines || []).forEach(function (t, i) {
      lines += '<text x="352" y="' + (318 + i * 34) + '" font-size="21" fill="' + INK + '" fill-opacity=".9" style="font-family:var(--brush)" transform="rotate(-1.5 352 ' + (318 + i * 34) + ')">' + G.esc(t) + '</text>';
    });

    var sheet =
      '<rect width="' + W + '" height="' + H + '" rx="3" fill="url(#' + id + 'pg)"/>' +
      '<rect width="' + W + '" height="' + H + '" filter="url(#' + id + 'mot)" opacity=".55"/>' +
      '<rect width="' + W + '" height="' + H + '" fill="url(#' + id + 'edge)"/>' +
      '<circle cx="62" cy="58" r="14" fill="url(#' + id + 'fox)"/><circle cx="268" cy="392" r="10" fill="url(#' + id + 'fox)"/>' +
      '<circle cx="520" cy="96" r="16" fill="url(#' + id + 'fox)"/><circle cx="34" cy="300" r="7" fill="url(#' + id + 'fox)"/>' +
      // an old fold across the sheet
      '<path d="M0 214 L' + W + ' 210" stroke="#fffaf0" stroke-width="1.4" opacity=".35"/><path d="M0 215.6 L' + W + ' 211.6" stroke="#8a6a40" stroke-width=".7" opacity=".18"/>' +
      '<g fill="none" stroke="' + INK + '" stroke-width=".75" stroke-linecap="round" stroke-linejoin="round" opacity=".92" filter="url(#' + id + 'ink)">' +
        peacock().replace(/MASK/g, id + 'm') + digits('7140 6002', 28, 366) + '</g>' +
      lines +
      '<rect width="' + W + '" height="' + H + '" filter="url(#' + id + 'grain)" opacity=".5"/>' +
      // torn rim: darker band, then the pale fibres of the inner paper
      '<path d="' + TEAR_D + '" fill="none" stroke="#7a5a30" stroke-opacity=".16" stroke-width="12"/>' +
      '<path d="' + TEAR_D + '" fill="none" stroke="#fbf6ea" stroke-width="5" filter="url(#' + id + 'fib)"/>';

    defs += '<g id="' + id + 'sheet">' + sheet + '</g>';
    var L = '<g clip-path="url(#' + id + 'cl)"><use href="#' + id + 'sheet"/></g>';
    var R = '<g clip-path="url(#' + id + 'cr)"><use href="#' + id + 'sheet"/></g>';
    var body, vb;
    if (part === 'right') { body = R; vb = '286 0 ' + (W - 286) + ' ' + H; }
    else if (part === 'whole') { body = L + R; vb = '0 0 ' + W + ' ' + H; }
    else { body = L; vb = '0 0 336 ' + H; }

    var par = opts.fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet';
    var cls = 'torn-paper' + (opts.className ? ' ' + opts.className : '');
    if (!opts.photo) {
      return '<svg class="' + cls + '" viewBox="' + vb + '" preserveAspectRatio="' + par + '" role="img" aria-label="撕掉一半的纸" xmlns="http://www.w3.org/2000/svg"><defs>' + defs + '</defs>' + body + '</svg>';
    }
    // night photo on the desk, lamp light from the top left
    var photoDefs =
      '<linearGradient id="' + id + 'desk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a301b"/><stop offset=".6" stop-color="#2a1a0e"/><stop offset="1" stop-color="#140c07"/></linearGradient>' +
      '<filter id="' + id + 'wood" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".004 .11" numOctaves="3" seed="2"/>' +
        '<feColorMatrix values="0 0 0 0 .05  0 0 0 0 .03  0 0 0 0 .01  1.6 0 0 0 -.55"/></filter>' +
      '<radialGradient id="' + id + 'lamp" cx=".12" cy="0" r="1"><stop offset="0" stop-color="#ffc77a" stop-opacity=".34"/><stop offset=".6" stop-color="#ffb35c" stop-opacity=".08"/><stop offset="1" stop-color="#ffb35c" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="' + id + 'vig" cx=".45" cy=".42" r=".78"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></radialGradient>' +
      '<filter id="' + id + 'noise" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="1" seed="8"/>' +
        '<feColorMatrix values="0 0 0 0 .5  0 0 0 0 .45  0 0 0 0 .4  1.4 0 0 0 -.6"/></filter>' +
      '<filter id="' + id + 'sh" x="-10%" y="-10%" width="125%" height="125%"><feDropShadow dx="4" dy="7" stdDeviation="6" flood-color="#000" flood-opacity=".55"/></filter>';
    return '<svg class="' + cls + ' is-photo" viewBox="0 0 360 480" preserveAspectRatio="' + par + '" role="img" aria-label="撕掉一半的孔雀纸" xmlns="http://www.w3.org/2000/svg">' +
      '<defs>' + defs + photoDefs + '</defs>' +
      '<rect width="360" height="480" fill="url(#' + id + 'desk)"/>' +
      '<rect width="360" height="480" filter="url(#' + id + 'wood)"/>' +
      '<g filter="url(#' + id + 'sh)"><g transform="translate(178 246) rotate(-2.5) scale(.93) translate(-168 -215)">' + body + '</g></g>' +
      '<rect width="360" height="480" fill="url(#' + id + 'lamp)"/>' +
      '<rect width="360" height="480" fill="url(#' + id + 'vig)"/>' +
      '<rect width="360" height="480" filter="url(#' + id + 'noise)" opacity=".35"/>' +
      '</svg>';
  };

  /* ---------- 03 相册 ---------- */
  // s03: 我偷偷拍的照片 + 我的照片备注
  var PHOTOS = [
    { id: 'photo-0918', date: '9月18日', time: '02:13', note: '她又在画那个东西。', kind: 'desk',
      memo: { id: 'photo-0918', title: '照片 · 9月18日 02:13', text: '她又在画那个东西。' } },
    { id: 'paper', date: '9月20日', time: '', note: '撕掉了一半。另一半在哪？', kind: 'paper',
      memo: { id: 'paper', title: '撕掉一半的纸', text: '（一只孔雀）　7140 6002' } }
  ];

  function photo(p, mode) {
    if (p.kind === 'paper') {
      return '<div class="alb-img alb-paper ' + mode + '">' + G.tornPaperSVG({ photo: true, fit: mode === 'thumb' ? 'cover' : '' }) + '</div>';
    }
    // 代码画的（js/art.js）：缩略图从左边裁成方的，留住手和纸
    var u = G.art ? (mode === 'thumb' ? G.art.url('desk-lefthand', 480, 480, { fit: 'cover', fx: 0 }) : G.art.url('desk-lefthand', 960, 720)) : '';
    return '<div class="alb-img alb-desk ' + mode + '">' + (u ? '<img src="' + u + '" alt="深夜台灯下，左手在纸上画同一个符号" draggable="false">' : '') + '</div>';
  }

  /* long-press (touch hold / right-click) without also firing the tap; a drag cancels it */
  function hold(el, onLong, onTap) {
    var t = null, x0 = 0, y0 = 0, fired = false;
    function clear() { if (t) { clearTimeout(t); t = null; } }
    el.addEventListener('pointerdown', function (e) {
      fired = false; x0 = e.clientX; y0 = e.clientY; clear();
      t = setTimeout(function () { t = null; fired = true; onLong(e); }, 550);
    });
    el.addEventListener('pointermove', function (e) {
      if (t && Math.abs(e.clientX - x0) + Math.abs(e.clientY - y0) > 10) clear();
    });
    el.addEventListener('pointerup', clear);
    el.addEventListener('pointerleave', clear);
    el.addEventListener('pointercancel', clear);
    el.addEventListener('contextmenu', function (e) {
      e.preventDefault(); clear();
      if (!fired) { fired = true; onLong(e); }
    });
    el.addEventListener('click', function (e) {
      if (fired) { fired = false; e.stopPropagation(); return; }
      if (onTap) onTap(e);
    });
  }

  function save(p) {
    var m = p.memo;
    G.memo.add({ id: m.id, title: m.title, text: m.text, time: G.state.get('time', '') });
  }
  function offerSave(p) {
    G.ui.sheet('', [{ label: '存到备忘录', value: true }]).then(function (ok) { if (ok) save(p); });
  }

  G.screen('album', {
    page: 3,
    theme: 'light',
    mount: function (root) {
      if (!G.state.has('album-seen')) { G.state.flag('album-seen'); G.audio.play('shutter'); }
      root.innerHTML =
        '<header class="alb-head"><button class="go-home" aria-label="返回主屏幕">← 返回主屏幕</button></header>' +
        '<div class="alb-body">' +
          '<h1 class="alb-title">相册</h1>' +
          '<div class="alb-sec">九月</div>' +
          '<div class="alb-grid">' + PHOTOS.map(function (p, i) {
            return '<button class="alb-cell" data-i="' + i + '" aria-label="' + G.esc(p.date + ' ' + p.time) + '">' + photo(p, 'thumb') + '</button>';
          }).join('') + '</div>' +
          '<div class="alb-count">' + PHOTOS.length + ' 张照片</div>' +
        '</div>';
      root.querySelector('.go-home').onclick = function () { G.audio.play('tap'); G.show('home'); };
      root.querySelectorAll('.alb-cell').forEach(function (cell) {
        var i = +cell.getAttribute('data-i');
        hold(cell, function () { offerSave(PHOTOS[i]); }, function () { G.audio.play('tap'); viewer(root, i); });
      });
    }
  });

  /* 全屏查看：左右滑动 / 箭头切换，日期 + 我的备注 */
  function viewer(root, index) {
    var phone = document.querySelector('.phone');
    var v = G.ui.el('<div class="alb-viewer" role="dialog" aria-label="照片">' +
      '<div class="albv-top"><button class="albv-close" aria-label="关闭"><svg viewBox="0 0 24 24"><path d="M15 4 7 12l8 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
        '<div class="albv-date"><b></b><small></small></div><span class="albv-n"></span></div>' +
      '<div class="albv-stage"><div class="albv-track">' + PHOTOS.map(function (p) {
        return '<div class="albv-slide">' + photo(p, 'view') + '</div>';
      }).join('') + '</div>' +
        '<button class="albv-arrow prev" aria-label="上一张">‹</button><button class="albv-arrow next" aria-label="下一张">›</button></div>' +
      '<div class="albv-foot"><div class="albv-note"><span class="albv-k">备注</span><p></p></div>' +
        '<button class="albv-save">存到备忘录</button></div>' +
      '</div>');
    root.appendChild(v);
    phone.setAttribute('data-theme', 'dark');

    var track = v.querySelector('.albv-track');
    var stage = v.querySelector('.albv-stage');
    function go(i, animate) {
      index = Math.max(0, Math.min(PHOTOS.length - 1, i));
      var p = PHOTOS[index];
      track.style.transition = animate === false ? 'none' : '';
      track.style.transform = 'translateX(' + (-index * 100) + '%)';
      v.querySelector('.albv-date b').textContent = p.date;
      v.querySelector('.albv-date small').textContent = p.time;
      v.querySelector('.albv-n').textContent = (index + 1) + ' / ' + PHOTOS.length;
      v.querySelector('.albv-note p').textContent = p.note;
      v.querySelector('.albv-save').style.visibility = p.kind === 'paper' ? '' : 'hidden';
      v.querySelector('.prev').hidden = index === 0;
      v.querySelector('.next').hidden = index === PHOTOS.length - 1;
    }
    go(index, false);

    v.querySelector('.albv-close').onclick = function () {
      G.audio.play('tap');
      phone.setAttribute('data-theme', 'light');
      v.classList.add('out');
      setTimeout(function () { v.remove(); }, 200);
    };
    v.querySelector('.prev').onclick = function () { G.audio.play('tap'); go(index - 1); };
    v.querySelector('.next').onclick = function () { G.audio.play('tap'); go(index + 1); };
    v.querySelector('.albv-save').onclick = function () { save(PHOTOS[index]); };
    v.querySelectorAll('.albv-slide').forEach(function (sl, i) {
      hold(sl, function () { if (i === index) offerSave(PHOTOS[i]); });
    });

    // swipe
    var x0 = null, dx = 0, w = 1;
    stage.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.albv-arrow')) return;
      x0 = e.clientX; dx = 0; w = stage.clientWidth || 1;
      track.style.transition = 'none';
    });
    stage.addEventListener('pointermove', function (e) {
      if (x0 === null) return;
      dx = e.clientX - x0;
      // resist at the ends
      if ((index === 0 && dx > 0) || (index === PHOTOS.length - 1 && dx < 0)) dx /= 3;
      track.style.transform = 'translateX(calc(' + (-index * 100) + '% + ' + dx + 'px))';
    });
    function end() {
      if (x0 === null) return;
      x0 = null;
      track.style.transition = '';
      if (dx < -w * 0.18) go(index + 1); else if (dx > w * 0.18) go(index - 1); else go(index);
    }
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
    stage.addEventListener('pointerleave', end);
  }
})();
