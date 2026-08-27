function initializeSearch() {
  const searchForm = document.querySelector('.search-form');
  const searchInput = document.querySelector('#site-search');
  const searchableItems = document.querySelectorAll('.featured-artist, .song-card, .video-card');

  if (!searchForm || !searchInput) {
    return;
  }

  const filterContent = () => {
    const searchTerm = searchInput.value.trim().toLowerCase();

    searchableItems.forEach((item) => {
      item.hidden = !item.textContent.toLowerCase().includes(searchTerm);
    });
  };

  searchInput.addEventListener('input', filterContent);
  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    filterContent();
  });
}
