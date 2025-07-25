// Pomodoro Timer JavaScript - Creates the pill structure
console.log('Pomodoro.js loaded');

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

console.log('Parsed params:', { subtaskId, subtaskTitle, subtaskDuration });

// Timer variables
let timeLeft = subtaskDuration * 60; // seconds
let totalTime = subtaskDuration * 60; // Store total time for progress calculation
let timer = null;
let running = false;

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM ready, setting up UI...');
    setupUI();
});

function setupUI() {
    console.log('Creating pill structure...');
    
    // Get the app container
    const app = document.getElementById('pomodoro-app');
    if (!app) {
        console.error('Pomodoro app container not found!');
        return;
    }
    
    // create the pill structure
    app.innerHTML = `
        <div class="pomodoro-container">
            <div class="pill-container">
                <div class="color-dot" id="colorDot"></div>
                <div class="text-container">
                    <div class="task-info">
                        <div class="title-time" id="titleTime">
                            <span class="task-name">SUBTASK</span>
                            <div class="timer-controls">
                                <span class="timer-display" id="timerDisplay">${formatTime(timeLeft)}</span>
                                <button class="dot-line-btn" id="dotLineBtn" title="Add 5 minutes">
                                    <img src="./assets/add_dot_line.svg" alt="Add time" width="12" height="12">
                                </button>
                                <button class="pause-btn" id="pauseBtn" title="Pause/Resume">
                                    <img src="./assets/pause.svg" alt="Pause" width="12" height="12">
                                </button>
                            </div>
                            <div class="completion-message">Well done! You finished the task!</div>
                        </div>
                        <div class="task-description" id="taskDescription">${subtaskTitle}</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    console.log('Pill structure created! Real data:', { subtaskTitle, timeFormatted: formatTime(timeLeft) });
    
    // Hide loading container (if any)
    const loadingContainer = document.querySelector('.loading-container');
    if (loadingContainer) {
        loadingContainer.style.display = 'none';
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Auto-start the timer after a short delay
    setTimeout(() => {
        console.log('Auto-starting timer...');
        startTimer();
    }, 500);
}

function setupEventListeners() {
    const colorDot = document.getElementById('colorDot');
    const pauseBtn = document.getElementById('pauseBtn');
    const dotLineBtn = document.getElementById('dotLineBtn');
    
    // Color dot click - pause/resume or complete task
    if (colorDot) {
        colorDot.addEventListener('click', () => {
            if (colorDot.classList.contains('completed')) {
                console.log('Task already completed');
                return;
            }
            
            if (running) {
                pauseTimer();
            } else if (timeLeft > 0) {
                resumeTimer();
            } else {
                completePomodoro();
            }
        });
    }
    
    // Pause button
    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            if (running) {
                pauseTimer();
            } else if (timeLeft > 0 && pauseBtn.classList.contains('paused')) {
                resumeTimer();
            }
        });
    }
    
    // Add time button (dot line button)
    if (dotLineBtn) {
        dotLineBtn.addEventListener('click', () => {
            addTime();
        });
    }
    
    console.log('Event listeners set up successfully');
}

function startTimer() {
    console.log('Starting timer...');
    if (running) return;
    
    running = true;
    const colorDot = document.getElementById('colorDot');
    const timerDisplay = document.getElementById('timerDisplay');
    const pauseBtn = document.getElementById('pauseBtn');
    
    if (colorDot) colorDot.classList.add('progress');
    if (timerDisplay) timerDisplay.classList.remove('paused');
    if (pauseBtn) pauseBtn.classList.remove('paused');
    
    updateProgress();
    
    timer = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateDisplay();
            updateProgress();
        } else {
            clearInterval(timer);
            running = false;
            onPomodoroComplete();
        }
    }, 1000);
    
    console.log(`Timer started for ${subtaskTitle} - ${formatTime(timeLeft)} remaining`);
}

function pauseTimer() {
    console.log('Pausing timer...');
    if (!running) return;
    
    running = false;
    clearInterval(timer);
    
    const timerDisplay = document.getElementById('timerDisplay');
    const pauseBtn = document.getElementById('pauseBtn');
    
    if (timerDisplay) timerDisplay.classList.add('paused');
    if (pauseBtn) {
        pauseBtn.classList.add('paused');
        const img = pauseBtn.querySelector('img');
        if (img) {
            img.src = './assets/pause_grey.svg';
            img.alt = 'Resume';
        }
    }
}

function resumeTimer() {
    console.log('Resuming timer...');
    if (running || timeLeft === 0) return;
    
    const timerDisplay = document.getElementById('timerDisplay');
    const pauseBtn = document.getElementById('pauseBtn');
    
    if (timerDisplay) timerDisplay.classList.remove('paused');
    if (pauseBtn) {
        pauseBtn.classList.remove('paused');
        pauseBtn.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M8.5 2.5L8.5 9.5" stroke="rgba(196, 149, 249, 0.5)" stroke-width="1" stroke-linecap="round"/>
                <path d="M3.5 2.5L3.5 9.5" stroke="rgba(196, 149, 249, 0.5)" stroke-width="1" stroke-linecap="round"/>
            </svg>
        `;
    }
    
    startTimer();
}

function addTime() {
    console.log('Adding 5 minutes...');
    timeLeft += 5 * 60; // Add 5 minutes
    totalTime += 5 * 60; // Update total time for correct progress calculation
    updateDisplay();
    updateProgress();
    
    // Show feedback
    const dotLineBtn = document.getElementById('dotLineBtn');
    if (dotLineBtn) {
        dotLineBtn.style.transform = 'scale(1.2)';
        setTimeout(() => {
            dotLineBtn.style.transform = 'scale(1)';
        }, 200);
    }
}

function updateDisplay() {
    const timerDisplay = document.getElementById('timerDisplay');
    if (timerDisplay) {
        timerDisplay.textContent = formatTime(timeLeft);
    }
}

function updateProgress() {
    const colorDot = document.getElementById('colorDot');
    if (colorDot && totalTime > 0) {
        const progress = ((totalTime - timeLeft) / totalTime) * 284; // 284px is max width from CSS
        colorDot.style.setProperty('--progress-width', `${Math.max(0, progress)}px`);
    }
}

function completePomodoro() {
    console.log('Completing pomodoro for:', subtaskTitle);
    clearInterval(timer);
    running = false;
    
    const colorDot = document.getElementById('colorDot');
    const titleTime = document.getElementById('titleTime');
    const taskDescription = document.getElementById('taskDescription');
    
    if (colorDot) {
        colorDot.classList.remove('progress');
        colorDot.classList.add('completed');
        colorDot.style.setProperty('--progress-width', '284px');
    }
    if (titleTime) titleTime.classList.add('completed');
    if (taskDescription) taskDescription.classList.add('completed');
    
    // Complete the subtask in backend
    if (window.api && window.api.completeSubtask && subtaskId) {
        console.log('Calling completeSubtask API for:', subtaskId);
        window.api.completeSubtask(subtaskId).then((result) => {
            console.log('CompleteSubtask result:', result);
            setTimeout(() => {
                if (window.close) {
                    window.close();
                }
            }, 3000);
        }).catch(error => {
            console.error('Error completing subtask:', error);
            setTimeout(() => {
                if (window.close) {
                    window.close();
                }
            }, 3000);
        });
    } else {
        console.log('API not available, closing window in 3 seconds...');
        setTimeout(() => {
            if (window.close) {
                window.close();
            }
        }, 3000);
    }
}

function onPomodoroComplete() {
    console.log(`Timer finished naturally for: ${subtaskTitle}`);
    completePomodoro();
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Debug info
console.log('Pomodoro timer initialized with:', {
    subtaskId,
    subtaskTitle,
    subtaskDuration: `${subtaskDuration} minutes`,
    timeLeft: `${formatTime(timeLeft)}`,
    totalTime: `${formatTime(totalTime)}`
});