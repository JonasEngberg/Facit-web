// Guide: a link to a topic (#guide-groups) opens it before scrolling there
function openGuideTopic() {
  const el = location.hash && document.getElementById(location.hash.slice(1));
  if (!el || !el.matches('details.topic')) return;
  el.open = true;
  el.scrollIntoView();
}
addEventListener('hashchange', openGuideTopic);
openGuideTopic();
