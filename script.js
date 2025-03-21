const screen = document.getElementById('screen');
const shape = document.getElementById('shape');
const audioPlayer = document.getElementById('audioPlayer');

let mediaRecorder;
let audioChunks = [];
let recordingUrl = null;
let stream = null;
let isPlaying = false;

// Initialize MediaRecorder
async function setupRecorder() {
  stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mimeType = MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : 'audio/webm';
  mediaRecorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 128000 });

  mediaRecorder.ondataavailable = e => {
    if (e.data.size > 0) audioChunks.push(e.data);
  };

  mediaRecorder.onstop = () => {
    const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
    if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    recordingUrl = URL.createObjectURL(blob);
    audioPlayer.src = recordingUrl;
    showMenu();
  };
}

// Switch to idle recording state
function showIdle() {
  screen.className = 'state-idle';
  shape.style.display = 'block';
}

// Switch to recording state
function showRecording() {
  screen.className = 'state-recording';
  shape.style.display = 'block';
}

// Show 3-part menu
function showMenu() {
  screen.className = 'state-menu';
  shape.style.display = 'none';
  screen.innerHTML = `
    <div id="section-record"></div>
    <div id="section-play"></div>
    <div id="section-save"></div>
  `;

  document.getElementById('section-record').addEventListener('click', startNewRecording);
  document.getElementById('section-play').addEventListener('click', togglePlayback);
  document.getElementById('section-save').addEventListener('click', saveRecording);
}

// Handle first tap: Start recording
function startRecording() {
  audioChunks = [];
  mediaRecorder.start(100);
  showRecording();
}

// Stop and prepare menu
function stopRecording() {
  mediaRecorder.stop();
  stream.getTracks().forEach(track => track.stop());
}

// Start new recording from menu
function startNewRecording() {
  setupRecorder().then(startRecording);
}

// Playback toggle
function togglePlayback() {
  const playSection = document.getElementById('section-play');
  if (!recordingUrl) return;

  if (isPlaying) {
    audioPlayer.pause();
    playSection.classList.remove('playing');
    isPlaying = false;
  } else {
    audioPlayer.play();
    playSection.classList.add('playing');
    isPlaying = true;
    audioPlayer.onended = () => {
      playSection.classList.remove('playing');
      isPlaying = false;
    };
  }
}

// Save current recording
function saveRecording() {
  if (!recordingUrl) return;
  const ext = mediaRecorder.mimeType.includes('mp4') ? 'mp4' : 'webm';
  const a = document.createElement('a');
  a.href = recordingUrl;
  a.download = `recording_${Date.now()}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Handle main tap logic
screen.addEventListener('click', () => {
  if (screen.classList.contains('state-idle')) {
    setupRecorder().then(startRecording);
  } else if (screen.classList.contains('state-recording')) {
    stopRecording();
  }
});

// Initial state
showIdle();
