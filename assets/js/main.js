/* ════════════ VATOS main.js ════════════ */

/* ── Hero 메인 문구 타이핑 애니메이션 (index.html의 #heroTitle이 있을 때만 동작) ──
   - 시작: 페이지 로드 약 300ms 후
   - 속도: 한 글자당 약 70ms (Array.from()으로 한글 음절이 깨지지 않게 분해)
   - 줄 사이 정지: 약 180ms
   - 타이핑 중 오른쪽에 청록색 커서가 깜빡이고, 새로 입력된 글자는 잠깐 청록색으로 강조된 뒤
     자연스럽게 기본 문구 색상(네이비)으로 전환됨
   - 완료 후 커서는 사라지고, 완성된 문구는 DOM에 그대로 남음(무한 반복 없음, 최초 1회만 실행)
   - prefers-reduced-motion 사용자는 애니메이션 없이 완성된 문구를 즉시 표시
   - 문구 전체는 HTML에 이미 존재하므로 JS가 실행되지 않아도 화면에서 사라지지 않음 */
(function () {
  var titleEl = document.getElementById('heroTitle');
  if (!titleEl) return;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return; // 문구는 이미 완성된 상태로 DOM에 있으므로 별도 처리 불필요

  var lines = Array.prototype.slice.call(titleEl.querySelectorAll('.typing-line'));
  if (!lines.length) return;

  var START_DELAY = 300; // 페이지 로드 후 타이핑 시작까지 대기(ms)
  var CHAR_SPEED = 70;   // 한 글자당 타이핑 간격(ms)
  var LINE_GAP = 180;    // 첫 줄 완료 후 다음 줄 시작까지 정지(ms)

  // 타이핑 도중 레이아웃이 흔들리지 않도록, 완성된 상태의 높이를 미리 고정
  titleEl.style.minHeight = titleEl.getBoundingClientRect().height + 'px';

  // 한글 음절 단위가 깨지지 않도록 Array.from()으로 문자 배열화
  var fullTexts = lines.map(function (el) { return Array.from(el.textContent); });
  lines.forEach(function (el) { el.textContent = ''; });

  var cursor = document.createElement('span');
  cursor.className = 'typing-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  lines[0].appendChild(cursor); // 시작 전, 첫 줄 앞에서 커서 대기

  function appendChar(lineEl, ch) {
    var span = document.createElement('span');
    span.className = 'type-char is-new';
    span.textContent = ch;
    lineEl.appendChild(span);
    lineEl.appendChild(cursor); // 커서를 항상 마지막으로 입력된 글자 뒤로 이동
    // 초기 청록색 강조가 먼저 화면에 반영된 뒤, 기본 색상으로 서서히 전환되도록 프레임을 한 번 넘김
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        span.classList.remove('is-new');
      });
    });
  }

  var lineIndex = 0;
  var charIndex = 0;

  function typeNext() {
    if (lineIndex >= lines.length) {
      if (cursor.parentNode) cursor.parentNode.removeChild(cursor); // 완료 후 커서 제거
      titleEl.style.minHeight = ''; // 완료 후 고정 높이 해제
      return;
    }
    var chars = fullTexts[lineIndex];
    if (charIndex < chars.length) {
      appendChar(lines[lineIndex], chars[charIndex]);
      charIndex++;
      setTimeout(typeNext, CHAR_SPEED);
    } else {
      lineIndex++;
      charIndex = 0;
      if (lineIndex < lines.length) {
        lines[lineIndex].appendChild(cursor); // 다음 줄 시작 위치로 커서 이동
      }
      setTimeout(typeNext, LINE_GAP);
    }
  }

  setTimeout(typeNext, START_DELAY);
})();

/* 같은 페이지 내 앵커(#id) 스무스 스크롤 — 멀티페이지 .html 링크엔 영향 없음 */
document.querySelectorAll('a[href^="#"]').forEach(function (a) {
  a.addEventListener('click', function (e) {
    var href = a.getAttribute('href');
    if (href === '#' || href.length < 2) return;
    var target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      var offset = 90; // 플로팅 헤더 높이 + 상단 여백
      var top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: top, behavior: 'smooth' });
      closeMobileNav();
    }
  });
});

/* 헤더 스크롤 시 짙은 배경 + blur (다크 플로팅 헤더 — 메인/Business Areas 상세페이지와 동일) */
(function () {
  var h = document.querySelector('header');
  if (!h) return;
  function onScroll() {
    if (window.scrollY > 40) h.classList.add('scrolled');
    else h.classList.remove('scrolled');
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();

/* 햄버거 / 모바일 내비게이션 */
var hamburgerBtn = document.getElementById('hamburgerBtn');
var mobileNav = document.getElementById('mobileNav');

function closeMobileNav() {
  if (!mobileNav || !hamburgerBtn) return;
  mobileNav.classList.remove('open');
  hamburgerBtn.classList.remove('active');
}

if (hamburgerBtn && mobileNav) {
  hamburgerBtn.addEventListener('click', function () {
    var isOpen = mobileNav.classList.toggle('open');
    hamburgerBtn.classList.toggle('active', isOpen);
  });
  document.addEventListener('click', function (e) {
    if (!hamburgerBtn.contains(e.target) && !mobileNav.contains(e.target)) {
      closeMobileNav();
    }
  });
}

/* ── 주소 복사 (careers / contact 찾아오시는 길) ── */
(function () {
  var buttons = document.querySelectorAll('.loc-copy-btn');
  if (!buttons.length) return;
  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var row = btn.closest('.loc-addr-row');
      if (!row) return;
      var addrEl = row.querySelector('.js-copy-addr');
      var toast = row.querySelector('.loc-copy-toast');
      var text = addrEl ? (addrEl.textContent || '').trim() : '';
      function showToast() {
        if (!toast) return;
        toast.classList.add('show');
        setTimeout(function () { toast.classList.remove('show'); }, 1800);
      }
      function fallbackCopy() {
        var ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.focus(); ta.select();
        try { document.execCommand('copy'); showToast(); } catch (e) {}
        document.body.removeChild(ta);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(showToast).catch(fallbackCopy);
      } else {
        fallbackCopy();
      }
    });
  });
})();

/* ── 상위 메뉴(드롭다운 부모) 클릭 시 페이지 이동 방지 ── */
/* About VATOS / Business Areas / Crew: href="#" + data-menu 를 가진 링크는 이동하지 않고 */
/* 드롭다운을 여는 역할만 한다. Tech Insights 등 실제 링크는 그대로 이동. */
(function () {
  var parents = document.querySelectorAll('.nav-link[href="#"][data-menu], .mnav-link[href="#"][data-menu]');
  parents.forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
    });
  });
})();

/* ── Tech Insights 페이지네이션 (자동, 7개씩) ──
   규칙: 콘텐츠 번호(insight-card-num) 기준 정렬 → 오래된 것부터 7개씩 묶고,
   가장 최신(번호가 높은) 묶음이 1페이지에 오도록 배치. 이전 묶음은 2·3페이지로 밀려남.
   콘텐츠를 추가하면 별도 태깅 없이 자동으로 7개씩 페이지가 나뉜다. */
(function () {
  var list = document.querySelector('.insight-list');
  var nav = document.getElementById('insightPagination');
  if (!list || !nav) return;
  var cards = Array.prototype.slice.call(list.querySelectorAll('.insight-card'));
  if (!cards.length) return;

  var perPage = 7;

  // 각 카드 번호 파싱 (없으면 DOM 순서로 대체)
  cards.forEach(function (c, idx) {
    var numEl = c.querySelector('.insight-card-num');
    var n = numEl ? parseInt((numEl.textContent || '').trim(), 10) : NaN;
    c._num = isNaN(n) ? idx : n;
  });

  // 오름차순(오래된→최신) 기준으로 7개씩 묶고, 최신 묶음을 1페이지로
  var asc = cards.slice().sort(function (a, b) { return a._num - b._num; });
  var totalPages = Math.ceil(asc.length / perPage);
  asc.forEach(function (c, i) {
    c._page = totalPages - Math.floor(i / perPage); // 최신 묶음 → 1페이지
  });

  // 화면 표시는 최신 우선(번호 내림차순)으로 DOM 재정렬
  cards.slice().sort(function (a, b) { return b._num - a._num; })
       .forEach(function (c) { list.appendChild(c); });

  // 페이지 번호 버튼 자동 생성 (prev/next 사이)
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

  var current = 1;
  function render(page) {
    current = Math.min(Math.max(1, page), totalPages);
    cards.forEach(function (c) {
      c.style.display = (c._page === current) ? '' : 'none';
    });
    numBtns.forEach(function (b) {
      b.classList.toggle('active', parseInt(b.getAttribute('data-goto'), 10) === current);
    });
    var prev = nav.querySelector('[data-goto="prev"]');
    if (prev) prev.disabled = (current === 1);
    if (nextBtn) nextBtn.disabled = (current === totalPages);
  }

  nav.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.page-btn') : null;
    if (!b || b.disabled) return;
    var g = b.getAttribute('data-goto');
    if (g === 'prev') render(current - 1);
    else if (g === 'next') render(current + 1);
    else render(parseInt(g, 10));
    list.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  render(1);
})();

/* ── 공통 스크롤 리빌 (.sv → .is-in) — 다크 상세페이지들과 동일한 Fade-up 기법 ── */
(function () {
  var els = document.querySelectorAll('.sv');
  if (!els.length) return;
  var REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (REDUCE || !('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('is-in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  els.forEach(function (el) { io.observe(el); });
})();

/* ── 서비스 문의하기 폼 제출 ──
   백엔드 연동 전까지, 필수값 검증 통과 시 접수 완료 안내만 표시한다.
   필수값이 비어 있으면 브라우저 기본 검증 메시지가 그대로 노출된다(HTML required 속성). */
(function () {
  var form = document.getElementById('contactForm');
  if (!form) return;
  var btn = form.querySelector('.btn-submit');
  form.addEventListener('submit', function (e) {
    e.preventDefault(); // 이 페이지는 정적 사이트이므로 실제 전송 대신 접수 완료 안내로 대체
    if (!btn) return;
    var original = btn.textContent;
    btn.disabled = true;
    btn.textContent = '접수되었습니다. 감사합니다!';
    setTimeout(function () {
      btn.disabled = false;
      btn.textContent = original;
      form.reset();
    }, 2600);
  });
})();
