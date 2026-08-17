const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { setSubtaskStatus } = require('../../services/tasks/taskService');

// Initialize Prisma
const prisma = new PrismaClient();

// Import our Express server
const { startServer, stopServer } = require('../server');

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
        backgroundColor: '#00000000',
        hasShadow: false,
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
    // macOS adds a native drop shadow to transparent windows by default.
    // For the circular standby icon this appears as a second offset circle.
    mainWindow.setHasShadow(false);
    
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
    if (chatboxWindow && !chatboxWindow.isDestroyed()) {
        chatboxWindow.show();
        chatboxWindow.focus();
        return chatboxWindow;
    }

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
    if (taskListWindow && !taskListWindow.isDestroyed()) {
        taskListWindow.show();
        taskListWindow.focus();
        return taskListWindow;
    }

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
    const targetWindow = BrowserWindow.fromWebContents(event.sender);
    if (targetWindow && !targetWindow.isDestroyed()) {
        targetWindow.setSize(width, height);
        
        // If expanding the window, center it on screen
        if (width > 80 && targetWindow === mainWindow) {
            targetWindow.center();
            // Ensure the window has a title bar and is not transparent for expanded views
            if (width === 350 && (height === 150 || height === 200)) {
                // Chatbox interface - maintain transparency and no frame for the chat UI
                targetWindow.setResizable(false);
                targetWindow.setOpacity(1.0);
            } else {
                // Task creation or task list view - need a frame
                targetWindow.setResizable(true);
            }
        } else if (width <= 80 && targetWindow === mainWindow) {
            // If minimizing, position it in the bottom right corner
            const { width: screenWidth, height: screenHeight } = 
                require('electron').screen.getPrimaryDisplay().workAreaSize;
            targetWindow.setPosition(screenWidth - 100, screenHeight - 100);
        }
        
        return true;
    }
    return false;
});

// Handle IPC for window dragging
ipcMain.on('drag-window', (event, { deltaX, deltaY }) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
        const [x, y] = win.getPosition();
        win.setPosition(x + deltaX, y + deltaY);
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

ipcMain.handle('open-task-creation', () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
        createMainWindow();
    }
    mainWindow.show();
    mainWindow.webContents.send('show-task-creation');
    return true;
});

// IPC handler for window operations
ipcMain.on('close-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        // If closing chat or tasklist, show the main icon window
        if (win === chatboxWindow || win === taskListWindow) {
            if (mainWindow) {
                mainWindow.show();
            }
            win.close();
        } else if (win === mainWindow) {
            // If closing the main icon window, quit the app
            app.quit();
        } else {
            win.close();
        }
    }
});

ipcMain.on('minimize-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        win.minimize();
    }
});

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

// Add IPC handler to open Pomodoro window
ipcMain.handle('open-pomodoro', (event, subtaskId, title, duration) => {
    const pomodoroWindow = new BrowserWindow({
        width: 400,
        height: 400,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: false,
        modal: true,
        show: false, // Don't show until loaded
        webPreferences: {
            preload: path.join(__dirname, '../preload/preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });
    
    const htmlPath = path.join(__dirname, '../../public/pomodoro.html');
    console.log('Loading Pomodoro HTML from:', htmlPath);

    pomodoroWindow.loadFile(htmlPath, {
        query: {
            subtaskId: String(subtaskId),
            title: String(title || 'Subtask'),
            duration: String(duration || 25)
        }
    });

    pomodoroWindow.once('ready-to-show', () => {
        pomodoroWindow.show();
        pomodoroWindow.focus();
    });

    return true;
});

// Add IPC handler to complete subtask
ipcMain.handle('complete-subtask', async (event, subtaskId) => {
    try {
        const result = await setSubtaskStatus(prisma, subtaskId, 'COMPLETED');
        if (taskListWindow && !taskListWindow.isDestroyed()) {
            taskListWindow.webContents.send('tasks-changed');
        }
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// ----------------------------------------------------------------------------
// App lifecycle events
// ----------------------------------------------------------------------------

app.whenReady().then(async () => {
    try {
        await startServer();
        createMainWindow();
    } catch (error) {
        console.error('Failed to initialize WakeyTasky:', error);
        app.quit();
        return;
    }
    
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
    await stopServer();
});
