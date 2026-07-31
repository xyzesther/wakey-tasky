// DOM Elements
const minimizedIcon = document.getElementById('minimizedIcon');
const inputContainer = document.getElementById('inputContainer');
const taskListContainer = document.getElementById('taskListContainer');
const chatboxContainer = document.getElementById('chatboxContainer');
const taskInput = document.getElementById('taskInput');
const sendButton = document.getElementById('sendButton');
const errorDialog = document.getElementById('errorDialog');
const errorOkButton = document.getElementById('errorOkButton');
const chatCloseButton = document.getElementById('chatCloseButton');
const chatMinimizeButton = document.getElementById('chatMinimizeButton');
const folderIcon = document.getElementById('folderIcon');
const sendIcon = document.getElementById('sendIcon');

// Variables to track state
let currentState = 'minimized'; // 'minimized', 'chat', 'input', 'tasks'

// Add window dragging functionality to the window controls and app icon
const dragElements = [
    document.querySelector('.window-controls'),
    document.querySelector('.app-icon'),
    minimizedIcon
];

// Variables for window dragging
let isWindowDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;
let didWindowDrag = false;

// Hide containers and show minimized icon by default
inputContainer.style.display = 'none';
taskListContainer.style.display = 'none';
chatboxContainer.style.display = 'none';
minimizedIcon.style.display = 'flex';

// Set initial position styles for the minimized icon
minimizedIcon.style.position = 'absolute';
minimizedIcon.style.right = '20px';
minimizedIcon.style.bottom = '20px';

// Toggle between minimized and other states when clicking the icon
minimizedIcon.addEventListener('click', () => {
    if (!didWindowDrag) {
        // Open the chatbox in a new window instead of showing it inline
        window.api.openChatbox();
    }
});

// Chatbox control buttons
chatCloseButton.addEventListener('click', () => {
    minimizeApp();
});

chatMinimizeButton.addEventListener('click', () => {
    minimizeApp();
});

// Make error dialog closable
errorOkButton.addEventListener('click', () => {
    errorDialog.style.display = 'none';
});

// Folder icon opens the task list view
folderIcon.addEventListener('click', () => {
    showTasksInterface();
});

// Send icon opens task creation view
sendIcon.addEventListener('click', () => {
    showInputInterface();
});

// Add window dragging to elements
dragElements.forEach(element => {
    if (element) {
        element.addEventListener('mousedown', startWindowDrag);
    }
});

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Debug check for API
    console.log('Window API available:', window.api);
    console.log('API methods:', window.api ? Object.keys(window.api) : 'API not available');
    
    // Initially, show icon and hide other containers
    minimizedIcon.style.display = 'flex';  // or 'block' depending on your CSS
    inputContainer.style.display = 'none';
    taskListContainer.style.display = 'none';
    
    // Load tasks on startup (but don't automatically show them)
    loadTasks().then(hasItems => {
        // Don't change display yet, let user click the icon first
        console.log(`${hasItems ? 'Tasks loaded' : 'No tasks found'}`);
    });
    
    // Handle form submission
    sendButton.addEventListener('click', submitTask);
    
    // Also allow pressing Enter to submit
    taskInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
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
        
        // Set up IPC event listeners
        window.api.onShowTaskList(() => {
            console.log('Received show-task-list event');
            showTasksInterface();
        });
        
        window.api.onShowTaskCreation(() => {
            console.log('Received show-task-creation event');
            showInputInterface();
        });
    } else {
        console.error('API not available!');
    }
});

// Start window drag operation
function startWindowDrag(e) {
    e.preventDefault();
    isWindowDragging = true;
    didWindowDrag = false;
    lastMouseX = e.screenX;
    lastMouseY = e.screenY;
    
    window.api.startWindowDrag();
    
    // Add temporary event listeners
    document.addEventListener('mousemove', windowDragMove);
    document.addEventListener('mouseup', windowDragEnd);
}

// Handle window drag movement
function windowDragMove(e) {
    if (!isWindowDragging) return;
    
    const deltaX = e.screenX - lastMouseX;
    const deltaY = e.screenY - lastMouseY;
    
    if (deltaX !== 0 || deltaY !== 0) {
        didWindowDrag = true;
        window.api.dragWindow(deltaX, deltaY);
        lastMouseX = e.screenX;
        lastMouseY = e.screenY;
    }
}

// End window drag operation
function windowDragEnd() {
    if (isWindowDragging) {
        isWindowDragging = false;
        window.api.endWindowDrag();
        
        // Remove temporary event listeners
        document.removeEventListener('mousemove', windowDragMove);
        document.removeEventListener('mouseup', windowDragEnd);
    }
}

// Show the chat interface
function showChatInterface() {
    currentState = 'chat';
    
    // Hide other interfaces, show chatbox
    minimizedIcon.style.display = 'none';
    inputContainer.style.display = 'none';
    taskListContainer.style.display = 'none';
    chatboxContainer.style.display = 'flex';
    
    // Resize window to fit the chatbox - using dimensions from Figma design
    window.api.resizeWindow(350, 150);
}

// Show the task input interface
function showInputInterface() {
    currentState = 'input';
    
    // Hide other interfaces, show input
    minimizedIcon.style.display = 'none';
    chatboxContainer.style.display = 'none';
    taskListContainer.style.display = 'none';
    inputContainer.style.display = 'flex';
    
    // Resize window
    window.api.resizeWindow(450, 300);
    
}

// Show the tasks list interface
function showTasksInterface() {
    currentState = 'tasks';
    
    // Load tasks first to see if we have any
    loadTasks().then(hasItems => {
        // If no tasks, switch to input interface instead
        if (!hasItems) {
            showInputInterface();
            return;
        }
        
        // Hide other interfaces, show task list
        minimizedIcon.style.display = 'none';
        chatboxContainer.style.display = 'none';
        inputContainer.style.display = 'none';
        taskListContainer.style.display = 'flex';
        
        // Resize window
        window.api.resizeWindow(450, 650);
    });
}

// Minimize the app to just the icon
function minimizeApp() {
    currentState = 'minimized';
    
    // Hide all interfaces, show icon
    chatboxContainer.style.display = 'none';
    inputContainer.style.display = 'none';
    taskListContainer.style.display = 'none';
    minimizedIcon.style.display = 'flex';
    
    // Resize window to just fit the icon
    window.api.resizeWindow(80, 80);
    
    // Give the window resize a moment to complete before repositioning
    setTimeout(() => {
        // Make sure position is set correctly
        if (!minimizedIcon.style.left || !minimizedIcon.style.top) {
            // Default position in bottom right if not set
            const { innerWidth, innerHeight } = window;
            minimizedIcon.style.left = `${innerWidth - 100}px`;
            minimizedIcon.style.top = `${innerHeight - 100}px`;
        }
    }, 100);
}

// Legacy toggle function - replaced with more specific state functions
function toggleMinimized() {
    if (currentState === 'minimized') {
        showChatInterface();
    } else {
        minimizeApp();
    }
}

// Add task to UI
function addTaskToUI(task) {
    // Format task data to ensure consistent structure
    const formattedTask = formatTaskData(task);
    console.log('Adding formatted task to UI:', formattedTask);
    
    const taskCard = document.createElement('div');
    taskCard.className = 'task-card';
    taskCard.dataset.taskId = formattedTask.id;
    
    const createdTime = new Date(formattedTask.createdAt).toLocaleString();
    
    taskCard.innerHTML = `
        <div class="task-header">
            <div class="task-title">${escapeHtml(formattedTask.title)}</div>
            <div class="task-actions">
                <div class="task-time">${formattedTask.duration} min · ${escapeHtml(createdTime)}</div>
                <button class="delete-button" data-id="${formattedTask.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="task-status">${formattedTask.status}</div>
        <div class="subtasks">
            ${formattedTask.subtasks.map(subtask => `
                <div class="subtask">
                    <div class="subtask-title">${escapeHtml(subtask.title || 'Subtask')}</div>
                    <div class="subtask-duration">${subtask.duration || 0} min</div>
                </div>
            `).join('')}
        </div>
    `;
    
    taskListContainer.appendChild(taskCard);
    
    // Add event listener for the delete button
    const deleteButton = taskCard.querySelector('.delete-button');
    deleteButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event from bubbling to the task card
        deleteTask(formattedTask.id);
    });
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
        
        console.log('Submitting task:', { text });
        
        // Show loading state
        sendButton.disabled = true;
        sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        // Create task
        const response = await window.api.generateTask(text);
        console.log('Full API response:', response);
        
        if (response.success) {
            const createdTasks = Array.isArray(response.data) ? response.data : [];
            console.log('Tasks created successfully:', createdTasks);
            
            // Clear input field
            taskInput.value = '';
            
            createdTasks.forEach(addTaskToUI);
            
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
        createdAt: task.createdAt || new Date().toISOString(),
        duration: Number.isFinite(task.duration)
            ? task.duration
            : (task.subtasks || []).reduce(
                (total, subtask) => total + (subtask.duration || 0),
                0
            ),
        subtasks: Array.isArray(task.subtasks) ? task.subtasks : []
    };
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

// Function to delete a task
async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }
    
    try {
        const response = await window.api.deleteTask(taskId);
        
        if (response.success) {
            // Remove the task from UI
            const taskCard = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
            if (taskCard) {
                taskCard.remove();
            }
            
            // Check if there are any tasks left
            if (taskListContainer.children.length === 0) {
                taskListContainer.style.display = 'none';
                inputContainer.style.display = 'flex';
            }
            
            console.log('Task deleted successfully');
        } else {
            console.error('Failed to delete task:', response.error);
            showError(response.error || 'Failed to delete task');
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        showError(`Failed to delete task: ${error.message}`);
    }
}
