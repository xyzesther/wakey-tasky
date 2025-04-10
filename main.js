const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Initialize Prisma
const prisma = new PrismaClient();

// Import our Express server
const server = require('./server');

// Store references to windows
let mainWindow;
let chatboxWindow;

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

function createMainWindow() {
    mainWindow = new BrowserWindow({
        title: 'Wakey Tasky',
        width: 80,  // Smaller width for the awaiting icon
        height: 80, // Smaller height for the awaiting icon
        frame: false,
        transparent: true,
        resizable: false,
        skipTaskbar: false, // Show in taskbar so it's easier to find
        alwaysOnTop: false, // Don't keep on top as it can interfere with other windows
        movable: true,     // Ensure window is movable
        show: true,       // Show window on creation
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Hide the menu bar
    mainWindow.setMenuBarVisibility(false);
    
    // Position window in the bottom right corner
    const { width, height } = require('electron').screen.getPrimaryDisplay().workAreaSize;
    mainWindow.setPosition(width - 100, height - 100);
    
    // Make window draggable from anywhere
    mainWindow.setMovable(true);
    
    // Load the HTML file
    mainWindow.loadFile(path.join(__dirname, './renderer/index.html'));
}

// Handle IPC resize-window event
ipcMain.handle('resize-window', (event, { width, height }) => {
    if (mainWindow) {
        mainWindow.setSize(width, height);
        
        // If expanding the window, center it on screen
        if (width > 80) {
            mainWindow.center();
            // Ensure the window has a title bar and is not transparent for expanded views
            if (width === 350 && (height === 150 || height === 200)) {
                // Chatbox interface - maintain transparency and no frame for the chat UI
                mainWindow.setResizable(false);
                mainWindow.setOpacity(1.0);
            } else {
                // Task creation or task list view - need a frame
                mainWindow.setResizable(true);
            }
        } else {
            // If minimizing, position it in the bottom right corner
            const { width: screenWidth, height: screenHeight } = 
                require('electron').screen.getPrimaryDisplay().workAreaSize;
            mainWindow.setPosition(screenWidth - 100, screenHeight - 100);
        }
        
        return true;
    }
    return false;
});

// Handle IPC for window dragging
ipcMain.on('window-drag-start', () => {
    if (mainWindow) {
        mainWindow.webContents.send('window-drag-enabled');
    }
});

ipcMain.on('window-drag', (event, { mouseX, mouseY }) => {
    if (mainWindow) {
        const { x, y } = mainWindow.getPosition();
        mainWindow.setPosition(x + mouseX, y + mouseY);
    }
});

ipcMain.on('window-drag-end', () => {
    if (mainWindow) {
        mainWindow.webContents.send('window-drag-disabled');
    }
});

// Function to create the chatbox window
function createChatboxWindow() {
    // If chatbox window already exists, just focus it and return
    if (chatboxWindow) {
        chatboxWindow.focus();
        return;
    }
    
    chatboxWindow = new BrowserWindow({
        title: 'WakeyTasky Chat',
        width: 370, // Slightly wider to ensure full content display
        height: 180, // Increased height to accommodate the layout
        frame: false,
        transparent: true,
        resizable: false,
        alwaysOnTop: false, // Don't keep on top
        skipTaskbar: false, // Show in taskbar
        movable: true,
        show: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    
    // Hide the menu bar
    chatboxWindow.setMenuBarVisibility(false);
    
    // Load the chatbox HTML file
    chatboxWindow.loadFile(path.join(__dirname, './renderer/chatbox.html'));
    
    // Center the window on screen
    chatboxWindow.center();
    
    // Handle window close
    chatboxWindow.on('closed', () => {
        chatboxWindow = null;
        
        // Show the main window again when the chatbox is closed
        if (mainWindow) {
            mainWindow.show();
        }
    });
}

// IPC handler to open chatbox window
ipcMain.handle('open-chatbox', (event) => {
    // Hide the main window when opening the chatbox
    if (mainWindow) {
        mainWindow.hide();
    }
    
    createChatboxWindow();
    return true;
});

// IPC handler for window operations
ipcMain.on('close-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        // If it's the chatbox being closed, show the main window
        if (win === chatboxWindow) {
            if (mainWindow) {
                mainWindow.show();
            }
        }
        
        win.close();
    }
});

ipcMain.on('minimize-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        win.minimize();
    }
});

ipcMain.on('open-task-list', () => {
    // If main window is not open, create it
    if (!mainWindow) {
        createMainWindow();
    } else {
        // Make sure main window is visible
        mainWindow.show();
    }
    
    // Show task list in main window
    mainWindow.webContents.send('show-task-list');
    mainWindow.focus();
    
    // Hide chatbox if it exists (don't close it)
    if (chatboxWindow) {
        chatboxWindow.close();
    }
});

ipcMain.on('open-task-creation', () => {
    // If main window is not open, create it
    if (!mainWindow) {
        createMainWindow();
    } else {
        // Make sure main window is visible
        mainWindow.show();
    }
    
    // Show task creation in main window
    mainWindow.webContents.send('show-task-creation');
    mainWindow.focus();
    
    // Hide chatbox if it exists (don't close it)
    if (chatboxWindow) {
        chatboxWindow.close();
    }
});

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
