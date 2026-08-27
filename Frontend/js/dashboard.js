function initializeDashboard() {
  const dashboard = document.querySelector('.artist-dashboard');

  if (!dashboard) {
    return;
  }

  dashboard.classList.add('is-ready');
}
