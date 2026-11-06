/* 威信 · 聊天列表、发现、朋友圈（无页码）+ 聊天：02 姐、04 方方
 * Chat lines come from storyboard/data.js (s02, s04) plus the author's later edits to 方方's chat. Do not add to it.
 * Pictures: assets/img/<name>.jpg slots (avatar-*, moments-*); a missing file falls back to the SVG drawn here
 * or to a scene from js/art.js (never a photo).
 */
(function () {
  'use strict';

  var CHATS = {
    jie: {
      name: '姐', nick: '月亮不属于我', account: '月亮不属于我', pinned: true,
      lines: [
        { who: '我', time: '9月22日', text: '你昨晚三点又出门了' },
        { who: '姐', time: '9月22日', text: '睡不着。' }
      ]
    },
    fang: {
      name: '方方',
      lines: [
        { who: '我', time: '9月20日', text: '［图片：撕掉一半的孔雀纸］' },
        { who: '我', time: '9月20日', text: '方方姐，你见过这个标志吗？' },
        { who: '方方', time: '9月20日', text: '没见过。我帮你搜搜' },
        { who: '方方', time: '9月23日', text: '我刚刚查了一下你说的那个孔雀标志，好像和你姐姐学校的一个社团有关。' },
        { who: '方方', time: '9月23日', text: '我找到他们的社团活动页面了，不过看起来挺正常的，也不知道是不是你要找的那个。' },
        { who: '方方', time: '9月23日', text: '［链接：圣玛利亚女子中学 · 社团活动］' },
        { who: '方方', time: '9月23日', text: '你先看看有没有你姐姐的线索，我再帮你查查。' },
        { who: '方方', time: '9月26日 19:32', text: '我看他们这周有活动，我去看看什么情况。' },
        { who: '方方', time: '9月28日 22:16', text: '我到了，怎么这么黑，好吓人……' },
        { who: '方方', time: '9月28日 23:51', text: '我好像找到你说的那个标志了。' },
        { who: '方方', time: '9月29日 00:13', text: 'kt' },         // index 10 → memo id msg-fang-10 (night.js)
        { who: '我', time: '9月29日 00:13', text: '方方姐你在哪！！回我' }
      ]
    }
  };
  var ORDER = ['jie', 'fang'];

  /* 姐的朋友圈，旧 → 新（页面上新的在上）。图片位 assets/img/moments-<n>.jpg，没放图时用 fb：
   * 'paper' = 撕掉一半的纸（SVG），其余是 js/art.js 的场景名（fy 同 object-position，用来裁）。
   * 草稿：等作者确认（文字、日期都是暂定的，别往里加东西）
   */
  var MOMENTS = [
    { n: 1, date: '9月1日', text: '开学了。妹妹也来了这所学校。', fb: 'school-day', fy: 0.7, ratio: '3x2' },
    { n: 2, date: '9月18日 02:13', text: '', fb: 'paper', ratio: '3x4' },
    { n: 3, date: '9月22日 03:04', text: '睡不着。', fb: 'night-black', ratio: '3x4' },
    { n: 4, date: '10月26日', text: '', fb: 'feather-desk', ratio: '1x1' }
  ];
  var ART_PX = { '3x2': [840, 560], '3x4': [600, 800], '1x1': [720, 720] }; // 列表和全屏共用一张
  var LINK_HOST = 'stmaria-gs.edu.cn';
  var RE_IMG = /^［图片：(.+)］$/;
  var RE_LINK = /^［链接：(.+)］$/;

  /* ---------- avatars (SVG, no photos) ---------- */
  var avSeq = 0;
  function avatar(who) {
    var id = 'wxav' + (++avSeq);
    if (who === 'jie') {
      // 月亮不属于我：深蓝夜空里一弯月亮
      return '<svg viewBox="0 0 48 48" aria-hidden="true"><defs>' +
        '<linearGradient id="' + id + 'g" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#0a1430"/><stop offset="1" stop-color="#1f3a78"/></linearGradient>' +
        '<radialGradient id="' + id + 'h"><stop offset="0" stop-color="#f6e7b8" stop-opacity=".28"/><stop offset="1" stop-color="#f6e7b8" stop-opacity="0"/></radialGradient>' +
        '<mask id="' + id + 'm"><rect width="48" height="48" fill="#fff"/><circle cx="29.5" cy="19.5" r="10.5" fill="#000"/></mask></defs>' +
        '<rect width="48" height="48" fill="url(#' + id + 'g)"/>' +
        '<circle cx="19" cy="28" r="17" fill="url(#' + id + 'h)"/>' +
        '<circle cx="23" cy="25" r="12.5" fill="#f4e4b2" mask="url(#' + id + 'm)"/>' +
        '<circle cx="38" cy="34" r=".9" fill="#dfe6ff"/><circle cx="40" cy="11" r=".7" fill="#dfe6ff" opacity=".8"/><circle cx="10" cy="9" r=".6" fill="#dfe6ff" opacity=".7"/><circle cx="35" cy="42" r=".5" fill="#dfe6ff" opacity=".6"/>' +
        '</svg>';
    }
    if (who === 'fang') {
      // 她和姐姐的合照：黄昏里两个剪影，比着同一个手势
      var sil = '#3a2638';
      function person(x, y, s) {
        return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
          '<circle cx="0" cy="0" r="5.4"/>' +
          '<path d="M-10 24 C-10 13 -6 8.5 0 8.5 C6 8.5 10 13 10 24 Z"/>' +
          '<path d="M-6.5 12 L-8.6 1.5" stroke="' + sil + '" stroke-width="2.8" stroke-linecap="round"/>' +
          '<path d="M-8.6 1.5 L-10.4 -5.6 M-8.4 1.5 L-6.6 -5.8" stroke="' + sil + '" stroke-width="1.5" stroke-linecap="round"/>' +
          '</g>';
      }
      return '<svg viewBox="0 0 48 48" aria-hidden="true"><defs>' +
        '<linearGradient id="' + id + 'g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4c58f"/><stop offset=".55" stop-color="#e38f7c"/><stop offset="1" stop-color="#7d5486"/></linearGradient></defs>' +
        '<rect width="48" height="48" fill="url(#' + id + 'g)"/>' +
        '<circle cx="24" cy="31" r="10" fill="#ffe2ad" opacity=".55"/>' +
        '<g fill="' + sil + '">' + person(16.5, 25.5, 1) + person(33, 24.5, 1.04) + '</g>' +
        '</svg>';
    }
    // 我：默认头像
    return '<svg viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" fill="#c5ced9"/>' +
      '<circle cx="24" cy="19" r="8" fill="#fff" opacity=".95"/><path d="M9 46 C9 34 16 29.5 24 29.5 C32 29.5 39 34 39 46 Z" fill="#fff" opacity=".95"/></svg>';
  }
  G.wxAvatar = avatar;

  /* image slot: the author's picture on top; a missing file removes itself and the fallback underneath shows */
  function slot(name) {
    return '<img class="wx-slot" src="assets/img/' + name + '.jpg" alt="" draggable="false" onerror="this.remove()">';
  }
  function face(who) { return avatar(who) + slot('avatar-' + who); }

  /* code-drawn scene (js/art.js) as an <img>; paintArt() fills it in. '' when art.js is missing */
  function art(name, w, h, o) {
    if (!G.art) return '';
    return '<img data-art="' + G.esc(JSON.stringify([name, w, h, o || null])) + '" alt="" draggable="false">';
  }
  /* a scene takes 50–200 ms the first time (G.art.url caches it), so the screen shows first
   * and the pictures come in one per tick; the first one is drawn right away */
  function paintArt(el) {
    var todo = [].slice.call(el.querySelectorAll('img[data-art]'));
    (function next() {
      var im = todo.shift();
      if (!im) return;
      if (im.isConnected) {
        var a = JSON.parse(im.getAttribute('data-art'));
        im.src = G.art.url(a[0], a[1], a[2], a[3]);
        im.removeAttribute('data-art');
      }
      setTimeout(next, 16);
    })();
  }

  // 朋友圈的一张图没放时的样子。mode 'view' = 全屏（不裁）
  function fallback(p, mode) {
    var fb, px = ART_PX[p.ratio];
    if (p.fb === 'paper') fb = G.tornPaperSVG({ part: 'left', photo: true, fit: mode === 'view' ? '' : 'cover' });
    else fb = art(p.fb, px[0], px[1], p.fy == null ? null : { fit: 'cover', fy: p.fy });
    return '<span class="wxm-fb fb-' + (p.fb === 'paper' ? 'paper' : 'art') + (mode ? ' ' + mode : '') + '">' + fb + '</span>';
  }
  function pic(p) { return fallback(p) + slot('moments-' + p.n); }

  // 绿孔雀校徽（链接卡片缩略图）
  function emblem() {
    var s = '';
    for (var i = 0; i < 9; i++) {
      var a = (-160 + i * 17.5) * Math.PI / 180, x = 24 + Math.cos(a) * 13, y = 27 + Math.sin(a) * 13;
      s += '<path d="M24 27 L' + x.toFixed(1) + ' ' + y.toFixed(1) + '" stroke="#2f8f72" stroke-width="1"/>' +
        '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="2.6" ry="2" fill="#2f8f72" transform="rotate(' + (-160 + i * 17.5) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"/>' +
        '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r=".9" fill="#1d3f8f"/>';
    }
    return '<svg viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" fill="#eef4f1"/>' +
      '<circle cx="24" cy="24" r="19" fill="#fff" stroke="#1b6f6a" stroke-width="2"/><circle cx="24" cy="24" r="16" fill="none" stroke="#1b6f6a" stroke-width=".6"/>' +
      s + '<path d="M21 36 C19 32 20 28 22.5 26 C22 23 23 20.5 25 20.5 C26.6 20.5 26.8 22.6 25.4 23.6 C26.6 26 28 29.5 27 36 Z" fill="#1b6f6a"/></svg>';
  }

  var ICON = {
    back: '<svg viewBox="0 0 24 24"><path d="M15 4 7 12l8 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 7.5v9M7.5 12h9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="m15.5 15.5 4.5 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    chats: '<svg viewBox="0 0 28 28"><path d="M14 4C8 4 3.5 8 3.5 12.9c0 2.8 1.5 5.2 3.8 6.8L6.6 23l3.8-1.9c1.1.3 2.3.5 3.6.5 6 0 10.5-4 10.5-8.8S20 4 14 4z" fill="currentColor"/></svg>',
    contacts: '<svg viewBox="0 0 28 28"><circle cx="14" cy="10" r="5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M5 23.5c.8-4.6 4.4-7.5 9-7.5s8.2 2.9 9 7.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    discover: '<svg viewBox="0 0 28 28"><circle cx="14" cy="14" r="10" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="m17.8 10.2-2.2 5.4-5.4 2.2 2.2-5.4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    me: '<svg viewBox="0 0 28 28"><circle cx="14" cy="10.5" r="4.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M6 23.5c.6-4 3.8-6.5 8-6.5s7.4 2.5 8 6.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    more: '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.9" fill="currentColor"/><circle cx="12" cy="12" r="1.9" fill="currentColor"/><circle cx="19" cy="12" r="1.9" fill="currentColor"/></svg>',
    voice: '<svg viewBox="0 0 28 28"><circle cx="14" cy="14" r="11.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M11 10.5a5 5 0 0 1 0 7M14.2 8a8.6 8.6 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="9" cy="14" r="1.3" fill="currentColor"/></svg>',
    emoji: '<svg viewBox="0 0 28 28"><circle cx="14" cy="14" r="11.5" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="10.2" cy="11.5" r="1.3" fill="currentColor"/><circle cx="17.8" cy="11.5" r="1.3" fill="currentColor"/><path d="M9 16.2c1.2 2 3 3 5 3s3.8-1 5-3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    add: '<svg viewBox="0 0 28 28"><circle cx="14" cy="14" r="11.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M14 8.5v11M8.5 14h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    chev: '<svg class="wx-chev" viewBox="0 0 24 24"><path d="m9.5 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    // 朋友圈：六色光圈
    moments: '<svg class="wx-mo-ic" viewBox="0 0 24 24">' + ['#f6b12c', '#f0762e', '#e8484a', '#8e5bd6', '#3a8ce8', '#2fbf86'].map(function (c, i) {
      return '<circle cx="12" cy="12" r="7.6" fill="none" stroke="' + c + '" stroke-width="5.2" stroke-dasharray="7.96 39.8" transform="rotate(' + (i * 60 - 90) + ' 12 12)"/>';
    }).join('') + '</svg>'
  };

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

  function saveSheet(item) {
    G.ui.sheet('', [{ label: '存到备忘录', value: true }]).then(function (ok) {
      if (ok) { item.time = item.time || G.state.get('time', ''); G.memo.add(item); }
    });
  }

  function day(t) { return String(t || '').split(' ')[0]; }
  function preview(text) {
    var m;
    if ((m = text.match(RE_IMG))) return '[图片]';
    if ((m = text.match(RE_LINK))) return '[链接] ' + m[1];
    return text;
  }
  function homeBtn() { return '<button class="go-home" aria-label="返回主屏幕">← 返回主屏幕</button>'; }
  function unavailable() { G.audio.play('error'); G.ui.toast('功能暂不可用'); }

  /* ---------- 聊天列表 · 发现（params.tab === 'discover'） ---------- */
  G.screen('wx-list', {
    theme: 'light',
    mount: function (root, params) {
      var disc = params.tab === 'discover';
      var body;
      if (disc) {
        // 发现：只有朋友圈一行
        body = '<div class="wxl-body wxd-body"><button class="wxd-row">' + ICON.moments + '<span>朋友圈</span>' + ICON.chev + '</button></div>';
      } else {
        body = '<div class="wxl-body"><div class="wxl-sw"><button class="wxl-search">' + ICON.search + '<span>搜索</span></button></div>' +
          ORDER.map(function (who) {
            var c = CHATS[who], last = c.lines[c.lines.length - 1];
            var unread = !G.state.has('wx-read-' + who);
            return '<button class="wxl-row' + (c.pinned ? ' pinned' : '') + '" data-who="' + who + '">' +
              '<span class="wx-av">' + face(who) + (unread ? '<i class="wxl-dot" aria-label="未读"></i>' : '') + '</span>' +
              '<span class="wxl-main"><span class="wxl-top"><b>' + G.esc(c.name) + '</b><time>' + G.esc(day(last.time)) + '</time></span>' +
              '<span class="wxl-prev">' + G.esc(preview(last.text)) + '</span></span></button>';
          }).join('') + '</div>';
      }
      root.innerHTML =
        '<header class="wxl-head">' + homeBtn() + '<h1>' + (disc ? '发现' : '威信') + '</h1>' +
          (disc ? '<span></span>' : '<button class="wxl-plus" aria-label="更多">' + ICON.plus + '</button>') + '</header>' +
        body +
        '<nav class="wx-tabs">' +
          '<button' + (disc ? '' : ' class="on"') + ' data-tab="chats">' + ICON.chats + '<span>威信</span></button>' +
          '<button>' + ICON.contacts + '<span>通讯录</span></button>' +
          '<button' + (disc ? ' class="on"' : '') + ' data-tab="discover">' + ICON.discover + '<span>发现</span></button>' +
          '<button>' + ICON.me + '<span>我</span></button>' +
        '</nav>';
      root.querySelector('.go-home').onclick = function () { G.audio.play('tap'); G.show('home'); };
      root.querySelectorAll('.wxl-row').forEach(function (r) {
        r.onclick = function () { G.audio.play('tap'); G.show('wx-chat', { who: r.getAttribute('data-who') }); };
      });
      var mo = root.querySelector('.wxd-row');
      if (mo) mo.onclick = function () { G.audio.play('tap'); G.show('wx-moments', { from: 'discover' }); };
      root.querySelectorAll('.wx-tabs button').forEach(function (b) {
        var tab = b.getAttribute('data-tab');
        if (!tab) { b.onclick = unavailable; return; }
        if (b.classList.contains('on')) return;
        b.onclick = function () { G.audio.play('tap'); G.show('wx-list', tab === 'discover' ? { tab: 'discover' } : null); };
      });
      root.querySelectorAll('.wxl-plus, .wxl-search').forEach(function (b) { b.onclick = unavailable; });
    }
  });

  /* ---------- 聊天 ---------- */
  G.screen('wx-chat', {
    page: function (p) { return p.who === 'fang' ? 4 : 2; },
    theme: 'light',
    mount: function (root, params) {
      var who = params.who === 'fang' ? 'fang' : 'jie';
      var c = CHATS[who];
      G.state.flag('wx-read-' + who);

      var more = G.ui.el('<button class="wxc-more" aria-label="聊天信息">' + ICON.more + '</button>');
      root.appendChild(G.ui.bar(c.name, function () { G.show('wx-list'); }, { right: more }));
      var body = G.ui.el('<div class="wxc-body"></div>');
      root.appendChild(body);
      root.appendChild(G.ui.el('<div class="wxc-input" aria-disabled="true">' +
        '<span class="wxc-ic">' + ICON.voice + '</span><span class="wxc-field"></span>' +
        '<span class="wxc-ic">' + ICON.emoji + '</span><span class="wxc-ic">' + ICON.add + '</span></div>'));

      var prev = null;
      c.lines.forEach(function (ln, i) {
        if (ln.time !== prev) body.appendChild(G.ui.el('<div class="wxc-time">' + G.esc(ln.time) + '</div>'));
        prev = ln.time;
        var me = ln.who === '我';
        var m, content, kind = 'text';
        if ((m = ln.text.match(RE_IMG))) {
          kind = 'img';
          content = '<button class="wxc-img" aria-label="' + G.esc(m[1]) + '">' + G.tornPaperSVG({ photo: true, fit: 'cover' }) + '</button>';
        } else if ((m = ln.text.match(RE_LINK))) {
          kind = 'link';
          content = '<button class="wxc-link"><span class="wxc-link-t">' + G.esc(m[1]) + '</span>' +
            '<span class="wxc-link-row"><span class="wxc-link-d">' + G.esc(LINK_HOST) + '</span><span class="wxc-link-th">' + emblem() + '</span></span></button>';
        } else {
          content = '<div class="wxc-bubble">' + G.esc(ln.text) + '</div>';
        }
        var row = G.ui.el('<div class="wxc-msg ' + (me ? 'me' : 'them') + ' k-' + kind + '">' +
          '<button class="wx-av sm" data-who="' + (me ? 'me' : who) + '" aria-label="' + G.esc(ln.who) + '">' + face(me ? 'me' : who) + '</button>' +
          content + '</div>');
        body.appendChild(row);

        var target = row.querySelector('.wxc-bubble, .wxc-img, .wxc-link');
        hold(target, function () {
          saveSheet({ id: 'msg-' + who + '-' + i, title: ln.who + ' · ' + ln.time, text: ln.text });
        }, function () {
          if (kind === 'img') { G.audio.play('tap'); viewImage(root); }
          if (kind === 'link') { G.audio.play('tap'); G.state.flag('link'); G.show('web-school', { path: 'clubs' }); }
        });
      });

      if (who === 'jie') {
        body.querySelectorAll('.wx-av[data-who="jie"]').forEach(function (a) {
          a.onclick = function () { G.audio.play('tap'); profile(root); };
        });
        more.onclick = function () { G.audio.play('tap'); profile(root); };
        if (params.profile) profile(root, true); // 从朋友圈返回：资料卡还开着
      } else {
        more.onclick = unavailable;
      }

      body.scrollTop = body.scrollHeight;
      requestAnimationFrame(function () { body.scrollTop = body.scrollHeight; });
    }
  });

  /* 姐的资料卡：昵称和账号都是「月亮不属于我」 */
  function profile(root, still) {
    var c = CHATS.jie;
    var s = G.ui.el('<div class="wxp' + (still ? ' still' : '') + '" role="dialog" aria-label="资料"><div class="wxp-card">' +
      '<i class="wxp-grip"></i>' +
      '<div class="wxp-head"><span class="wx-av lg">' + face('jie') + '</span><div class="wxp-info">' +
        '<div class="wxp-name">' + G.esc(c.name) + '</div>' +
        '<div class="wxp-row"><span>昵称：</span>' + G.esc(c.nick) + '</div>' +
        '<div class="wxp-row"><span>账号：</span>' + G.esc(c.account) + '</div>' +
      '</div></div>' +
      // 朋友圈：最近的几张图，新的在前
      '<button class="wxp-mo"><span class="wxp-mo-k">朋友圈</span><span class="wxp-mo-th">' +
        MOMENTS.slice().reverse().map(function (p) { return '<span class="wxp-th">' + pic(p) + '</span>'; }).join('') +
      '</span>' + ICON.chev + '</button>' +
      '<button class="wxp-btn">存到备忘录</button>' +
      '</div></div>');
    root.appendChild(s);
    paintArt(s);
    function close() { s.classList.add('out'); setTimeout(function () { s.remove(); }, 200); }
    var item = { id: 'jie-profile', title: '姐 · 资料', text: '昵称：' + c.nick + '\n账号：' + c.account };
    s.onclick = function (e) { if (e.target === s) close(); };
    s.querySelector('.wxp-mo').onclick = function () { G.audio.play('tap'); G.show('wx-moments', { from: 'jie' }); };
    s.querySelector('.wxp-btn').onclick = function () { item.time = G.state.get('time', ''); G.memo.add(item); };
    hold(s.querySelector('.wxp-head'), function () { saveSheet(item); });
  }

  /* ---------- 姐的朋友圈（无页码）：从资料卡或「发现」进来，返回回到原处 ---------- */
  G.screen('wx-moments', {
    theme: 'dark',
    mount: function (root, params) {
      var c = CHATS.jie;
      var phone = document.querySelector('.phone');
      var posts = MOMENTS.slice().reverse(); // newest first
      root.innerHTML =
        '<header class="wxm-bar"><button class="wxm-back" aria-label="返回">' + ICON.back + '</button><b>朋友圈</b><span></span></header>' +
        '<div class="wxm-body">' +
          '<div class="wxm-top"><div class="wxm-cover">' + art('campus-night', 840, 624, { fit: 'cover', fy: 0.45 }) + slot('moments-cover') + '</div>' +
            '<div class="wxm-me"><b>' + G.esc(c.nick) + '</b><span class="wx-av">' + face('jie') + '</span></div></div>' +
          '<div class="wxm-list">' + posts.map(function (p) {
            return '<article class="wxm-post">' +
              '<span class="wx-av">' + face('jie') + '</span>' +
              '<div class="wxm-main"><b class="wxm-name">' + G.esc(c.nick) + '</b>' +
                (p.text ? '<p class="wxm-text">' + G.esc(p.text) + '</p>' : '') +
                '<button class="wxm-pic r-' + p.ratio + '" aria-label="图片">' + pic(p) + '</button>' +
                '<time>' + G.esc(p.date) + '</time></div></article>';
          }).join('') + '</div>' +
        '</div>';
      paintArt(root);

      root.querySelector('.wxm-back').onclick = function () {
        G.audio.play('tap');
        if (params.from === 'discover') G.show('wx-list', { tab: 'discover' });
        else G.show('wx-chat', { who: 'jie', profile: true });
      };

      // 顶栏：盖在封面上是透明的，滚过封面变成实色
      var body = root.querySelector('.wxm-body');
      var solid = false;
      body.addEventListener('scroll', function () {
        var s = body.scrollTop > root.querySelector('.wxm-cover').offsetHeight - 94;
        if (s === solid) return;
        solid = s;
        root.classList.toggle('solid', s);
        if (!root.querySelector('.wxm-viewer')) phone.setAttribute('data-theme', s ? 'light' : 'dark');
      });

      // 放了作者的图：框按图本身的比例（真朋友圈的单图就是这样），不裁掉她的图
      root.querySelectorAll('.wxm-pic .wx-slot').forEach(function (im) {
        function fit() {
          var box = im.parentNode;
          if (!box || !im.naturalWidth) return;
          var r = Math.min(2, Math.max(0.5, im.naturalWidth / im.naturalHeight));
          box.className = 'wxm-pic r-' + (r > 1.15 ? '3x2' : r < 0.87 ? '3x4' : '1x1');
          box.style.aspectRatio = String(r);
        }
        if (im.complete) fit(); else im.addEventListener('load', fit);
      });

      root.querySelectorAll('.wxm-post').forEach(function (el, i) {
        var p = posts[i];
        hold(el, function () {
          saveSheet({ id: 'moment-' + p.n, title: '姐 · 朋友圈 · ' + p.date, text: (p.text ? p.text + '\n' : '') + '［图片］' });
        }, function (e) {
          var box = e.target.closest('.wxm-pic');
          if (box) { G.audio.play('tap'); viewMoment(root, p, box); }
        });
      });
    }
  });

  /* 朋友圈的图：全屏看。放了作者的图就看图，没放就看 fallback */
  function viewMoment(root, p, box) {
    var phone = document.querySelector('.phone');
    var im = box.querySelector('.wx-slot');
    var inner = im && im.complete && im.naturalWidth
      ? '<img class="wxm-full" src="' + G.esc(im.getAttribute('src')) + '" alt="" draggable="false">'
      : fallback(p, 'view');
    var v = G.ui.el('<div class="wxm-viewer" role="dialog" aria-label="图片">' + inner + '</div>');
    root.appendChild(v);
    paintArt(v);
    phone.setAttribute('data-theme', 'dark');
    v.onclick = function () {
      phone.setAttribute('data-theme', root.classList.contains('solid') ? 'light' : 'dark');
      v.classList.add('out');
      setTimeout(function () { v.remove(); }, 200);
    };
  }

  /* 点开图片：全屏看 */
  function viewImage(root) {
    var phone = document.querySelector('.phone');
    var v = G.ui.el('<div class="wxc-viewer" role="dialog" aria-label="图片">' + G.tornPaperSVG({ photo: true }) + '</div>');
    root.appendChild(v);
    phone.setAttribute('data-theme', 'dark');
    v.onclick = function () {
      phone.setAttribute('data-theme', 'light');
      v.classList.add('out');
      setTimeout(function () { v.remove(); }, 200);
    };
  }
})();
