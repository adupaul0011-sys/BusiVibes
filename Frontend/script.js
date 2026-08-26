function playVideo(videoPath) {
  const modal = document.createElement('div');
  modal.className = 'video-modal';

  const video = document.createElement('video');
  video.src = videoPath;
  video.controls = true;
  video.autoplay = true;
  video.style.width = '80%';
  video.style.borderRadius = '10px';

  // Create close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✖';
  closeBtn.style.position = 'absolute';
  closeBtn.style.top = '20px';
  closeBtn.style.right = '30px';
  closeBtn.style.fontSize = '24px';
  closeBtn.style.color = 'white';
  closeBtn.style.background = 'none';
  closeBtn.style.border = 'none';
  closeBtn.style.cursor = 'pointer';

  closeBtn.addEventListener('click', () => {
    document.body.removeChild(modal);
  });

  modal.appendChild(video);
  modal.appendChild(closeBtn);
  document.body.appendChild(modal);
}

const artistsContainer = document.querySelector('.artists-container');
const previousArtistButton = document.querySelector('.artist-prev');
const nextArtistButton = document.querySelector('.artist-next');

if (artistsContainer && previousArtistButton && nextArtistButton) {
  const scrollArtists = (direction) => {
    const artist = artistsContainer.querySelector('.featured-artist');
    const gap = Number.parseInt(getComputedStyle(artistsContainer).gap, 10) || 0;
    const scrollAmount = artist ? artist.offsetWidth + gap : artistsContainer.clientWidth;

    artistsContainer.scrollBy({
      left: direction * scrollAmount,
      behavior: 'smooth'
    });
  };

  previousArtistButton.addEventListener('click', () => scrollArtists(-1));
  nextArtistButton.addEventListener('click', () => scrollArtists(1));
}

const searchForm = document.querySelector('.search-form');
const searchInput = document.querySelector('#site-search');
const searchableItems = document.querySelectorAll('.featured-artist, .song-card, .video-card');

if (searchForm && searchInput) {
  const filterContent = () => {
    const searchTerm = searchInput.value.trim().toLowerCase();

    searchableItems.forEach((item) => {
      const matches = item.textContent.toLowerCase().includes(searchTerm);
      item.hidden = !matches;
    });
  };

  searchInput.addEventListener('input', filterContent);
  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    filterContent();
  });
}

