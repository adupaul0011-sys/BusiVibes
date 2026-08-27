function playVideo(videoPath) {
  const modal = document.createElement('div');
  modal.className = 'video-modal';

  const video = document.createElement('video');
  video.src = videoPath;
  video.controls = true;
  video.autoplay = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.style.width = '80%';
  video.style.maxHeight = '85vh';
  video.style.borderRadius = '10px';

  video.addEventListener('error', () => {
    const errorMessage = document.createElement('p');
    errorMessage.textContent = 'This video could not be played in your browser.';
    errorMessage.style.color = 'white';
    errorMessage.style.textAlign = 'center';
    modal.appendChild(errorMessage);
    console.error(`Unable to load video: ${videoPath}`);
  });

  const closeButton = document.createElement('button');
  closeButton.textContent = 'x';
  closeButton.setAttribute('aria-label', 'Close video');
  closeButton.style.position = 'absolute';
  closeButton.style.top = '20px';
  closeButton.style.right = '30px';
  closeButton.style.fontSize = '24px';
  closeButton.style.color = 'white';
  closeButton.style.background = 'none';
  closeButton.style.border = 'none';
  closeButton.style.cursor = 'pointer';

  const closeModal = () => {
    video.pause();
    modal.remove();
  };

  closeButton.addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  modal.append(video, closeButton);
  document.body.appendChild(modal);
  video.load();
  video.play().catch((error) => {
    console.error(`Unable to play video: ${videoPath}`, error);
  });
}

let currentAudio;

function playSong(audioPath) {
  if (!currentAudio) {
    currentAudio = new Audio();
    currentAudio.preload = 'auto';
  }

  if (currentAudio.src.endsWith(audioPath) && !currentAudio.paused) {
    currentAudio.pause();
    return;
  }

  currentAudio.src = audioPath;
  currentAudio.load();
  currentAudio.play().catch((error) => {
    console.error(`Unable to play ${audioPath}`, error);
    currentAudio = null;
  });
}

function initializeAudioPlayers() {
  document.querySelectorAll('[data-audio]').forEach((button) => {
    button.addEventListener('click', () => playSong(button.dataset.audio));
  });
}

function initializeVideoPlayers() {
  document.querySelectorAll('[data-video]').forEach((button) => {
    button.addEventListener('click', () => playVideo(button.dataset.video));
  });
}
