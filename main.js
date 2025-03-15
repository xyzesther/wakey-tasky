const {app, BrowserWindow} = require('electron');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Initialize Prisma
const prisma = new PrismaClient();

// Import our Express server
const server = require('./app/server');

function createMainWindow() {
    const mainWindow = new BrowserWindow({
        title: 'Wakey Tasky',
        width: 450,
        height: 650,
        frame: false,
        transparent: true,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Hide the menu bar
    mainWindow.setMenuBarVisibility(false);
    
    // Load the HTML file
    mainWindow.loadFile(path.join(__dirname, './app/index.html'));
}

app.whenReady().then(() => {
    createMainWindow();
    
    // Handle app activation (macOS)
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

// Quit the app when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});

// Clean up resources before exiting
app.on('before-quit', async () => {
    await prisma.$disconnect();
    server.close();
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});

// Clean up resources before exiting
app.on('before-quit', async () => {
    await prisma.$disconnect();
    server.close();
});
