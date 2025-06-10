// 发送按钮逻辑--对话气泡
document.getElementById('aiSendBtn').onclick = () => {
    const input = document.getElementById('aiInput');
    const text = input.value.trim();
    console.log('User input:', text);
    if (text) {
        const msg = document.createElement('div');
        msg.className = 'user-bubble';
        msg.innerHTML = `<div class="user-bubble-content">${text}</div>`;
        document.getElementById('aiMessages').appendChild(msg);
        input.value = '';
        // 滚动到底部
        document.getElementById('aiMessages').scrollTop = document.getElementById('aiMessages').scrollHeight;
    }
};
document.getElementById('confirmBtn').onclick = () => {
    console.log('Confirm button clicked');
    window.api.openTaskListWindow();
};