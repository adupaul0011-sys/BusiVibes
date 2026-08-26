import { playVideo } from './player.js';
import { initializeSearch } from './search.js';
import { initializeArtistSlider } from './artists.js';
import { initializeDashboard } from './dashboard.js';

window.playVideo = playVideo;

initializeSearch();
initializeArtistSlider();
initializeDashboard();
