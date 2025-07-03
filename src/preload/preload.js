const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script starting...');

// Base URL for API calls
const API_URL = 'http://localhost:3000';

// Define the real API
const api = {
    test: () => {
        console.log('API test function called');
        return 'API is working';
    },
    
    // Resize window (for toggling between minimized and expanded states)
    resizeWindow: (width, height) => {
        return ipcRenderer.invoke('resize-window', { width, height });
    },
    
    // Window dragging support
    startWindowDrag: () => {
        ipcRenderer.send('window-drag-start');
    },
    
    dragWindow: (mouseX, mouseY) => {
        ipcRenderer.send('window-drag', { mouseX, mouseY });
    },
    
    endWindowDrag: () => {
        ipcRenderer.send('window-drag-end');
    },
    
    generateTask: async (text, startTime, endTime) => {
        try {
            console.log(`Sending request to ${API_URL}/api/generate-task`, { text, startTime, endTime });
            
            const response = await fetch(`${API_URL}/api/generate-task`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ text, startTime, endTime }),
            });
            
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API error:', response.status, errorText);
                return { success: false, error: `Server error (${response.status})` };
            }
            
            const data = await response.json();
            console.log('Response data:', data);
            return data;
        } catch (error) {
            console.error('Error in generateTask:', error);
            return { success: false, error: error.message || 'Network error' };
        }
    },
    
    getTasks: async () => {
        try {
            const response = await fetch(`${API_URL}/api/tasks`);
            
            if (!response.ok) {
                return { success: false, error: `Server error (${response.status})` };
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching tasks:', error);
            return { success: false, error: error.message || 'Network error', data: [] };
        }
    },
    
    getTask: async (id) => {
        try {
            const response = await fetch(`${API_URL}/api/tasks/${id}`);
            
            if (!response.ok) {
                return { success: false, error: `Server error (${response.status})` };
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching specific task:', error);
            return { success: false, error: error.message || 'Network error' };
        }
    },
    
    ping: async () => {
        try {
            const response = await fetch(`${API_URL}/api/ping`);
            return await response.json();
        } catch (error) {
            console.error('Error pinging API:', error);
            return { success: false, message: error.message };
        }
    },
    
    deleteTask: async (id) => {
        try {
            const response = await fetch(`${API_URL}/api/tasks/${id}`, {
                method: 'DELETE',
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API error deleting task:', response.status, errorText);
                return { success: false, error: `Server error (${response.status})` };
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error deleting task:', error);
            return { success: false, error: error.message || 'Network error' };
        }
    },
    
    // IPC event listeners
    onShowTaskList: (callback) => {
        ipcRenderer.on('show-task-list', () => callback());
    },
    
    onShowTaskCreation: (callback) => {
        ipcRenderer.on('show-task-creation', () => callback());
    },
    
    // Open chatbox window
    openChatbox: () => {
        return ipcRenderer.invoke('open-chatbox');
    },
    
    // Close current window (for chatbox)
    closeWindow: () => {
        ipcRenderer.send('close-window');
    },
    
    // Minimize current window (for chatbox)
    minimizeWindow: () => {
        ipcRenderer.send('minimize-window');
    },
    
    // Open task list view
    openTaskList: () => {
        ipcRenderer.send('open-task-list');
    },
    
    // Open task creation view
    openTaskCreation: () => {
        ipcRenderer.send('open-task-creation');
    },
    
    // Open Talk with AI window
    openTalkWithAI: () => {
        console.log('preload openTalkWithAI');
        return ipcRenderer.invoke('open-talkwithai');
    },

    // Open Task List Window
    openTaskListWindow: () => {
        console.log('preload openTaskListWindow');
        return ipcRenderer.invoke('open-tasklist-window');
    },

    // Send message to AI and get response
    sendAIMessage: async (message) => {
        console.log('sendAIMessage called with message:', message);
        try {
            const response = await fetch('http://localhost:3000/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    prompt: message,
                }),
            });
            
            console.log('AI API response status:', response.status);
            const data = await response.json();
            console.log('AI API response data:', data);
            return data;
        } catch (error) {
            console.error('Error in sendAIMessage:', error);
            return { success: false, error: error.message };
        }
    },

    updateSubtaskStatus: async (taskId, subtaskId, newStatus) => {
        try {
            const response = await fetch(`${API_URL}/api/tasks/${taskId}/subtasks/${subtaskId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });
            
            if (!response.ok) {
                return { 
                    success: false, 
                    error: `Server error (${response.status})` 
                };
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error updating subtask status:', error);
            return { 
                success: false, 
                error: error.message || 'Network error' 
            };
        }
    },
};

// Expose the API
contextBridge.exposeInMainWorld('api', api);

// 添加日志以确认方法存在
console.log('API methods available:', Object.keys(window.api).join(', '));

console.log('Preload script completed. API exposed:', Object.keys(api));