/* ============================================================
   VATOS — Subpage interactions
   Business 상세 / History 타임라인 / Tech Insights 목록
   common.js 다음에 로드된다. 각 기능은 대상 DOM이 있을 때만 실행된다.
   ============================================================ */
(function () {
  'use strict';

  var REDUCE = window.VATOS_REDUCE ||
    (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---- 핵심 메시지: 세로선(모바일은 가로선) 위 인디케이터가 스크롤에 연동해 이동
         — 연혁 페이지 타임라인 인디케이터와 동일한 방식, 이동 범위는 이 섹션 내부로 제한 ---- */
  (function introDot() {
    var bodies = Array.prototype.slice.call(document.querySelectorAll('.bd-intro__body'));
    if (!bodies.length) return;

    bodies.forEach(function (body) {
      var dot = document.createElement('span');
      dot.className = 'bd-intro__dot';
      dot.setAttribute('aria-hidden', 'true');
      body.insertBefore(dot, body.firstChild);

      if (REDUCE) { return; }

      var ticking = false;
      function isMobile() { return window.matchMedia('(max-width: 900px)').matches; }

      function update() {
        ticking = false;
        var rect = body.getBoundingClientRect();
        var height = rect.height; // 진행률은 방향(가로/세로)에 관계없이 항상 세로 스크롤 거리 기준
        if (height <= 0) return;

        var scrollY = window.scrollY || window.pageYOffset;
        var viewportH = window.innerHeight;
        var anchorY = viewportH * 0.5;

        // 선의 시작/끝 지점을 문서 절대좌표로 환산 — 실제 선의 양 끝과 정확히 일치하도록 계산
        var startAbs = rect.top + scrollY;
        var endAbs = startAbs + height;

        var startScrollY = startAbs - anchorY; // 진행률 0%: 선 시작(왼쪽/위쪽 끝)
        var endScrollY = endAbs - anchorY;      // 진행률 100%: 선 끝(오른쪽/아래쪽 끝)

        var progress;
        if (endScrollY <= startScrollY) {
          progress = scrollY >= startScrollY ? 1 : 0;
        } else {
          progress = (scrollY - startScrollY) / (endScrollY - startScrollY);
        }
        progress = Math.max(0, Math.min(1, progress));

        var pct = (progress * 100).toFixed(2) + '%';
        if (isMobile()) {
          dot.style.top = '';
          dot.style.left = pct;
        } else {
          dot.style.left = '';
          dot.style.top = pct;
        }
      }
      function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
      }
      update();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      window.addEventListener('load', update);
    });
  })();

  /* ---- 큰 핵심 문구: 지정된 구문(.bd-hl)에 청록색 음영을 1회만 채우고 이후 유지 ---- */
  (function leadHighlight() {
    var leads = Array.prototype.slice.call(document.querySelectorAll('.bd-intro__lead'));
    if (!leads.length) return;

    if (REDUCE || !('IntersectionObserver' in window)) {
      document.querySelectorAll('.bd-hl').forEach(function (h) { h.classList.add('is-hl'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var hls = e.target.querySelectorAll('.bd-hl');
        hls.forEach(function (h) {
          setTimeout(function () { h.classList.add('is-hl'); }, 250);
        });
        io.unobserve(e.target);
      });
    }, { threshold: 0.5 });
    leads.forEach(function (l) { io.observe(l); });
  })();

  /* ---- 서비스 유형 리스트: 스크롤 진입 시 순차 등장 ---- */
  (function serviceList() {
    var rows = Array.prototype.slice.call(document.querySelectorAll('.bd-row'));
    if (!rows.length) return;

    if (REDUCE || !('IntersectionObserver' in window)) {
      rows.forEach(function (r) { r.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var row = e.target;
        var idx = rows.indexOf(row);
        // 화면에 들어온 순서대로 살짝씩 지연을 줘 계단식으로 나타나게 함
        setTimeout(function () { row.classList.add('is-in'); }, Math.min(idx, 6) * 90);
        io.unobserve(row);
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -6% 0px' });
    rows.forEach(function (r) { io.observe(r); });
  })();

  /* ---- 수행 방식: 연결선 드로잉 + 단계 순차 활성화 ---- */
  (function process() {
    var track = document.querySelector('.bd-process__track');
    if (!track) return;
    var steps = Array.prototype.slice.call(track.querySelectorAll('.bd-step'));
    if (!steps.length) return;

    var svg = track.querySelector('.bd-process__line');
    var path = svg ? svg.querySelector('path') : null;

    if (REDUCE) {
      steps.forEach(function (s) { s.classList.add('is-active'); });
      return;
    }

    /* 각 STEP의 실제 위치를 이어주는 곡선을 계산해서 그린다.
       (단계 들여쓰기가 비정형이라 좌표를 읽어 경로를 만든다) */
    function buildPath() {
      if (!svg || !path) return;
      var tRect = track.getBoundingClientRect();
      if (!tRect.width) return;
      svg.setAttribute('viewBox', '0 0 ' + tRect.width + ' ' + tRect.height);

      var pts = steps.map(function (s) {
        var n = s.querySelector('.bd-step__num');
        var r = (n || s).getBoundingClientRect();
        return {
          x: r.left - tRect.left + r.width / 2,
          y: r.top - tRect.top + r.height / 2
        };
      });
      if (pts.length < 2) return;

      var d = 'M ' + pts[0].x + ' ' + pts[0].y;
      for (var i = 1; i < pts.length; i++) {
        var p0 = pts[i - 1], p1 = pts[i];
        var midY = (p0.y + p1.y) / 2;
        // 부드러운 S자 곡선으로 단계를 연결
        d += ' C ' + p0.x + ' ' + midY + ', ' + p1.x + ' ' + midY + ', ' + p1.x + ' ' + p1.y;
      }
      path.setAttribute('d', d);
      var len = path.getTotalLength ? path.getTotalLength() : 2000;
      path.style.setProperty('--len', len);
    }

    buildPath();
    window.addEventListener('resize', function () {
      path && path.classList.remove('is-drawn');
      buildPath();
      if (drawn) requestAnimationFrame(function () { path && path.classList.add('is-drawn'); });
    });

    var drawn = false;
    function activate() {
      if (!drawn) {
        drawn = true;
        if (path) path.classList.add('is-drawn');
      }
    }

    if ('IntersectionObserver' in window) {
      // 연결선: 프로세스 영역 진입 시 1회 드로잉
      var lineIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { activate(); lineIO.unobserve(e.target); } });
      }, { threshold: 0.15 });
      lineIO.observe(track);

      // 각 STEP: 순차 활성화
      var stepIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var s = e.target;
          setTimeout(function () { s.classList.add('is-active'); }, steps.indexOf(s) * 170);
          stepIO.unobserve(s);
        });
      }, { threshold: 0.4, rootMargin: '0px 0px -10% 0px' });
      steps.forEach(function (s) { stepIO.observe(s); });
    } else {
      activate();
      steps.forEach(function (s) { s.classList.add('is-active'); });
    }

    // 폰트/이미지 로드 후 좌표가 바뀔 수 있으므로 재계산
    window.addEventListener('load', function () {
      var wasDrawn = drawn;
      if (path) path.classList.remove('is-drawn');
      buildPath();
      if (wasDrawn) requestAnimationFrame(function () { path && path.classList.add('is-drawn'); });
    });
  })();

  /* ---- 핵심 지표 바: 가로선이 왼쪽→오른쪽으로 그려지며 5개 항목 순차 활성화 ---- */
  (function statsBar() {
    var bar = document.querySelector('.bd-stats-bar');
    if (!bar) return;
    var stats = Array.prototype.slice.call(bar.querySelectorAll('.bd-stat'));
    if (!stats.length) return;

    if (REDUCE || !('IntersectionObserver' in window)) {
      bar.classList.add('is-in');
      stats.forEach(function (s) { s.classList.add('is-active'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        bar.classList.add('is-in');
        stats.forEach(function (s, i) {
          setTimeout(function () { s.classList.add('is-active'); }, 200 + i * 220);
        });
        io.unobserve(bar);
      });
    }, { threshold: 0.35 });
    io.observe(bar);
  })();

})();

/* ============================================================
   History timeline module
   ============================================================ */
/* ============================================================
   VATOS — History(연혁) 페이지 전용 스크립트
   세로 타임라인 선 위의 원형 인디케이터를 스크롤 진행률에 맞춰 이동시키고,
   현재 위치에 해당하는 연도를 청록색으로 강조한다.
   ============================================================ */
(function () {
  'use strict';

  var timeline = document.getElementById('hstTimeline');
  if (!timeline) return;

  var line = timeline.querySelector('.hst-line');
  var fill = document.getElementById('hstLineFill');
  var indicator = document.getElementById('hstIndicator');
  var rows = Array.prototype.slice.call(timeline.querySelectorAll('.hst-row'));
  if (!line || !fill || !indicator || !rows.length) return;

  var REDUCE = window.VATOS_REDUCE ||
    (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  var ANCHOR_RATIO = 0.38; // 뷰포트 상단에서 38% 지점을 스크롤 기준선으로 사용
  var ticking = false;

  function update() {
    ticking = false;

    var lineRect = line.getBoundingClientRect();
    var lineHeight = lineRect.height;
    if (lineHeight <= 0) return;

    var scrollY = window.scrollY || window.pageYOffset;
    var viewportH = window.innerHeight;
    var anchorY = viewportH * ANCHOR_RATIO;

    // 라인의 시작/끝 지점을 "문서 절대좌표"로 환산 — 스크롤 위치가 바뀌어도 값이 고정되어 안정적으로 비교 가능
    var lineTopAbs = lineRect.top + scrollY;
    var lineBottomAbs = lineTopAbs + lineHeight;

    // 실제로 스크롤 가능한 최대 위치(문서 길이가 짧은 모바일에서도 이 값을 넘지 않음)
    var maxScrollY = Math.max(0, document.documentElement.scrollHeight - viewportH);

    var startScrollY = lineTopAbs - anchorY;              // 진행률 0%: 라인 상단이 기준선에 닿는 시점
    var idealEndScrollY = lineBottomAbs - anchorY;        // 진행률 100%가 되어야 하는 이상적인 스크롤 위치
    var endScrollY = Math.min(idealEndScrollY, maxScrollY); // 페이지 끝을 넘어서지 않도록 보정 → 마지막 연도까지 항상 도달 가능

    var progress;
    if (endScrollY <= startScrollY) {
      progress = scrollY >= startScrollY ? 1 : 0;
    } else {
      progress = (scrollY - startScrollY) / (endScrollY - startScrollY);
    }
    progress = Math.max(0, Math.min(1, progress));

    var pct = (progress * 100).toFixed(2) + '%';
    fill.style.height = pct;
    indicator.style.top = pct;

    // 기준선에 가장 가까운 연도(row)를 활성 상태로 표시
    var atPageBottom = scrollY >= maxScrollY - 1;
    var closestRow = null;
    var closestDist = Infinity;
    rows.forEach(function (row) {
      var r = row.getBoundingClientRect();
      var center = r.top + r.height / 2;
      var dist = Math.abs(center - anchorY);
      if (dist < closestDist) { closestDist = dist; closestRow = row; }
    });
    if (atPageBottom) closestRow = rows[rows.length - 1]; // 페이지 맨 끝에서는 마지막 연도(2015)를 확실히 활성화

    rows.forEach(function (row) {
      row.classList.toggle('is-active', row === closestRow);
    });
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  if (REDUCE) {
    fill.style.transition = 'none';
    indicator.style.transition = 'none';
  } else {
    fill.style.transition = 'height .15s linear';
    indicator.style.transition = 'top .15s linear';
  }

  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', update);
})();

/* ============================================================
   Tech Insights list module
   ============================================================ */
/* ============================================================
   VATOS — Tech Insights
   페이지네이션(9개 단위, 데스크톱 3×3 자동 분할) + 카드 순차 등장
   + 페이지 전환 시 배경은 고정하고 카드 영역만 fade-out / fade-in
   ============================================================ */
(function () {
  'use strict';

  var REDUCE = window.VATOS_REDUCE ||
    (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  var list = document.querySelector('.ti-list');
  var nav = document.getElementById('insightPagination');
  if (!list || !nav) return;

  var cards = Array.prototype.slice.call(list.querySelectorAll('.ti-card'));
  if (!cards.length) return;

  var perPage = 9; // 페이지당 9개, 데스크톱 3×3

  /* 카드 번호 파싱 (없으면 DOM 순서) */
  cards.forEach(function (c, idx) {
    var numEl = c.querySelector('.ti-card__num');
    var n = numEl ? parseInt((numEl.textContent || '').trim(), 10) : NaN;
    c._num = isNaN(n) ? idx : n;
  });

  /* 최신(번호 높은 순)부터 7개씩 묶어 1페이지부터 채운다.
     → 1페이지에 최신 7개, 남는 글이 마지막 페이지로 간다.
     (기존 HTML의 data-page 표기와 동일한 그룹핑) */
  var desc = cards.slice().sort(function (a, b) { return b._num - a._num; });
  var totalPages = Math.ceil(desc.length / perPage);
  desc.forEach(function (c, i) { c._page = Math.floor(i / perPage) + 1; });

  /* 화면 표시도 최신 우선 순서로 정렬 */
  desc.forEach(function (c) { list.appendChild(c); });

  /* 페이지 번호 버튼 자동 생성 */
  var nextBtn = nav.querySelector('[data-goto="next"]');
  nav.querySelectorAll('.page-btn:not(.page-nav)').forEach(function (b) { b.parentNode.removeChild(b); });
  var numBtns = [];
  for (var pnum = 1; pnum <= totalPages; pnum++) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'page-btn';
    btn.setAttribute('data-goto', String(pnum));
    btn.textContent = String(pnum);
    if (nextBtn) nav.insertBefore(btn, nextBtn); else nav.appendChild(btn);
    numBtns.push(btn);
  }

  /* 카드 순차 등장 */
  function revealVisible(stagger) {
    var visible = cards.filter(function (c) { return c.style.display !== 'none'; });
    if (REDUCE) { visible.forEach(function (c) { c.classList.add('is-in'); }); return; }
    visible.forEach(function (c, i) {
      c.classList.remove('is-in');
      setTimeout(function () { c.classList.add('is-in'); }, stagger ? i * 70 : 0);
    });
  }

  var current = 1;
  function apply(page) {
    current = Math.min(Math.max(1, page), totalPages);
    cards.forEach(function (c) { c.style.display = (c._page === current) ? '' : 'none'; });
    numBtns.forEach(function (b) {
      b.classList.toggle('active', parseInt(b.getAttribute('data-goto'), 10) === current);
    });
    var prev = nav.querySelector('[data-goto="prev"]');
    if (prev) prev.disabled = (current === 1);
    if (nextBtn) nextBtn.disabled = (current === totalPages);
  }

  /* 페이지 전환: 배경은 그대로 두고 카드 영역만 페이드 아웃 → 교체 → 페이드 인 */
  function goTo(page) {
    if (page === current || page < 1 || page > totalPages) return;
    if (REDUCE) { apply(page); revealVisible(false); return; }
    list.classList.add('is-swapping');
    setTimeout(function () {
      apply(page);
      list.classList.remove('is-swapping');
      revealVisible(true);
    }, 320);
  }

  nav.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.page-btn') : null;
    if (!b || b.disabled) return;
    var g = b.getAttribute('data-goto');
    var target = (g === 'prev') ? current - 1 : (g === 'next') ? current + 1 : parseInt(g, 10);
    goTo(target);
    var top = list.getBoundingClientRect().top + window.scrollY - 120;
    window.scrollTo({ top: top, behavior: REDUCE ? 'auto' : 'smooth' });
  });

  apply(1);

  /* 최초 진입: 카드가 뷰포트에 들어올 때 순차 등장 */
  if (REDUCE || !('IntersectionObserver' in window)) {
    revealVisible(false);
  } else {
    var started = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && !started) { started = true; revealVisible(true); io.disconnect(); }
      });
    }, { threshold: 0.08 });
    io.observe(list);
  }
})();
