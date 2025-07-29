// ===== 应用初始化 =====
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


// ===== 窗口控制 =====【！！后期应该并入utils！！】
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

// ===== 数据管理 =====
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


// ===== UI渲染 =====
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
    
    // 按创建时间排序任务（替代 startAt）
    tasks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
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
    
    // 计算任务总时长（基于子任务的 duration）
    let totalDurationMinutes = 0;
    if (task.subtasks && task.subtasks.length > 0) {
        totalDurationMinutes = task.subtasks.reduce((total, subtask) => {
            return total + (subtask.duration || 30); // 默认30分钟
        }, 0);
    }
    
    const hours = Math.floor(totalDurationMinutes / 60);
    const minutes = totalDurationMinutes % 60;
    
    // 计算创建时间信息
    const createdAt = new Date(task.createdAt);
    const now = new Date();
    const timeSinceCreated = now - createdAt;
    const hoursAgo = Math.floor(timeSinceCreated / (1000 * 60 * 60));
    const minutesAgo = Math.floor((timeSinceCreated % (1000 * 60 * 60)) / (1000 * 60));
    
    let timeInfo = '';
    if (hoursAgo > 0) {
        timeInfo = `Created ${hoursAgo}h ${minutesAgo}m ago`;
    } else if (minutesAgo > 0) {
        timeInfo = `Created ${minutesAgo} mins ago`;
    } else {
        timeInfo = 'Just created';
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
                <span>${hours}h ${minutes}m total</span><br>
                <span class="time-info">${timeInfo}</span>
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
            taskItem.dataset.taskId = task.id;
            
            // 根据子任务状态选择图标
            const iconSrc = subtask.status === 'COMPLETED' ? 
                './assets/task_done.svg' : './assets/task_todo.svg';
            
            // 获取子任务时长
            const duration = subtask.duration || 30; // 默认30分钟
            const durationText = formatDuration(duration);
            
            // 确定番茄钟图标
            const tomatoIcons = generateTomatoIcons(duration);
            
            // 构建子任务HTML，包含悬停时的编辑按钮
            taskItem.innerHTML = `
                <div class="subtask-content">
                    <img src="${iconSrc}" class="task-icon" alt="${subtask.status === 'COMPLETED' ? 'Done' : 'To do'}" />
                    <span class="task-desc">${subtask.title}</span>
                    <div class="tomato-icons">
                        ${tomatoIcons}
                    </div>
                    <span class="task-item-time">${durationText}</span>
                </div>
                
                <!-- 悬停时显示的操作按钮 -->
                <div class="subtask-hover-actions">
                    <button class="action-btn edit-btn" data-action="edit" title="Edit Task">
                        <img src="./assets/edit.svg" alt="Edit" />
                    </button>
                    <button class="action-btn start-btn" data-action="start" title="Start Task">
                        <img src="./assets/start.svg" alt="Start" />
                    </button>
                </div>
                
                <!-- 模糊背景层 -->
                <div class="subtask-blur-overlay"></div>
            `;
            
            // 添加悬停事件监听器
            setupSubtaskHoverEvents(taskItem, subtask, task);
            
            // 添加点击事件切换状态（只在非悬停状态下生效）
            taskItem.addEventListener('click', (e) => {
                // 如果点击的是操作按钮，不触发状态切换
                if (e.target.closest('.action-btn')) {
                    return;
                }
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
        <div class="progress-label">${taskProgressPercentage}% Complete (${completedSubtasks}/${totalSubtasks} subtasks)</div>
    `;
    
    // 组装完整卡片：头部 + 子任务列表 + 进度条
    card.appendChild(header);
    card.appendChild(taskItems);
    card.appendChild(taskProgressBar);
    
    // 获取 chevron 元素
    const chevron = header.querySelector('.chevron');
    
    // 添加 chevron 点击事件来控制展开/收起
    chevron.addEventListener('click', (e) => {
        e.stopPropagation(); // 阻止事件冒泡
        
        // 切换子任务列表和进度条的显示状态
        if (taskItems.style.display === 'none') {
            // 展开
            taskItems.style.display = '';
            taskProgressBar.style.display = '';
            
            // 还原箭头指向（向下）
            chevron.style.transform = 'rotate(0deg)';
        } else {
            // 收起
            taskItems.style.display = 'none';
            taskProgressBar.style.display = 'none';
            
            // 改变箭头指向（向右）
            chevron.style.transform = 'rotate(+90deg)';
        }
    });
    
    // 添加整个标题区域点击事件
    header.addEventListener('click', (e) => {
        // 如果点击的是 chevron 图标则不处理（避免重复触发）
        if (e.target === chevron) return;
        
        // 模拟点击 chevron
        chevron.click();
    });
    
    return card;
}

// ===== 工具函数 =====
// 1. 格式化持续时间显示
function formatDuration(minutes) {
    if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins > 0 ? mins + 'm' : ''}`.trim();
    }
    return `${minutes}m`;
}

// 2. 根据时长生成番茄时钟图标
function generateTomatoIcons(durationMinutes) {
    // 确保时间不超过2小时（120分钟）
    const cappedDuration = Math.min(durationMinutes, 120);
    
    let icons = '';
    
    // 生成番茄图标
    if (cappedDuration <= 15) {
        icons = '<img src="./assets/tomato_clock/15mins.svg" alt="15min" class="tomato-icon" />';
    } else if (cappedDuration <= 30) {
        icons = '<img src="./assets/tomato_clock/30mins.svg" alt="30min" class="tomato-icon" />';
    } else if (cappedDuration <= 45) {
        icons = '<img src="./assets/tomato_clock/45mins.svg" alt="45min" class="tomato-icon" />';
    } else if (cappedDuration <= 60) {
        icons = '<img src="./assets/tomato_clock/60mins.svg" alt="60min" class="tomato-icon" />';
    } else if (cappedDuration <= 75) {
        icons = '<img src="./assets/tomato_clock/60mins.svg" alt="60min" class="tomato-icon" /><img src="./assets/tomato_clock/15mins.svg" alt="15min" class="tomato-icon" />';
    } else if (cappedDuration <= 90) {
        icons = '<img src="./assets/tomato_clock/60mins.svg" alt="60min" class="tomato-icon" /><img src="./assets/tomato_clock/30mins.svg" alt="30min" class="tomato-icon" />';
    } else if (cappedDuration <= 105) {
        icons = '<img src="./assets/tomato_clock/60mins.svg" alt="60min" class="tomato-icon" /><img src="./assets/tomato_clock/45mins.svg" alt="45min" class="tomato-icon" />';
    } else {
        icons = '<img src="./assets/tomato_clock/60mins.svg" alt="60min" class="tomato-icon" /><img src="./assets/tomato_clock/60mins.svg" alt="60min" class="tomato-icon" />';
    }
    
    return icons;
}

// ===== 状态管理 =====
// 切换子任务状态
async function toggleSubtaskStatus(taskId, subtaskId, currentStatus) {
    try {
        // 计算新状态
        const newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
        
        // 调用API更新状态
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


// ===== 交互处理 =====
// 设置子任务悬停事件
function setupSubtaskHoverEvents(taskItem, subtask, task) {
    const content = taskItem.querySelector('.subtask-content');
    const actions = taskItem.querySelector('.subtask-hover-actions');
    const overlay = taskItem.querySelector('.subtask-blur-overlay');
    const editBtn = taskItem.querySelector('.edit-btn');
    const startBtn = taskItem.querySelector('.start-btn');
    
    let hoverTimeout;
    
    // 鼠标进入
    taskItem.addEventListener('mouseenter', () => {
        clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(() => {
            taskItem.classList.add('hover-active');
        }, 200); // 200ms 延迟，避免快速滑过时触发
    });
    
    // 鼠标离开
    taskItem.addEventListener('mouseleave', () => {
        clearTimeout(hoverTimeout);
        taskItem.classList.remove('hover-active');
    });
    
    // 编辑按钮点击事件
    editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        editSubtask(task.id, subtask.id, subtask);
    });
    
    // 开始按钮点击事件
    startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        startSubtask(task.id, subtask.id, subtask);
    });
}

// 编辑子任务
function editSubtask(taskId, subtaskId, subtask) {
    console.log('Editing subtask:', subtaskId, subtask);
    
    // 创建编辑模态框
    const modal = createEditModal(subtask, (updatedData) => {
        // 更新子任务
        updateSubtaskData(taskId, subtaskId, updatedData);
    });
    
    document.body.appendChild(modal);
}

// 开始子任务
function startSubtask(taskId, subtaskId, subtask) {
    console.log('Starting subtask:', subtaskId, subtask);
    if (window.api && window.api.openPomodoro) {
        window.api.openPomodoro(subtaskId, subtask.title, subtask.duration || 30);
    } else {
        alert('Pomodoro integration not available.');
    }
}

// ===== 模态框管理 =====
function createEditModal(subtask, onSave) {
    const modal = document.createElement('div');
    modal.className = 'edit-modal-overlay';
    
    // 初始化模态框内部状态
    let currentDuration = subtask.duration || 30;
    let currentTitle = subtask.title;
    
    // 生成初始番茄钟图标
    const generateModalTomatoIcons = (duration) => {
        return generateTomatoIcons(duration);
    };
    
    modal.innerHTML = `
        <div class="edit-modal">
            <!-- 任务标题输入 -->
            <input type="text" class="task-title-input" value="${currentTitle}" placeholder="任务标题" />
            
            <!-- 当前状态显示 -->
            <div class="current-status">Current: ${formatDuration(currentDuration)}</div>
            
            <!-- 番茄钟图标显示区域 -->
            <div class="tomato-display">
                ${generateModalTomatoIcons(currentDuration)}
            </div>
            
            <!-- 时长控制器 -->
            <div class="duration-controller">
                <button class="duration-btn minus-btn" ${currentDuration <= 15 ? 'disabled' : ''}>−</button>
                <span class="duration-display">${formatDuration(currentDuration)}</span>
                <button class="duration-btn plus-btn" ${currentDuration >= 120 ? 'disabled' : ''}>+</button>
            </div>
            
            <!-- 操作按钮 -->
            <div class="action-buttons">
                <button class="modal-action-btn cancel-btn">
                    <span class="btn-icon">❌</span>
                    <span class="btn-text">Cancel</span>
                </button>
                <button class="modal-action-btn confirm-btn">
                    <span class="btn-icon">✅</span>
                    <span class="btn-text">Confirm</span>
                </button>
            </div>
        </div>
    `;
    
    // 获取控制元素
    const titleInput = modal.querySelector('.task-title-input');
    const currentStatusEl = modal.querySelector('.current-status');
    const tomatoDisplayEl = modal.querySelector('.tomato-display');
    const durationDisplayEl = modal.querySelector('.duration-display');
    const minusBtn = modal.querySelector('.minus-btn');
    const plusBtn = modal.querySelector('.plus-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');
    const confirmBtn = modal.querySelector('.confirm-btn');
    
    // 更新显示的函数
    const updateDisplay = () => {
        // 更新状态显示
        currentStatusEl.textContent = `Current: ${formatDuration(currentDuration)}`;
        
        // 更新时长显示
        durationDisplayEl.textContent = formatDuration(currentDuration);
        
        // 更新番茄钟图标
        tomatoDisplayEl.innerHTML = generateModalTomatoIcons(currentDuration);
        
        // 更新按钮状态
        minusBtn.disabled = currentDuration <= 15;
        plusBtn.disabled = currentDuration >= 120;
        
        // 更新按钮样式
        minusBtn.classList.toggle('disabled', currentDuration <= 15);
        plusBtn.classList.toggle('disabled', currentDuration >= 120);
    };
    
    // 减少时长事件
    minusBtn.addEventListener('click', () => {
        if (currentDuration > 15) {
            currentDuration = Math.max(15, currentDuration - 15);
            updateDisplay();
        }
    });
    
    // 增加时长事件
    plusBtn.addEventListener('click', () => {
        if (currentDuration < 120) {
            currentDuration = Math.min(120, currentDuration + 15);
            updateDisplay();
        }
    });
    
    // 标题输入事件
    titleInput.addEventListener('input', (e) => {
        currentTitle = e.target.value;
    });
    
    // 关闭模态框函数
    const closeModal = () => {
        if (document.body.contains(modal)) {
            document.body.removeChild(modal);
        }
    };
    
    // 取消按钮事件
    cancelBtn.addEventListener('click', closeModal);
    
    // 确认按钮事件
    confirmBtn.addEventListener('click', () => {
        const trimmedTitle = currentTitle.trim();
        
        if (!trimmedTitle) {
            alert('请输入任务标题');
            titleInput.focus();
            return;
        }
        
        const updatedData = {
            title: trimmedTitle,
            duration: currentDuration
        };
        
        onSave(updatedData);
        closeModal();
    });
    
    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // 键盘事件支持
    modal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        } else if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            confirmBtn.click();
        }
    });
    
    // 聚焦到标题输入框
    setTimeout(() => {
        titleInput.focus();
        titleInput.select();
    }, 100);
    
    return modal;
}

// ===== 数据更新 =====
// 更新子任务数据
async function updateSubtaskData(taskId, subtaskId, updatedData) {
    try {
        if (window.api.updateSubtask) {
            const response = await window.api.updateSubtask(subtaskId, updatedData);
            if (response.success) {
                // 重新加载任务列表
                await loadTasks();
            } else {
                console.error('Failed to update subtask:', response.error);
                alert('更新失败，请重试');
            }
        } else {
            console.warn('updateSubtask API method not available');
            alert('更新功能暂不可用');
        }
    } catch (error) {
        console.error('Error updating subtask:', error);
        alert('更新时发生错误');
    }
}