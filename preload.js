const { contextBridge, ipcRenderer } = require('electron');

// Expose API functions to the renderer process
contextBridge.exposeInMainWorld('api', {
    generateTask: async (text) => {
        try {
            const response = await fetch('http://localhost:3000/api/generate-task', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
            });
            return await response.json();
        } catch (error) {
            console.error('Error generating task:', error);
            throw error;
        }
    },
    
    getTasks: async () => {
        try {
            const response = await fetch('http://localhost:3000/api/tasks');
            return await response.json();
        } catch (error) {
            console.error('Error fetching tasks:', error);
            throw error;
        }
    },
    
    getTask: async (id) => {
        try {
            const response = await fetch(`http://localhost:3000/api/tasks/${id}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching task:', error);
            throw error;
        }
    }
}); 