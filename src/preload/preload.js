const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script starting...');

// Base URL for API calls
const API_PORT = process.env.PORT || 3000;
const API_URL = `http://localhost:${API_PORT}`;

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
    startWindowDrag: () => true,
    
    dragWindow: (deltaX, deltaY) => {
        ipcRenderer.send('window-drag', { deltaX, deltaY });
    },
    
    endWindowDrag: () => true,
    
    generateTask: async (text) => {
        try {
            console.log(`Sending request to ${API_URL}/api/generate-task`, { text });
            
            const response = await fetch(`${API_URL}/api/generate-task`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ text }),
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
    
    // Close current window
    closeWindow: () => {
        ipcRenderer.send('close-window');
    },
    
    // Minimize current window (for chatbox)
    minimizeWindow: () => {
        ipcRenderer.send('minimize-window');
    },
    
    // Open task list view
    openTaskList: () => {
        return ipcRenderer.invoke('open-tasklist-window');
    },
    
    // Open task creation view
    openTaskCreation: () => {
        return ipcRenderer.invoke('open-task-creation');
    },

    openTalkWithAI: () => ipcRenderer.invoke('open-chatbox'),
    

    // Open Task List Window
    openTaskListWindow: () => {
        console.log('preload openTaskListWindow');
        return ipcRenderer.invoke('open-tasklist-window');
    },

    // Send message to AI and get response
    sendAIMessage: async (message) => {
        console.log('sendAIMessage called with message:', message);
        try {
            const response = await fetch(`${API_URL}/api/generate-task`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    text: message
                }),
            });
            
            console.log('AI API response status:', response.status);
            const data = await response.json().catch(() => ({
                success: false,
                error: `Server error (${response.status})`
            }));
            console.log('AI API response data:', data);

            if (!response.ok || !data.success) {
                return {
                    success: false,
                    error: data.error || `Server error (${response.status})`
                };
            }
            return data;
        } catch (error) {
            console.error('Error in sendAIMessage:', error);
            return { success: false, error: error.message };
        }
    },

    updateSubtaskStatus: async (_taskId, subtaskId, newStatus) => {
        try {
            const response = await fetch(`${API_URL}/api/subtasks/${subtaskId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });
            
            const data = await response.json().catch(() => null);

            if (!response.ok || !data?.success) {
                return { 
                    success: false, 
                    error: data?.error || `Server error (${response.status})`
                };
            }
            
            return data;
        } catch (error) {
            console.error('Error updating subtask status:', error);
            return { 
                success: false, 
                error: error.message || 'Network error' 
            };
        }
    },

    // update subtask
    updateSubtask: async (subtaskId, updatedData) => {
        try {
            const response = await fetch(`${API_URL}/api/subtasks/${subtaskId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedData),
            });
            
            const data = await response.json().catch(() => null);
            if (!response.ok || !data?.success) {
                return {
                    success: false,
                    error: data?.error || `Server error (${response.status})`
                };
            }
            return data;
        } catch (error) {
            console.error('Error updating subtask:', error);
            return { success: false, error: error.message };
        }
    },

    // open Pomodoro window
    openPomodoro: (subtaskId, title, duration) => ipcRenderer.invoke('open-pomodoro', subtaskId, title, duration),
    

    // For receiving Pomodoro data
    onPomodoroData: (callback) => {
        ipcRenderer.on('pomodoro-data', (event, data) => {
            callback(data);
        });
    },
    onTasksChanged: (callback) => {
        ipcRenderer.on('tasks-changed', () => callback());
    },
    completeSubtask: (subtaskId) => ipcRenderer.invoke('complete-subtask', subtaskId),
};

// Expose the API
contextBridge.exposeInMainWorld('api', api);

console.log('Preload script completed. API exposed:', Object.keys(api));
