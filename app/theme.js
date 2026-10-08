// Keep this small, blocking script ahead of CSS, including in the offline shell.
(() => {
  const key = 'zzpice-assets-theme';
  const root = document.documentElement;
  const media = matchMedia('(prefers-color-scheme: dark)');
  const normalize = value => value === 'light' || value === 'dark' ? value : 'system';
  let preference = 'system';
  try { preference = normalize(localStorage.getItem(key)); } catch {}

  function render() {
    const theme = preference === 'system' ? (media.matches ? 'dark' : 'light') : preference;
    root.dataset.themeMode = preference;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#151617' : '#ffffff';
    root.style.backgroundColor = document.querySelector('meta[name="theme-color"]').content;
    document.querySelector('meta[name="color-scheme"]').content = theme;
    document.querySelector('link[rel="manifest"]').href = theme === 'dark' ? 'app/manifest-dark.webmanifest' : 'app/manifest.webmanifest';
    const select = document.getElementById('appearance');
    if (select) select.value = preference;
  }
  render();
  media.addEventListener('change', () => { if (preference === 'system') render(); });
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) { preference = normalize(event.newValue); render(); }
  });
  window.addEventListener('pageshow', () => {
    try { preference = normalize(localStorage.getItem(key)); } catch {}
    render();
  });
  document.addEventListener('DOMContentLoaded', () => {
    const select = document.getElementById('appearance');
    render();
    select.hidden = false;
    select.addEventListener('change', () => {
      preference = normalize(select.value);
      try {
        if (preference === 'system') localStorage.removeItem(key);
        else localStorage.setItem(key, preference);
      } catch {}
      render();
    });
  });
})();
