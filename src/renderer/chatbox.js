let isSending = false;

function appendUserMessage(text) {
    const userMsg = document.createElement('div');
    const content = document.createElement('div');
    userMsg.className = 'user-bubble';
    content.className = 'user-bubble-content';
    content.textContent = text;
    userMsg.appendChild(content);
    document.getElementById('aiMessages').appendChild(userMsg);
}

function appendAIMessage(text, className = '') {
    const message = document.createElement('div');
    const avatar = document.createElement('img');
    const content = document.createElement('div');

    message.className = 'ai-bubble';
    avatar.className = 'ai-avatar';
    avatar.src = './assets/talking_icon.svg';
    avatar.alt = 'AI';
    content.className = `ai-bubble-content ${className}`.trim();
    content.textContent = text;

    message.append(avatar, content);
    document.getElementById('aiMessages').appendChild(message);
    return message;
}

function appendThinkingMessage() {
    const message = document.createElement('div');
    message.className = 'ai-bubble';
    message.innerHTML = `
        <img class="ai-avatar" src="./assets/talking_icon.svg" alt="AI" />
        <div class="ai-bubble-content thinking">
            <div class="typing-indicator">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;
    document.getElementById('aiMessages').appendChild(message);
    return message;
}

function scrollMessagesToBottom() {
    const messages = document.getElementById('aiMessages');
    messages.scrollTop = messages.scrollHeight;
}

function getFriendlyTaskError(response, error) {
    if (response?.code === 'AI_NOT_CONFIGURED') {
        return "AI task breakdown isn't set up yet. Add OPENAI_API_KEY to the project's .env file, then restart WakeyTasky.";
    }

    if (response?.code === 'AI_RESPONSE_INVALID') {
        return "I couldn't turn that into a clear task plan. Try rephrasing it with a little more detail.";
    }

    if (error instanceof TypeError || /fetch|network|connect/i.test(error?.message || '')) {
        return "I can't connect to the task service right now. Make sure WakeyTasky is running, then try again.";
    }

    return response?.error || "I couldn't create the task this time. Please try again in a moment.";
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const sendButton = document.getElementById('chatSendBtn');
    const text = input.value.trim();

    if (!text || isSending) {
        return;
    }

    isSending = true;
    sendButton.disabled = true;
    appendUserMessage(text);
    const thinkingMessage = appendThinkingMessage();
    scrollMessagesToBottom();
    input.value = '';

    try {
        const response = await window.api.sendAIMessage(text);
        thinkingMessage.remove();

        if (!response?.success) {
            const requestError = new Error(response?.error || 'Task creation failed');
            requestError.response = response;
            throw requestError;
        }

        appendAIMessage('任务已创建成功！请查看任务列表。');
        await window.api.openTaskListWindow();
    } catch (error) {
        thinkingMessage.remove();
        console.error('Error processing message:', error);
        appendAIMessage(getFriendlyTaskError(error.response, error), 'error');
    } finally {
        isSending = false;
        sendButton.disabled = false;
        input.focus();
        scrollMessagesToBottom();
    }
}

document.getElementById('folderIcon')?.addEventListener('click', () => {
    window.api.openTaskListWindow();
});

document.getElementById('sendIcon')?.addEventListener('click', () => {
    window.api.openTalkWithAI();
});

document.getElementById('chatSendBtn').addEventListener('click', sendMessage);

document.getElementById('chatInput').addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    window.api?.resizeWindow?.(350, 500);
    document.getElementById('chatInput').focus();
});
