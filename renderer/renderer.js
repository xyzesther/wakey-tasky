// DOM Elements
const minimizedIcon = document.getElementById('minimizedIcon');
const inputContainer = document.getElementById('inputContainer');
const taskListContainer = document.getElementById('taskListContainer');
const taskInput = document.getElementById('taskInput');
const sendButton = document.getElementById('sendButton');
const startTimeInput = document.getElementById('startTime');
const endTimeInput = document.getElementById('endTime');

// Variables to track state
let isDragging = false;
let offsetX, offsetY;
let isMinimized = false;

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
function toggleMinimized() {
    isMinimized = !isMinimized;
    
    if (isMinimized) {
        inputContainer.style.display = 'none';
        taskListContainer.style.display = 'none';
        minimizedIcon.style.display = 'flex';
    } else {
        inputContainer.style.display = 'flex';
        minimizedIcon.style.display = 'none';
        
        // Only show tasks if we have some
        loadTasks().then(hasItems => {
            taskListContainer.style.display = hasItems ? 'flex' : 'none';
        });
    }
}

// Initialize default time values (current time + 1 hour for end time)
function initializeTimeInputs() {
    const now = new Date();
    const startHours = now.getHours().toString().padStart(2, '0');
    const startMinutes = now.getMinutes().toString().padStart(2, '0');
    
    // Set end time to 1 hour later
    const endTime = new Date(now.getTime() + 60 * 60 * 1000);
    const endHours = endTime.getHours().toString().padStart(2, '0');
    const endMinutes = endTime.getMinutes().toString().padStart(2, '0');
    
    startTimeInput.value = `${startHours}:${startMinutes}`;
    endTimeInput.value = `${endHours}:${endMinutes}`;
}

// Add task to UI
function addTaskToUI(task) {
    // Format task data to ensure consistent structure
    const formattedTask = formatTaskData(task);
    console.log('Adding formatted task to UI:', formattedTask);
    
    const taskCard = document.createElement('div');
    taskCard.className = 'task-card';
    taskCard.dataset.taskId = formattedTask.id;
    
    // Format time
    let startTimeStr = 'Not set';
    let endTimeStr = 'Not set';
    
    try {
        const startTime = new Date(formattedTask.scheduledTime);
        startTimeStr = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        if (formattedTask.endTime) {
            const endTime = new Date(formattedTask.endTime);
            endTimeStr = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    } catch (e) {
        console.error('Error formatting task time:', e);
    }
    
    taskCard.innerHTML = `
        <div class="task-header">
            <div class="task-title">${formattedTask.title}</div>
            <div class="task-time">${startTimeStr} - ${endTimeStr}</div>
        </div>
        <div class="task-status">${formattedTask.status}</div>
        <div class="subtasks">
            ${formattedTask.subtasks.map(subtask => `
                <div class="subtask">
                    <div class="subtask-title">${subtask.title || 'Subtask'}</div>
                    <div class="subtask-duration">${subtask.duration || 0} min</div>
                </div>
            `).join('')}
        </div>
    `;
    
    taskListContainer.appendChild(taskCard);
}

// Load all tasks from API
async function loadTasks() {
    try {
        taskListContainer.innerHTML = '';
        
        const response = await window.api.getTasks();
        
        if (response.success && response.data.length > 0) {
            response.data.forEach(task => {
                addTaskToUI(task);
            });
            return true; // Has tasks
        }
        
        return false; // No tasks
    } catch (error) {
        console.error('Error loading tasks:', error);
        return false;
    }
}

// Show error dialog
function showError(message) {
    const errorDialog = document.getElementById('errorDialog');
    const errorMessage = document.getElementById('errorMessage');
    
    errorMessage.textContent = message || 'Failed to create task. Please try again.';
    errorDialog.style.display = 'flex';
}

// Submit a new task
async function submitTask() {
    try {
        if (!window.api) {
            throw new Error('API not available. preload.js may not be working.');
        }
        
        if (typeof window.api.generateTask !== 'function') {
            throw new Error('generateTask method not available in API.');
        }
        
        const text = taskInput.value.trim();
        if (!text) {
            showError('Please enter task content');
            return;
        }
        
        // Get time values
        const startTime = startTimeInput.value;
        const endTime = endTimeInput.value;
        
        if (!startTime || !endTime) {
            showError('Please set start and end times');
            return;
        }
        
        console.log('Submitting task:', { text, startTime, endTime });
        
        // Show loading state
        sendButton.disabled = true;
        sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        // Create task
        const response = await window.api.generateTask(text, startTime, endTime);
        console.log('Full API response:', response);
        
        if (response.success) {
            console.log('Task created successfully:', response.data.task);
            console.log('Subtasks:', response.data.task.subtasks);
            
            // Clear input field
            taskInput.value = '';
            
            // Add task to UI
            addTaskToUI(response.data.task);
            
            // Ensure task list is visible
            taskListContainer.style.display = 'flex';
        } else {
            console.error('Failed to create task:', response.error);
            showError(response.error || 'Failed to create task');
        }
    } catch (error) {
        console.error('Detailed submit error:', error);
        showError(`Task creation failed: ${error.message}`);
    } finally {
        // Restore button state
        sendButton.disabled = false;
        sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
    }
}

// Format task data to ensure consistent structure
function formatTaskData(task) {
    console.log('Formatting task data:', task);
    
    // Ensure task object has all required properties
    return {
        id: task.id || '',
        title: task.title || 'Unnamed Task',
        status: task.status || 'PENDING',
        scheduledTime: task.scheduledTime || new Date(),
        endTime: task.endTime || null,
        subtasks: Array.isArray(task.subtasks) ? task.subtasks : []
    };
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Debug check for API
    console.log('Window API available:', window.api);
    console.log('API methods:', window.api ? Object.keys(window.api) : 'API not available');
    
    // Initialize time inputs
    initializeTimeInputs();
    
    // Initially, show input form and hide minimized icon
    minimizedIcon.style.display = 'none';
    inputContainer.style.display = 'flex';
    taskListContainer.style.display = 'none';
    
    // Load tasks on startup
    loadTasks().then(hasItems => {
        taskListContainer.style.display = hasItems ? 'flex' : 'none';
    });
    
    // Handle minimize/maximize
    minimizedIcon.addEventListener('click', toggleMinimized);
    
    // Handle form submission
    sendButton.addEventListener('click', submitTask);
    
    // Also allow pressing Enter to submit
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitTask();
        }
    });

    // In your DOMContentLoaded event listener, add:
    document.getElementById('errorOkButton').addEventListener('click', () => {
        document.getElementById('errorDialog').style.display = 'none';
    });

    // 在DOMContentLoaded事件中添加
    window.api.ping().then(response => {
        console.log('Ping response:', response);
    }).catch(error => {
        console.error('Ping failed:', error);
    });

    // Add this early in your code
    console.log('Testing API...');
    if (window.api) {
        console.log('API test result:', window.api.test());
    } else {
        console.error('API not available!');
    }
});