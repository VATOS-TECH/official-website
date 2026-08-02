/* ============================================================
   VATOS — Site interactions
   전체 페이지 공통 기능과 페이지별 기능을 하나의 파일에서 관리한다.
   각 기능은 대상 DOM이 있을 때만 실행된다.
   ============================================================ */
(function () {
  'use strict';

  var BASE_URL = 'https://vatos-tech.github.io/official-website';
  document.documentElement.classList.add('vatos-js');

  var REDUCE = !!(
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  window.VATOS_REDUCE = REDUCE;

  function toArray(items) {
    return Array.prototype.slice.call(items || []);
  }

  document.addEventListener('click', function (event) {
    var target = event.target;
    var logo = target && target.closest
      ? target.closest('.vatos-logo[data-vatos-skip-intro]')
      : null;
    if (!logo) return;

    try {
      window.sessionStorage.setItem('vatosSkipIntroOnce', 'true');
    } catch (error) {
      console.warn('[VATOS] 인트로 생략 상태를 저장하지 못했습니다.', error);
    }
  });

  function observeOnce(elements, callback, options) {
    var targets = toArray(elements);
    if (!targets.length) return null;

    if (REDUCE || !('IntersectionObserver' in window)) {
      targets.forEach(function (element, index) {
        callback(element, index);
      });
      return null;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        callback(entry.target, targets.indexOf(entry.target));
        observer.unobserve(entry.target);
      });
    }, options || {});

    targets.forEach(function (element) {
      observer.observe(element);
    });
    return observer;
  }

  function revealElements(elements, settings) {
    var options = settings || {};
    var className = options.className || 'visible';
    var delay = options.delay || 0;

    observeOnce(elements, function (element, index) {
      var wait = typeof delay === 'function' ? delay(index) : delay;
      if (REDUCE || !wait) {
        element.classList.add(className);
        return;
      }
      window.setTimeout(function () {
        element.classList.add(className);
      }, wait);
    }, {
      threshold: options.threshold || 0.15,
      rootMargin: options.rootMargin || '0px 0px -8% 0px'
    });
  }

  function bindRafScroll(update) {
    var ticking = false;
    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        update();
      });
    }

    update();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    window.addEventListener('load', requestUpdate);
    return requestUpdate;
  }

  function getScrollProgress(rect, anchorRatio, clampToPageEnd) {
    if (!rect || rect.height <= 0) return 0;

    var scrollY = window.scrollY || window.pageYOffset;
    var viewportH = window.innerHeight;
    var anchorY = viewportH * anchorRatio;
    var startAbs = rect.top + scrollY;
    var endAbs = startAbs + rect.height;
    var startScrollY = startAbs - anchorY;
    var endScrollY = endAbs - anchorY;

    if (clampToPageEnd) {
      endScrollY = Math.min(
        endScrollY,
        Math.max(0, document.documentElement.scrollHeight - viewportH)
      );
    }

    if (endScrollY <= startScrollY) {
      return scrollY >= startScrollY ? 1 : 0;
    }
    return Math.max(
      0,
      Math.min(1, (scrollY - startScrollY) / (endScrollY - startScrollY))
    );
  }

  /*
     GitHub Pages에서는 상대경로를 그대로 사용한다.
     우피 도메인에서 실행될 때만 VATOS 영역의 상대 assets 경로를
     GitHub Pages 절대경로로 변경한다.
  */
  function normalizeAssetPaths() {
    if (
      window.location.protocol === 'file:' ||
      window.location.hostname === 'vatos-tech.github.io'
    ) return;

    function toAbsoluteAssetUrl(value) {
      if (!value || /^(?:https?:|data:|blob:)/i.test(value)) return value;
      var normalized = value.replace(/^(?:\.\.\/)+/, '').replace(/^\//, '');
      return normalized.indexOf('assets/') === 0
        ? BASE_URL + '/' + normalized
        : value;
    }

    document.querySelectorAll(
      '[src*="assets/"], [href*="assets/"], [style*="assets/"]'
    ).forEach(function (element) {
      if (!element.closest(
        '[class^="vatos-"], [class*=" vatos-"]'
      )) return;

      ['src', 'href'].forEach(function (attribute) {
        if (!element.hasAttribute(attribute)) return;
        element.setAttribute(
          attribute,
          toAbsoluteAssetUrl(element.getAttribute(attribute))
        );
      });

      if (element.hasAttribute('style')) {
        element.setAttribute(
          'style',
          element.getAttribute('style').replace(
            /url\(\s*(['"]?)((?:\.\.\/)+|\/)?assets\/([^'")]+)\1\s*\)/gi,
            'url("' + BASE_URL + '/assets/$3")'
          )
        );
      }
    });
  }

  function scheduleAssetPathNormalization() {
    window.setTimeout(normalizeAssetPaths, 600);
  }

  if (document.readyState === 'complete') {
    scheduleAssetPathNormalization();
  } else {
    window.addEventListener(
      'load',
      scheduleAssetPathNormalization,
      { once: true }
    );
  }

  /* ── 공통 기능 ─────────────────────────────────────────── */
  var hamburgerBtn = document.getElementById('hamburgerBtn');
  var mobileNav = document.getElementById('mobileNav');

  function closeMobileNav() {
    if (!mobileNav || !hamburgerBtn) return;
    mobileNav.classList.remove('open');
    hamburgerBtn.classList.remove('active');
  }

  (function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (event) {
        var href = anchor.getAttribute('href');
        if (href === '#' || href.length < 2) return;
        var target = document.querySelector(href);
        if (!target) return;

        event.preventDefault();
        window.scrollTo({
          top: target.getBoundingClientRect().top + window.scrollY - 90,
          behavior: 'smooth'
        });
        closeMobileNav();
      });
    });
  })();

  (function initHeader() {
    var inner = document.querySelector('.vatos-header-inner');
    var header = inner ? inner.closest('.vatos-header') : null;
    if (!header) return;

    function updateHeader() {
      header.classList.toggle('scrolled', window.scrollY > 40);
    }
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
  })();

  (function initMobileNav() {
    if (!hamburgerBtn || !mobileNav) return;

    hamburgerBtn.addEventListener('click', function () {
      var isOpen = mobileNav.classList.toggle('open');
      hamburgerBtn.classList.toggle('active', isOpen);
    });
    document.addEventListener('click', function (event) {
      if (
        !hamburgerBtn.contains(event.target) &&
        !mobileNav.contains(event.target)
      ) {
        closeMobileNav();
      }
    });
  })();

  (function initAddressCopy() {
    var buttons = document.querySelectorAll('.vatos-location-copy-btn');
    if (!buttons.length) return;

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        var row = button.closest('.vatos-location-addr-row');
        if (!row) return;

        var address = row.querySelector('.vatos-copy-address');
        var toast = row.querySelector('.vatos-location-copy-toast');
        var text = address ? (address.textContent || '').trim() : '';

        function showToast() {
          if (!toast) return;
          toast.classList.add('show');
          window.setTimeout(function () {
            toast.classList.remove('show');
          }, 1800);
        }

        function fallbackCopy() {
          var textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.focus();
          textarea.select();
          try {
            document.execCommand('copy');
            showToast();
          } catch (error) {}
          document.body.removeChild(textarea);
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(showToast).catch(fallbackCopy);
        } else {
          fallbackCopy();
        }
      });
    });
  })();

  (function initDropdownParents() {
    var parents = document.querySelectorAll(
      '.vatos-nav-link[href="#"][data-menu], ' +
      '.vatos-mobile-nav-link[href="#"][data-menu]'
    );
    parents.forEach(function (element) {
      element.addEventListener('click', function (event) {
        event.preventDefault();
      });
    });
  })();

  (function initSubHero() {
    var hero = document.querySelector('.vatos-sub-hero');
    if (!hero) return;
    window.requestAnimationFrame(function () {
      hero.classList.add('ready');
    });
  })();

  (function initCommonReveal() {
    revealElements(
      document.querySelectorAll(
        '.vatos-motion-reveal, .vatos-motion-left, ' +
        '.vatos-motion-right'
      )
    );
  })();

  /*
     clip-path로 완전히 가려진 mask 요소는 브라우저에 따라
     IntersectionObserver의 교차 영역이 0으로 계산될 수 있다.
     따라서 mask 자체가 아닌 가려지지 않은 부모를 감지한다.
  */
  (function initMotionMasks() {
    var masks = document.querySelectorAll('.vatos-motion-mask');
    if (!masks.length) return;

    masks.forEach(function (mask) {
      var trigger = mask.parentElement || mask;
      observeOnce([trigger], function () {
        mask.classList.add('visible');
      }, {
        threshold: 0.15,
        rootMargin: '0px 0px -8% 0px'
      });
    });

    /*
       우피 렌더링 환경에서 Observer 이벤트가 누락되더라도
       실제 화면 위치를 기준으로 한 번 더 확인한다.
    */
    bindRafScroll(function () {
      masks.forEach(function (mask) {
        if (mask.classList.contains('visible')) return;
        var trigger = mask.parentElement || mask;
        var rect = trigger.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.92 && rect.bottom >= 0) {
          mask.classList.add('visible');
        }
      });
    });
  })();

  /* ── 문의 메일 ───────────────────────────────────────── */

  (function initContactForm() {
  var form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    var formData = new FormData(form);
    var name = String(formData.get('name') || '').trim();
    var company = String(formData.get('company') || '').trim();
    var email = String(formData.get('email') || '').trim();
    var phone = String(formData.get('phone') || '').trim();
    var inquiryType = String(formData.get('inquiry_type') || '').trim();
    var message = String(formData.get('message') || '').trim();

    var subject =
      '[VATOS 서비스 문의] ' +
      inquiryType +
      ' | ' +
      company;

    var body = [
      '안녕하세요.',
      '',
      company + '의 ' + name + '입니다.',
      inquiryType + ' 관련하여 VATOS 홈페이지를 통해 문의드립니다.',
      '아래 내용을 확인하시어 담당자 회신 부탁드립니다.',
      '',
      '────────────────────',
      '문의 내용',
      '────────────────────',
      '문의 유형 : ' + inquiryType,
      '',
      message || '(작성 내용 없음)',
      '',
      '',
      '────────────────────',
      '문의자 정보',
      '────────────────────',
      '성함 : ' + name,
      '회사명 : ' + company,
      '이메일 : ' + email,
      '연락처 : ' + phone,
      '',
      '확인 후 회신 부탁드립니다.',
      '',
      '감사합니다.'
    ].join('\r\n');

    var mailtoUrl =
      'mailto:sales@vatos.co.kr' +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);

    window.location.href = mailtoUrl;

    window.setTimeout(function () {
      form.reset();
    }, 300);
  });
})();

  /* ── 메인 페이지 ───────────────────────────────────────── */
  (function initMainPage() {
    var introElement = document.getElementById('introScreen');
    var heroTitle = document.getElementById('heroTitle');
    var businessSection = document.getElementById('baSection');
    if (!introElement && !heroTitle && !businessSection) return;

    var hasGSAP = typeof window.gsap !== 'undefined';

    var introFinished = false;
    var introCallbacks = [];

    function onIntroDone(callback) {
      if (introFinished) callback();
      else introCallbacks.push(callback);
    }

    function markIntroDone() {
      introFinished = true;
      var callbacks = introCallbacks;
      introCallbacks = [];
      callbacks.forEach(function (callback) {
        callback();
      });
    }

    (function initHeroTyping() {
      if (!heroTitle || REDUCE) return;

      var lines = toArray(
        heroTitle.querySelectorAll('.vatos-typing-line')
      );
      if (!lines.length) return;

      var charDelay = 62;
      var lineGap = 200;
      var texts = lines.map(function (element) {
        return Array.from(element.textContent);
      });
      var totalChars = texts.reduce(function (sum, text) {
        return sum + text.length;
      }, 0);

      heroTitle.style.minHeight =
        heroTitle.getBoundingClientRect().height + 'px';
      lines.forEach(function (element) {
        element.textContent = '';
      });

      var cursor = document.createElement('span');
      cursor.className = 'vatos-typing-cursor';
      cursor.setAttribute('aria-hidden', 'true');
      lines[0].appendChild(cursor);

      var scrollKeys = [
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'PageUp', 'PageDown', 'Home', 'End', ' ', 'Spacebar'
      ];
      var typingLocked = false;
      var safetyTimer = null;

      function isInteractiveTarget(element) {
        return !!(
          element &&
          element.closest &&
          element.closest(
            'a, button, input, textarea, select, ' +
            '[contenteditable="true"], [role="button"]'
          )
        );
      }

      function blockWheelTouch(event) {
        event.preventDefault();
      }

      function blockKeys(event) {
        if (scrollKeys.indexOf(event.key) === -1) return;
        if (isInteractiveTarget(event.target)) return;
        event.preventDefault();
      }

      function lockTypingScroll() {
        if (typingLocked) return;
        typingLocked = true;
        document.documentElement.classList.add('vatos-hero-typing-lock');
        window.addEventListener('wheel', blockWheelTouch, { passive: false });
        window.addEventListener('touchmove', blockWheelTouch, { passive: false });
        window.addEventListener('keydown', blockKeys, { passive: false });
      }

      function unlockTypingScroll() {
        if (!typingLocked) return;
        typingLocked = false;
        document.documentElement.classList.remove('vatos-hero-typing-lock');
        window.removeEventListener('wheel', blockWheelTouch);
        window.removeEventListener('touchmove', blockWheelTouch);
        window.removeEventListener('keydown', blockKeys);
        window.clearTimeout(safetyTimer);
      }

      var lineIndex = 0;
      var charIndex = 0;

      function putCharacter(line, character) {
        line.insertBefore(document.createTextNode(character), cursor);
      }

      function typeNext() {
        if (lineIndex >= lines.length) {
          if (cursor.parentNode) cursor.parentNode.removeChild(cursor);
          heroTitle.style.minHeight = '';
          unlockTypingScroll();
          return;
        }

        var characters = texts[lineIndex];
        if (charIndex < characters.length) {
          putCharacter(lines[lineIndex], characters[charIndex]);
          charIndex += 1;
          window.setTimeout(typeNext, charDelay);
          return;
        }

        lineIndex += 1;
        charIndex = 0;
        if (lineIndex < lines.length) {
          lines[lineIndex].appendChild(cursor);
        }
        window.setTimeout(typeNext, lineGap);
      }

      onIntroDone(function () {
        lockTypingScroll();
        safetyTimer = window.setTimeout(
          unlockTypingScroll,
          totalChars * charDelay + lines.length * lineGap + 2000
        );
        window.setTimeout(typeNext, 300);

        if (hasGSAP) {
          window.gsap.to('#heroSub', {
            opacity: 1,
            y: 0,
            duration: 0.9,
            delay: 0.45,
            ease: 'power2.out'
          });
        } else {
          var sub = document.getElementById('heroSub');
          if (sub) sub.style.opacity = 1;
        }
      });
    })();

    (function initIntro() {
      var header = document.getElementById('vatosHeader');
      var root = document.documentElement;
      if (!introElement) {
        markIntroDone();
        return;
      }

      var skipIntro = false;
      try {
        skipIntro =
          window.sessionStorage.getItem('vatosSkipIntroOnce') === 'true';
        window.sessionStorage.removeItem('vatosSkipIntroOnce');
      } catch (error) {
        skipIntro = false;
      }

      if (skipIntro) {
        if (introElement.parentNode) {
          introElement.parentNode.removeChild(introElement);
        }
        if (header) header.classList.add('visible');
        markIntroDone();
        return;
      }

      root.classList.add('vatos-intro-lock');

      function finish() {
        root.classList.remove('vatos-intro-lock');
        if (header) header.classList.add('visible');
        introElement.classList.add('done');
        window.setTimeout(function () {
          if (introElement.parentNode) {
            introElement.parentNode.removeChild(introElement);
          }
        }, 700);
        markIntroDone();
      }

      if (REDUCE) {
        introElement.classList.add('fading');
        window.setTimeout(finish, 220);
        return;
      }

      var words = toArray(
        introElement.querySelectorAll('.vatos-main-intro-word')
      );

      function showWord(index) {
        words.forEach(function (word, wordIndex) {
          word.classList.toggle('active', wordIndex === index);
        });
      }

      function hideAll() {
        words.forEach(function (word) {
          word.classList.remove('active');
        });
      }

      showWord(0);
      window.setTimeout(function () { showWord(1); }, 650);
      window.setTimeout(function () { showWord(2); }, 1300);
      window.setTimeout(hideAll, 2200);
      window.setTimeout(function () {
        introElement.classList.add('fading');
      }, 2550);
      window.setTimeout(finish, 3150);
    })();

    (function initBusinessAreas() {
      if (!businessSection) return;

      var images = toArray(
        document.querySelectorAll('.vatos-main-business-img')
      );
      var slides = toArray(
        document.querySelectorAll('.vatos-main-business-slide')
      );
      var rail = toArray(
        document.querySelectorAll('#baRail button')
      );
      var count = document.getElementById('baCount');
      var stageNumber = document.getElementById('baStageNum');
      var total = images.length;
      if (!total) return;

      businessSection.style.setProperty(
        '--vatos-business-scroll-height',
        (total + 1) * 100 + 'vh'
      );

      var ticking = false;
      var scroller = null;

      function isDesktop() {
        return window.matchMedia('(min-width: 901px)').matches;
      }

      function getScroller() {
        var oopyScroller =
          businessSection.closest('.notion-scroller') ||
          document.querySelector(
            '.notion-scroller.vertical, .notion-scroller'
          );
        if (
          oopyScroller &&
          oopyScroller.scrollHeight > oopyScroller.clientHeight
        ) return oopyScroller;
        return window;
      }

      function getMetrics() {
        var currentScroller = scroller || window;
        if (currentScroller === window) {
          return {
            top: 0,
            height: window.innerHeight,
            scrollTop: window.scrollY || window.pageYOffset
          };
        }

        var rect = currentScroller.getBoundingClientRect();
        return {
          top: rect.top,
          height: currentScroller.clientHeight,
          scrollTop: currentScroller.scrollTop
        };
      }

      function activate(index) {
        index = Math.max(0, Math.min(total - 1, index));
        images.forEach(function (element, itemIndex) {
          element.classList.toggle('active', itemIndex === index);
        });
        slides.forEach(function (element, itemIndex) {
          element.classList.toggle('active', itemIndex === index);
        });
        rail.forEach(function (element, itemIndex) {
          element.classList.toggle('active', itemIndex === index);
        });

        var label = ('0' + (index + 1)).slice(-2);
        if (count) count.textContent = label;
        if (stageNumber) stageNumber.textContent = label;
      }

      function updateByScroll() {
        ticking = false;
        if (!isDesktop()) return;

        var metrics = getMetrics();
        var rect = businessSection.getBoundingClientRect();
        var distance = Math.max(
          1,
          businessSection.offsetHeight - metrics.height
        );
        var progress = Math.max(
          0,
          Math.min(1, (metrics.top - rect.top) / distance)
        );
        activate(
          Math.min(total - 1, Math.floor(progress * total))
        );
      }

      function requestUpdate() {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(updateByScroll);
      }

      function connectScroller() {
        var nextScroller = getScroller();
        if (scroller === nextScroller) return;
        if (scroller) {
          scroller.removeEventListener('scroll', requestUpdate);
        }
        scroller = nextScroller;
        scroller.addEventListener('scroll', requestUpdate, {
          passive: true
        });
      }

      function scrollToIndex(index) {
        if (!isDesktop()) return;
        var metrics = getMetrics();
        var rect = businessSection.getBoundingClientRect();
        var distance = Math.max(
          1,
          businessSection.offsetHeight - metrics.height
        );
        var sectionStart =
          metrics.scrollTop + rect.top - metrics.top;
        var target =
          sectionStart + distance * (index / total) + 4;

        if (scroller === window) {
          window.scrollTo({ top: target, behavior: 'smooth' });
        } else {
          scroller.scrollTo({ top: target, behavior: 'smooth' });
        }
      }

      rail.forEach(function (button) {
        button.addEventListener('click', function () {
          var index = parseInt(button.getAttribute('data-idx'), 10);
          activate(index);
          scrollToIndex(index);
        });
      });

      connectScroller();
      activate(0);
      requestUpdate();
      window.addEventListener('resize', function () {
        connectScroller();
        requestUpdate();
      });
      window.addEventListener('load', function () {
        connectScroller();
        requestUpdate();
      });
    })();

    if (REDUCE) {
      var heroSub = document.getElementById('heroSub');
      if (heroSub) heroSub.style.opacity = 1;
    }
  })();

  /* ── 하위 페이지 공통 ─────────────────────────────────── */
  (function initSubIntroDots() {
    var bodies = toArray(
      document.querySelectorAll('.vatos-sub-intro-body')
    );
    if (!bodies.length) return;

    bodies.forEach(function (body) {
      if (body.closest('[data-vatos-service]')) return;

      var dot = document.createElement('span');
      dot.className = 'vatos-sub-intro-dot';
      dot.setAttribute('aria-hidden', 'true');
      body.insertBefore(dot, body.firstChild);
      if (REDUCE) return;

      bindRafScroll(function () {
        var progress = getScrollProgress(
          body.getBoundingClientRect(),
          0.5,
          false
        );
        var percent = (progress * 100).toFixed(2) + '%';

        if (window.matchMedia('(max-width: 900px)').matches) {
          dot.style.top = '';
          dot.style.left = percent;
        } else {
          dot.style.left = '';
          dot.style.top = percent;
        }
      });
    });
  })();

  (function initLeadHighlight() {
    var leads = document.querySelectorAll('.vatos-sub-intro-lead');
    observeOnce(leads, function (lead) {
      lead.querySelectorAll('.vatos-highlight').forEach(function (highlight) {
        if (REDUCE) {
          highlight.classList.add('highlighted');
          return;
        }
        window.setTimeout(function () {
          highlight.classList.add('highlighted');
        }, 250);
      });
    }, { threshold: 0.5 });
  })();

  (function initServiceList() {
    revealElements(document.querySelectorAll('.vatos-service-item'), {
      delay: function (index) {
        return Math.min(index, 6) * 90;
      },
      threshold: 0.2,
      rootMargin: '0px 0px -6% 0px'
    });
  })();

  (function initProcess() {
    var track = document.querySelector('.vatos-process-track');
    if (!track) return;

    var steps = toArray(track.querySelectorAll('.vatos-step'));
    var svg = track.querySelector('.vatos-process-line');
    var path = svg ? svg.querySelector('path') : null;
    if (!steps.length) return;

    if (REDUCE) {
      steps.forEach(function (step) {
        step.classList.add('active');
      });
      return;
    }

    var drawn = false;

    function buildPath() {
      if (!svg || !path) return;
      var trackRect = track.getBoundingClientRect();
      if (!trackRect.width) return;

      svg.setAttribute(
        'viewBox',
        '0 0 ' + trackRect.width + ' ' + trackRect.height
      );

      var points = steps.map(function (step) {
        var number = step.querySelector('.vatos-step-num');
        var rect = (number || step).getBoundingClientRect();
        return {
          x: rect.left - trackRect.left + rect.width / 2,
          y: rect.top - trackRect.top + rect.height / 2
        };
      });
      if (points.length < 2) return;

      var data = 'M ' + points[0].x + ' ' + points[0].y;
      for (var index = 1; index < points.length; index += 1) {
        var previous = points[index - 1];
        var current = points[index];
        var middleY = (previous.y + current.y) / 2;
        data +=
          ' C ' + previous.x + ' ' + middleY +
          ', ' + current.x + ' ' + middleY +
          ', ' + current.x + ' ' + current.y;
      }

      path.setAttribute('d', data);
      path.style.setProperty(
        '--len',
        path.getTotalLength ? path.getTotalLength() : 2000
      );
    }

    function activateLine() {
      if (drawn) return;
      drawn = true;
      if (path) path.classList.add('drawn');
    }

    buildPath();
    window.addEventListener('resize', function () {
      if (path) path.classList.remove('drawn');
      buildPath();
      if (drawn) {
        window.requestAnimationFrame(function () {
          if (path) path.classList.add('drawn');
        });
      }
    });

    observeOnce([track], activateLine, { threshold: 0.15 });
    observeOnce(steps, function (step, index) {
      window.setTimeout(function () {
        step.classList.add('active');
      }, index * 170);
    }, {
      threshold: 0.4,
      rootMargin: '0px 0px -10% 0px'
    });

    window.addEventListener('load', function () {
      var wasDrawn = drawn;
      if (path) path.classList.remove('drawn');
      buildPath();
      if (wasDrawn) {
        window.requestAnimationFrame(function () {
          if (path) path.classList.add('drawn');
        });
      }
    });
  })();

  (function initStatsBar() {
    var bar = document.querySelector('.vatos-stats-bar');
    if (!bar) return;
    var stats = toArray(bar.querySelectorAll('.vatos-stat'));
    if (!stats.length) return;

    observeOnce([bar], function () {
      bar.classList.add('visible');
      stats.forEach(function (stat, index) {
        if (REDUCE) {
          stat.classList.add('active');
          return;
        }
        window.setTimeout(function () {
          stat.classList.add('active');
        }, 200 + index * 220);
      });
    }, { threshold: 0.35 });
  })();

  /* ── Business 상세 페이지 ──────────────────────────────── */
  function initBusinessFlows(scope) {
    var root = scope || document;
    var flows = toArray(root.querySelectorAll('.vatos-business-flow'));

    flows.forEach(function (flow) {
      if (flow.dataset.vatosFlowInitialized === 'true') return;
      flow.dataset.vatosFlowInitialized = 'true';

      observeOnce([flow], function () {
        flow.classList.add('drawn');
      }, {
        threshold: 0.2,
        rootMargin: '0px 0px -8% 0px'
      });

      revealElements(
        flow.querySelectorAll('.vatos-business-flow-step'),
        {
          className: 'visible',
          delay: function (index) {
            return index * 120;
          },
          threshold: 0.15,
          rootMargin: '0px 0px -6% 0px'
        }
      );
    });
  }

  function initBusinessCarousels(scope) {
    var root = scope || document;
    var carousels = toArray(root.querySelectorAll('.vatos-carousel-3d'));

    carousels.forEach(function (carousel) {
      if (carousel.dataset.vatosCarouselInitialized === 'true') return;
      carousel.dataset.vatosCarouselInitialized = 'true';

      var cards = toArray(
        carousel.querySelectorAll('.vatos-service-card')
      );
      var dots = toArray(
        carousel.querySelectorAll('.vatos-carousel-dot')
      );
      var count = cards.length;
      if (count < 2) return;

      var interval = parseInt(
        carousel.getAttribute('data-interval') || '3000',
        10
      );
      var firstDelay = parseInt(
        carousel.getAttribute('data-first-delay') || '1500',
        10
      );
      var active = parseInt(
        carousel.getAttribute('data-start') || '0',
        10
      ) % count;
      var timer = null;
      var firstTimer = null;
      var resizeTimer = null;
      var moved = false;
      var dragging = false;
      var downX = 0;
      var dragX = 0;
      var dragShifted = false;

      var slotClasses = {
        '0': 'center',
        '1': 'right',
        '-1': 'left',
        '2': 'right-2',
        '-2': 'left-2'
      };
      var stateClasses = [
        'center',
        'left',
        'right',
        'left-2',
        'right-2'
      ];

      function isStacked() {
        if (carousel.getAttribute('data-mobile-3d') === 'true') {
          return false;
        }
        return !!(
          window.matchMedia &&
          window.matchMedia('(max-width: 900px)').matches
        );
      }

      function render() {
        cards.forEach(function (card, index) {
          var relative = ((index - active) % count + count) % count;
          var offset = relative > count / 2 ? relative - count : relative;
          var stateClass = slotClasses[String(offset)];

          stateClasses.forEach(function (className) {
            card.classList.remove(className);
          });

          if (stateClass) {
            card.classList.add(stateClass);
          }

          card.setAttribute(
            'aria-hidden',
            offset === 0 ? 'false' : 'true'
          );
        });

        dots.forEach(function (dot, index) {
          dot.classList.toggle('active', index === active);
        });
      }

      function go(index) {
        active = ((index % count) + count) % count;
        render();
      }

      function next() {
        if (!carousel.isConnected) {
          stop();
          return;
        }
        go(active + 1);
      }

      function previous() {
        go(active - 1);
      }

      function start() {
        if (REDUCE || isStacked() || timer || firstTimer) return;

        firstTimer = window.setTimeout(function () {
          firstTimer = null;
          next();
          timer = window.setInterval(next, interval);
        }, firstDelay);
      }

      function stop() {
        if (firstTimer) {
          window.clearTimeout(firstTimer);
          firstTimer = null;
        }
        if (timer) {
          window.clearInterval(timer);
          timer = null;
        }
      }

      function getClientX(event) {
        if (event.touches && event.touches.length) {
          return event.touches[0].clientX;
        }
        if (event.changedTouches && event.changedTouches.length) {
          return event.changedTouches[0].clientX;
        }
        return event.clientX;
      }

      function handleDown(event) {
        dragging = true;
        moved = false;
        downX = getClientX(event);
        dragX = downX;
        dragShifted = false;
        carousel.classList.add('dragging');

        if (
          event.pointerId !== undefined &&
          event.currentTarget.setPointerCapture
        ) {
          event.currentTarget.setPointerCapture(event.pointerId);
        }

        stop();
      }

      function handleMove(event) {
        if (!dragging) return;

        var currentX = getClientX(event);
        var totalDistance = currentX - downX;
        var stepDistance = currentX - dragX;

        if (Math.abs(totalDistance) > 8) {
          moved = true;
        }

        if (stepDistance <= -42) {
          next();
          dragX = currentX;
          dragShifted = true;
        } else if (stepDistance >= 42) {
          previous();
          dragX = currentX;
          dragShifted = true;
        }

        if (moved && event.cancelable) {
          event.preventDefault();
        }
      }

      function handleUp(event) {
        if (!dragging) return;

        dragging = false;
        carousel.classList.remove('dragging');
        var distance = getClientX(event) - downX;

        if (!dragShifted && Math.abs(distance) > 42) {
          if (distance < 0) {
            next();
          } else {
            previous();
          }
        }

        start();
        window.setTimeout(function () {
          moved = false;
        }, 180);
      }

      function handleCancel() {
        if (!dragging) return;
        dragging = false;
        carousel.classList.remove('dragging');
        start();
        window.setTimeout(function () {
          moved = false;
        }, 180);
      }

      cards.forEach(function (card, index) {
        card.querySelectorAll('img').forEach(function (image) {
          image.setAttribute('draggable', 'false');
        });

        card.addEventListener('click', function () {
          if (moved) return;
          stop();
          go(index);
          start();
        });
      });

      dots.forEach(function (dot, index) {
        dot.addEventListener('click', function () {
          stop();
          go(index);
          start();
        });
      });

      carousel.addEventListener('focusin', stop);
      carousel.addEventListener('focusout', start);

      var viewport =
        carousel.querySelector('.vatos-carousel-viewport') || carousel;

      if (window.PointerEvent) {
        viewport.addEventListener('pointerdown', handleDown);
        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', handleUp);
        window.addEventListener('pointercancel', handleCancel);
      } else {
        viewport.addEventListener('touchstart', handleDown, { passive: true });
        viewport.addEventListener('touchmove', handleMove, { passive: false });
        viewport.addEventListener('touchend', handleUp);
      }

      window.addEventListener('resize', function () {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(function () {
          if (isStacked()) {
            stop();
          } else {
            render();
            start();
          }
        }, 200);
      });

      document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
          stop();
        } else {
          start();
        }
      });

      window.addEventListener('pagehide', stop);
      render();
      start();
    });
  }

  function initBusinessMarquees(scope) {
    var root = scope || document;
    var marquees = toArray(root.querySelectorAll('.vatos-card-marquee'));

    marquees.forEach(function (marquee) {
      if (marquee.dataset.vatosMarqueeInitialized === 'true') return;
      marquee.dataset.vatosMarqueeInitialized = 'true';

      var track = marquee.querySelector('.vatos-card-marquee-track');
      if (!track || !track.children.length) return;

      var originalCount = track.children.length;
      var originals = toArray(track.children).map(function (element) {
        return element.cloneNode(true);
      });
      var cycle = parseInt(
        marquee.getAttribute('data-cycle') || '40000',
        10
      );
      var setWidth = 0;
      var offset = 0;
      var lastFrame = 0;
      var paused = false;
      var dragging = false;
      var visible = !('IntersectionObserver' in window);
      var downX = 0;
      var lastX = 0;
      var resizeTimer = null;

      function appendSet() {
        originals.forEach(function (element) {
          track.appendChild(element.cloneNode(true));
        });
      }

      function applyPosition() {
        track.style.transform =
          'translate3d(' + offset.toFixed(2) + 'px, 0, 0)';
      }

      function wrapPosition() {
        if (setWidth <= 0) return;
        while (offset <= -setWidth) {
          offset += setWidth;
        }
        while (offset > 0) {
          offset -= setWidth;
        }
      }

      function build() {
        while (track.children.length > originalCount) {
          track.removeChild(track.lastChild);
        }

        appendSet();
        setWidth =
          track.children[originalCount].offsetLeft -
          track.children[0].offsetLeft;

        var requiredWidth = marquee.clientWidth + setWidth + 400;
        var guard = 0;

        while (track.scrollWidth < requiredWidth && guard < 40) {
          appendSet();
          guard += 1;
        }

        offset = 0;
        applyPosition();
      }

      function frame(timestamp) {
        if (!marquee.isConnected) return;

        if (lastFrame) {
          var elapsed = timestamp - lastFrame;
          if (elapsed > 100) {
            elapsed = 16;
          }

          if (
            visible &&
            !paused &&
            !dragging &&
            !REDUCE &&
            setWidth > 0
          ) {
            offset -= (setWidth / cycle) * elapsed;
            wrapPosition();
            applyPosition();
          }
        }

        lastFrame = timestamp;
        window.requestAnimationFrame(frame);
      }

      function getClientX(event) {
        if (event.touches && event.touches.length) {
          return event.touches[0].clientX;
        }
        return event.clientX;
      }

      function handleDown(event) {
        dragging = true;
        downX = getClientX(event);
        lastX = downX;
        marquee.classList.add('dragging');
      }

      function handleMove(event) {
        if (!dragging) return;

        var currentX = getClientX(event);
        offset += currentX - lastX;
        lastX = currentX;
        wrapPosition();
        applyPosition();
      }

      function handleUp() {
        if (!dragging) return;
        dragging = false;
        marquee.classList.remove('dragging');
      }

      marquee.addEventListener('mouseenter', function () {
        paused = true;
      });
      marquee.addEventListener('mouseleave', function () {
        paused = false;
      });

      if (window.PointerEvent) {
        marquee.addEventListener('pointerdown', handleDown);
        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', handleUp);
      } else {
        marquee.addEventListener('touchstart', handleDown, { passive: true });
        marquee.addEventListener('touchmove', handleMove, { passive: true });
        window.addEventListener('touchend', handleUp);
      }

      track.addEventListener('dragstart', function (event) {
        event.preventDefault();
      });

      if ('IntersectionObserver' in window) {
        var visibilityObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.target === marquee) {
              visible = entry.isIntersecting;
            }
          });
        }, { threshold: 0.01 });

        visibilityObserver.observe(marquee);
      }

      window.addEventListener('load', build);
      window.addEventListener('resize', function () {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(build, 200);
      });

      build();
      window.requestAnimationFrame(frame);
    });
  }

  function initPerformanceHoverGalleries(scope) {
    var root = scope || document;
    var galleries = toArray(
      root.querySelectorAll('.vatos-performance-hover-gallery')
    );

    galleries.forEach(function (gallery) {
      if (gallery.dataset.vatosHoverGalleryInitialized === 'true') return;
      gallery.dataset.vatosHoverGalleryInitialized = 'true';

      var cards = toArray(
        gallery.querySelectorAll('.vatos-performance-hover-card')
      );
      var content = gallery.querySelector(
        '.vatos-performance-hover-content'
      );
      var number = content
        ? content.querySelector('.vatos-performance-hover-num')
        : null;
      var title = content
        ? content.querySelector('.vatos-performance-hover-title')
        : null;
      var description = content
        ? content.querySelector('.vatos-performance-hover-desc')
        : null;
      if (!cards.length || !content) return;

      var defaultIndex = parseInt(
        gallery.getAttribute('data-default-index') || '0',
        10
      );
      if (defaultIndex < 0 || defaultIndex >= cards.length) {
        defaultIndex = 0;
      }
      var contentFrame = null;

      function activate(index) {
        var card = cards[index];
        if (!card) return;

        cards.forEach(function (item, itemIndex) {
          var active = itemIndex === index;
          item.classList.toggle('active', active);
          item.setAttribute('aria-current', active ? 'true' : 'false');
        });

        content.classList.remove('visible');
        if (contentFrame) {
          window.cancelAnimationFrame(contentFrame);
        }
        contentFrame = window.requestAnimationFrame(function () {
          if (number) {
            number.textContent = card.getAttribute('data-number') || '';
          }
          if (title) {
            title.textContent = card.getAttribute('data-title') || '';
          }
          if (description) {
            description.textContent =
              card.getAttribute('data-description') || '';
          }
          content.classList.add('visible');
          contentFrame = null;
        });
      }

      cards.forEach(function (card, index) {
        card.querySelectorAll('img').forEach(function (image) {
          image.setAttribute('draggable', 'false');
        });
        card.addEventListener('mouseenter', function () {
          activate(index);
        });
        card.addEventListener('focus', function () {
          activate(index);
        });
        card.addEventListener('click', function () {
          activate(index);
        });
      });

      gallery.addEventListener('mouseleave', function () {
        activate(defaultIndex);
      });
      gallery.addEventListener('focusout', function (event) {
        if (!gallery.contains(event.relatedTarget)) {
          activate(defaultIndex);
        }
      });

      activate(defaultIndex);
    });
  }

  function initializeBusinessComponents(scope) {
    initBusinessFlows(scope);
    initBusinessCarousels(scope);
    initBusinessMarquees(scope);
    initPerformanceHoverGalleries(scope);
  }

  (function observeBusinessComponents() {
    initializeBusinessComponents(document);

    if (!('MutationObserver' in window)) return;

    var initializeTimer = null;
    var observer = new MutationObserver(function (mutations) {
      var hasAddedNodes = mutations.some(function (mutation) {
        return mutation.addedNodes && mutation.addedNodes.length > 0;
      });

      if (!hasAddedNodes) return;

      window.clearTimeout(initializeTimer);
      initializeTimer = window.setTimeout(function () {
        normalizeAssetPaths();
        initializeBusinessComponents(document);
      }, 120);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  })();

  /* ── History ───────────────────────────────────────────── */
  (function initHistoryTimeline() {
    var timeline = document.getElementById('hstTimeline');
    if (!timeline) return;

    var line = timeline.querySelector('.vatos-history-line');
    var fill = document.getElementById('hstLineFill');
    var indicator = document.getElementById('hstIndicator');
    var rows = toArray(timeline.querySelectorAll('.vatos-history-row'));
    if (!line || !fill || !indicator || !rows.length) return;

    if (REDUCE) {
      fill.style.transition = 'none';
      indicator.style.transition = 'none';
    } else {
      fill.style.transition = 'height .15s linear';
      indicator.style.transition = 'top .15s linear';
    }

    bindRafScroll(function () {
      var progress = getScrollProgress(
        line.getBoundingClientRect(),
        0.38,
        true
      );
      var percent = (progress * 100).toFixed(2) + '%';
      fill.style.height = percent;
      indicator.style.top = percent;

      var anchorY = window.innerHeight * 0.38;
      var maxScrollY = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight
      );
      var currentRow = null;
      var closestDistance = Infinity;

      rows.forEach(function (row) {
        var rect = row.getBoundingClientRect();
        var distance = Math.abs(
          rect.top + rect.height / 2 - anchorY
        );
        if (distance < closestDistance) {
          closestDistance = distance;
          currentRow = row;
        }
      });

      if ((window.scrollY || window.pageYOffset) >= maxScrollY - 1) {
        currentRow = rows[rows.length - 1];
      }
      rows.forEach(function (row) {
        row.classList.toggle('active', row === currentRow);
      });
    });
  })();

  /* ── Tech Insights ─────────────────────────────────────── */
  (function initInsightsPagination() {
    var list = document.querySelector('.vatos-insights-list');
    var nav = document.getElementById('insightPagination');
    if (!list || !nav) return;

    var cards = toArray(
      list.querySelectorAll('.vatos-insights-card')
    );
    if (!cards.length) return;

    var perPage = 9;
    cards.forEach(function (card, index) {
      var numberElement = card.querySelector(
        '.vatos-insights-card-num'
      );
      var number = numberElement
        ? parseInt((numberElement.textContent || '').trim(), 10)
        : NaN;
      card._num = isNaN(number) ? index : number;
    });

    var sorted = cards.slice().sort(function (first, second) {
      return second._num - first._num;
    });
    var totalPages = Math.ceil(sorted.length / perPage);
    sorted.forEach(function (card, index) {
      card._page = Math.floor(index / perPage) + 1;
      list.appendChild(card);
    });

    var nextButton = nav.querySelector('[data-goto="next"]');
    nav.querySelectorAll(
      '.vatos-page-btn:not(.vatos-page-nav)'
    ).forEach(function (button) {
      button.parentNode.removeChild(button);
    });

    var numberButtons = [];
    for (var pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'vatos-page-btn';
      button.setAttribute('data-goto', String(pageNumber));
      button.textContent = String(pageNumber);
      if (nextButton) nav.insertBefore(button, nextButton);
      else nav.appendChild(button);
      numberButtons.push(button);
    }

    function revealVisible(stagger) {
      var visibleCards = cards.filter(function (card) {
        return card.style.display !== 'none';
      });
      visibleCards.forEach(function (card, index) {
        if (REDUCE) {
          card.classList.add('visible');
          return;
        }
        card.classList.remove('visible');
        window.setTimeout(function () {
          card.classList.add('visible');
        }, stagger ? index * 70 : 0);
      });
    }

    var currentPage = 1;

    function applyPage(page) {
      currentPage = Math.min(Math.max(1, page), totalPages);
      cards.forEach(function (card) {
        card.style.display =
          card._page === currentPage ? '' : 'none';
      });
      numberButtons.forEach(function (button) {
        button.classList.toggle(
          'active',
          parseInt(button.getAttribute('data-goto'), 10) === currentPage
        );
      });

      var previousButton = nav.querySelector('[data-goto="prev"]');
      if (previousButton) previousButton.disabled = currentPage === 1;
      if (nextButton) nextButton.disabled = currentPage === totalPages;
    }

    function goToPage(page) {
      if (
        page === currentPage ||
        page < 1 ||
        page > totalPages
      ) return;

      if (REDUCE) {
        applyPage(page);
        revealVisible(false);
        return;
      }

      list.classList.add('swapping');
      window.setTimeout(function () {
        applyPage(page);
        list.classList.remove('swapping');
        revealVisible(true);
      }, 320);
    }

    nav.addEventListener('click', function (event) {
      var button = event.target.closest
        ? event.target.closest('.vatos-page-btn')
        : null;
      if (!button || button.disabled) return;

      var target = button.getAttribute('data-goto');
      var page =
        target === 'prev'
          ? currentPage - 1
          : target === 'next'
            ? currentPage + 1
            : parseInt(target, 10);

      goToPage(page);
      window.scrollTo({
        top: list.getBoundingClientRect().top + window.scrollY - 120,
        behavior: REDUCE ? 'auto' : 'smooth'
      });
    });

    applyPage(1);
    if (REDUCE || !('IntersectionObserver' in window)) {
      revealVisible(false);
    } else {
      observeOnce([list], function () {
        revealVisible(true);
      }, { threshold: 0.08 });
    }
  })();
})();
