// Loaded only by the isolated test image, never the production application.
(() => {
  const storageKey = 'bigcapital:test-system-banner-dismissed';
  const banner = document.createElement('aside');
  banner.setAttribute('aria-label', 'Test system notice');
  banner.style.cssText = 'position:relative;z-index:40;background:#ffc400;color:#111;text-align:center;font:600 13px/1.4 sans-serif;padding:10px 46px;overflow-wrap:anywhere;';
  banner.append('TEST SYSTEM - Demo data only | ');

  const source = document.createElement('a');
  source.href = 'https://github.com/Tamz-01/bigcapital';
  source.target = '_blank';
  source.rel = 'noopener noreferrer';
  source.textContent = 'Source code';
  source.style.color = 'inherit';
  source.style.textDecoration = 'underline';
  source.style.whiteSpace = 'nowrap';
  banner.append(source);

  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = '\u00d7';
  close.setAttribute('aria-label', 'Dismiss test system notice');
  close.title = 'Hide until your next login';
  close.style.cssText = 'position:absolute;inset-inline-end:0;inset-block:0;border:0;background:transparent;color:inherit;font-size:24px;cursor:pointer;width:44px;padding:0;';
  banner.append(close);

  const updateNoticeHeight = () => {
    document.documentElement.style.setProperty(
      '--test-notice-height',
      `${banner.offsetHeight}px`,
    );
  };

  const syncVisibility = () => {
    try {
      banner.hidden = localStorage.getItem(storageKey) === 'true';
    } catch {
      // Storage restrictions must not prevent the notice from displaying.
    }
    updateNoticeHeight();
  };
  close.addEventListener('click', () => {
    banner.hidden = true;
    updateNoticeHeight();
    try {
      localStorage.setItem(storageKey, 'true');
    } catch {
      // Dismissal still works for this page when browser storage is unavailable.
    }
  });
  window.addEventListener('bigcapital:login', () => {
    banner.hidden = false;
    updateNoticeHeight();
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // A successful login always restores the notice in this tab.
    }
  });
  window.addEventListener('storage', (event) => {
    if (event.key === storageKey || event.key === null) syncVisibility();
  });
  document.body.prepend(banner);
  syncVisibility();
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(updateNoticeHeight).observe(banner);
  } else {
    window.addEventListener('resize', updateNoticeHeight);
  }
})();
