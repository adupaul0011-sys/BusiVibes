function formatCount(value) {
  const safeValue = Number(value) || 0;
  return safeValue >= 1000 ? `${(safeValue / 1000).toFixed(1).replace(/\.0$/, '')}K` : String(safeValue);
}

function initializeDashboard() {
  const dashboard = document.querySelector('.artist-dashboard');

  if (!dashboard) {
    return;
  }

  const isLoggedIn = localStorage.getItem('busiVibesLoggedIn') === 'true';

  if (!isLoggedIn) {
    window.location.href = '../login.html';
    return;
  }

  const currentUser = JSON.parse(localStorage.getItem('busiVibesCurrentUser') || '{}');
  const storedStats = JSON.parse(localStorage.getItem('busiVibesArtistStats') || '{}');

  const artistName = document.getElementById('artistName');
  const artistWelcome = document.getElementById('artistWelcome');
  const songsPlayedEl = document.getElementById('songsPlayed');
  const videosWatchedEl = document.getElementById('videosWatched');
  const topSongEl = document.getElementById('topSong');
  const editProfileButton = document.getElementById('editProfileButton');
  const uploadSongButton = document.getElementById('uploadSongButton');
  const uploadVideoButton = document.getElementById('uploadVideoButton');
  const songInput = document.getElementById('songFile');
  const songTitleInput = document.getElementById('songTitle');
  const videoInput = document.getElementById('videoFile');
  const videoTitleInput = document.getElementById('videoTitle');

  const defaults = {
    songsPlayed: 12000,
    videosWatched: 8000,
    topSong: 'Champion'
  };

  const stats = {
    ...defaults,
    ...storedStats
  };

  if (artistName) {
    artistName.textContent = currentUser.fullName || 'Paul Beats';
  }

  if (artistWelcome) {
    artistWelcome.textContent = `Welcome back, ${currentUser.fullName || 'Artist'}!`;
  }

  const renderStats = () => {
    if (songsPlayedEl) {
      songsPlayedEl.textContent = `Songs Played: ${formatCount(stats.songsPlayed)}`;
    }

    if (videosWatchedEl) {
      videosWatchedEl.textContent = `Videos Watched: ${formatCount(stats.videosWatched)}`;
    }

    if (topSongEl) {
      topSongEl.textContent = `Top Song: ${stats.topSong || 'Champion'}`;
    }
  };

  renderStats();

  if (editProfileButton) {
    editProfileButton.addEventListener('click', () => {
      const updatedName = window.prompt('Update artist name:', artistName.textContent);

      if (!updatedName || !updatedName.trim()) {
        return;
      }

      const cleanName = updatedName.trim();
      artistName.textContent = cleanName;
      artistWelcome.textContent = `Welcome back, ${cleanName}!`;

      const user = JSON.parse(localStorage.getItem('busiVibesUser') || '{}');
      const current = JSON.parse(localStorage.getItem('busiVibesCurrentUser') || '{}');

      user.fullName = cleanName;
      current.fullName = cleanName;

      localStorage.setItem('busiVibesUser', JSON.stringify(user));
      localStorage.setItem('busiVibesCurrentUser', JSON.stringify(current));
    });
  }

  const handleUpload = (type) => {
    const fileInput = type === 'song' ? songInput : videoInput;
    const titleInput = type === 'song' ? songTitleInput : videoTitleInput;

    if (!fileInput || !titleInput) {
      return;
    }

    const file = fileInput.files[0];
    const title = titleInput.value.trim();

    if (!file || !title) {
      window.alert('Please choose a file and enter a title before uploading.');
      return;
    }

    const key = type === 'song' ? 'uploadedSongs' : 'uploadedVideos';
    const savedItems = JSON.parse(localStorage.getItem(key) || '[]');
    savedItems.push({ title, fileName: file.name, uploadedAt: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(savedItems));

    if (type === 'song') {
      stats.songsPlayed = Number(stats.songsPlayed || 0) + 250;
      stats.topSong = title;
    } else {
      stats.videosWatched = Number(stats.videosWatched || 0) + 180;
    }

    localStorage.setItem('busiVibesArtistStats', JSON.stringify(stats));
    renderStats();

    fileInput.value = '';
    titleInput.value = '';
    window.alert(`${type === 'song' ? 'Song' : 'Video'} uploaded successfully.`);
  };

  if (uploadSongButton) {
    uploadSongButton.addEventListener('click', () => handleUpload('song'));
  }

  if (uploadVideoButton) {
    uploadVideoButton.addEventListener('click', () => handleUpload('video'));
  }

  dashboard.classList.add('is-ready');
}
