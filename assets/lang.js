// Language switcher: remember the choice and keep the current #section
document.querySelectorAll('a[data-lang]').forEach((a) => {
  a.addEventListener('click', () => {
    try { localStorage.setItem('lang', a.dataset.lang); } catch (e) { }
    a.href = a.href.split('#')[0] + location.hash;
  });
});
