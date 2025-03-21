const screen = document.getElementById('screen');
const shape = document.getElementById('shape');
const label = document.getElementById('label');
const audioPlayer = document.getElementById('audioPlayer');

let mediaRecorder;
let audioChunks = [];
let recordingUrl = null;
let stream = null;
let isPlaying = false;
let pulseInterval = null;

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
  label.textContent = 'RECORD';
  label.style.display = 'block';
}

// Switch to recording state
function showRecording() {
  screen.className = 'state-recording pulse-1';
  shape.style.display = 'block';
  label.textContent = 'STOP';

  // Start pulsing
  let pulseState = 1;
  pulseInterval = setInterval(() => {
    pulseState = pulseState === 1 ? 2 : 1;
    screen.classList.remove(`pulse-${pulseState === 1 ? 2 : 1}`);
    screen.classList.add(`pulse-${pulseState}`);
  }, 600); // change every 600ms
}

// Show 3-part menu
function showMenu() {
  // Remove all event listeners by cloning the screen element
  const newScreen = screen.cloneNode(false);
  while (screen.firstChild) {
    screen.removeChild(screen.firstChild);
  }
  
  screen.className = 'state-menu';
  screen.style.backgroundColor = '';

  screen.innerHTML = `
    <div id="section-record">
      <div class="menu-shape shape-circle"></div>
      <div class="menu-label-record">RECORD</div>
    </div>
    <div id="section-play">
      <div class="menu-shape shape-triangle"></div>
      <div class="menu-label-play">PLAY</div>
    </div>
    <div id="section-save">
      <div class="menu-shape shape-square"></div>
      <div class="menu-label-save">SAVE</div>
    </div>
  `;

  // Event listeners
  document.getElementById('section-record').addEventListener('click', startNewRecording);
  document.getElementById('section-play').addEventListener('click', startPlayback);
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
  
  if (pulseInterval) {
    clearInterval(pulseInterval);
    pulseInterval = null;
  }
}

// Start new recording from menu
function startNewRecording(event) {
  if (event) {
    event.stopPropagation();
  }
  
  // Clear screen content
  while (screen.firstChild) {
    screen.removeChild(screen.firstChild);
  }
  
  // Add back the shape and label
  screen.appendChild(shape);
  screen.appendChild(label);
  
  screen.className = 'state-recording pulse-1';
  shape.style.display = 'block';
  shape.className = ''; // Reset any custom classes
  label.style.display = 'block';
  label.textContent = 'STOP';
  
  setupRecorder().then(startRecording);
}

// Start playback and show square icon
function startPlayback(event) {
  if (!recordingUrl) return;
  
  // Prevent event bubbling
  if (event) {
    event.stopPropagation();
  }
  
  isPlaying = true;

  // Clear screen content
  while (screen.firstChild) {
    screen.removeChild(screen.firstChild);
  }
  
  screen.className = 'state-playing';
  
  // Create and append stop icon (square)
  const stopIcon = document.createElement('div');
  stopIcon.className = 'stop-icon';
  stopIcon.id = 'playback-control';
  
  // Create and append label
  const playingLabel = document.createElement('div');
  playingLabel.textContent = 'PLAYING';
  playingLabel.style.fontSize = '36px';
  playingLabel.style.color = 'white';
  playingLabel.style.fontWeight = 'bold';
  
  screen.appendChild(stopIcon);
  screen.appendChild(playingLabel);
  
  // Play the audio
  audioPlayer.play();
  audioPlayer.onended = () => {
    isPlaying = false;
    showMenu();
  };
  
  // Add click handler to the entire screen
  screen.addEventListener('click', stopPlayback);
}

// Function to handle stopping playback
function stopPlayback(event) {
  // Prevent any event bubbling
  if (event) {
    event.stopPropagation();
  }
  
  audioPlayer.pause();
  audioPlayer.currentTime = 0;
  isPlaying = false;
  
  // Remove the click listener
  screen.removeEventListener('click', stopPlayback);
  
  showMenu();
}

// Save current recording
function saveRecording(event) {
  if (event) {
    event.stopPropagation();
  }
  
  if (!recordingUrl) return;
  
  const ext = mediaRecorder.mimeType.includes('mp4') ? 'mp4' : 'webm';
  const a = document.createElement('a');
  a.href = recordingUrl;
  a.download = `recording_${Date.now()}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  const saveSection = document.getElementById('section-save');
  if (saveSection) saveSection.remove();

  const recordSection = document.getElementById('section-record');
  const playSection = document.getElementById('section-play');
  if (recordSection && playSection) {
    recordSection.style.flex = '1';
    playSection.style.flex = '1';
  }
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