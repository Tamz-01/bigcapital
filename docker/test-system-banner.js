// Loaded only by the isolated test image, never the production application.
(() => {
  const storageKey = 'bigcapital:test-system-banner-dismissed';
  const banner = document.createElement('aside');
  banner.setAttribute('aria-label', 'Test system notice');
  banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:2147483647;background:#ffc400;color:#111;text-align:center;font:600 13px sans-serif;padding:6px 42px;';
  banner.append('TEST SYSTEM - Demo data only | ');

  const source = document.createElement('a');
  source.href = 'https://github.com/Tamz-01/bigcapital';
  source.target = '_blank';
  source.rel = 'noopener noreferrer';
  source.textContent = 'Source code';
  banner.append(source);

  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = '\u00d7';
  close.setAttribute('aria-label', 'Dismiss test system notice');
  close.title = 'Hide until your next login';
  close.style.cssText = 'position:absolute;right:6px;top:0;bottom:0;border:0;background:transparent;color:inherit;font-size:24px;cursor:pointer;padding:0 8px;';
  banner.append(close);

  const syncVisibility = () => {
    try {
      banner.hidden = localStorage.getItem(storageKey) === 'true';
    } catch {
      // Storage restrictions must not prevent the notice from displaying.
    }
  };
  close.addEventListener('click', () => {
    banner.hidden = true;
    try {
      localStorage.setItem(storageKey, 'true');
    } catch {
      // Dismissal still works for this page when browser storage is unavailable.
    }
  });
  window.addEventListener('bigcapital:login', () => {
    banner.hidden = false;
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // A successful login always restores the notice in this tab.
    }
  });
  window.addEventListener('storage', (event) => {
    if (event.key === storageKey || event.key === null) syncVisibility();
  });
  syncVisibility();
  document.body.append(banner);
})();
