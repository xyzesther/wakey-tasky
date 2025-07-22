// Pomodoro Timer for Subtask
// Parse subtask info from query string
function getQueryParams() {
    const params = {};
    window.location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(str,key,value) {
        params[key] = decodeURIComponent(value);
    });
    return params;
}

const params = getQueryParams();
const subtaskId = params.subtaskId;
const subtaskTitle = params.title || 'Subtask';
const subtaskDuration = parseInt(params.duration, 10) || 25; // in minutes

// UI Elements
const app = document.getElementById('pomodoro-app');
app.innerHTML = `
    <div class="pomodoro-container">
        <h2 id="pomodoro-title">${subtaskTitle}</h2>
        <div id="timer-display" class="timer-display">${formatTime(subtaskDuration * 60)}</div>
        <div class="pomodoro-controls">
            <button id="start-btn" class="pomodoro-btn">Start</button>
            <button id="stop-btn" class="pomodoro-btn" disabled>Stop</button>
        </div>
        <div id="pomodoro-status" class="pomodoro-status"></div>
    </div>
`;

let timer = null;
let timeLeft = subtaskDuration * 60; // seconds
let running = false;

const timerDisplay = document.getElementById('timer-display');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const statusDiv = document.getElementById('pomodoro-status');

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateDisplay() {
    timerDisplay.textContent = formatTime(timeLeft);
}

function startTimer() {
    if (running) return;
    running = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    statusDiv.textContent = '';
    timer = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateDisplay();
        } else {
            clearInterval(timer);
            running = false;
            timerDisplay.textContent = '00:00';
            statusDiv.textContent = 'Pomodoro complete!';
            onPomodoroComplete();
        }
    }, 1000);
}

function stopTimer() {
    if (!running) return;
    running = false;
    clearInterval(timer);
    startBtn.disabled = false;
    stopBtn.disabled = true;
    statusDiv.textContent = 'Timer stopped.';
}

startBtn.addEventListener('click', startTimer);
stopBtn.addEventListener('click', stopTimer);

function onPomodoroComplete() {
    // Mark subtask as completed via backend
    if (window.api && window.api.completeSubtask && subtaskId) {
        window.api.completeSubtask(subtaskId).then(() => {
            setTimeout(() => window.close(), 1200);
        });
    } else {
        setTimeout(() => window.close(), 1200);
    }
}

// Optional: auto-start timer on load
// startTimer(); 