const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Initialize Prisma
const prisma = new PrismaClient();

// Import our Express server
const server = require('../server');

// ----------------------------------------------------------------------------
// Application window creation and management
// ----------------------------------------------------------------------------

// Store references to windows
let mainWindow;
let chatboxWindow;
let taskListWindow;

// Position information for chatbox and task list windows
let chatboxPosition = { x: 0, y: 0 };
let taskListPosition = { x: 0, y: 0 };

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
            preload: path.join(__dirname, '../preload/preload.js') // Use preload script for secure context
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
    mainWindow.loadFile(path.join(__dirname, '../../public/index.html'));
}



// Function to create the chatbox window
function createChatboxWindow() {
    chatboxWindow = new BrowserWindow({
        width: 400,
        height: 500,
        frame: false,
        transparent: true,
        webPreferences: {
            preload: path.join(__dirname, '../preload/preload.js')
        }
    });
    
    chatboxWindow.loadFile(path.join(__dirname, '../../public/chatbox.html'));
    
    // 存储 chatbox 窗口位置，用于任务列表窗口定位
    chatboxPosition = chatboxWindow.getPosition();
    
    chatboxWindow.on('closed', () => {
        chatboxWindow = null;
    });
    
    // 当 chatbox 窗口移动时，更新位置信息
    chatboxWindow.on('move', () => {
        if (chatboxWindow) {
            chatboxPosition = chatboxWindow.getPosition();
            
            // 如果任务列表窗口已打开，同步移动它
            if (taskListWindow) {
                positionTaskListWindow();
            }
        }
    });
}

// 创建任务列表窗口的函数
function createTaskListWindow() {
    taskListWindow = new BrowserWindow({
        width: 400,
        height: 600,
        frame: false,
        transparent: true,
        webPreferences: {
            preload: path.join(__dirname, '../preload/preload.js')
        }
    });
    
    taskListWindow.loadFile(path.join(__dirname, '../../public/tasklist.html'));
    
    // 定位任务列表窗口
    positionTaskListWindow();
    
    taskListWindow.on('closed', () => {
        taskListWindow = null;
    });
}

// 定位任务列表窗口在 chatbox 下方
function positionTaskListWindow() {
    if (!taskListWindow || !chatboxWindow) return;
    
    const [x, y] = chatboxWindow.getPosition();
    const [width, height] = chatboxWindow.getSize();
    
    // 将任务列表窗口放在 chatbox 下方，保持 x 坐标一致
    taskListWindow.setPosition(x, y + height + 10);
}

// ----------------------------------------------------------------------------
// IPC Handlers
// ----------------------------------------------------------------------------

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
        if (mainWindow) {
            mainWindow.show();
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

// // IPC handler to open the Talk with AI view
// ipcMain.handle('open-talkwithai', () => {
//     const filePath = path.join(__dirname, '../../public/talkwithai.html');
//     console.log('main open-talkwithai, loading:', filePath);
//     if (chatboxWindow) {
//         chatboxWindow.loadFile(filePath);
//         chatboxWindow.setSize(350, 480); // Set size for Talk with AI view
//     }
// });

// IPC handler to open the Task List window
ipcMain.handle('open-tasklist-window', () => {
    console.log('main: open-tasklist-window received');
    if (taskListWindow) {
        taskListWindow.show();
    } else {
        createTaskListWindow();
    }
    
    // 确保 chatbox 窗口保持在前
    if (chatboxWindow) {
        chatboxWindow.focus();
    }
    
    return true;
});

// ----------------------------------------------------------------------------
// App lifecycle events
// ----------------------------------------------------------------------------

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
