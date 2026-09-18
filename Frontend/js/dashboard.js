function formatCount(value) {
  const number = Number(value) || 0;

  if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  }

  if (number >= 1000) {
    return `${(number / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }

  return String(number);
}


async function initializeDashboard() {

  const dashboard = document.querySelector('.artist-dashboard');

  if (!dashboard) {
    return;
  }

  console.log("BusiVibes: Dashboard starting...");


  // ==========================================
  // GET CURRENT USER
  // ==========================================

  let currentUser = null;

  if (
    window.BusiVibesDB &&
    typeof BusiVibesDB.getCurrentUser === "function"
  ) {
    currentUser = await BusiVibesDB.getCurrentUser();
  }


  // ==========================================
  // FALLBACK TO LEGACY USER
  // ==========================================

  if (!currentUser) {

    const legacyUser = JSON.parse(
      localStorage.getItem("busiVibesCurrentUser") || "null"
    );

    if (legacyUser) {

      currentUser = {
        id: legacyUser.id || legacyUser.email || "legacy-user",
        email: legacyUser.email || "",
        username:
          legacyUser.fullName ||
          legacyUser.name ||
          legacyUser.username ||
          "Artist",
        type: String(
          legacyUser.accountType ||
          legacyUser.userType ||
          "artist"
        ).toLowerCase()
      };

    }
  }


  if (!currentUser) {

    console.log("BusiVibes: No logged-in user found.");

    return;
  }


  console.log("BusiVibes: Current user:", currentUser);


  // ==========================================
  // FIND ARTIST PROFILE
  // ==========================================

  const artists = await BusiVibesDB.getAllArtists();

  console.log("BusiVibes: All artists:", artists);


  let artistProfile = artists.find(
    artist => artist.userId === currentUser.id
  );


  // Fallback: match artist name
  if (!artistProfile) {

    artistProfile = artists.find(
      artist =>
        String(artist.artistName || "")
          .trim()
          .toLowerCase() ===
        String(currentUser.username || "")
          .trim()
          .toLowerCase()
    );

  }


  // Final fallback for your migrated Adu Paul account
  if (!artistProfile) {

    artistProfile = artists.find(
      artist =>
        String(artist.artistName || "")
          .trim()
          .toLowerCase() === "adu paul"
    );

  }


  console.log("BusiVibes: Selected artist:", artistProfile);


  if (!artistProfile) {

    console.log("BusiVibes: Artist profile could not be found.");

    return;
  }


  // ==========================================
  // GET ARTIST STATISTICS
  // ==========================================

  const artistStats =
    await BusiVibesDB.getArtistStats(artistProfile.id);


  console.log("BusiVibes: Artist stats:", artistStats);


  // ==========================================
  // FIND DASHBOARD STAT ELEMENTS
  // ==========================================

  const followersCount =
    document.getElementById("followersCount");

  const streamsCount =
    document.getElementById("streamsCount");

  const downloadsCount =
    document.getElementById("downloadsCount");

  const songsCount =
    document.getElementById("songsCount");


  // ==========================================
  // UPDATE STATISTICS
  // ==========================================

  if (followersCount) {

    followersCount.textContent =
      formatCount(artistStats.followerCount);

  }


  if (streamsCount) {

    streamsCount.textContent =
      formatCount(artistStats.totalStreams);

  }


  if (downloadsCount) {

    downloadsCount.textContent =
      formatCount(artistStats.totalDownloads);

  }


  if (songsCount) {

    songsCount.textContent =
      formatCount(artistStats.songCount);

  }


  // ==========================================
  // UPDATE WELCOME MESSAGE
  // ==========================================

  const artistWelcome =
    document.getElementById("artistWelcome");


  const displayName =
    artistProfile.artistName ||
    currentUser.username ||
    "Artist";


  if (artistWelcome) {

    artistWelcome.textContent =
      `Welcome back, ${displayName}!`;

  }

  // ==========================================
  // LOAD ARTIST SONGS
  // ==========================================

  const artistSongsList =
    document.getElementById("artistSongsList");

  if (artistSongsList) {

    const artistSongs =
      await BusiVibesDB.getSongsByArtist(artistProfile.id);

    artistSongsList.innerHTML = "";

    if (artistSongs.length === 0) {

      artistSongsList.innerHTML = `
        <div class="music-row">
          <span>No songs uploaded yet.</span>
          <span>0</span>
          <span>0</span>
          <span class="status">No songs</span>
        </div>
      `;

    } else {

      artistSongs.forEach(song => {

        const row = document.createElement("div");

        row.className = "music-row";

        row.innerHTML = `
          <span>🎵 ${song.title}</span>
          <span>${formatCount(song.plays)}</span>
          <span>${formatCount(song.downloads)}</span>
          <span class="status">Published</span>
        `;

        artistSongsList.appendChild(row);

      });

    }

  }

  // ==========================================
  // UPLOAD SONG
  // ==========================================

  const uploadSongForm =
    document.getElementById("uploadSongForm");

  const uploadMessage =
    document.getElementById("uploadMessage");

  if (uploadSongForm) {

    uploadSongForm.addEventListener("submit", async (event) => {

      event.preventDefault();

      const title =
        document.getElementById("songTitle").value.trim();

      const genre =
        document.getElementById("songGenre").value.trim();

      const audioFile =
        document.getElementById("songFile").files[0];

      const allowDownload =
        document.getElementById("allowDownload").checked;

      if (!title || !audioFile) {

        uploadMessage.textContent =
          "Please enter a song title and select an audio file.";

        return;
      }

      try {

        uploadMessage.textContent =
          "Uploading song...";

        // Save the song information to BusiVibesDB
        const newSong =
          await BusiVibesDB.uploadSong(
            artistProfile.id,
            {
              title: title,
              genre: genre,
              audioUrl: URL.createObjectURL(audioFile),
              allowDownload: allowDownload,
              duration: "0:00"
            }
          );

        console.log(
          "BusiVibes: Song uploaded:",
          newSong
        );

        uploadMessage.textContent =
          "Song uploaded successfully!";

        // Clear the form
        uploadSongForm.reset();

        // Reload the dashboard
        const updatedStats =
          await BusiVibesDB.getArtistStats(
            artistProfile.id
          );

        if (songsCount) {
          songsCount.textContent =
            formatCount(updatedStats.songCount);
        }

        // Add the new song to the music table
        if (artistSongsList) {

          const row =
            document.createElement("div");

          row.className = "music-row";

          row.innerHTML = `
            <span>🎵 ${newSong.title}</span>
            <span>${formatCount(newSong.plays)}</span>
            <span>${formatCount(newSong.downloads)}</span>
            <span class="status">Published</span>
          `;

          artistSongsList.appendChild(row);

        }

      } catch (error) {

        console.error(
          "BusiVibes: Upload failed:",
          error
        );

        uploadMessage.textContent =
          "Upload failed: " + error.message;

      }

    });

  }

  dashboard.classList.add("is-ready");

  console.log("BusiVibes: Dashboard loaded successfully.");

}

document.addEventListener(
  "DOMContentLoaded",
  () => {

    initializeDashboard();


    // ==========================================
    // OPEN UPLOAD SONG FORM
    // ==========================================

    const uploadSongBtn =
      document.getElementById("uploadSongBtn");

    const uploadSongSection =
      document.getElementById("uploadSongSection");

    const cancelUploadBtn =
      document.getElementById("cancelUploadBtn");


    if (uploadSongBtn && uploadSongSection) {

      uploadSongBtn.addEventListener("click", () => {

        uploadSongSection.style.display = "block";

        uploadSongSection.scrollIntoView({
          behavior: "smooth"
        });

      });

    }


    // ==========================================
    // CANCEL UPLOAD
    // ==========================================

    if (cancelUploadBtn && uploadSongSection) {

      cancelUploadBtn.addEventListener("click", () => {

        uploadSongSection.style.display = "none";

      });

    }

  }
);