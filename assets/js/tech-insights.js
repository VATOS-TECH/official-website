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
