// Get DOM elements
const chatCloseButton = document.getElementById('chatCloseButton');
const chatMinimizeButton = document.getElementById('chatMinimizeButton');

// Close button handler
chatCloseButton.addEventListener('click', () => {
    console.log('chatCloseButton clicked');
    window.api.closeWindow();
});

// Minimize button handler
chatMinimizeButton.addEventListener('click', () => {
    window.api.minimizeWindow();
});