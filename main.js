const {app, BrowserWindow} = require('electron');
const path = require('path');

function createMainWindow() {
    const mainWindow = new BrowserWindow({
        title: 'Wakey Tasky',
        width: 400,
        height: 600,
        // webPreferences: {
        //     nodeIntegration: true
        // }
    });

    mainWindow.loadFile(path.join(__dirname, './app/index.html'));
}

app.whenReady().then(() => {
    createMainWindow();
});
