const currentUser = JSON.parse(localStorage.getItem("busiVibesCurrentUser"));

if (!currentUser) {
  window.location.href = "login.html";
} else {
  const fanName = document.getElementById("fanName");
  if (fanName) fanName.textContent = currentUser.fullName;
}

const logoutButton = document.querySelector(".logout");
if (logoutButton) {
  logoutButton.addEventListener("click", function (event) {
    event.preventDefault();
    localStorage.removeItem("busiVibesLoggedIn");
    localStorage.removeItem("busiVibesCurrentUser");
    window.location.href = "login.html";
  });
}

const likedSongsList = document.getElementById("likedSongsList");
const emptyState = document.getElementById("emptyState");

const playerSongTitle = document.getElementById("playerSongTitle");
const playerArtistName = document.getElementById("playerArtistName");
const playerCoverImage = document.getElementById("playerCoverImage");
const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");
const musicProgress = document.getElementById("musicProgress");
const volumeControl = document.getElementById("volumeControl");
const mainPlayButton = document.getElementById("mainPlayButton");
const previousSongButton = document.getElementById("previousSong");
const nextSongButton = document.getElementById("nextSong");

const musicCatalog = {
  Champion: {
    artist: "Paul Beats",
    cover: "assets/song-cover/Champion.png",
    audio: "assets/audio-files/Champion.mp3"
  },
  "Rise Up": {
    artist: "Paul Beats",
    cover: "assets/song-cover/Rise Up.png",
    audio: "assets/audio-files/Rise Up.mp3"
  },
  "Dream Big": {
    artist: "Paul Beats",
    cover: "assets/song-cover/Dream Big.png",
    audio: "assets/audio-files/Dream Big.mp3"
  },
  Forever: {
    artist: "Paul Beats",
    cover: "assets/song-cover/Forever.png",
    audio: "assets/audio-files/Forever.mp3"
  }
};

function normalizeAssetPath(value) {
  if (!value) return "";
  return encodeURI(value.replace(/\\/g, "/"));
}

function resolveAudioPath(title) {
  const candidates = [
    `assets/audio-files/${title}.mp3`,
    `assets/audio-files/${title.replace(/ /g, "-")}.mp3`,
    `assets/music/${title}.mp3`,
    `assets/music/${title.replace(/ /g, "-")}.mp3`
  ].map((candidate) => normalizeAssetPath(candidate));

  return candidates.filter((value, index, array) => value && array.indexOf(value) === index);
}

function getLikedSongs() {
  const likedSongs = [];

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith("busiVibesLiked_")) continue;

    const title = key.replace("busiVibesLiked_", "");
    const info = musicCatalog[title] || {
      artist: "Unknown Artist",
      cover: "assets/song-cover/Champion.png",
      audio: resolveAudioPath(title)[0] || ""
    };

    likedSongs.push({
      title,
      artist: info.artist,
      cover: info.cover,
      audio: info.audio || resolveAudioPath(title)[0] || ""
    });
  }

  return likedSongs;
}

let currentAudio = null;
let currentTrackIndex = -1;
let currentTrackList = [];
let playTimer = null;
let currentTimeSeconds = 0;
let isPlaying = false;

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function stopPlaybackTimer() {
  if (playTimer) {
    clearInterval(playTimer);
    playTimer = null;
  }
}

function updateBottomPlayer(song, duration = 210) {
  if (!playerSongTitle || !playerArtistName || !durationEl || !currentTimeEl || !musicProgress) return;

  playerSongTitle.textContent = song.title;
  playerArtistName.textContent = song.artist;
  durationEl.textContent = formatTime(duration);
  currentTimeEl.textContent = "0:00";
  musicProgress.value = 0;
  currentTimeSeconds = 0;

  if (playerCoverImage) {
    const nextCover = normalizeAssetPath(song.cover || "assets/song-cover/Champion.png");
    playerCoverImage.src = nextCover;
    playerCoverImage.alt = `${song.title} cover`;
  }
}

function setMainPlayButtonState(playing) {
  isPlaying = playing;
  if (mainPlayButton) {
    mainPlayButton.textContent = playing ? "❚❚" : "▶";
    mainPlayButton.title = playing ? "Pause" : "Play";
  }

  if (playing) {
    stopPlaybackTimer();
    playTimer = setInterval(() => {
      if (!currentAudio || currentAudio.paused) return;

      const currentDuration = Number(currentAudio.duration) || 210;
      currentTimeSeconds = Number(currentAudio.currentTime) || 0;

      currentTimeEl.textContent = formatTime(currentTimeSeconds);
      musicProgress.value = (currentTimeSeconds / currentDuration) * 100;
      durationEl.textContent = formatTime(currentDuration);
    }, 500);
  } else {
    stopPlaybackTimer();
  }
}

function playSong(song, index) {
  if (!song.audio) {
    alert("Audio preview is not available for this track yet.");
    return;
  }

  const safeAudioPath = normalizeAssetPath(song.audio);
  const audio = new Audio(safeAudioPath);

  if (currentAudio && currentTrackIndex === index && !currentAudio.paused) {
    currentAudio.pause();
    setMainPlayButtonState(false);
    return;
  }

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
  }

  currentTrackIndex = index;
  currentAudio = audio;
  currentTimeSeconds = 0;

  updateBottomPlayer(song, Number(song.duration || 210));
  setMainPlayButtonState(true);

  currentAudio.volume = Number(volumeControl?.value || 1);
  currentAudio.play().catch(() => {
    alert("This song could not be played yet. Please add the audio file to the project.");
    setMainPlayButtonState(false);
  });

  currentAudio.onended = () => {
    setMainPlayButtonState(false);
  };
}

function renderLikedSongs() {
  const songs = getLikedSongs();
  currentTrackList = songs;

  if (!likedSongsList) return;

  if (songs.length === 0) {
    if (emptyState) emptyState.style.display = "block";
    return;
  }

  if (emptyState) emptyState.style.display = "none";
  likedSongsList.innerHTML = "";

  songs.forEach((song, index) => {
    const card = document.createElement("div");
    card.className = "liked-song-card";
    card.dataset.audio = normalizeAssetPath(song.audio);

    card.innerHTML = `
      <img src="${normalizeAssetPath(song.cover)}" alt="${song.title} Cover" class="song-cover" />
      <div class="song-info">
        <h3 class="song-title">${song.title}</h3>
        <p class="artist-name">${song.artist}</p>
      </div>
      <button class="play-btn" aria-label="Play ${song.title}">▶</button>
      <button class="unlike-btn" aria-label="Unlike ${song.title}">♥</button>
    `;

    const playButton = card.querySelector(".play-btn");
    const unlikeButton = card.querySelector(".unlike-btn");

    playButton.addEventListener("click", () => {
      playSong(song, index);
    });

    unlikeButton.addEventListener("click", () => {
      localStorage.removeItem(`busiVibesLiked_${song.title}`);
      renderLikedSongs();
    });

    likedSongsList.appendChild(card);
  });
}

if (mainPlayButton) {
  mainPlayButton.addEventListener("click", () => {
    if (!currentAudio && currentTrackList.length > 0) {
      playSong(currentTrackList[0], 0);
      return;
    }

    if (!currentAudio) return;

    if (currentAudio.paused) {
      currentAudio.play();
      setMainPlayButtonState(true);
    } else {
      currentAudio.pause();
      setMainPlayButtonState(false);
    }
  });
}

if (previousSongButton) {
  previousSongButton.addEventListener("click", () => {
    if (currentTrackList.length === 0) return;
    const nextIndex = currentTrackIndex <= 0 ? currentTrackList.length - 1 : currentTrackIndex - 1;
    playSong(currentTrackList[nextIndex], nextIndex);
  });
}

if (nextSongButton) {
  nextSongButton.addEventListener("click", () => {
    if (currentTrackList.length === 0) return;
    const nextIndex = currentTrackIndex >= currentTrackList.length - 1 ? 0 : currentTrackIndex + 1;
    playSong(currentTrackList[nextIndex], nextIndex);
  });
}

if (musicProgress) {
  musicProgress.addEventListener("input", function () {
    if (!currentAudio || !currentAudio.duration) return;
    const newTime = (Number(musicProgress.value) / 100) * currentAudio.duration;
    currentAudio.currentTime = newTime;
    currentTimeEl.textContent = formatTime(newTime);
  });
}

if (volumeControl) {
  volumeControl.addEventListener("input", function () {
    if (currentAudio) currentAudio.volume = Number(volumeControl.value);
    const volumeValue = Number(volumeControl.value);
    const icon = document.querySelector(".player-volume span");
    if (icon) {
      icon.textContent = volumeValue === 0 ? "🔇" : volumeValue < 0.5 ? "🔉" : "🔊";
    }
  });
}

renderLikedSongs();
