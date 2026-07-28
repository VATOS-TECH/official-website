/* ============================================================
   VATOS — About VATOS 상세페이지 전용 스크립트
   Location(오시는 길) 페이지의 주소 복사 버튼만 처리한다.
   해당 요소가 없는 페이지(Company/History)에서는 아무 동작 없음.
   ============================================================ */
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
