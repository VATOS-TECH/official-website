/* ============================================================
   VATOS — Business Areas 상세페이지 공통 애니메이션
   Hero 좌우 진입 / 서비스 리스트 순차 등장 / 프로세스 연결선 드로잉(강조)
   sub-shell.js 다음에 로드된다. 외부 라이브러리 의존 없음.
   ============================================================ */
(function () {
  'use strict';

  var REDUCE = window.VATOS_REDUCE ||
    (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---- Hero 진입: 라벨 → 제목 → 설명 → 그래픽 ---- */
  (function hero() {
    var h = document.querySelector('.bd-hero');
    if (!h) return;
    requestAnimationFrame(function () { h.classList.add('is-ready'); });
  })();

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
