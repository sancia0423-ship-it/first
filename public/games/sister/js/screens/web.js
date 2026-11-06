/* 浏览器 · 05 学校官网 · 06 隐藏入口 · 07 活动预告 · 09 校史
 * 剧情文字只取自 ../storyboard/data.js（v6）：s05、s06、s07、s09 和「学校：圣玛利亚女子中学」一节。
 * 新闻标题、社团介绍、栏目、页脚等是普通学校网站的填充文字，不带出任何剧情信息。
 */
(function () {
  'use strict';

  var esc = G.esc;

  /* ---------- 剧情文字（data.js v6） ---------- */
  var SCHOOL = '圣玛利亚女子中学';
  var SCHOOL_EN = "St. Maria's Girls' School";
  var MOTTO = '以奉献之心，见永恒之光。';
  var EMBLEM = '校徽为一只展开尾羽的绿孔雀。';
  var HISTORY_LINES = [ // s09 lines
    '学校依山而建，山脚附近有一座小动物园。多年前，学校为了辅助生物教学，购买过几只孔雀和其他动物。',
    '动物园后已停用，所余动物由管理员定期照料。'
  ];
  var HISTORY_STORY = [ // s09 story
    '不知什么原因，动物园后来被废弃了。',
    '学校没有彻底处理这些动物，只安排管理员偶尔过去喂食。',
    '这里逐渐变成了一处被遗忘的角落。',
    '妹妹决定提前去，躲起来，看看这个组织究竟在做什么。'
  ];
  var EVENT = '活动预告｜2024年10月28日 00:00｜地点：旧动物园（山脚）｜请按时到达，携带必要物品。'.split('｜'); // s07
  var EVENT_AFTER = ['活动时间是周日晚上十二点，而那一天，学校里几乎没有人。']; // s07 story
  var GATE_TITLE = '校内组织 · 内部系统'; // s06
  var ACCOUNT = '月亮不属于我';
  var PASSCODE = '20060417';

  var DOMAIN = 'stmaria-gs.edu.cn';
  var INTERNAL = DOMAIN + '/internal/';
  var PEACOCK_ACT = 'a5';

  /* ---------- 普通网站填充文字 ---------- */
  var MENU = [
    ['about', '学校概况'], ['teaching', '教育教学'], ['admission', '招生'], ['library', '图书馆'],
    ['chaplain', '校牧室'], ['clubs', '社团活动'], ['life', '校园生活'], ['alumni', '校友']
  ];
  var UTIL = [['life', '在校生'], ['teaching', '教职员工'], ['alumni', '校友'], ['about', '访客']];

  var NEWS = [
    { id: 'n1', date: '2024-10-25', title: '我校举行 2024 年秋季运动会', body: '10 月 25 日，我校 2024 年秋季运动会在学校运动场举行。各年级同学参加了田径、跳绳和接力等项目的比赛。' },
    { id: 'n2', date: '2024-10-18', title: '圣诗合唱团在区中学生合唱比赛中获奖', body: '在近日举行的区中学生合唱比赛中，我校圣诗合唱团获得一等奖。' },
    { id: 'n3', date: '2024-10-15', title: '图书馆“书香校园”阅读月活动启动', body: '本月图书馆举办阅读月活动，包括好书推荐、读书分享和书签设计等内容，欢迎同学们参加。' },
    { id: 'n4', date: '2024-10-11', title: '我校举办秋季学期教学开放周', body: '开放周期间，各学科开设公开课，邀请家长走进课堂。' },
    { id: 'n5', date: '2024-09-30', title: '各班开展国庆假期安全教育主题班会', body: '假期前，各班召开安全教育主题班会，提醒同学们注意交通、用电和饮食安全。' },
    { id: 'n6', date: '2024-09-13', title: '2024 年秋季社团招新顺利结束', body: '本学期社团招新已经结束，各社团将陆续开展常规活动。' },
    { id: 'n7', date: '2024-09-02', title: '2024—2025 学年秋季开学典礼举行', body: '9 月 2 日上午，全校师生在运动场举行开学典礼。' }
  ];
  var NOTICES = [
    { id: 't1', date: '2024-10-24', title: '关于秋季运动会期间调整作息时间的通知', body: '运动会当天（10 月 25 日）上午不安排课程，下午按正常课表上课。' },
    { id: 't2', date: '2024-10-21', title: '图书馆借阅系统维护公告', body: '因系统维护，图书馆借阅系统将于 10 月 22 日暂停服务一天，敬请谅解。' },
    { id: 't3', date: '2024-10-16', title: '关于开展校园消防安全演练的通知', body: '学校将于近期开展消防安全演练，请各班提前熟悉疏散路线。' },
    { id: 't4', date: '2024-10-08', title: '2024 年秋季学期期中考试安排', body: '期中考试安排在 11 月上旬，具体时间以各年级通知为准。' },
    { id: 't5', date: '2024-09-27', title: '2024 年国庆节放假安排', body: '10 月 1 日至 10 月 7 日放假，请同学们注意假期安全。' }
  ];

  var CLUBS = [
    { name: '圣诗合唱团', ic: 'note', intro: '以圣诗和中外合唱作品为主，每学期举办一次音乐会。', time: '每周二、四 16:40', place: '小礼拜堂' },
    { name: '文学社', ic: 'book', intro: '读书、写作与分享，每学期编印一期社刊。', time: '每周三 16:40', place: '图书馆二楼' },
    { name: '美术社', ic: 'brush', intro: '素描、水彩与写生，每年秋季举办作品展。', time: '每周一 16:40', place: '艺术楼 302' },
    { name: '英语戏剧社', ic: 'mask', intro: '排演英语短剧，参加校园艺术节演出。', time: '每周五 16:40', place: '艺术楼小剧场' },
    { name: '摄影社', ic: 'camera', intro: '学习摄影基础知识，记录校园四季。', time: '每周四 16:40', place: '艺术楼 105' },
    { name: '志愿服务队', ic: 'heart', intro: '参与校内外志愿服务，定期组织公益活动。', time: '每月第二周周六', place: '学生活动中心' }
  ];

  /* 旧活动。a5 排第一，海报下方是那只孔雀（s05）。head 里的 \n 是海报上的换行。 */
  var ACTS = [
    { id: 'a5', date: '2023-10-14', views: 127, title: '合唱团社团交流会', poster: 'plain', tags: ['孔雀', '羽毛'],
      top: '', head: '合唱团\n社团交流会', sub: '欢迎参加', foot: ['2023.10.14 星期六'],
      body: '本次活动已结束，感谢参与。' },
    { id: 'a1', date: '2024-06-14', views: 486, title: '圣诗合唱团夏季音乐会', poster: 'concert',
      top: '圣诗合唱团', head: '夏季音乐会', sub: 'SUMMER CONCERT', foot: ['2024.06.14 星期五 16:30', '小礼拜堂'],
      body: '6 月 14 日下午，圣诗合唱团在小礼拜堂举行夏季音乐会，演唱了多首中外合唱作品。' },
    { id: 'a2', date: '2024-04-19', views: 302, title: '文学社春日读书会', poster: 'reading',
      top: '文学社', head: '春日读书会', sub: 'READING CLUB', foot: ['2024.04.19 星期五 16:40', '图书馆二楼'],
      body: '读书会上，社员们分享了本学期读过的书，并交流了阅读心得。' },
    { id: 'a3', date: '2023-12-20', views: 655, title: '圣诞报佳音活动', poster: 'carol',
      top: '圣诗合唱团 · 志愿服务队', head: '圣诞报佳音', sub: 'CHRISTMAS CAROLING', foot: ['2023.12.20 星期三', '校园各处'],
      body: '圣诞节前夕，圣诗合唱团与志愿服务队在校园各处报佳音。' },
    { id: 'a4', date: '2023-11-17', views: 391, title: '美术社秋季写生作品展', poster: 'art',
      top: '美术社', head: '秋季写生作品展', sub: 'AUTUMN SKETCHES', foot: ['2023.11.17 — 11.24', '艺术楼一楼展厅'],
      body: '本次作品展展出了美术社社员秋季写生的水彩和素描作品。' },
    { id: 'a6', date: '2023-09-15', views: 418, title: '英语戏剧社秋季招新', poster: 'drama',
      top: '英语戏剧社', head: '秋季招新', sub: 'DRAMA CLUB', foot: ['2023.09.15 星期五 16:40', '艺术楼小剧场'],
      body: '英语戏剧社欢迎对表演、剧本和舞台设计感兴趣的同学加入。' }
  ];

  var LAWS = [
    { n: '一', law: '神爱你，并且为你的一生有奇妙的计划。', verse: '神爱世人，甚至将他的独生子赐给他们，叫一切信他的，不至灭亡，反得永生。', ref: '约翰福音 3:16' },
    { n: '二', law: '人有罪，与神隔绝。', verse: '因为世人都犯了罪，亏缺了神的荣耀。', ref: '罗马书 3:23' },
    { n: '三', law: '耶稣基督是神为人类的罪所预备的唯一出路。', verse: '惟有基督在我们还作罪人的时候为我们死，神的爱就在此向我们显明了。', ref: '罗马书 5:8' },
    { n: '四', law: '我们必须个别地接受耶稣基督为救主。', verse: '凡接待他的，就是信他名的人，他就赐他们权柄，作神的儿女。', ref: '约翰福音 1:12' }
  ];

  /* ---------- 图形 ---------- */
  function svg(vb, body, cls) {
    return '<svg' + (cls ? ' class="' + cls + '"' : '') + ' viewBox="' + vb + '" aria-hidden="true">' + body + '</svg>';
  }
  function stroke(d, w) {
    return '<path d="' + d + '" fill="none" stroke="currentColor" stroke-width="' + (w || 1.8) + '" stroke-linecap="round" stroke-linejoin="round"/>';
  }
  var IC = {
    back: svg('0 0 24 24', stroke('M15 5l-7 7 7 7', 2.2)),
    lock: svg('0 0 24 24', '<rect x="5.5" y="10.5" width="13" height="9.5" rx="2" fill="currentColor"/>' + stroke('M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5', 1.9)),
    book: svg('0 0 24 24', stroke('M6 3.5h12v17l-6-4-6 4z')),
    search: svg('0 0 24 24', '<circle cx="10.5" cy="10.5" r="6.2" fill="none" stroke="currentColor" stroke-width="2"/>' + stroke('M15.3 15.3L20 20', 2)),
    menu: svg('0 0 24 24', stroke('M4 7h16M4 12h16M4 17h16', 2)),
    close: svg('0 0 24 24', stroke('M6 6l12 12M18 6L6 18', 2)),
    chev: svg('0 0 24 24', stroke('M9.5 6l6 6-6 6', 1.8)),
    user: svg('0 0 24 24', '<circle cx="12" cy="8.5" r="3.8" fill="none" stroke="currentColor" stroke-width="1.5"/>' + stroke('M4.8 20a7.2 7.2 0 0 1 14.4 0', 1.5)),
    key: svg('0 0 24 24', '<rect x="5" y="10.5" width="14" height="9.5" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/>' + stroke('M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5M12 14v2.5', 1.5)),
    arrow: svg('0 0 24 24', stroke('M5 12h13M13 6.5l5.5 5.5-5.5 5.5', 1.8)),
    check: svg('0 0 24 24', stroke('M5 12.5l4.5 4.5L19 7.5', 1.8))
  };
  var QUICK = {
    about: stroke('M3 20.5h18M5 20.5V9.5L12 4.5l7 5v11M9.5 20.5v-5h5v5'),
    teaching: stroke('M3 5.5h6a3 3 0 0 1 3 3V20a2.5 2.5 0 0 0-2.5-2.5H3zM21 5.5h-6a3 3 0 0 0-3 3V20a2.5 2.5 0 0 1 2.5-2.5H21z'),
    admission: stroke('M2.5 9.5L12 5l9.5 4.5L12 14zM6.5 11.5v4.5c3 2.2 8 2.2 11 0v-4.5M21.5 9.5v5'),
    library: stroke('M4.5 4.5h4v15h-4zM10.5 4.5h4v15h-4zM16 5.6l3.3-.8 3 14.3-3.3.8'),
    chaplain: stroke('M12 3v18M7 8.5h10'),
    clubs: stroke('M5.5 21V4M5.5 4.5h12l-2.5 4 2.5 4h-12'),
    life: stroke('M4 10h13v3.5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6zM17 11h1.5a2.5 2.5 0 0 1 0 5H17M8.5 3.5v3.5M12.5 3.5v3.5'),
    alumni: stroke('M9 11a3.4 3.4 0 1 0 0-6.8A3.4 3.4 0 0 0 9 11zM2.5 20a6.5 6.5 0 0 1 13 0M15.5 4.6a3.4 3.4 0 0 1 0 6.3M17.8 14a6.5 6.5 0 0 1 3.7 6')
  };
  var CLUB_IC = {
    note: stroke('M9 18V6l10-2v12M9 18a2.5 2.5 0 1 1-2.5-2.5A2.5 2.5 0 0 1 9 18zM19 16a2.5 2.5 0 1 1-2.5-2.5A2.5 2.5 0 0 1 19 16zM9 9.5l10-2'),
    book: QUICK.teaching,
    brush: stroke('M14.5 4.5l5 5-8 8-5-5zM6.5 12.5c-2 1-2.5 3-2.5 7 4 0 6-.5 7-2.5'),
    mask: stroke('M4 5c5 2 11 2 16 0v6.5a8 8 0 0 1-16 0zM8.5 10.5h2M13.5 10.5h2M9 14.5c1.8 1.6 4.2 1.6 6 0'),
    camera: stroke('M3.5 8h4l1.5-2.5h6L16.5 8h4v11h-17zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z'),
    heart: stroke('M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z')
  };

  /** 校徽：一只展开尾羽的绿孔雀（正式、实心、对称）。 */
  function emblemSVG(cls) {
    var tail = '';
    for (var a = -75; a <= 75; a += 15) {
      tail += '<g transform="rotate(' + a + ' 50 66)">' +
        '<path d="M50 66C46.6 52 46.2 40 50 29.5 53.8 40 53.4 52 50 66z" fill="#2f8a66"/>' +
        '<circle cx="50" cy="33.5" r="4.4" fill="#c9a43a"/><circle cx="50" cy="33.5" r="2.9" fill="#1d7468"/>' +
        '<circle cx="50" cy="33.5" r="1.5" fill="#22378a"/></g>';
    }
    return svg('0 0 100 100',
      '<circle cx="50" cy="50" r="49" fill="#fff"/>' +
      '<circle cx="50" cy="50" r="46.5" fill="none" stroke="#1b6f5a" stroke-width="2.2"/>' +
      '<circle cx="50" cy="50" r="43" fill="none" stroke="#1b6f5a" stroke-width=".7"/>' + tail +
      '<path d="M50 45.5c-2.6 0-3.6 3.4-3 6.6-3.8 3.4-5.2 9.4-3.4 14.2 1.4 3.8 3.6 5.4 6.4 5.4s5-1.6 6.4-5.4c1.8-4.8.4-10.8-3.4-14.2.6-3.2-.4-6.6-3-6.6z" fill="#17614f"/>' +
      '<circle cx="50" cy="43.6" r="3" fill="#17614f"/><path d="M52.6 43.4l2.4.8-2.4.8z" fill="#c9a43a"/>' +
      '<path d="M50 40.6V36.5M48.4 41l-1.7-3.8M51.6 41l1.7-3.8" stroke="#17614f" stroke-width=".8"/>' +
      '<circle cx="50" cy="36.3" r="1" fill="#c9a43a"/><circle cx="46.6" cy="37" r="1" fill="#c9a43a"/><circle cx="53.4" cy="37" r="1" fill="#c9a43a"/>' +
      '<path d="M40 80.5h20" stroke="#1b6f5a" stroke-width="1.2"/>', cls || 'wb-emblem');
  }

  /** 钢笔画的孔雀（和那张纸上一样）。paper：底色，用来遮住身后的羽轴。 */
  var JIT = [0.8, -1.2, 0.4, 1.4, -0.6, -1.5, 0.9, 0.2, -0.9, 1.1, -0.3, 1.3, -1.1, 0.6, -0.7];
  function inkPeacockSVG(paper) {
    var g = '';
    var n = 15;
    for (var i = 0; i < n; i++) {
      var a = -104 + i * (208 / (n - 1)) + JIT[i];
      var len = 35 + (i % 2 ? -3.5 : 0) + JIT[(i + 4) % n];
      var tip = 60 - len;
      g += '<g transform="rotate(' + a.toFixed(1) + ' 50 60)">' +
        '<path d="M50 52L50 ' + (tip + 9).toFixed(1) + '"/>' +
        '<path d="M50 ' + tip.toFixed(1) + 'c-3.3 2.2-3.7 7.2 0 10.2 3.7-3 3.3-8 0-10.2z"/>' +
        '<path d="M48.6 ' + (tip + 13).toFixed(1) + 'l-2.2-1.6M51.4 ' + (tip + 13).toFixed(1) + 'l2.2-1.6M48.8 ' + (tip + 17).toFixed(1) + 'l-1.8-1.3M51.2 ' + (tip + 17).toFixed(1) + 'l1.8-1.3" stroke-width=".7"/>' +
        '<circle cx="50" cy="' + (tip + 5.4).toFixed(1) + '" r="1.35" fill="currentColor" stroke="none"/></g>';
    }
    var p = paper || '#ebe5d6';
    return svg('0 0 100 100',
      '<g fill="none" stroke="currentColor" stroke-width="1.05" stroke-linecap="round" stroke-linejoin="round">' + g +
      '<path d="M50 41.5c-2.4 0-3.3 3.1-2.7 6-3.6 3.2-5 8.8-3.2 13.6 1.5 4 3.5 5.5 5.9 5.5s4.4-1.5 5.9-5.5c1.8-4.8.4-10.4-3.2-13.6.6-2.9-.3-6-2.7-6z" fill="' + p + '"/>' +
      '<path d="M47.6 52.5c1.4 1.2 3.4 1.2 4.8 0M46.8 57c2 1.5 4.4 1.5 6.4 0" stroke-width=".7"/>' +
      '<circle cx="50" cy="39" r="2.6" fill="' + p + '"/><circle cx="50.9" cy="38.6" r=".5" fill="currentColor" stroke="none"/>' +
      '<path d="M52.4 39.2l2 .6-2 .5"/>' +
      '<path d="M50 36.4V32.2M48.5 36.8l-1.7-3.9M51.5 36.8l1.7-3.9" stroke-width=".7"/>' +
      '<circle cx="50" cy="31.8" r=".85" fill="currentColor" stroke="none"/><circle cx="46.7" cy="32.6" r=".85" fill="currentColor" stroke="none"/><circle cx="53.3" cy="32.6" r=".85" fill="currentColor" stroke="none"/>' +
      '<path d="M48.2 66.4l-1 7.4M51.8 66.4l1 7.4M44.4 74.2h5.2M50.4 74.2h5.2"/>' +
      '<path d="M38 77.5c8-1.4 16-1.4 24 0" stroke-width=".7"/></g>', 'ink-peacock');
  }

  /* 和相册里那张纸保持一致：从 A 的 G.tornPaperSVG 里只取孔雀那几笔（不带纸、不带数字），
   * 拼成整只（纸上撕开了，海报上是完整的）。取不到就用自己画的钢笔孔雀。 */
  function posterPeacock(paper) {
    if (typeof G.tornPaperSVG === 'function') {
      try {
        var s = G.tornPaperSVG({ part: 'whole' });
        var mask = s.match(/<mask id="[^"]+"[\s\S]*?<\/mask>/);
        var ink = s.match(/<filter id="[^"]*ink"[\s\S]*?<\/filter>/);
        var g = s.match(/(<g fill="none" stroke="[^"]*"[^>]*>)([\s\S]*?)<g stroke-width="2\.4">/);
        if (mask && g && g[2].indexOf('<text') < 0) {
          return '<svg class="ink-peacock from-paper" viewBox="44 74 342 276" aria-hidden="true"><defs>' + mask[0] + (ink ? ink[0] : '') +
            '</defs>' + g[1] + g[2] + '</g></svg>';
        }
      } catch (e) { /* fall through */ }
    }
    return inkPeacockSVG(paper);
  }

  /** 社徽：一根绿色的孔雀羽毛，里面有一只眼睛。 */
  var uid = 0;
  var VANE = 'M30 6C46 16 50 36 45.5 58 41.5 76 35 92 31 116h-2C25 92 18.5 76 14.5 58 10 36 14 16 30 6z';
  function featherEyeSVG(cls) {
    var id = 'wbf' + (++uid);
    var barbs = '';
    for (var y = 12; y <= 112; y += 2.4) {
      var t = (y - 6) / 110;
      var w = 20 * Math.sin(Math.PI * Math.min(1, 0.12 + t * 1.05));
      barbs += 'M30 ' + y.toFixed(1) + 'Q' + (30 - w * 0.55).toFixed(1) + ' ' + (y - 2.6).toFixed(1) + ' ' + (30 - w).toFixed(1) + ' ' + (y - 6.5).toFixed(1) +
        'M30 ' + y.toFixed(1) + 'Q' + (30 + w * 0.55).toFixed(1) + ' ' + (y - 2.6).toFixed(1) + ' ' + (30 + w).toFixed(1) + ' ' + (y - 6.5).toFixed(1);
    }
    return svg('0 0 60 124',
      '<defs><clipPath id="' + id + 'c"><path d="' + VANE + '"/></clipPath>' +
      '<radialGradient id="' + id + 'g" cx="50%" cy="26%" r="75%"><stop offset="0" stop-color="#2c9c78"/>' +
      '<stop offset=".5" stop-color="#145a4c"/><stop offset="1" stop-color="#08221f"/></radialGradient></defs>' +
      '<path d="' + VANE + '" fill="url(#' + id + 'g)"/>' +
      '<path d="' + barbs + '" clip-path="url(#' + id + 'c)" fill="none" stroke="#8fe0be" stroke-opacity=".26" stroke-width=".45"/>' +
      '<path d="M30 121C30.6 96 30.4 60 30 12" fill="none" stroke="#a9d3bd" stroke-width=".8" opacity=".55"/>' +
      '<ellipse cx="30" cy="33" rx="12.5" ry="15" fill="#a9843a" opacity=".92"/>' +
      '<ellipse cx="30" cy="33" rx="10" ry="12.2" fill="#1d7d61"/>' +
      '<path d="M19.5 33Q30 23 40.5 33 30 43 19.5 33z" fill="#0b1846"/>' +
      '<circle class="fe-iris" cx="30" cy="33" r="5" fill="#2a46a6"/>' +
      '<ellipse class="fe-pupil" cx="30" cy="33" rx="1.3" ry="3.7" fill="#020308"/>' +
      '<circle cx="31.8" cy="31.2" r=".8" fill="#fff" opacity=".75"/>', cls || 'feather-eye');
  }

  /* ---------- 小工具 ---------- */
  function el(html) { return G.ui.el(html); }
  function day(d) { return d.slice(8); }
  function ym(d) { return d.slice(0, 7); }
  function find(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  /** 图片位：作者以后放 assets/img/<name>.jpg（同名覆盖）。没有这个文件时换成 G.art 画的场景 art，外层加 .fb。 */
  function slot(name, art) {
    return '<img class="wb-slot" src="assets/img/' + name + '.jpg" alt="" ' +
      'onerror="this.onerror=null;this.parentNode.classList.add(\'fb\');if(window.G&&G.art)this.src=G.art.url(\'' + art + '\')">';
  }
  function fine() { return window.matchMedia && window.matchMedia('(pointer: fine)').matches; }
  /** 长按 → 存到备忘录（"记录"玩法）。 */
  function memoOnLongPress(node, item) {
    G.longPress(node, function () {
      G.ui.sheet(item.title, [{ label: '存到备忘录', value: 'save' }]).then(function (v) {
        if (v === 'save') G.memo.add(item);
      });
    });
  }

  /** 浏览器顶栏：返回、地址栏、书签。 */
  function chrome(url, onBack, dark) {
    var c = el('<div class="wb-chrome' + (dark ? ' dark' : '') + '">' +
      '<button class="wb-cbtn wb-cback" aria-label="返回">' + IC.back + '</button>' +
      '<div class="wb-url">' + IC.lock + '<span>' + esc(url) + '</span></div>' +
      '<button class="wb-cbtn wb-cbook" aria-label="书签">' + IC.book + '</button>' +
      '<i class="wb-progress"></i></div>');
    c.querySelector('.wb-cback').onclick = function () { G.audio.play('tap'); onBack(); };
    c.querySelector('.wb-cbook').onclick = function () { G.audio.play('tap'); G.show('browser'); };
    return c;
  }

  /* =====================================================================
   * 浏览器 · 书签
   * ===================================================================== */
  G.screen('browser', {
    theme: 'light',
    mount: function (root) {
      var marks = [];
      if (G.state.has('link') || G.reached() >= 5) {
        marks.push({ key: 'school', title: SCHOOL, url: DOMAIN + '/clubs/', icon: '<span class="br-fav">' + emblemSVG() + '</span>' });
      }
      if (G.state.has('gate')) {
        marks.push({ key: 'internal', title: GATE_TITLE, url: INTERNAL, icon: '<span class="br-fav dark">' + featherEyeSVG() + '</span>' });
      }
      var list = marks.length
        ? '<div class="br-list">' + marks.map(function (m) {
          return '<button class="br-item" data-mark="' + m.key + '">' + m.icon +
            '<span class="br-text"><span class="br-title">' + esc(m.title) + '</span><span class="br-link">' + esc(m.url) + '</span></span>' +
            '<span class="br-chev">' + IC.chev + '</span></button>';
        }).join('') + '</div>'
        : '<div class="br-empty">' + IC.book + '<p>' + esc('还没有书签') + '</p><small>' + esc('收藏的网页会显示在这里') + '</small></div>';

      root.innerHTML =
        '<div class="br-top">' +
          '<button class="br-back" aria-label="返回主屏">' + IC.back + '</button>' +
          '<button class="br-url">' + IC.search + '<span>' + esc('搜索或输入网址') + '</span></button>' +
        '</div>' +
        '<div class="br-body">' +
          '<h1 class="br-h">' + esc('书签') + '</h1>' + list +
        '</div>';

      root.querySelector('.br-back').onclick = function () { G.audio.play('tap'); G.show('home'); };
      root.querySelector('.br-url').onclick = function () { G.ui.toast('请从书签打开网页'); };
      root.querySelectorAll('.br-item').forEach(function (b) {
        b.onclick = function () {
          G.audio.play('tap');
          if (b.getAttribute('data-mark') === 'school') G.show('web-school', { path: 'clubs' });
          else G.show('web-event');
        };
      });
    }
  });

  /* =====================================================================
   * 05 / 09 学校官网
   * ===================================================================== */
  var hist = [];        // 站内后退记录
  var navigating = false;
  var here = null;

  function go(p) {
    G.audio.play('tap');
    if (here) hist.push(here);
    navigating = true;
    G.show('web-school', p);
  }
  function back() {
    if (hist.length) { navigating = true; G.show('web-school', hist.pop()); }
    else G.show('browser');
  }

  var URLS = {
    home: '/', clubs: '/clubs/', about: '/about/', history: '/about/history.html', chaplain: '/chaplaincy/',
    teaching: '/teaching/', admission: '/admission/', library: '/library/', life: '/campus-life/', alumni: '/alumni/',
    news: '/news/', notices: '/notices/'
  };
  function urlFor(p) {
    if (p.path === 'activity') {
      var a = find(ACTS, p.id) || ACTS[0];
      return DOMAIN + '/clubs/archive/' + a.date.replace(/-/g, '') + '.html';
    }
    if (p.path === 'article') return DOMAIN + '/news/' + (p.id || '') + '.html';
    if (p.path === 'search') return DOMAIN + '/search?q=' + (p.q || '');
    return DOMAIN + (URLS[p.path] || '/');
  }

  /* --- 公共结构 --- */
  function header() {
    return '<div class="wb-util">' + UTIL.map(function (u) {
      return '<button data-go="' + u[0] + '">' + esc(u[1]) + '</button>';
    }).join('<i></i>') + '</div>' +
      '<header class="wb-head">' +
        '<div class="wb-brand">' +
          '<button class="wb-logo" data-go="home" aria-label="' + esc(SCHOOL) + ' 首页">' + emblemSVG() +
            '<span class="wb-name"><b>' + esc(SCHOOL) + '</b><small>' + esc(SCHOOL_EN) + '</small></span></button>' +
          '<button class="wb-burger" aria-label="栏目">' + IC.menu + '</button>' +
        '</div>' +
        searchForm('', 'wb-search') +
      '</header>';
  }
  function searchForm(q, cls) {
    return '<form class="' + cls + '" role="search" autocomplete="off">' +
      '<span class="wb-sicon">' + IC.search + '</span>' +
      '<input type="search" name="q" value="' + esc(q) + '" placeholder="' + esc('搜索本站') + '" enterkeyhint="search" maxlength="40" aria-label="站内搜索">' +
      '<button type="submit">' + esc('搜索') + '</button></form>';
  }
  function footer() {
    return '<footer class="wb-foot">' +
      '<div class="wb-foot-brand">' + emblemSVG() + '<span><b>' + esc(SCHOOL) + '</b><small>' + esc(SCHOOL_EN) + '</small></span></div>' +
      '<nav class="wb-sitemap">' + MENU.map(function (m) {
        return '<button data-go="' + m[0] + '">' + esc(m[1]) + '</button>';
      }).join('') + '</nav>' +
      '<p>' + esc('校址：圣玛利亚路 1 号') + '</p>' +
      '<p>' + esc('© 2024 ' + SCHOOL + ' 版权所有') + '</p>' +
      '<p class="wb-fiction">' + esc('本故事纯属虚构') + '</p>' +
    '</footer>';
  }
  function menuOverlay() {
    return '<div class="wb-menu" hidden><div class="wb-menu-card">' +
      '<div class="wb-menu-h"><span>' + esc('栏目导航') + '</span><button class="wb-menu-x" aria-label="关闭">' + IC.close + '</button></div>' +
      [['home', '首页']].concat(MENU).map(function (m) {
        return '<button class="wb-menu-i" data-go="' + m[0] + '">' + esc(m[1]) + IC.chev + '</button>';
      }).join('') + '</div></div>';
  }
  function crumb(items) {
    return '<nav class="wb-crumb">' + esc('当前位置：') + items.map(function (it, i) {
      var last = i === items.length - 1;
      return last || !it[0] ? '<span>' + esc(it[1]) + '</span>' : '<button data-go="' + it[0] + '">' + esc(it[1]) + '</button>';
    }).join('<i>›</i>') + '</nav>';
  }
  function pageHead(title, en) {
    return '<div class="wb-ph"><h1>' + esc(title) + '</h1><small>' + esc(en) + '</small></div>';
  }
  function secHead(title, morePath) {
    return '<div class="wb-sh"><h2>' + esc(title) + '</h2>' +
      (morePath ? '<button data-go="' + morePath + '">' + esc('更多') + ' ›</button>' : '') + '</div>';
  }
  function rows(list) {
    return '<dl class="wb-rows">' + list.map(function (r) {
      return '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>';
    }).join('') + '</dl>';
  }
  function newsItem(n) {
    return '<button class="wb-news" data-go="article" data-id="' + n.id + '">' +
      '<span class="wb-date"><b>' + esc(day(n.date)) + '</b><small>' + esc(ym(n.date)) + '</small></span>' +
      '<span class="wb-news-t">' + esc(n.title) + '</span></button>';
  }
  function noticeItem(n) {
    return '<button class="wb-notice" data-go="article" data-id="' + n.id + '">' +
      '<span>' + esc(n.title) + '</span><small>' + esc(n.date) + '</small></button>';
  }

  /* --- 海报（container query 单位，缩略图和详情页共用一套） --- */
  var MOTIF = {
    concert: svg('0 0 120 60', '<g fill="none" stroke="currentColor" stroke-width=".9" opacity=".55">' +
      '<path d="M0 18h120M0 24h120M0 30h120M0 36h120M0 42h120"/></g>' +
      '<g fill="currentColor"><ellipse cx="22" cy="40" rx="4.2" ry="3" transform="rotate(-20 22 40)"/><path d="M25.6 39V14h1.2v25z"/>' +
      '<ellipse cx="52" cy="34" rx="4.2" ry="3" transform="rotate(-20 52 34)"/><ellipse cx="68" cy="28" rx="4.2" ry="3" transform="rotate(-20 68 28)"/>' +
      '<path d="M55.6 33V10h1.2v23zM71.6 27V6h1.2v21zM55.6 10l17.2-4v3.2l-17.2 4z"/>' +
      '<ellipse cx="98" cy="22" rx="4.2" ry="3" transform="rotate(-20 98 22)"/><path d="M101.6 21V2h1.2v19zM102.8 2c3 3 6 5 4 11 0-4-2-6-4-7z"/></g>'),
    reading: svg('0 0 120 70', '<g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">' +
      '<path d="M60 18C46 10 28 10 14 14v44c14-4 32-4 46 4 14-8 32-8 46-4V14C92 10 74 10 60 18zM60 18v44"/>' +
      '<path d="M22 24c10-2 20-2 30 2M22 32c10-2 20-2 30 2M22 40c10-2 20-2 30 2M68 26c10-4 20-4 30-2M68 34c10-4 20-4 30-2M68 42c10-4 20-4 30-2" stroke-width=".9" opacity=".6"/></g>' +
      '<path d="M86 2c4 6 4 10 0 16-4-6-4-10 0-16z" fill="currentColor" opacity=".5"/>'),
    carol: svg('0 0 120 80', '<g fill="currentColor"><path d="M60 4l4.4 13.6H79L67.3 26l4.4 13.6L60 31.2 48.3 39.6 52.7 26 41 17.6h14.6z"/>' +
      '<circle cx="18" cy="14" r="1.2"/><circle cx="104" cy="10" r="1.4"/><circle cx="96" cy="40" r="1"/><circle cx="26" cy="46" r="1"/><circle cx="10" cy="30" r=".8"/><circle cx="112" cy="28" r=".9"/></g>' +
      '<path d="M0 80V66c20-8 40-10 60-10s40 2 60 10v14z" fill="currentColor" opacity=".18"/>'),
    art: svg('0 0 120 80', '<path d="M8 50c20-16 40-20 62-12" stroke="#e0a43c" stroke-width="9" fill="none" stroke-linecap="round" opacity=".85"/>' +
      '<path d="M30 66c22-8 48-10 78-2" stroke="#4f8fbf" stroke-width="7" fill="none" stroke-linecap="round" opacity=".8"/>' +
      '<path d="M54 24c14-6 30-8 50-2" stroke="#c4574d" stroke-width="6" fill="none" stroke-linecap="round" opacity=".75"/>' +
      '<circle cx="24" cy="22" r="7" fill="#6aa26a" opacity=".8"/>'),
    drama: svg('0 0 120 70', '<g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">' +
      '<path d="M18 10c12 5 26 5 38 0v18a19 19 0 0 1-38 0z"/><path d="M28 22h5M41 22h5M29 34c4 3 12 3 16 0"/>' +
      '<path d="M64 20c12 5 26 5 38 0v18a19 19 0 0 1-38 0z"/><path d="M74 32h5M87 32h5M75 48c4-3 12-3 16 0"/></g>')
  };
  function poster(a, live) {
    var cls = 'wb-poster p-' + a.poster;
    var inner = '';
    if (a.top) inner += '<div class="wbp-top">' + esc(a.top) + '</div>';
    if (MOTIF[a.poster]) inner += '<div class="wbp-motif">' + MOTIF[a.poster] + '</div>';
    inner += '<div class="wbp-head">' + esc(a.head) + '</div><div class="wbp-sub">' + esc(a.sub) + '</div>';
    inner += '<div class="wbp-foot">' + a.foot.map(function (f) { return '<span>' + esc(f) + '</span>'; }).join('') + '</div>';
    if (a.poster === 'carol') inner += '<span class="wbp-emblem">' + emblemSVG() + '</span>';
    if (a.poster === 'plain') {
      inner += live
        ? '<button class="wbp-peacock wb-peacock" aria-label="图案">' + posterPeacock('#ebe5d6') + '</button>'
        : '<span class="wbp-peacock">' + posterPeacock('#ebe5d6') + '</span>';
    }
    return '<div class="' + cls + '"><div class="wbp">' + inner + '</div></div>';
  }

  /* --- 搜索 --- */
  function docs() {
    var list = [];
    list.push({ go: { path: 'about' }, title: '学校概况', text: aboutText() });
    list.push({ go: { path: 'clubs' }, title: '社团活动', text: '社团介绍 旧活动 ' + CLUBS.map(function (c) { return c.name + '：' + c.intro; }).join(' ') });
    ACTS.forEach(function (a) {
      list.push({ go: { path: 'activity', id: a.id }, title: a.title, date: a.date, text: '社团活动 · 旧活动　' + a.body, tags: a.tags, tagNote: a.tags ? '［图片］活动海报' : null });
    });
    list.push({ go: { path: 'chaplain' }, title: '四个属灵的定律', text: '校牧室 ' + LAWS.map(function (l) { return l.law + l.verse + l.ref; }).join(' ') });
    NEWS.concat(NOTICES).forEach(function (n) {
      list.push({ go: { path: 'article', id: n.id }, title: n.title, date: n.date, text: n.body });
    });
    ['teaching', 'admission', 'library', 'life', 'alumni'].forEach(function (k) {
      list.push({ go: { path: k }, title: SIMPLE[k].title, text: SIMPLE[k].intro + ' ' + SIMPLE[k].rows.map(function (r) { return r.join(' '); }).join(' ') });
    });
    if (G.state.has('note')) { // 拼好纸条之后，校史才搜得到
      list.push({ go: { path: 'history' }, title: '校史', text: HISTORY_LINES.join(''), tags: ['动物园', '校史', '后山'] });
    }
    return list;
  }
  function aboutText() { return ABOUT_INTRO + ' 校训：' + MOTTO + ' ' + EMBLEM; }
  function fold(s) {
    return String(s || '').replace(/[！-～]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); })
      .replace(/\s+/g, '').toLowerCase();
  }
  function search(q) {
    var k = fold(q);
    if (!k) return [];
    var hits = [];
    docs().forEach(function (d) {
      var tagHit = (d.tags || []).some(function (t) { return t.indexOf(k) >= 0 || k.indexOf(t) >= 0; });
      var inTitle = fold(d.title).indexOf(k) >= 0;
      var inText = fold(d.text).indexOf(k) >= 0;
      if (tagHit || inTitle || inText) hits.push({ d: d, score: (inTitle ? 2 : 0) + (tagHit ? 3 : 0) + (inText ? 1 : 0), inText: inText });
    });
    hits.sort(function (a, b) { return b.score - a.score; });
    return hits;
  }
  function mark(text, q) {
    if (!q) return esc(text);
    var low = text.toLowerCase(), k = q.toLowerCase(), out = '', i = 0, j;
    while ((j = low.indexOf(k, i)) >= 0) {
      out += esc(text.slice(i, j)) + '<em>' + esc(text.slice(j, j + k.length)) + '</em>';
      i = j + k.length;
    }
    return out + esc(text.slice(i));
  }
  function snippet(text, q) {
    var j = text.toLowerCase().indexOf(q.toLowerCase());
    var s = Math.max(0, j - 18);
    return (s > 0 ? '…' : '') + text.slice(s, s + 64) + (s + 64 < text.length ? '…' : '');
  }

  /* --- 各栏目 --- */
  var ABOUT_INTRO = '圣玛利亚女子中学是一所女子高中。学校依山而建，校园环境清幽，教学楼、图书馆、小礼拜堂与运动场错落分布。';
  var SIMPLE = {
    teaching: { title: '教育教学', en: 'TEACHING', intro: '学校开设国家课程，并开设外语、艺术、阅读等校本选修课程。',
      rows: [['早读', '7:30 — 7:55'], ['上午课程', '8:00 — 11:50'], ['下午课程', '13:30 — 16:30'], ['社团活动', '16:40 — 17:40']] },
    admission: { title: '招生', en: 'ADMISSION', intro: '2025 年招生简章将在本栏目另行公布，请关注学校官网通知。',
      rows: [['招生对象', '高中女生'], ['咨询地点', '行政楼一楼招生办公室'], ['咨询时间', '周一至周五 9:00 — 16:00']] },
    library: { title: '图书馆', en: 'LIBRARY', intro: '图书馆设有阅览室、自习室和电子阅览区，面向全校师生开放。',
      rows: [['开放时间', '周一至周五 7:30 — 17:30'], ['周六', '9:00 — 12:00'], ['借阅', '每人限借 5 册，借期 30 天']] },
    life: { title: '校园生活', en: 'CAMPUS LIFE', intro: '本栏目介绍学生食堂、校医室等校园生活服务。',
      rows: [['学生食堂', '早 6:50　午 11:50　晚 17:40'], ['校医室', '教学楼一楼东侧'], ['心理咨询室', '图书馆三楼']] },
    alumni: { title: '校友', en: 'ALUMNI', intro: '欢迎各届校友常回母校看看。校友会负责联络各届校友，组织返校与交流活动。',
      rows: [['校友会办公室', '行政楼 205'], ['校友信息登记', '请至校友会办公室办理']] }
  };

  var PAGES = {
    home: function () {
      return banner() +
        '<nav class="wb-quick">' + MENU.map(function (m) {
          return '<button data-go="' + m[0] + '"><span>' + svg('0 0 24 24', QUICK[m[0]]) + '</span>' + esc(m[1]) + '</button>';
        }).join('') + '</nav>' +
        '<section class="wb-sec">' + secHead('校园新闻', 'news') + NEWS.slice(0, 6).map(newsItem).join('') + '</section>' +
        '<section class="wb-sec">' + secHead('通知公告', 'notices') + NOTICES.map(noticeItem).join('') + '</section>';
    },
    news: function () {
      return crumb([['home', '首页'], [null, '校园新闻']]) + pageHead('校园新闻', 'NEWS') +
        '<section class="wb-sec">' + NEWS.map(newsItem).join('') + pager(NEWS.length) + '</section>';
    },
    notices: function () {
      return crumb([['home', '首页'], [null, '通知公告']]) + pageHead('通知公告', 'NOTICES') +
        '<section class="wb-sec">' + NOTICES.map(noticeItem).join('') + pager(NOTICES.length) + '</section>';
    },
    article: function (p) {
      var n = find(NEWS, p.id), isNews = !!n;
      n = n || find(NOTICES, p.id) || NEWS[0];
      return crumb([['home', '首页'], [isNews ? 'news' : 'notices', isNews ? '校园新闻' : '通知公告'], [null, '正文']]) +
        '<article class="wb-art"><h1>' + esc(n.title) + '</h1>' +
        meta(['发布时间：' + n.date, '来源：' + (isNews ? '宣传办公室' : '学校办公室')]) +
        '<p>' + esc(n.body) + '</p></article>';
    },
    about: function () {
      return crumb([['home', '首页'], [null, '学校概况']]) + pageHead('学校概况', 'ABOUT US') +
        '<section class="wb-sec"><h2 class="wb-h2">' + esc('学校简介') + '</h2><p class="wb-p">' + esc(ABOUT_INTRO) + '</p></section>' +
        '<section class="wb-sec"><h2 class="wb-h2">' + esc('校训') + '</h2><p class="wb-motto">' + esc(MOTTO) + '</p></section>' +
        '<section class="wb-sec"><h2 class="wb-h2">' + esc('校徽') + '</h2><div class="wb-emblem-big">' + emblemSVG() + '</div>' +
        '<p class="wb-p wb-center">' + esc(EMBLEM) + '</p></section>';
    },
    clubs: function () {
      return crumb([['home', '首页'], [null, '社团活动']]) + pageHead('社团活动', 'STUDENT CLUBS') +
        '<nav class="wb-tabs"><button data-jump="wb-intro" class="on">' + esc('社团介绍') + '</button><button data-jump="wb-archive">' + esc('旧活动') + '</button></nav>' +
        '<section class="wb-sec" id="wb-intro">' + secHead('社团介绍') +
          '<p class="wb-p wb-lead">' + esc('学校现有各类学生社团，社团活动一般安排在每周下午课后，欢迎同学们根据兴趣参加。') + '</p>' +
          CLUBS.map(function (c) {
            return '<div class="wb-club"><span class="wb-club-ic">' + svg('0 0 24 24', CLUB_IC[c.ic]) + '</span><div>' +
              '<h3>' + esc(c.name) + '</h3><p>' + esc(c.intro) + '</p>' +
              '<small>' + esc('活动时间：' + c.time + '　地点：' + c.place) + '</small></div></div>';
          }).join('') +
        '</section>' +
        '<section class="wb-sec" id="wb-archive">' + secHead('旧活动') +
          ACTS.map(function (a) {
            return '<button class="wb-arc" data-go="activity" data-id="' + a.id + '">' +
              '<span class="wb-thumb">' + poster(a, false) + '</span>' +
              '<span class="wb-arc-b"><span class="wb-arc-t">' + esc(a.title) + '</span>' +
              '<small>' + esc(a.date + '　浏览 ' + a.views) + '</small></span></button>';
          }).join('') + pager(ACTS.length) +
        '</section>';
    },
    activity: function (p) {
      var i = Math.max(0, ACTS.indexOf(find(ACTS, p.id)));
      var a = ACTS[i], prev = ACTS[i - 1], next = ACTS[i + 1];
      return crumb([['home', '首页'], ['clubs', '社团活动'], [null, '旧活动']]) +
        '<article class="wb-art"><h1>' + esc(a.title) + '</h1>' +
        meta(['发布时间：' + a.date, '来源：社团活动中心', '浏览次数：' + a.views]) +
        '<div class="wb-poster-wrap">' + poster(a, true) + '</div>' +
        '<p>' + esc(a.body) + '</p>' +
        '<div class="wb-pn">' +
          (prev ? '<button data-go="activity" data-id="' + prev.id + '">' + esc('上一篇：' + prev.title) + '</button>' : '<span>' + esc('上一篇：没有了') + '</span>') +
          (next ? '<button data-go="activity" data-id="' + next.id + '">' + esc('下一篇：' + next.title) + '</button>' : '<span>' + esc('下一篇：没有了') + '</span>') +
        '</div></article>';
    },
    chaplain: function () {
      return crumb([['home', '首页'], [null, '校牧室']]) + pageHead('校牧室', 'CHAPLAINCY') +
        '<article class="wb-art wb-laws"><h1>' + esc('四个属灵的定律') + '</h1>' +
        meta(['来源：校牧室']) +
        '<p>' + esc('正如自然界有它的定律，属灵的世界也有定律，关乎人与神的关系。') + '</p>' +
        LAWS.map(function (l) {
          return '<section class="wb-law"><div class="wb-law-n">' + esc('定律' + l.n) + '</div>' +
            '<h2>' + esc(l.law) + '</h2>' +
            '<blockquote>' + esc('「' + l.verse + '」') + '<cite>' + esc('（' + l.ref + '）') + '</cite></blockquote></section>';
        }).join('') +
        '<p class="wb-small">' + esc('经文引自《圣经》和合本。') + '</p></article>' +
        '<section class="wb-sec">' + secHead('校牧室') + rows([['开放时间', '周一至周五 8:00 — 17:00'], ['地点', '小礼拜堂一楼']]) + '</section>';
    },
    history: function () {
      return crumb([['home', '首页'], ['about', '学校概况'], [null, '校史']]) + pageHead('校史', 'HISTORY') +
        '<article class="wb-art wb-history">' +
        meta(['来源：学校办公室']) +
        HISTORY_LINES.map(function (l) { return '<p class="wb-hline">' + esc(l) + '</p>'; }).join('') +
        '<figure class="wb-oldphoto">' + slot('history-photo', 'old-zoo') + '</figure>' +
        '</article>';
    },
    search: function (p) {
      var q = String(p.q || '');
      var hits = search(q), k = fold(q);
      var res = hits.length
        ? '<p class="wb-count">' + esc('搜索「' + q + '」，共找到 ' + hits.length + ' 条结果') + '</p>' +
          hits.map(function (h) {
            var d = h.d;
            var snip = h.inText ? mark(snippet(d.text, k), k) : esc(d.tagNote || d.text.slice(0, 48));
            return '<button class="wb-hit" data-go="' + d.go.path + '"' + (d.go.id ? ' data-id="' + d.go.id + '"' : '') + '>' +
              '<span class="wb-hit-t">' + mark(d.title, k) + '</span>' +
              '<span class="wb-hit-s">' + snip + '</span>' +
              '<small>' + esc(urlFor(d.go) + (d.date ? '　' + d.date : '')) + '</small></button>';
          }).join('')
        : '<div class="wb-none"><b>' + esc('没有找到相关内容') + '</b><small>' + esc('请检查输入的关键词，或换一个关键词再试。') + '</small></div>';
      return crumb([['home', '首页'], [null, '站内搜索']]) +
        '<section class="wb-sec">' + searchForm(q, 'wb-search wb-search-page') + res + '</section>';
    }
  };
  ['teaching', 'admission', 'library', 'life', 'alumni'].forEach(function (k) {
    PAGES[k] = function () {
      var s = SIMPLE[k];
      return crumb([['home', '首页'], [null, s.title]]) + pageHead(s.title, s.en) +
        '<section class="wb-sec"><p class="wb-p">' + esc(s.intro) + '</p>' + rows(s.rows) + '</section>';
    };
  });

  function meta(items) {
    return '<div class="wb-meta">' + items.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>';
  }
  function pager(n) {
    return '<div class="wb-pager">' + esc('共 ' + n + ' 条　1 / 1 页') + '</div>';
  }

  /* --- 首页横幅：纯 SVG 场景，无照片 --- */
  var SCENES = [
    { cap: '小礼拜堂', sky: ['#1a2554', '#6c4a78', '#d88c66', '#f2c48b'], ink: '#15142a',
      art: '<path d="M0 132C70 112 130 108 200 120S330 104 400 116V180H0z" fill="#2c2546" opacity=".75"/>' +
        '<circle cx="312" cy="118" r="20" fill="#ffd9a1" opacity=".55"/>' +
        '<path d="M96 180v-54l34-26 34 26v54zM164 180v-44h58v44zM118 126V86l12-26 12 26v40z"/>' +
        '<path d="M129 40h2v16h-2zM124.5 45h11v2h-11z"/>' +
        '<g fill="#f3c977" opacity=".85"><path d="M126 112a4 4 0 0 1 8 0v10h-8zM110 146a4 4 0 0 1 8 0v14h-8zM142 146a4 4 0 0 1 8 0v14h-8zM176 150h8v12h-8zM196 150h8v12h-8z"/></g>' +
        '<circle cx="40" cy="160" r="22"/><circle cx="62" cy="168" r="16"/><circle cx="262" cy="160" r="20"/><circle cx="288" cy="166" r="16"/><circle cx="372" cy="158" r="24"/>' +
        '<rect y="170" width="400" height="10"/>' },
    { cap: '图书馆', sky: ['#0d2552', '#28518d', '#6f97c4', '#b7cde2'], ink: '#0e1a33',
      art: '<path d="M0 140C80 126 160 124 240 132S360 128 400 134V180H0z" fill="#1d3358" opacity=".7"/>' +
        '<path d="M110 180v-68h180v68zM100 114l100-30 100 30zM186 84V52h28v32zM190 52l10-14 10 14z"/>' +
        '<circle cx="200" cy="66" r="6" fill="#e9eef5" opacity=".85"/>' +
        '<g fill="#f1d38f" opacity=".8"><path d="M124 124h14v14h-14zM150 124h14v14h-14zM236 124h14v14h-14zM262 124h14v14h-14zM124 148h14v14h-14zM262 148h14v14h-14zM188 140h24v40h-24z"/></g>' +
        '<circle cx="50" cy="162" r="20"/><circle cx="74" cy="168" r="14"/><circle cx="340" cy="160" r="22"/><circle cx="366" cy="168" r="14"/>' +
        '<rect y="172" width="400" height="8"/>' },
    { cap: '秋日校园', sky: ['#7fa9cf', '#a9c6df', '#d9e5ee', '#eef1ef'], ink: '#2b3a34',
      art: '<path d="M0 150C90 138 190 136 280 142S370 140 400 144V180H0z" fill="#8aa38f"/>' +
        '<path d="M150 180v-74h150v74zM142 108l83-22 83 22z" fill="#b9a58a"/>' +
        '<g fill="#e8e1d2"><path d="M166 122a6 6 0 0 1 12 0v16h-12zM196 122a6 6 0 0 1 12 0v16h-12zM242 122a6 6 0 0 1 12 0v16h-12zM272 122a6 6 0 0 1 12 0v16h-12zM214 150a11 11 0 0 1 22 0v30h-22z"/></g>' +
        '<circle cx="60" cy="128" r="30" fill="#c9783d"/><circle cx="92" cy="138" r="22" fill="#dc9a45"/><path d="M68 180v-30h6v30z" fill="#5b4433"/>' +
        '<circle cx="350" cy="126" r="28" fill="#b9653a"/><circle cx="324" cy="140" r="18" fill="#d8a24a"/><path d="M346 180v-30h6v30z" fill="#5b4433"/>' +
        '<rect y="172" width="400" height="8" fill="#7e9783"/>' }
  ];
  function banner() {
    return '<div class="wb-banner"><div class="wb-track">' + SCENES.map(function (s, i) {
      var id = 'wbsky' + i;
      return '<div class="wb-slide">' +
        svg('0 0 400 180', '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
          s.sky.map(function (c, j) { return '<stop offset="' + [0, 0.5, 0.82, 1][j] + '" stop-color="' + c + '"/>'; }).join('') +
          '</linearGradient></defs><rect width="400" height="180" fill="url(#' + id + ')"/><g fill="' + s.ink + '">' + s.art + '</g>') +
        '<span class="wb-cap">' + esc(s.cap) + '</span></div>';
    }).join('') + '</div><div class="wb-dots">' + SCENES.map(function (s, i) {
      return '<button data-slide="' + i + '" aria-label="' + esc(s.cap) + '"' + (i ? '' : ' class="on"') + '></button>';
    }).join('') + '</div></div>';
  }

  G.screen('web-school', {
    page: function (p) { return p.path === 'history' ? 9 : 5; },
    theme: 'light',
    mount: function (root, params) {
      var p = { path: PAGES[params.path] ? params.path : 'clubs' };
      if (params.id) p.id = params.id;
      if (params.q != null) p.q = params.q;
      if (!navigating) hist = [];
      navigating = false;
      here = p;

      var alive = true, timers = [];
      function later(fn, ms) { timers.push(setTimeout(function () { if (alive) fn(); }, ms)); }

      root.appendChild(chrome(urlFor(p), back, false));
      var site = el('<div class="wb-site"></div>');
      site.innerHTML = header() + '<main class="wb-main">' + PAGES[p.path](p) + '</main>' + footer();
      root.appendChild(site);
      root.appendChild(el(menuOverlay()));
      var menu = root.querySelector('.wb-menu');

      root.addEventListener('click', function (e) {
        if (e.target === menu) { menu.hidden = true; return; }
        var t = e.target.closest('.wb-peacock, [data-go], [data-jump], [data-slide], .wb-burger, .wb-menu-x');
        if (!t) return;
        if (t.classList.contains('wb-peacock')) { e.preventDefault(); toGate(); return; }
        if (t.classList.contains('wb-burger')) { G.audio.play('tap'); menu.hidden = false; return; }
        if (t.classList.contains('wb-menu-x')) { menu.hidden = true; return; }
        var goTo = t.getAttribute('data-go');
        if (goTo) {
          e.preventDefault();
          var np = { path: goTo };
          if (t.getAttribute('data-id')) np.id = t.getAttribute('data-id');
          go(np);
          return;
        }
        var jump = t.getAttribute('data-jump');
        if (jump) {
          var sec = site.querySelector('#' + jump);
          root.querySelectorAll('[data-jump]').forEach(function (b) { b.classList.toggle('on', b === t); });
          if (sec) site.scrollTo({ top: sec.offsetTop - 8, behavior: G.reducedMotion() ? 'auto' : 'smooth' });
          return;
        }
        if (t.hasAttribute('data-slide')) slide(+t.getAttribute('data-slide'));
      });
      root.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = e.target.querySelector('input[name="q"]');
        var q = input ? input.value.trim() : '';
        if (!q) { G.ui.toast('请输入关键词'); return; }
        if (input) input.blur();
        go({ path: 'search', q: q.slice(0, 40) });
      });

      function toGate() {
        G.audio.play('tap');
        if (G.reducedMotion()) { G.show('web-gate'); return; }
        root.classList.add('wb-leaving');
        later(function () { G.show('web-gate'); }, 340);
      }

      /* 首页横幅轮播 */
      var cur = 0, track = root.querySelector('.wb-track');
      function slide(i) {
        if (!track) return;
        cur = (i + SCENES.length) % SCENES.length;
        track.style.transform = 'translateX(' + (-100 * cur) + '%)';
        root.querySelectorAll('[data-slide]').forEach(function (d, j) { d.classList.toggle('on', j === cur); });
      }
      var spin = track && !G.reducedMotion() ? setInterval(function () { slide(cur + 1); }, 4800) : null;

      /* 09 校史：长按存备忘录，然后「出发」 */
      if (p.path === 'history') {
        var art = root.querySelector('.wb-history');
        memoOnLongPress(art, { id: 'web-history', title: '学校官网 · 校史', text: HISTORY_LINES.join('\n') });
        var out = el('<button class="wb-depart" hidden>' + esc('出发') + '</button>');
        root.appendChild(out);
        later(function () { out.hidden = false; }, 1400);
        out.onclick = function () {
          G.audio.play('tap');
          out.disabled = true;
          G.ui.narrate(HISTORY_STORY).then(function () { if (alive) G.show('night-gate'); });
        };
      }

      return function () {
        alive = false;
        timers.forEach(clearTimeout);
        if (spin) clearInterval(spin);
      };
    }
  });

  /* =====================================================================
   * 06 隐藏入口 · 身份已确认
   * ===================================================================== */
  G.screen('web-gate', {
    page: 6,
    theme: 'dark',
    mount: function (root) {
      var alive = true, timers = [];
      function later(fn, ms) { timers.push(setTimeout(function () { if (alive) fn(); }, ms)); }

      root.appendChild(chrome(INTERNAL, function () { G.show('web-school', { path: 'activity', id: PEACOCK_ACT }); }, true));
      var body = el('<div class="wg-body"><div class="wg-center">' +
        '<div class="wg-emblem">' + featherEyeSVG() + '</div>' +
        '<h1 class="wg-title">' + esc(GATE_TITLE) + '</h1>' +
        '<div class="wg-who">' + IC.user + '<span>' + esc(ACCOUNT) + '</span>' + IC.check + '</div>' +
        '<p class="wg-ok" aria-live="polite"></p>' +
        '<form class="wg-form" autocomplete="off" novalidate>' +
          '<label class="wg-field"><span class="wg-ic">' + IC.user + '</span>' +
            '<input class="wg-input" type="text" name="v" placeholder="' + esc('请输入账号') + '" enterkeyhint="go" ' +
            'autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" maxlength="32" aria-label="' + esc('请输入账号') + '"></label>' +
          '<button class="wg-go" type="submit" aria-label="确认">' + IC.arrow + '</button>' +
        '</form>' +
        '<p class="wg-err" role="alert"></p>' +
      '</div></div>');
      root.appendChild(body);

      var form = body.querySelector('.wg-form');
      var input = body.querySelector('.wg-input');
      var err = body.querySelector('.wg-err');
      var ok = body.querySelector('.wg-ok');
      var who = body.querySelector('.wg-who');
      var step = 'account';

      if (fine()) later(function () { input.focus(); }, 300);

      function fail(msg) {
        G.audio.play('error');
        err.textContent = msg;
        err.classList.remove('in'); void err.offsetWidth; err.classList.add('in');
        form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
        input.select();
      }
      input.addEventListener('input', function () { err.textContent = ''; });

      form.onsubmit = function (e) {
        e.preventDefault();
        var v = G.normalize(input.value);
        if (!v) { form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake'); return; }
        if (step === 'account') {
          if (v !== G.normalize(ACCOUNT)) { fail('账号不存在'); return; }
          step = 'wait';
          err.textContent = '';
          G.audio.play('chime');
          input.readOnly = true;
          form.classList.add('dim');
          ok.textContent = '身份已确认。';
          requestAnimationFrame(function () { ok.classList.add('in'); who.classList.add('in'); });
          later(function () {
            step = 'code';
            input.value = '';
            input.readOnly = false;
            input.setAttribute('inputmode', 'numeric');
            input.setAttribute('maxlength', '12');
            input.classList.add('masked');
            input.placeholder = '请输入口令（8 位）';
            input.setAttribute('aria-label', '请输入口令（8 位）');
            body.querySelector('.wg-ic').innerHTML = IC.key;
            form.classList.remove('dim');
            input.focus();
          }, 1100);
        } else if (step === 'code') {
          if (v !== PASSCODE) { fail('口令错误'); return; }
          step = 'done';
          input.blur();
          G.state.flag('gate');
          root.classList.add('wg-enter');
          later(function () { G.show('web-event'); }, G.reducedMotion() ? 0 : 700);
        }
      };

      return function () { alive = false; timers.forEach(clearTimeout); };
    }
  });

  /* =====================================================================
   * 07 活动预告 · 完成
   * ===================================================================== */
  G.screen('web-event', {
    page: 7,
    theme: 'dark',
    mount: function (root) {
      var alive = true, timers = [];
      function later(fn, ms) { timers.push(setTimeout(function () { if (alive) fn(); }, ms)); }
      var done = G.state.has('done');

      root.appendChild(chrome(INTERNAL + 'notice', function () { G.show('browser'); }, true));
      var scroller = el('<div class="we-scroll">' +
        '<div class="we-head">' + featherEyeSVG() + '<span>' + esc(GATE_TITLE) + '</span></div>' +
        '<article class="we-notice">' +
          '<h1>' + esc(EVENT[0]) + '</h1>' +
          '<p class="we-time">' + esc(EVENT[1]) + '</p>' +
          '<p class="we-place">' + esc(EVENT[2]) + '</p>' +
          '<p class="we-note">' + esc(EVENT[3]) + '</p>' +
        '</article>' +
        '<div class="we-void"><i></i><i></i><i></i><span class="we-mark">' + featherEyeSVG() + '</span></div>' +
        '<div class="we-end"><div class="we-stamp' + (done ? ' static' : '') + '"><span>' + esc('完成') + '</span></div></div>' +
      '</div>');
      root.appendChild(scroller);
      memoOnLongPress(scroller.querySelector('.we-notice'), {
        id: 'web-event', title: '内部系统 · 活动预告', text: EVENT.slice(1).join('\n')
      });

      var stamp = scroller.querySelector('.we-stamp');

      if (done) {
        var cont = el('<button class="we-continue">' + esc('继续') + IC.chev + '</button>');
        cont.onclick = function () { G.audio.play('tap'); G.show('room'); };
        root.appendChild(cont);
      } else {
        var fired = false;
        var check = function () {
          if (fired || !alive) return;
          if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 6) finish();
        };
        scroller.addEventListener('scroll', check, { passive: true });

        var finish = function () {
          fired = true;
          root.appendChild(el('<div class="we-block"></div>'));
          scroller.classList.add('still');
          stamp.classList.add('slam');
          later(function () {
            G.audio.play('stamp');
            root.classList.add('hit');
          }, G.reducedMotion() ? 0 : 170);
          later(function () {
            G.state.flag('done');
            G.ui.narrate(EVENT_AFTER).then(function () { if (alive) G.show('room'); });
          }, 2400);
        };
      }

      return function () { alive = false; timers.forEach(clearTimeout); };
    }
  });

  /* 给其他屏幕备用的图形（只读，不改核心）。 */
  G.webArt = { emblem: emblemSVG, feather: featherEyeSVG, inkPeacock: inkPeacockSVG, posterPeacock: posterPeacock };
})();
