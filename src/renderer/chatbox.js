

// Folder icon opens task list view
folderIcon.addEventListener('click', () => {
    window.api.openTaskList();
});

// Download icon opens task creation view
downloadIcon.addEventListener('click', () => {
    console.log('uploadIcon clicked')
    window.api.openTalkWithAI();
});