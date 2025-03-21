// DOM elements
const recordBtn = document.getElementById('record');
const playBtn = document.getElementById('play');
const saveBtn = document.getElementById('save');
const statusDiv = document.getElementById('status');
const audioPlayer = document.getElementById('audioPlayer');
const debugDiv = document.getElementById('debug');

// Global variables
let mediaRecorder;
let audioChunks = [];
let recordingUrl = null;
let stream = null;

// Debug logging
function log(message) {
    console.log(message);
    debugDiv.textContent += message + "\n";
}

// Initialize app
async function init() {
    try {
        const constraints = {
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            }
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);
        log("Got audio stream");

        let mimeType = 'audio/webm';
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4';
            log("Using MP4 format");
        } else {
            log("Using WebM format");
        }

        mediaRecorder = new MediaRecorder(stream, {
            mimeType: mimeType,
            audioBitsPerSecond: 128000
        });

        mediaRecorder.ondataavailable = handleDataAvailable;
        mediaRecorder.onstop = handleRecordingStop;

        log("MediaRecorder created");
        statusDiv.textContent = "Ready to record";

        recordBtn.addEventListener('click', toggleRecording);
        playBtn.addEventListener('click', playRecording);
        saveBtn.addEventListener('click', saveRecording);
    } catch (error) {
        log("Error initializing: " + error.message);
        statusDiv.textContent = "Error: " + error.message;
    }
}

function handleDataAvailable(event) {
    if (event.data && event.data.size > 0) {
        audioChunks.push(event.data);
        log(`Got chunk: ${event.data.size} bytes`);
    }
}

function handleRecordingStop() {
    log(`Recording stopped, got ${audioChunks.length} chunks`);
    const mimeType = mediaRecorder.mimeType;
    log(`Using MIME type: ${mimeType}`);
    const audioBlob = new Blob(audioChunks, { type: mimeType });
    log(`Created blob: ${audioBlob.size} bytes`);

    if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
    }

    recordingUrl = URL.createObjectURL(audioBlob);
    audioPlayer.src = recordingUrl;

    playBtn.disabled = false;
    saveBtn.disabled = false;
    statusDiv.textContent = "Recording ready";
}

function toggleRecording() {
    if (mediaRecorder.state === 'inactive') {
        restartMicrophone().then(() => {
            audioChunks = [];
            mediaRecorder.start(100);
            recordBtn.style.background = 'darkred';
            statusDiv.textContent = "Recording...";
            log("Recording started");

            playBtn.disabled = true;
            saveBtn.disabled = true;
            audioPlayer.src = '';
        }).catch(error => {
            statusDiv.textContent = "Microphone error: " + error.message;
            log("Error getting microphone: " + error.message);
        });
    } else {
        mediaRecorder.stop();
        recordBtn.style.background = 'red';
        log("Recording stopped");
        stopMicrophone();
    }
}

function stopMicrophone() {
    if (stream) {
        stream.getTracks().forEach(track => {
            track.stop();
        });
    }
}

async function restartMicrophone() {
    try {
        stopMicrophone();

        stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            }
        });

        const mimeType = MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : 'audio/webm';
        mediaRecorder = new MediaRecorder(stream, {
            mimeType: mimeType,
            audioBitsPerSecond: 128000
        });
        mediaRecorder.ondataavailable = handleDataAvailable;
        mediaRecorder.onstop = handleRecordingStop;

        log("Microphone restarted");
        return Promise.resolve();
    } catch (error) {
        log("Error restarting microphone: " + error.message);
        return Promise.reject(error);
    }
}

function playRecording() {
    if (audioPlayer.src) {
        audioPlayer.play()
            .then(() => {
                statusDiv.textContent = "Playing...";
                log("Playback started");
            })
            .catch(error => {
                statusDiv.textContent = "Use player controls to play";
                log("Playback error: " + error.message);
            });
    }
}

function saveRecording() {
    if (recordingUrl) {
        const extension = mediaRecorder.mimeType.includes('mp4') ? 'mp4' : 'webm';

        try {
            const link = document.createElement('a');
            link.href = recordingUrl;
            link.download = `recording_${Date.now()}.${extension}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            statusDiv.textContent = "Saving... (check downloads)";
            log("Download initiated");
        } catch (e) {
            statusDiv.textContent = "Long-press audio player to save";
            log("Save error: " + e.message);
        }
    }
}

document.addEventListener('DOMContentLoaded', function () {
    debugDiv.textContent = "";
    init();
});
