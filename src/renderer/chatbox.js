

// Folder icon opens task list view
folderIcon.addEventListener('click', () => {
    window.api.openTaskList();
});

// send icon opens task creation view
sendIcon.addEventListener('click', () => {
    console.log('uploadIcon clicked')
    window.api.openTalkWithAI();
});