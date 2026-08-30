initializeSearch();
initializeArtistSlider();
initializeAudioPlayers();
initializeVideoPlayers();
initializeDashboard();

document.addEventListener("DOMContentLoaded", () => {
  const authButtons = document.getElementById("authButtons");

  if (!authButtons) {
    return;
  }

  const isLoggedIn = localStorage.getItem("busiVibesLoggedIn") === "true";
  const currentUser = JSON.parse(localStorage.getItem("busiVibesCurrentUser") || "null");

  if (isLoggedIn && currentUser) {
    authButtons.innerHTML = `
      <span class="welcome-user">
        Hi, ${currentUser.fullName}
      </span>
      <button class="logout-btn" id="logoutBtn" type="button">
        Logout
      </button>
    `;

    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("busiVibesLoggedIn");
        localStorage.removeItem("busiVibesCurrentUser");
        window.location.reload();
      });
    }
  }
});
