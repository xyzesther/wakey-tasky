// DOM Elements
const minimizedIcon = document.getElementById('minimizedIcon');
const inputContainer = document.getElementById('inputContainer');
const taskListContainer = document.getElementById('taskListContainer');
const taskInput = document.getElementById('taskInput');
const sendButton = document.getElementById('sendButton');
const startTime = document.getElementById('startTime');
const endTime = document.getElementById('endTime');

// Variables to track state
let isDragging = false;
let offsetX, offsetY;
let isExpanded = false;

// Make the minimized icon draggable
minimizedIcon.addEventListener('mousedown', (e) => {
    isDragging = true;
    
    // Calculate the offset between mouse position and element position
    const rect = minimizedIcon.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    
    minimizedIcon.style.transition = 'none'; // Disable transition during drag
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    // Update position based on mouse movement
    const newX = e.clientX - offsetX;
    const newY = e.clientY - offsetY;
    
    // Keep icon within viewport boundaries
    const maxX = window.innerWidth - minimizedIcon.offsetWidth;
    const maxY = window.innerHeight - minimizedIcon.offsetHeight;
    
    minimizedIcon.style.left = `${Math.max(0, Math.min(newX, maxX))}px`;
    minimizedIcon.style.bottom = 'auto';
    minimizedIcon.style.right = 'auto';
    minimizedIcon.style.top = `${Math.max(0, Math.min(newY, maxY))}px`;
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    minimizedIcon.style.transition = 'transform 0.2s'; // Re-enable transition
});

// Toggle between minimized and expanded states
minimizedIcon.addEventListener('click', () => {
    if (isDragging) return; // Don't toggle if we just finished dragging
    
    isExpanded = !isExpanded;
    
    if (isExpanded) {
        minimizedIcon.style.transform = 'scale(0)';
        setTimeout(() => {
            minimizedIcon.style.display = 'none';
            inputContainer.style.display = 'block';
            // Show task list if there are tasks
            if (taskListContainer.children.length > 0) {
                taskListContainer.style.display = 'block';
            }
        }, 200);
    }
});

// Mock function to create a task (without backend)
function createTask(text, start, end) {
    // Create a task card
    const taskCard = document.createElement("div");
    taskCard.className = "task-card";

    // Create task header (task title + start button)
    const taskHeader = document.createElement("div");
    taskHeader.className = "task-header";

    // Task title
    const taskTitle = document.createElement("div");
    taskTitle.className = "task-title";
    taskTitle.textContent = text;
    
    // Add "Start" button next to the task title
    const startButton = document.createElement("button");
    startButton.className = "start-button";
    startButton.textContent = "Start";

    // Add event listener to the "Start" button
    startButton.addEventListener("click", () => {
        startButton.textContent = "In Progress...";
        startButton.disabled = true;
        startButton.style.backgroundColor = "#bbb"; // Grayed out
        startButton.style.cursor = "not-allowed";

        // Simulate task execution
        setTimeout(() => {
            startButton.textContent = "Completed";
            startButton.style.backgroundColor = "#8bc34a"; // Green for success
        }, 5000);
    });

    // Append title and button inside task header
    taskHeader.appendChild(taskTitle);
    taskHeader.appendChild(startButton);

    // Task time range
    const taskTime = document.createElement("div");
    taskTime.className = "task-time";
    taskTime.innerHTML = `<i class="fas fa-clock"></i> ${start} - ${end}`;

    // Add subtasks
    const subtasks = document.createElement("div");
    subtasks.className = "subtasks";

    for (let i = 1; i <= 3; i++) {
        const subtask = document.createElement("div");
        subtask.className = "subtask-item";

        const subtaskLeft = document.createElement("div");
        subtaskLeft.className = "subtask-left";
        subtaskLeft.innerHTML = `<input type="checkbox"> <span>Subtask ${i}</span>`;

        const subtaskDuration = document.createElement("div");
        subtaskDuration.className = "subtask-duration";
        subtaskDuration.textContent = `${Math.floor(Math.random() * 30) + 15} min`;

        subtask.appendChild(subtaskLeft);
        subtask.appendChild(subtaskDuration);
        subtasks.appendChild(subtask);
    }

    // Append all elements to task card
    taskCard.appendChild(taskHeader);
    taskCard.appendChild(taskTime);
    taskCard.appendChild(subtasks);

    // Append task card to task list container
    taskListContainer.style.display = "block";
    taskListContainer.appendChild(taskCard);

    // Reset input field
    taskInput.value = "";
}

// Handle send button click
sendButton.addEventListener('click', () => {
    const text = taskInput.value.trim();
    const start = startTime.value;
    const end = endTime.value;
    
    if (text) {
        createTask(text, start || 'Not set', end || 'Not set');
    }
});

// Allow pressing Enter to send
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendButton.click();
    }
});

// Add a click event outside the input container to minimize
document.addEventListener('mousedown', (e) => {
    if (isExpanded && 
        !inputContainer.contains(e.target) && 
        !taskListContainer.contains(e.target)) {
        // Minimize the app
        inputContainer.style.display = 'none';
        taskListContainer.style.display = 'none';
        minimizedIcon.style.display = 'flex';
        setTimeout(() => {
            minimizedIcon.style.transform = 'scale(1)';
        }, 10);
        isExpanded = false;
    }
});

// Initialize time inputs with current time when focused
document.addEventListener('DOMContentLoaded', () => {
    startTime.addEventListener('focus', setCurrentTimeIfEmpty);
    endTime.addEventListener('focus', setEndTimeIfEmpty);
    
    function setCurrentTimeIfEmpty() {
        if (!this.value) {
            const now = new Date();
            this.value = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        }
    }
    
    function setEndTimeIfEmpty() {
        if (!this.value) {
            const later = new Date();
            later.setHours(later.getHours() + 1);
            this.value = `${later.getHours().toString().padStart(2, '0')}:${later.getMinutes().toString().padStart(2, '0')}`;
        }
    }
});