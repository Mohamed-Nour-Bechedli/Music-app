// DOM Elements
const albumArt = document.getElementById('album-art');
const songTitle = document.getElementById('song-title');
const artistName = document.getElementById('artist-name');
const progressBar = document.getElementById('progress-bar');
const progress = document.getElementById('progress');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const playButton = document.getElementById('play-button');
const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');
const tracksContainer = document.getElementById('tracks-container');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');

// Audio element
const audio = new Audio();
let tracks = [];
let currentTrackIndex = 0;

// App state
let isPlaying = false;
let progressInterval;

// Initialize the app
function init() {
    // Set default display
    songTitle.textContent = "Search for an artist";
    artistName.textContent = "Results will appear here";
    albumArt.src = "https://via.placeholder.com/300/6c5ce7/ffffff?text=VibeTunes";

    // Set up event listeners
    setupEventListeners();
}

// Search for tracks by artist using iTunes API
async function searchArtist(artistName) {
    try {
        const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=song&limit=15`);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            // Transform API results to our track format
            tracks = data.results.map(result => ({
                id: result.trackId,
                title: result.trackName,
                artist: result.artistName,
                cover: result.artworkUrl100.replace('100x100bb', '300x300bb'),
                audio: result.previewUrl,
                duration: Math.floor(result.trackTimeMillis / 1000)
            }));

            // Load the first track
            if (tracks.length > 0) {
                currentTrackIndex = 0;
                loadSong(tracks[0]);
            }

            // Render the tracks
            renderTracks();
        } else {
            tracksContainer.innerHTML = '<div class="no-results">No tracks found for this artist</div>';
        }
    } catch (error) {
        console.error("Error searching for artist:", error);
        tracksContainer.innerHTML = '<div class="no-results">Error loading tracks</div>';
    }
}

// Load a song into the player
function loadSong(song) {
    songTitle.textContent = song.title;
    artistName.textContent = song.artist;
    albumArt.src = song.cover;
    audio.src = song.audio;

    // Format duration
    const durationMinutes = Math.floor(song.duration / 60);
    const durationSeconds = Math.floor(song.duration % 60).toString().padStart(2, '0');
    durationEl.textContent = `${durationMinutes}:${durationSeconds}`;

    // Reset progress
    progress.style.width = '0%';
    currentTimeEl.textContent = '0:00';
}

// Render tracks in the tracks container
function renderTracks() {
    tracksContainer.innerHTML = '';

    tracks.forEach((track, index) => {
        const trackElement = document.createElement('div');
        trackElement.className = 'track';
        trackElement.innerHTML = `
            <div class="track-cover">
                <img src="${track.cover}" alt="${track.title}">
            </div>
            <div class="track-info">
                <div class="track-title">${track.title}</div>
                <div class="track-artist">${track.artist}</div>
            </div>
        `;

        trackElement.addEventListener('click', () => {
            currentTrackIndex = index;
            loadSong(track);
            playSong();
        });
        tracksContainer.appendChild(trackElement);
    });
}

// Play the current song
function playSong() {
    isPlaying = true;
    audio.play();
    playButton.innerHTML = `
        <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
        </svg>
    `;

    // Start progress timer
    progressInterval = setInterval(updateProgress, 1000);
}

// Pause the current song
function pauseSong() {
    isPlaying = false;
    audio.pause();
    playButton.innerHTML = `
        <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M8 5v14l11-7z"/>
        </svg>
    `;

    // Stop progress timer
    clearInterval(progressInterval);
}

// Update progress bar
function updateProgress() {
    const { duration, currentTime } = audio;
    const progressPercent = (currentTime / duration) * 100;
    progress.style.width = `${progressPercent}%`;

    // Update current time display
    const currentMinutes = Math.floor(currentTime / 60);
    const currentSeconds = Math.floor(currentTime % 60).toString().padStart(2, '0');
    currentTimeEl.textContent = `${currentMinutes}:${currentSeconds}`;

    // Check if song ended
    if (currentTime >= duration) {
        playNextTrack();
    }
}

// Play next track
function playNextTrack() {
    currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
    loadSong(tracks[currentTrackIndex]);
    if (isPlaying) {
        playSong();
    }
}

// Play previous track
function playPrevTrack() {
    currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    loadSong(tracks[currentTrackIndex]);
    if (isPlaying) {
        playSong();
    }
}

// Seek to specific position in song
function seekSong(e) {
    if (!isPlaying) return;

    const progressBarWidth = progressBar.clientWidth;
    const clickPosition = e.offsetX;
    const clickPercent = (clickPosition / progressBarWidth);

    audio.currentTime = clickPercent * audio.duration;
}

// Perform search
function performSearch() {
    const searchTerm = searchInput.value.trim();

    if (searchTerm === '') {
        tracksContainer.innerHTML = '<div class="no-results">Enter an artist name to search</div>';
        return;
    }

    searchArtist(searchTerm);
}

// Set up event listeners
function setupEventListeners() {
    // Play/Pause button
    playButton.addEventListener('click', () => {
        if (audio.src) { // Only if we have a song loaded
            if (isPlaying) {
                pauseSong();
            } else {
                playSong();
            }
        }
    });

    // Next button
    nextButton.addEventListener('click', () => {
        if (tracks.length > 0) playNextTrack();
    });

    // Previous button
    prevButton.addEventListener('click', () => {
        if (tracks.length > 0) playPrevTrack();
    });

    // Progress bar click
    progressBar.addEventListener('click', seekSong);

    // Search functionality
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // When song ends, play next track
    audio.addEventListener('ended', () => {
        if (tracks.length > 0) playNextTrack();
    });
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);