/* ============================================================
   VATOS — Main Page interactions
   메인 인트로, Hero 타이핑, GSAP + ScrollTrigger 전용 효과.
   Scoped to index.html elements; guards on every block.
   ============================================================ */
(function () {
  'use strict';

  var REDUCE = window.VATOS_REDUCE ||
    (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var hasGSAP = typeof window.gsap !== 'undefined';
  if (hasGSAP && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* -------------------------------------------------- Intro-done callback registry
     인트로가 끝난 뒤에 실행되어야 하는 작업(타이핑 시작, Hero 비주얼 줌 등)을 등록해두면,
     인트로 스크립트가 끝날 때 한 번에 호출한다. 인트로 요소가 없으면 즉시 실행된다. */
  var __introFinished = false;
  var __introCallbacks = [];
  function onIntroDone(fn) {
    if (__introFinished) fn();
    else __introCallbacks.push(fn);
  }
  function markIntroDone() {
    __introFinished = true;
    var cbs = __introCallbacks; __introCallbacks = [];
    cbs.forEach(function (fn) { fn(); });
  }

  /* -------------------------------------------------- Hero typing
     설정(글자 비우기·커서 준비)은 즉시 실행되어 인트로 뒤에서 미리 완성된 문구가
     노출되지 않도록 하고, 실제 타이핑 시작은 인트로 종료 후(onIntroDone)로 미룬다.
     타이핑이 진행되는 동안(시작~완료)에는 body 스크롤(휠·터치·키보드)을 잠근다.
     헤더 메뉴/버튼 클릭 등 다른 상호작용은 그대로 동작하며, 오류 상황에서도
     안전장치(타임아웃)로 자동 해제된다. */
  (function typing() {
    var titleEl = document.getElementById('heroTitle');
    if (!titleEl) return;
    if (REDUCE) return; // reduced-motion: 완성된 문구가 이미 표시되어 있으므로 스크롤도 잠그지 않음

    var lines = Array.prototype.slice.call(titleEl.querySelectorAll('.typing-line'));
    if (!lines.length) return;

    var CHAR = 62, GAP = 200;
    titleEl.style.minHeight = titleEl.getBoundingClientRect().height + 'px';

    var texts = lines.map(function (el) { return Array.from(el.textContent); });
    lines.forEach(function (el) { el.textContent = ''; });

    var cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    lines[0].appendChild(cursor);

    function put(lineEl, ch) {
      var textNode = document.createTextNode(ch);
      lineEl.insertBefore(textNode, cursor);
    }

    /* ── 스크롤 잠금: body(및 html) 스크롤만 제어, 페이지 전체를 고정하는 방식은 아님 ── */
    var SCROLL_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Spacebar'];
    var typingLocked = false;

    function isInteractiveTarget(el) {
      return !!(el && el.closest && el.closest('a, button, input, textarea, select, [contenteditable="true"], [role="button"]'));
    }
    function blockWheelTouch(e) { e.preventDefault(); }
    function blockKeys(e) {
      if (SCROLL_KEYS.indexOf(e.key) === -1) return;
      if (isInteractiveTarget(e.target)) return; // 헤더 메뉴 등 키보드 조작은 그대로 허용
      e.preventDefault();
    }
    function lockTypingScroll() {
      if (typingLocked) return;
      typingLocked = true;
      document.documentElement.classList.add('hero-typing-lock');
      window.addEventListener('wheel', blockWheelTouch, { passive: false });
      window.addEventListener('touchmove', blockWheelTouch, { passive: false });
      window.addEventListener('keydown', blockKeys, { passive: false });
    }
    function unlockTypingScroll() {
      if (!typingLocked) return;
      typingLocked = false;
      document.documentElement.classList.remove('hero-typing-lock');
      window.removeEventListener('wheel', blockWheelTouch);
      window.removeEventListener('touchmove', blockWheelTouch);
      window.removeEventListener('keydown', blockKeys);
      clearTimeout(safetyTimer);
    }
    var totalChars = 0;
    texts.forEach(function (arr) { totalChars += arr.length; });
    // 안전장치: 예상 소요 시간을 넉넉히 초과하면 오류 여부와 무관하게 자동 해제
    var safetyTimer = null;

    var li = 0, ci = 0;
    function next() {
      if (li >= lines.length) {
        if (cursor.parentNode) cursor.parentNode.removeChild(cursor);
        titleEl.style.minHeight = '';
        unlockTypingScroll(); // 타이핑 완료 즉시 스크롤 잠금 해제
        return;
      }
      var chars = texts[li];
      if (ci < chars.length) {
        put(lines[li], chars[ci]); ci++;
        setTimeout(next, CHAR);
      } else {
        li++; ci = 0;
        if (li < lines.length) lines[li].appendChild(cursor);
        setTimeout(next, GAP);
      }
    }

    // 타이핑 시작 + 서브 카피 페이드인: 인트로가 완전히 사라진 뒤 실행
    onIntroDone(function () {
      lockTypingScroll();
      safetyTimer = setTimeout(unlockTypingScroll, totalChars * CHAR + lines.length * GAP + 2000);
      setTimeout(next, 300);
      if (hasGSAP) {
        gsap.to('#heroSub', { opacity: 1, y: 0, duration: 0.9, delay: 0.45, ease: 'power2.out' });
      } else {
        var sub = document.getElementById('heroSub');
        if (sub) sub.style.opacity = 1;
      }
    });
  })();

  /* -------------------------------------------------- Fullscreen Intro (DATA / SYSTEM / STABILITY)
     최초 진입 시 헤더보다 먼저 재생되는 풀스크린 인트로.
     재생 정책: 현재는 새로고침마다 항상 재생됨.
     세션당 1회만 재생하려면 아래 "SESSION-ONCE" 주석 블록의 주석을 해제하세요. */
  (function intro() {
    var introEl = document.getElementById('introScreen');
    var header = document.getElementById('siteHeader');
    var root = document.documentElement;

    if (!introEl) { markIntroDone(); return; }

    /* ---- SESSION-ONCE (선택 적용) ----------------------------------------
    if (window.sessionStorage && sessionStorage.getItem('vatosIntroPlayed')) {
      introEl.parentNode.removeChild(introEl);
      if (header) header.classList.add('is-visible');
      markIntroDone();
      return;
    }
    ------------------------------------------------------------------------- */

    root.classList.add('intro-lock'); // 인트로 재생 중 스크롤 잠금

    function finish() {
      root.classList.remove('intro-lock');
      if (header) header.classList.add('is-visible');
      introEl.classList.add('is-done');
      // if (window.sessionStorage) sessionStorage.setItem('vatosIntroPlayed', '1'); // SESSION-ONCE 사용 시 주석 해제
      setTimeout(function () {
        if (introEl.parentNode) introEl.parentNode.removeChild(introEl);
      }, 700);
      markIntroDone();
    }

    if (REDUCE) {
      // 모션 감소 사용자: 긴 시퀀스 생략, 짧은 페이드 후 바로 Hero 노출
      introEl.classList.add('is-fading');
      setTimeout(finish, 220);
      return;
    }

    var words = Array.prototype.slice.call(introEl.querySelectorAll('.rd-intro__word'));
    function showWord(i) {
      words.forEach(function (w, idx) { w.classList.toggle('is-active', idx === i); });
    }
    function hideAll() {
      words.forEach(function (w) { w.classList.remove('is-active'); });
    }

    showWord(0);                                    // 0ms     DATA 등장
    setTimeout(function () { showWord(1); }, 650);   // 650ms   SYSTEM 등장 (DATA는 동시에 페이드아웃 — 크로스페이드)
    setTimeout(function () { showWord(2); }, 1300);  // 1300ms  STABILITY 등장
    setTimeout(hideAll, 2200);                       // 2200ms  글자 먼저 페이드아웃
    setTimeout(function () { introEl.classList.add('is-fading'); }, 2550); // 2550ms  흰 배경 페이드아웃 시작
    setTimeout(finish, 3150);                        // 3150ms  인트로 종료 → 헤더/Hero 노출, 타이핑 시작
  })();

  if (REDUCE) {
    var heroSub = document.getElementById('heroSub');
    if (heroSub) heroSub.style.opacity = 1;
    return;
  }

  if (!hasGSAP || !window.ScrollTrigger) return;

  /* -------------------------------------------------- Business Areas pinned cross-fade */
  (function businessAreas() {
    var sec = document.getElementById('baSection');
    if (!sec) return;
    var imgs = gsap.utils.toArray('.rd-ba__img');
    var slides = gsap.utils.toArray('.rd-ba__slide');
    var rail = gsap.utils.toArray('#baRail button');
    var countEl = document.getElementById('baCount');
    var stageNum = document.getElementById('baStageNum');
    var N = imgs.length;
    if (!N) return;

    var isDesktop = window.matchMedia('(min-width: 901px)').matches;

    function activate(idx) {
      idx = Math.max(0, Math.min(N - 1, idx));
      imgs.forEach(function (el, i) { el.classList.toggle('active', i === idx); });
      slides.forEach(function (el, i) { el.classList.toggle('active', i === idx); });
      rail.forEach(function (el, i) { el.classList.toggle('active', i === idx); });
      var label = ('0' + (idx + 1)).slice(-2);
      if (countEl) countEl.textContent = label;
      if (stageNum) stageNum.textContent = label;
    }

    // rail click (works on all breakpoints)
    rail.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.getAttribute('data-idx'), 10);
        activate(idx);
        if (isDesktop && st) {
          var target = st.start + (st.end - st.start) * (idx / (N));
          window.scrollTo({ top: target + 4, behavior: 'smooth' });
        }
      });
    });

    var st = null;
    if (isDesktop) {
      var trig = ScrollTrigger.create({
        trigger: sec, start: 'top top', end: '+=' + (N * 100) + '%',
        pin: true, scrub: 0.4, anticipatePin: 1,
        onUpdate: function (self) {
          var idx = Math.min(N - 1, Math.floor(self.progress * N));
          activate(idx);
        }
      });
      st = trig;
    } else {
      // mobile: auto-advance via IntersectionObserver stepping is overkill;
      // simply reveal each on scroll by observing the slides container height.
      activate(0);
    }
    activate(0);
  })();

  /* -------------------------------------------------- Company & TI figure mask via ScrollTrigger (batch fallback covered by IO) */
  (function figures() {
    ['#companyFigure', '#tiFigure'].forEach(function (sel) {
      var el = document.querySelector(sel);
      if (!el) return;
      ScrollTrigger.create({
        trigger: el, start: 'top 82%',
        onEnter: function () { el.classList.add('is-in'); }
      });
    });
  })();

  // Refresh after fonts/images settle
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
