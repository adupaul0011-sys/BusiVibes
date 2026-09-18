/**
 * ============================================================================
 * BUSIVIBES DATA LAYER
 * ============================================================================
 * This is the ONE place every page should go to read or write data.
 * No page should ever call localStorage.getItem / setItem directly —
 * always go through the functions below.
 *
 * WHY THIS MATTERS:
 * Every function here is written as `async` and returns a Promise, even
 * though right now it just reads/writes LocalStorage synchronously.
 * That's intentional. When you're ready to move to a real backend, you
 * rewrite the INSIDE of these functions to do `fetch('/api/...')` instead —
 * every page that calls `await BusiVibesDB.getSongsByArtist(id)` keeps
 * working with zero changes. The function names and shapes are your
 * permanent contract; LocalStorage is just today's implementation.
 *
 * Include this file on every page BEFORE your page-specific script:
 *   <script src="busivibes-data.js"></script>
 * ============================================================================
 */

const BusiVibesDB = (() => {

  // --------------------------------------------------------------------
  // STORAGE KEYS — one array per entity type
  // --------------------------------------------------------------------
  const KEYS = {
    USERS: 'bv_users',
    ARTIST_PROFILES: 'bv_artist_profiles',
    FAN_PROFILES: 'bv_fan_profiles',
    SONGS: 'bv_songs',
    ALBUMS: 'bv_albums',
    FOLLOWS: 'bv_follows',
    DOWNLOADS: 'bv_downloads',
    STREAMS: 'bv_streams',
    COMMENTS: 'bv_comments',
    EVENTS: 'bv_events',
    SESSION: 'bv_current_user_id'
  };

  // --------------------------------------------------------------------
  // LOW-LEVEL HELPERS (private — not exported)
  // --------------------------------------------------------------------
  function _read(key) {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  }

  function _write(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function _generateId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  function _initIfEmpty() {
    Object.values(KEYS).forEach(key => {
      if (key === KEYS.SESSION) return;
      if (localStorage.getItem(key) === null) {
        _write(key, []);
      }
    });
  }
  _initIfEmpty();

  // ========================================================================
  // USERS  (base account — determines fan vs artist + login)
  // Shape: { id, email, password, username, type: 'artist'|'fan', createdAt }
  // ========================================================================

  async function registerUser({ email, password, username, type }) {
    const users = _read(KEYS.USERS);

    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with this email already exists.');
    }

    const newUser = {
      id: _generateId('user'),
      email,
      password, // NOTE: plain text is fine for prototype only. A real backend must hash this.
      username,
      type, // 'artist' or 'fan'
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    _write(KEYS.USERS, users);

    // Automatically create the matching profile so the rest of the app
    // never has to worry about a user existing without one.
    if (type === 'artist') {
      await createArtistProfile(newUser.id, { artistName: username });
    } else {
      await createFanProfile(newUser.id, { displayName: username });
    }

    return newUser;
  }

  async function loginUser(email, password) {
    const users = _read(KEYS.USERS);
    const user = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!user) throw new Error('Invalid email or password.');
    localStorage.setItem(KEYS.SESSION, user.id);
    return user;
  }

  async function logoutUser() {
    localStorage.removeItem(KEYS.SESSION);
  }

  async function getCurrentUser() {
    const id = localStorage.getItem(KEYS.SESSION);
    if (id) {
      return getUserById(id);
    }

    const legacyUser = JSON.parse(localStorage.getItem('busiVibesCurrentUser') || 'null');
    if (!legacyUser) return null;

    const userEmail = legacyUser.email || '';
    const users = _read(KEYS.USERS);
    const matchedUser = users.find(u => u.email && u.email.toLowerCase() === userEmail.toLowerCase());

    if (matchedUser) {
      return matchedUser;
    }

    return {
      id: legacyUser.id || legacyUser.email || 'legacy-user',
      email: legacyUser.email,
      username: legacyUser.fullName || legacyUser.name || legacyUser.username || 'Artist',
      type: String(legacyUser.accountType || legacyUser.userType || 'fan').toLowerCase(),
      accountType: legacyUser.accountType || legacyUser.userType || 'fan'
    };
  }

  async function getUserById(userId) {
    const users = _read(KEYS.USERS);
    return users.find(u => u.id === userId) || null;
  }

  // ========================================================================
  // ARTIST PROFILES
  // Shape: { id, userId, artistName, bio, profileImage, coverImage,
  //          genre, socialLinks: [{platform, url}], verified, createdAt }
  // ========================================================================

  async function createArtistProfile(userId, data = {}) {
    const profiles = _read(KEYS.ARTIST_PROFILES);
    const profile = {
      id: _generateId('artist'),
      userId,
      artistName: data.artistName || 'Unnamed Artist',
      bio: data.bio || '',
      profileImage: data.profileImage || '',
      coverImage: data.coverImage || '',
      genre: data.genre || '',
      socialLinks: data.socialLinks || [],
      verified: false,
      createdAt: new Date().toISOString()
    };
    profiles.push(profile);
    _write(KEYS.ARTIST_PROFILES, profiles);
    return profile;
  }

  async function getArtistProfileByUserId(userId) {
    const profiles = _read(KEYS.ARTIST_PROFILES);
    return profiles.find(p => p.userId === userId) || null;
  }

  async function getArtistProfileById(artistId) {
    const profiles = _read(KEYS.ARTIST_PROFILES);
    return profiles.find(p => p.id === artistId) || null;
  }

  async function updateArtistProfile(artistId, updates) {
    const profiles = _read(KEYS.ARTIST_PROFILES);
    const idx = profiles.findIndex(p => p.id === artistId);
    if (idx === -1) throw new Error('Artist profile not found.');
    profiles[idx] = { ...profiles[idx], ...updates };
    _write(KEYS.ARTIST_PROFILES, profiles);
    return profiles[idx];
  }

  async function getAllArtists() {
    return _read(KEYS.ARTIST_PROFILES);
  }

  // ========================================================================
  // FAN PROFILES
  // Shape: { id, userId, displayName, profileImage, createdAt }
  // ========================================================================

  async function createFanProfile(userId, data = {}) {
    const profiles = _read(KEYS.FAN_PROFILES);
    const profile = {
      id: _generateId('fan'),
      userId,
      displayName: data.displayName || 'Fan',
      profileImage: data.profileImage || '',
      createdAt: new Date().toISOString()
    };
    profiles.push(profile);
    _write(KEYS.FAN_PROFILES, profiles);
    return profile;
  }

  async function getFanProfileByUserId(userId) {
    const profiles = _read(KEYS.FAN_PROFILES);
    return profiles.find(p => p.userId === userId) || null;
  }

  // ========================================================================
  // SONGS
  // Shape: { id, artistId, title, coverImage, audioUrl, albumId,
  //          genre, allowDownload, plays, downloads, duration, createdAt }
  // ========================================================================

  async function uploadSong(artistId, data = {}) {
    const songs = _read(KEYS.SONGS);
    const song = {
  id: _generateId('song'),
  artistId,
  title: data.title || 'Untitled',
  coverImage: data.coverImage || '',
  audioUrl: data.audioUrl || '',
  albumId: data.albumId || null,
  genre: data.genre || '',
  allowDownload: data.allowDownload !== undefined ? data.allowDownload : true,
  plays: Number(data.plays) || 0,
  downloads: Number(data.downloads) || 0,
  duration: data.duration || 0,
  createdAt: new Date().toISOString()
};
    songs.push(song);
    _write(KEYS.SONGS, songs);

    // If it belongs to an album, keep the album's songIds in sync.
    if (song.albumId) {
      await addSongToAlbum(song.albumId, song.id);
    }
    return song;
  }

  async function getSongById(songId) {
    const songs = _read(KEYS.SONGS);
    return songs.find(s => s.id === songId) || null;
  }

  async function getSongsByArtist(artistId) {
    const songs = _read(KEYS.SONGS);
    return songs.filter(s => s.artistId === artistId);
  }

  async function getAllSongs() {
    // This is what Discover Music should call. Since every song already
    // carries its own artistId, Discover automatically reflects every
    // upload from every artist — no separate "push to discover" step needed.
    return _read(KEYS.SONGS);
  }

  async function toggleDownloadPermission(songId, allow) {
    const songs = _read(KEYS.SONGS);
    const idx = songs.findIndex(s => s.id === songId);
    if (idx === -1) throw new Error('Song not found.');
    songs[idx].allowDownload = allow;
    _write(KEYS.SONGS, songs);
    return songs[idx];
  }

  async function _incrementSongCounter(songId, field) {
    const songs = _read(KEYS.SONGS);
    const idx = songs.findIndex(s => s.id === songId);
    if (idx === -1) throw new Error('Song not found.');
    songs[idx][field] = (songs[idx][field] || 0) + 1;
    _write(KEYS.SONGS, songs);
    return songs[idx];
  }

  // ========================================================================
  // ALBUMS
  // Shape: { id, artistId, title, coverImage, songIds: [], createdAt }
  // ========================================================================

  async function createAlbum(artistId, data = {}) {
    const albums = _read(KEYS.ALBUMS);
    const album = {
      id: _generateId('album'),
      artistId,
      title: data.title || 'Untitled Album',
      coverImage: data.coverImage || '',
      songIds: [],
      createdAt: new Date().toISOString()
    };
    albums.push(album);
    _write(KEYS.ALBUMS, albums);
    return album;
  }

  async function addSongToAlbum(albumId, songId) {
    const albums = _read(KEYS.ALBUMS);
    const idx = albums.findIndex(a => a.id === albumId);
    if (idx === -1) throw new Error('Album not found.');
    if (!albums[idx].songIds.includes(songId)) {
      albums[idx].songIds.push(songId);
      _write(KEYS.ALBUMS, albums);
    }
    return albums[idx];
  }

  async function getAlbumsByArtist(artistId) {
    const albums = _read(KEYS.ALBUMS);
    return albums.filter(a => a.artistId === artistId);
  }

  async function getAlbumById(albumId) {
    const albums = _read(KEYS.ALBUMS);
    return albums.find(a => a.id === albumId) || null;
  }

  // ========================================================================
  // FOLLOWS  (fan <-> artist relationship)
  // Shape: { id, fanId, artistId, followedAt }
  // ========================================================================

  async function followArtist(fanId, artistId) {
    const follows = _read(KEYS.FOLLOWS);
    const already = follows.some(f => f.fanId === fanId && f.artistId === artistId);
    if (already) return follows.find(f => f.fanId === fanId && f.artistId === artistId);

    const record = {
      id: _generateId('follow'),
      fanId,
      artistId,
      followedAt: new Date().toISOString()
    };
    follows.push(record);
    _write(KEYS.FOLLOWS, follows);
    return record;
  }

  async function unfollowArtist(fanId, artistId) {
    const follows = _read(KEYS.FOLLOWS);
    const filtered = follows.filter(f => !(f.fanId === fanId && f.artistId === artistId));
    _write(KEYS.FOLLOWS, filtered);
  }

  async function isFollowing(fanId, artistId) {
    const follows = _read(KEYS.FOLLOWS);
    return follows.some(f => f.fanId === fanId && f.artistId === artistId);
  }

  async function getFollowedArtists(fanId) {
    // Powers the "Following Artists" page: get the follow records,
    // then resolve each into a full artist profile.
    const follows = _read(KEYS.FOLLOWS).filter(f => f.fanId === fanId);
    const artistIds = follows.map(f => f.artistId);
    const allArtists = await getAllArtists();
    return allArtists.filter(a => artistIds.includes(a.id));
  }

  async function getFollowerCount(artistId) {
    const follows = _read(KEYS.FOLLOWS);
    return follows.filter(f => f.artistId === artistId).length;
  }

  // ========================================================================
  // DOWNLOADS  (fan <-> song relationship)
  // Shape: { id, fanId, songId, downloadedAt }
  // ========================================================================

  async function downloadSong(fanId, songId) {
    const song = await getSongById(songId);
    if (!song) throw new Error('Song not found.');
    if (!song.allowDownload) throw new Error('This artist has disabled downloads for this song.');

    const downloads = _read(KEYS.DOWNLOADS);
    const already = downloads.some(d => d.fanId === fanId && d.songId === songId);
    if (!already) {
      downloads.push({
        id: _generateId('download'),
        fanId,
        songId,
        downloadedAt: new Date().toISOString()
      });
      _write(KEYS.DOWNLOADS, downloads);
      await _incrementSongCounter(songId, 'downloads');
    }
    return song;
  }

  async function getDownloadsByFan(fanId) {
    // Powers the Downloads page: get download records, resolve to full songs.
    const downloads = _read(KEYS.DOWNLOADS).filter(d => d.fanId === fanId);
    const songIds = downloads.map(d => d.songId);
    const allSongs = await getAllSongs();
    return allSongs.filter(s => songIds.includes(s.id));
  }

  async function hasDownloaded(fanId, songId) {
    const downloads = _read(KEYS.DOWNLOADS);
    return downloads.some(d => d.fanId === fanId && d.songId === songId);
  }

  // ========================================================================
  // STREAMS  (play events — fanId may be null for anonymous/logged-out plays)
  // Shape: { id, fanId, songId, playedAt }
  // ========================================================================

  async function recordStream(songId, fanId = null) {
    const streams = _read(KEYS.STREAMS);
    streams.push({
      id: _generateId('stream'),
      fanId,
      songId,
      playedAt: new Date().toISOString()
    });
    _write(KEYS.STREAMS, streams);
    await _incrementSongCounter(songId, 'plays');
  }

  async function getStreamCount(songId) {
    const streams = _read(KEYS.STREAMS);
    return streams.filter(s => s.songId === songId).length;
  }

  // ========================================================================
  // COMMENTS
  // Shape: { id, songId, fanId, text, createdAt }
  // ========================================================================

  async function addComment(songId, fanId, text) {
    const comments = _read(KEYS.COMMENTS);
    const comment = {
      id: _generateId('comment'),
      songId,
      fanId,
      text,
      createdAt: new Date().toISOString()
    };
    comments.push(comment);
    _write(KEYS.COMMENTS, comments);
    return comment;
  }

  async function getCommentsForSong(songId) {
    const comments = _read(KEYS.COMMENTS);
    return comments.filter(c => c.songId === songId);
  }

  // ========================================================================
  // EVENTS
  // Shape: { id, artistId, title, date, location, ticketUrl, description }
  // ========================================================================

  async function createEvent(artistId, data = {}) {
    const events = _read(KEYS.EVENTS);
    const event = {
      id: _generateId('event'),
      artistId,
      title: data.title || 'Untitled Event',
      date: data.date || '',
      location: data.location || '',
      ticketUrl: data.ticketUrl || '',
      description: data.description || '',
      createdAt: new Date().toISOString()
    };
    events.push(event);
    _write(KEYS.EVENTS, events);
    return event;
  }

  async function getEventsByArtist(artistId) {
    const events = _read(KEYS.EVENTS);
    return events.filter(e => e.artistId === artistId);
  }

  // ========================================================================
  // ONE-TIME MIGRATION — EXISTING PAUL BEATS SONGS
  // ========================================================================

  async function migratePaulBeatsSongs(artistId) {
    const existingSongs = await getSongsByArtist(artistId);

    const songsToMigrate = [
      {
        title: 'Champion',
        coverImage: 'assets/song-cover/champion.jpg',
        audioUrl: 'assets/audio-files/Champion.mp3',
        genre: 'Afropop',
        allowDownload: true,
        plays: 2100000,
        downloads: 150000,
        duration: '3:45'
      },
      {
        title: 'Rise Up',
        coverImage: 'assets/song-cover/rise-up.jpg',
        audioUrl: 'assets/audio-files/Rise Up.mp3',
        genre: 'Afropop',
        allowDownload: true,
        plays: 1400000,
        downloads: 120000,
        duration: '4:01'
      },
      {
        title: 'Dream Big',
        coverImage: 'assets/song-cover/dream-big.jpg',
        audioUrl: 'assets/audio-files/Dream Big.mp3',
        genre: 'Afropop',
        allowDownload: true,
        plays: 900000,
        downloads: 80000,
        duration: '2:58'
      },
      {
        title: 'Forever',
        coverImage: 'assets/song-cover/forever.jpg',
        audioUrl: 'assets/audio-files/Forever.mp3',
        genre: 'Afropop',
        allowDownload: true,
        plays: 500000,
        downloads: 50000,
        duration: '3:30'
      }
    ];

    const migratedSongs = [];

    for (const songData of songsToMigrate) {
      const alreadyExists = existingSongs.some(
        song => song.title.toLowerCase() === songData.title.toLowerCase()
      );

      if (!alreadyExists) {
        const song = await uploadSong(artistId, songData);
        migratedSongs.push(song);
      }
    }

    return migratedSongs;
  }

  // ========================================================================
  // ANALYTICS  (rolls up the relationship tables into one summary)
  // ========================================================================

  async function getArtistStats(artistId) {
    const songs = await getSongsByArtist(artistId);
    const followerCount = await getFollowerCount(artistId);

    const totalStreams = songs.reduce((sum, s) => sum + (s.plays || 0), 0);
    const totalDownloads = songs.reduce((sum, s) => sum + (s.downloads || 0), 0);

    return {
      artistId,
      followerCount,
      totalStreams,
      totalDownloads,
      songCount: songs.length
    };
  }

  // ------------------------------------------------------------------------
  // PUBLIC API — this is the entire contract every page should code against
  // ------------------------------------------------------------------------
  return {
    // users / auth
    registerUser, loginUser, logoutUser, getCurrentUser, getUserById,
    // artist profiles
    createArtistProfile, getArtistProfileByUserId, getArtistProfileById,
    updateArtistProfile, getAllArtists,
    // fan profiles
    createFanProfile, getFanProfileByUserId,
    // songs
    uploadSong,
    getSongById,
    getSongsByArtist,
    getAllSongs,
    toggleDownloadPermission,
    migratePaulBeatsSongs,
    // albums
    createAlbum, addSongToAlbum, getAlbumsByArtist, getAlbumById,
    // follows
    followArtist, unfollowArtist, isFollowing, getFollowedArtists, getFollowerCount,
    // downloads
    downloadSong, getDownloadsByFan, hasDownloaded,
    // streams
    recordStream, getStreamCount,
    // comments
    addComment, getCommentsForSong,
    // events
    createEvent, getEventsByArtist,
    // analytics
    getArtistStats
  };
})();
