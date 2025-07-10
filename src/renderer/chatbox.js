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
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    
    if (text) {
        // 显示用户消息气泡
        const userMsg = document.createElement('div');
        userMsg.className = 'user-bubble';
        userMsg.innerHTML = `<div class="user-bubble-content">${text}</div>`;
        document.getElementById('aiMessages').appendChild(userMsg);
        
        // 添加一个"正在思考"的 AI 气泡
        const thinkingMsg = document.createElement('div');
        thinkingMsg.className = 'ai-bubble';
        thinkingMsg.innerHTML = `
            <img class="ai-avatar" src="./assets/talking_icon.svg" alt="AI" />
            <div class="ai-bubble-content thinking">
                <div class="typing-indicator">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        document.getElementById('aiMessages').appendChild(thinkingMsg);
        
        // 滚动到底部
        const messagesContainer = document.getElementById('aiMessages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // 清空输入框
        input.value = '';
        
        try {
            // 直接在 chatbox 中调用 AI 服务
            const response = await window.api.sendAIMessage(text);
            
            // 移除"正在思考"的气泡
            messagesContainer.removeChild(thinkingMsg);
            
            // 添加 AI 响应气泡
            const aiResponseMsg = document.createElement('div');
            aiResponseMsg.className = 'ai-bubble';
            aiResponseMsg.innerHTML = `
                <img class="ai-avatar" src="./assets/talking_icon.svg" alt="AI" />
                <div class="ai-bubble-content">
                    任务已创建成功！请查看任务列表。
                </div>
            `;
            document.getElementById('aiMessages').appendChild(aiResponseMsg);
            
            // 滚动到底部
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            
            // 打开任务列表窗口（调整位置显示在 chatbox 下方）
            window.api.openTaskListWindow();
        } catch (error) {
            console.error('Error processing message:', error);
            
            // 移除"正在思考"的气泡
            messagesContainer.removeChild(thinkingMsg);
            
            // 显示错误消息
            const errorMsg = document.createElement('div');
            errorMsg.className = 'ai-bubble';
            errorMsg.innerHTML = `
                <img class="ai-avatar" src="./assets/talking_icon.svg" alt="AI" />
                <div class="ai-bubble-content error">
                    抱歉，处理您的请求时出现了问题。请稍后重试。
                </div>
            `;
            document.getElementById('aiMessages').appendChild(errorMsg);
        }
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
    // 调整窗口大小为固定尺寸 (一次性设置)
    if (window.api && window.api.resizeWindow) {
        // 设置固定的宽高
        window.api.resizeWindow(350, 500);
    }
    
    // 聚焦输入框
    document.getElementById('chatInput').focus();
});