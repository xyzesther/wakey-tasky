// 保留原来的功能
// Folder icon opens task list view
document.getElementById('folderIcon').addEventListener('click', () => {
    window.api.openTaskList();
});

// send icon opens task creation view
document.getElementById('sendIcon').addEventListener('click', () => {
    console.log('uploadIcon clicked')
    window.api.openTalkWithAI();
});

// 新增发送消息功能
document.getElementById('chatSendBtn').addEventListener('click', () => {
    const text = document.getElementById('chatInput').value.trim();
    console.log('Send button clicked, input text:', text);
    
    if (text) {
        console.log('Attempting to send message to backend');
        sendMessageToBackend(text);
    }
});

// 输入框按回车键也可以发送消息
document.getElementById('chatInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// 发送消息的函数
function sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    
    if (text) {
        // 记录用户输入的消息（后面传递给 talkwithai 页面）
        localStorage.setItem('userMessage', text);
        
        // 显示用户消息气泡
        const msg = document.createElement('div');
        msg.className = 'user-bubble';
        msg.innerHTML = `<div class="user-bubble-content">${text}</div>`;
        document.getElementById('aiMessages').appendChild(msg);
        
        // 清空输入框
        input.value = '';
        
        // 将消息发送到后端（可选）
        sendMessageToBackend(text);
        
        // 跳转到 talkwithai 页面
        setTimeout(() => {
            window.api.openTalkWithAI();
            
            // 同时打开任务列表窗口
            window.api.openTaskListWindow();
        }, 500); // 稍微延迟，让用户看到自己的消息
    }
}

// 将消息发送到后端
async function sendMessageToBackend(message) {
    try {
        // 如果你的 preload.js 中有相关方法，使用它
        if (window.api.sendAIMessage) {
            await window.api.sendAIMessage(message);
        } else {
            console.log('Message would be sent to backend:', message);
            // 这里可以先留空，等后端 API 准备好后再实现
        }
    } catch (error) {
        console.error('Error sending message to backend:', error);
    }
}

// 在 DOMContentLoaded 事件中添加
document.addEventListener('DOMContentLoaded', () => {
    
    // 调整窗口大小以适应内容
    if (window.api && window.api.resizeWindow) {
        // 给定固定宽高
        window.api.resizeWindow(500, 500);
    }
});