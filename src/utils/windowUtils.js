// Get DOM elements
const chatCloseButton = document.getElementById('chatCloseButton');
const chatMinimizeButton = document.getElementById('chatMinimizeButton');
const chatBoxContainer = document.querySelector('.chatbox-container') || 
                //   document.querySelector('.talkwithai-container') ||
                  document.querySelector('.tasklist-container');

// Add drag functionality
let isDragging = false;  // 修改为 false
let startX, startY;

// Make the entire chatbox draggable
chatboxContainer.addEventListener('mousedown', (e) => {
    // Skip if clicking on icons or window controls
    if (e.target.classList.contains('prompt-icon') || 
        e.target.classList.contains('window-control') ||
        e.target.id === 'chatInput' ||  // 添加排除输入框
        e.target.id === 'chatSendBtn') {
        return;
    }
    
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