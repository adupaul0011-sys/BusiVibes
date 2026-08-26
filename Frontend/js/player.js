export function playVideo(videoPath) {
  const modal = document.createElement('div');
  modal.className = 'video-modal';

  const video = document.createElement('video');
  video.src = videoPath;
  video.controls = true;
  video.autoplay = true;
  video.style.width = '80%';
  video.style.borderRadius = '10px';

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
}
