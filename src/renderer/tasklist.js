// 全局变量跟踪当前加载的任务
let currentTasks = [];

// 页面加载时获取任务数据
document.addEventListener('DOMContentLoaded', async () => {
    console.log('TaskList page loaded');
    
    // 设置窗口控制按钮事件
    setupWindowControls();
    
    // 加载任务数据
    await loadTasks();
    
    // 定期刷新任务数据（每60秒）
    setInterval(loadTasks, 60000);
});

// 设置窗口控制按钮事件
function setupWindowControls() {
    // 关闭按钮
    const closeButton = document.getElementById('chatCloseButton');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            window.api.closeWindow();
        });
    }
    
    // 最小化按钮
    const minimizeButton = document.getElementById('chatMinimizeButton');
    if (minimizeButton) {
        minimizeButton.addEventListener('click', () => {
            window.api.minimizeWindow();
        });
    }
}

// 加载任务数据
async function loadTasks() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const noTasksMessage = document.getElementById('noTasksMessage');
    const tasklistContainer = document.getElementById('tasklistContainer');
    
    try {
        // 显示加载指示器
        if (loadingIndicator) loadingIndicator.style.display = 'block';
        if (noTasksMessage) noTasksMessage.style.display = 'none';
        
        // 从API获取任务
        const response = await window.api.getTasks();
        
        console.log('Tasks API response:', response);
        
        if (response.success && response.data && Array.isArray(response.data)) {
            currentTasks = response.data;
            
            // 隐藏加载指示器
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            
            // 检查是否有任务
            if (currentTasks.length === 0) {
                if (noTasksMessage) noTasksMessage.style.display = 'block';
                return;
            }
            
            // 渲染任务列表
            renderTaskList(currentTasks);
        } else {
            console.error('Failed to load tasks:', response.error || 'Unknown error');
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            if (noTasksMessage) {
                noTasksMessage.textContent = 'Error loading tasks. Please try again.';
                noTasksMessage.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        if (noTasksMessage) {
            noTasksMessage.textContent = `Error: ${error.message || 'Failed to connect to server'}`;
            noTasksMessage.style.display = 'block';
        }
    }
}

// 渲染任务列表
function renderTaskList(tasks) {
    const tasklistContainer = document.getElementById('tasklistContainer');
    
    // 清空容器（保留加载指示器和无任务消息）
    const loadingIndicator = document.getElementById('loadingIndicator');
    const noTasksMessage = document.getElementById('noTasksMessage');
    tasklistContainer.innerHTML = '';
    
    // 重新添加加载指示器和无任务消息
    tasklistContainer.appendChild(loadingIndicator);
    tasklistContainer.appendChild(noTasksMessage);
    
    // 按开始时间排序任务
    tasks.sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
    
    // 为每个任务创建卡片
    tasks.forEach(task => {
        const taskCard = createTaskCard(task);
        tasklistContainer.appendChild(taskCard);
    });
}

// 创建任务卡片
function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'tasklist-card';
    card.dataset.taskId = task.id;
    
    // 计算任务时间（以小时和分钟表示）
    const startTime = new Date(task.startAt);
    const endTime = new Date(task.endAt);
    const durationMs = endTime - startTime;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    // 计算剩余时间
    const now = new Date();
    let timeLeftText = '';
    
    if (now < endTime) {
        const timeLeftMs = endTime - now;
        const hoursLeft = Math.floor(timeLeftMs / (1000 * 60 * 60));
        const minutesLeft = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
        timeLeftText = `${hoursLeft} ${hoursLeft === 1 ? 'hour' : 'hours'} ${minutesLeft} mins left`;
    } else {
        timeLeftText = 'Time expired';
    }
    
    // 创建任务头部
    const header = document.createElement('div');
    header.className = 'tasklist-card-header';
    header.innerHTML = `
        <img class="chevron" src="./assets/chevron.svg" alt="Expand" />
        <div class="task-title">
            <span>${task.title}</span>
        </div>
        <div class="task-time">
            <div>
                <span>${hours} ${hours === 1 ? 'hour' : 'hours'}</span><br>
                <span>${minutes} mins${timeLeftText ? '<br>' + timeLeftText : ''}</span>
            </div>
        </div>
    `;
    
    // 创建子任务列表
    const taskItems = document.createElement('div');
    taskItems.className = 'tasklist-items';
    
    // 计算此任务的子任务完成进度
    let completedSubtasks = 0;
    let totalSubtasks = 0;
    
    // 遍历并添加子任务
    if (task.subtasks && task.subtasks.length > 0) {
        totalSubtasks = task.subtasks.length;
        
        task.subtasks.forEach(subtask => {
            // 计算完成的子任务数量
            if (subtask.status === 'COMPLETED') {
                completedSubtasks++;
            }
            
            const taskItem = document.createElement('div');
            taskItem.className = 'tasklist-item';
            taskItem.dataset.subtaskId = subtask.id;
            
            // 根据子任务状态选择图标
            const iconSrc = subtask.status === 'COMPLETED' ? 
                './assets/task_done.svg' : './assets/task_todo.svg';
            
            // 计算子任务时长
            const duration = subtask.duration || 30; // 默认30分钟
            const durationText = duration >= 60 ? 
                `${Math.floor(duration/60)}hr ${duration%60} mins` : 
                `${duration} mins`;
            
            taskItem.innerHTML = `
                <img src="${iconSrc}" class="task-icon" alt="${subtask.status === 'COMPLETED' ? 'Done' : 'To do'}" />
                <span class="task-desc">${subtask.title}</span>
                <span class="task-item-time">${durationText}</span>
            `;
            
            // 添加点击事件切换状态
            taskItem.addEventListener('click', () => {
                toggleSubtaskStatus(task.id, subtask.id, subtask.status);
            });
            
            taskItems.appendChild(taskItem);
        });
    } else {
        // 如果没有子任务，显示提示信息
        const noSubtasks = document.createElement('div');
        noSubtasks.className = 'tasklist-item no-subtasks';
        noSubtasks.innerHTML = `<span class="task-desc">No subtasks defined</span>`;
        taskItems.appendChild(noSubtasks);
    }
    
    // 创建该任务卡片的进度条
    const taskProgressPercentage = totalSubtasks > 0 ? 
        Math.round((completedSubtasks / totalSubtasks) * 100) : 0;
    
    const taskProgressBar = document.createElement('div');
    taskProgressBar.className = 'task-progress';
    taskProgressBar.innerHTML = `
        <div class="progress-bar-bg">
            <div class="progress-bar-fg" style="width:${taskProgressPercentage}%;"></div>
        </div>
        <div class="progress-label">${taskProgressPercentage}% Complete</div>
    `;
    
    // 组装完整卡片：头部 + 子任务列表 + 进度条
    card.appendChild(header);
    card.appendChild(taskItems);
    card.appendChild(taskProgressBar); // 添加进度条到任务卡片
    
    return card;
}

// 切换子任务状态
async function toggleSubtaskStatus(taskId, subtaskId, currentStatus) {
    try {
        // 计算新状态
        const newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
        
        // 调用API更新状态（假设preload.js中有updateSubtaskStatus方法）
        if (window.api.updateSubtaskStatus) {
            const response = await window.api.updateSubtaskStatus(taskId, subtaskId, newStatus);
            
            if (response.success) {
                // 成功后重新加载任务列表
                await loadTasks();
            } else {
                console.error('Failed to update subtask status:', response.error);
            }
        } else {
            console.warn('updateSubtaskStatus API method not available');
            // 临时更新UI，但警告API不可用
            const subtaskElement = document.querySelector(`.tasklist-item[data-subtask-id="${subtaskId}"]`);
            if (subtaskElement) {
                const statusIcon = subtaskElement.querySelector('.task-icon');
                if (statusIcon) {
                    statusIcon.src = newStatus === 'COMPLETED' ? 
                        './assets/task_done.svg' : './assets/task_todo.svg';
                    statusIcon.alt = newStatus === 'COMPLETED' ? 'Done' : 'To do';
                }
            }
        }
    } catch (error) {
        console.error('Error toggling subtask status:', error);
    }
}