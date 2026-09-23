'use strict';
// A shared keyboard-accessible navigation and honest network state.
const status = document.createElement('div');
status.className = 'network-status hidden';
status.setAttribute('role', 'status');
status.textContent = 'Sin conexión: puedes trabajar con tu selección y archivos locales. La búsqueda necesita internet.';
document.body.prepend(status);
const updateNetwork = () => status.classList.toggle('hidden', navigator.onLine);
window.addEventListener('online', updateNetwork);
window.addEventListener('offline', updateNetwork);
updateNetwork();
document.querySelectorAll('.tabs .tab').forEach((tab, index, tabs) => {
  tab.setAttribute('role', 'tab');
  tab.setAttribute('aria-controls', tab.dataset.mode + 'Pane');
  tab.setAttribute('aria-selected', String(tab.classList.contains('selected')));
  tab.tabIndex = tab.classList.contains('selected') ? 0 : -1;
  tab.addEventListener('click', () => tabs.forEach(t => {
    t.setAttribute('aria-selected', String(t === tab));
    t.tabIndex = t === tab ? 0 : -1;
  }));
  tab.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[next].click(); tabs[next].focus();
  });
});
