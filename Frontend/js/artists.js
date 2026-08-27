function initializeArtistSlider() {
  const artistsContainer = document.querySelector('.artists-container');
  const previousArtistButton = document.querySelector('.artist-prev');
  const nextArtistButton = document.querySelector('.artist-next');

  if (!artistsContainer || !previousArtistButton || !nextArtistButton) {
    return;
  }

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
