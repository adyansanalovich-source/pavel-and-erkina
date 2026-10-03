// Подставьте URL опубликованного веб-приложения Google Apps Script.
const GUEST_LOOKUP_URL = 'https://script.google.com/macros/s/AKfycbzSiKIwW8VYCXja_qUB0jhM9EtMSNvrzOPiGj5pSbcMwkfWYI2BxrpKA-4vlCvgXn-2mQ/exec';
if (GUEST_LOOKUP_URL && /^[A-Z0-9]{6}$/.test(guestCode)) {
  window.weddingGuestLookup = function (value) {
    if (typeof value !== 'string' || !value.trim()) return;
    greeting = value.trim();
    document.getElementById('guest-greeting').textContent = greeting;
  };
  const url = new URL(GUEST_LOOKUP_URL);
  url.searchParams.set('id', guestCode);
  const script = document.createElement('script');
  script.src = url.href;
  script.onerror = () => script.remove();
  document.head.appendChild(script);
}
