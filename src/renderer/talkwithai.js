// 页面加载时检查是否有从 chatbox 传递过来的消息
document.addEventListener('DOMContentLoaded', () => {
    const savedMessage = localStorage.getItem('userMessage');
    
    // 如果有消息，显示出来并清除存储
    if (savedMessage) {
        // 检查是否已经有同样内容的消息（避免重复）
        const existingMessages = document.querySelectorAll('.user-bubble-content');
        let isDuplicate = false;
        
        existingMessages.forEach(element => {
            if (element.textContent === savedMessage) {
                isDuplicate = true;
            }
        });
        
        // 如果不是重复消息，则添加到聊天区域
        if (!isDuplicate) {
            const msg = document.createElement('div');
            msg.className = 'user-bubble';
            msg.innerHTML = `<div class="user-bubble-content">${savedMessage}</div>`;
            document.getElementById('aiMessages').appendChild(msg);
            
            // 滚动到底部
            const messagesContainer = document.getElementById('aiMessages');
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        // 清除存储的消息，避免下次重复显示
        localStorage.removeItem('userMessage');
    }
});

// 发送按钮逻辑--对话气泡
document.getElementById('aiSendBtn').onclick = () => {
    const input = document.getElementById('aiInput');
    const text = input.value.trim();
    if (text) {
        // 显示用户消息
        const msg = document.createElement('div');
        msg.className = 'user-bubble';
        msg.innerHTML = `<div class="user-bubble-content">${text}</div>`;
        document.getElementById('aiMessages').appendChild(msg);
        
        // 清空输入框
        input.value = '';
        
        // 将消息发送到后端（如果有相关 API）
        if (window.api.sendAIMessage) {
            window.api.sendAIMessage(text);
        }
        
        // 打开 Task List 窗口
        window.api.openTaskListWindow();
    }
};

// 输入框回车发送
document.getElementById('aiInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('aiSendBtn').click();
    }
});