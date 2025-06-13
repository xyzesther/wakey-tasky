// Get DOM elements
const chatCloseButton = document.getElementById('chatCloseButton');
const chatMinimizeButton = document.getElementById('chatMinimizeButton');
const chatboxContainer = document.querySelector('.chatbox-container');

// Add drag functionality
let isDragging = true;
let startX, startY;

// Make the entire chatbox draggable
chatboxContainer.addEventListener('mousedown', (e) => {
    // Skip if clicking on icons or window controls
    if (e.target.classList.contains('prompt-icon') || 
        e.target.classList.contains('window-control')) return;
    
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    
    e.preventDefault();
});

function onMouseMove(e) {
    if (!isDragging) return;
    
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    if (deltaX !== 0 || deltaY !== 0) {
        window.api.dragWindow(deltaX, deltaY);
        startX = e.clientX;
        startY = e.clientY;
    }
}

function onMouseUp() {
    isDragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
}

// Close button handler
chatCloseButton.addEventListener('click', () => {
    console.log('chatCloseButton clicked');
    window.api.closeWindow();
});

// Minimize button handler
chatMinimizeButton.addEventListener('click', () => {
    window.api.minimizeWindow();
});