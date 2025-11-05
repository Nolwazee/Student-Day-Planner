
        // Data storage
        let tasks = [];
        let schedule = [];
        let currentFilter = 'all';
        let activeTab = 'dashboard';

        // Initialize app
        document.addEventListener('DOMContentLoaded', function() {
            updateCurrentDate();
            loadData();
            renderAll();
            setInterval(checkReminders, 60000); // Check every minute
        });

        function updateCurrentDate() {
            const now = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
        }

        function switchTab(tabName) {
            // Remove active class from all tabs and content
            document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            // Add active class to selected tab and content
            event.target.classList.add('active');
            document.getElementById(tabName).classList.add('active');
            
            activeTab = tabName;
            
            // Refresh content when switching to dashboard
            if (tabName === 'dashboard') {
                renderDashboard();
            }
        }

        function showNotification(message, type = 'success', playSound = false) {
            const notification = document.getElementById('notification');
            notification.textContent = message;
            notification.className = `notification ${type} show`;
            
            if (playSound) {
                const alarmSound = document.getElementById('alarmSound');
                alarmSound.play().catch(e => console.log('Could not play alarm sound:', e));
            }
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }

        function addTask() {
            const title = document.getElementById('taskTitle').value.trim();
            const description = document.getElementById('taskDescription').value.trim();
            const priority = document.getElementById('taskPriority').value;
            const dueDate = document.getElementById('taskDueDate').value;
            const category = document.getElementById('taskCategory').value;

            if (!title) {
                showNotification('Please enter a task title', 'error');
                return;
            }

            const task = {
                id: Date.now(),
                title,
                description,
                priority,
                category,
                dueDate: dueDate ? new Date(dueDate) : null,
                completed: false,
                createdAt: new Date()
            };

            tasks.push(task);
            saveData();
            renderAll();

            // Clear form
            document.getElementById('taskTitle').value = '';
            document.getElementById('taskDescription').value = '';
            document.getElementById('taskPriority').value = 'low';
            document.getElementById('taskCategory').value = 'study';
            document.getElementById('taskDueDate').value = '';

            showNotification('Task added successfully!');
        }

        function toggleTask(id) {
            const task = tasks.find(t => t.id === id);
            if (task) {
                task.completed = !task.completed;
                saveData();
                renderAll();
                showNotification(task.completed ? 'Task completed!' : 'Task marked as pending');
            }
        }

        function deleteTask(id) {
            tasks = tasks.filter(t => t.id !== id);
            saveData();
            renderAll();
            showNotification('Task deleted');
        }

        function filterTasks(filter) {
            currentFilter = filter;
            renderTasks();
            
            // Update active filter button
            document.querySelectorAll('.quick-actions .btn-small').forEach(btn => {
                btn.style.background = 'linear-gradient(135deg, #6c757d, #5a6268)';
            });
            event.target.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
        }

        function renderTasks() {
            const container = document.getElementById('tasksList');
            
            let filteredTasks = tasks;
            
            switch(currentFilter) {
                case 'pending':
                    filteredTasks = tasks.filter(t => !t.completed);
                    break;
                case 'completed':
                    filteredTasks = tasks.filter(t => t.completed);
                    break;
                case 'high':
                    filteredTasks = tasks.filter(t => t.priority === 'high');
                    break;
            }
            
            if (filteredTasks.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                        </svg>
                        <p>No tasks match the current filter.</p>
                    </div>`;
                return;
            }

            // Sort tasks
            const sortedTasks = filteredTasks.sort((a, b) => {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                if (a.completed !== b.completed) return a.completed ? 1 : -1;
                if (a.priority !== b.priority) return priorityOrder[b.priority] - priorityOrder[a.priority];
                if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
                return 0;
            });

            const categoryIcons = {
                study: '📚',
                assignment: '📝',
                exam: '🎯',
                project: '💼',
                personal: '👤',
                other: '📌'
            };

            container.innerHTML = sortedTasks.map(task => {
                const dueDateStr = task.dueDate ? 
                    new Date(task.dueDate).toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    }) : '';
                
                return `
                    <div class="item ${task.completed ? 'completed' : ''} priority-${task.priority}">
                        <div class="item-content">
                            <div class="item-title">${categoryIcons[task.category]} ${task.title}</div>
                            <div class="item-details">
                                ${task.description ? `${task.description} • ` : ''}
                                Priority: ${task.priority} • Category: ${task.category}${dueDateStr ? ` • Due: ${dueDateStr}` : ''}
                            </div>
                        </div>
                        <div class="item-actions">
                            <button class="btn btn-small" onclick="toggleTask(${task.id})">
                                ${task.completed ? '↻' : '✓'}
                            </button>
                            <button class="btn btn-small btn-danger" onclick="deleteTask(${task.id})">×</button>
                        </div>
                    </div>`;
            }).join('');
        }

        function addScheduleItem() {
            const time = document.getElementById('scheduleTime').value;
            const activity = document.getElementById('scheduleActivity').value.trim();
            const location = document.getElementById('scheduleLocation').value.trim();
            const type = document.getElementById('scheduleType').value;
            const reminder = parseInt(document.getElementById('scheduleReminder').value);

            if (!time || !activity) {
                showNotification('Please enter time and activity', 'error');
                return;
            }

            const item = {
                id: Date.now(),
                time,
                activity,
                location,
                type,
                reminder,
                createdAt: new Date()
            };

            schedule.push(item);
            saveData();
            renderAll();

            // Clear form
            document.getElementById('scheduleTime').value = '';
            document.getElementById('scheduleActivity').value = '';
            document.getElementById('scheduleLocation').value = '';
            document.getElementById('scheduleType').value = 'class';
            document.getElementById('scheduleReminder').value = '0';

            showNotification('Schedule item added!');
        }

        function deleteScheduleItem(id) {
            schedule = schedule.filter(s => s.id !== id);
            saveData();
            renderAll();
            showNotification('Schedule item deleted');
        }

        function renderSchedule() {
            const container = document.getElementById('timetable');
            
            if (schedule.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                        </svg>
                        <p>No scheduled activities. Add your first item!</p>
                    </div>`;
                return;
            }

            const sortedSchedule = schedule.sort((a, b) => a.time.localeCompare(b.time));
            const typeIcons = {
                class: '🎓',
                study: '📚',
                meeting: '🤝',
                break: '☕',
                other: '📌'
            };

            container.innerHTML = sortedSchedule.map(item => {
                const timeFormatted = new Date(`2000-01-01T${item.time}`).toLocaleString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });

                return `
                    <div class="time-slot">
                        <div class="time-label">${timeFormatted}</div>
                        <div>
                            <div class="item-title">${typeIcons[item.type]} ${item.activity}</div>
                            <div class="item-details">
                                ${item.location ? `📍 ${item.location}` : ''}
                                ${item.reminder > 0 ? ` • 🔔 ${item.reminder}min reminder` : ''}
                            </div>
                        </div>
                        <button class="btn btn-small btn-danger" onclick="deleteScheduleItem(${item.id})">×</button>
                    </div>`;
            }).join('');
        }

        function renderDashboard() {
            updateDashboardStats();
            renderUrgentTasks();
            renderTodaySchedule();
            renderRecentTasks();
        }

        function updateDashboardStats() {
            const total = tasks.length;
            const completed = tasks.filter(t => t.completed).length;
            const pending = total - completed;
            const todayScheduleCount = schedule.length;

            document.getElementById('dashTotalTasks').textContent = total;
            document.getElementById('dashCompletedTasks').textContent = completed;
            document.getElementById('dashPendingTasks').textContent = pending;
            document.getElementById('dashTodaySchedule').textContent = todayScheduleCount;
        }

        function renderUrgentTasks() {
            const urgentTasks = tasks.filter(t => 
                !t.completed && 
                (t.priority === 'high' || (t.dueDate && new Date(t.dueDate) - new Date() < 24 * 60 * 60 * 1000))
            ).slice(0, 5);

            const container = document.getElementById('urgentTasks');
            
            if (urgentTasks.length === 0) {
                container.innerHTML = '<div class="empty-state"><p>No urgent tasks</p></div>';
                return;
            }

            const categoryIcons = {
                study: '📚', assignment: '📝', exam: '🎯', 
                project: '💼', personal: '👤', other: '📌'
            };

            container.innerHTML = urgentTasks.map(task => `
                <div class="item priority-${task.priority}">
                    <div class="item-content">
                        <div class="item-title">${categoryIcons[task.category]} ${task.title}</div>
                        <div class="item-details">
                            ${task.dueDate ? `Due: ${new Date(task.dueDate).toLocaleDateString()}` : 'High Priority'}
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-small" onclick="toggleTask(${task.id}); renderDashboard();">✓</button>
                    </div>
                </div>
            `).join('');
        }

        function renderTodaySchedule() {
            const container = document.getElementById('todaySchedule');
            
            if (schedule.length === 0) {
                container.innerHTML = '<div class="empty-state"><p>No activities scheduled</p></div>';
                return;
            }

            const sortedSchedule = schedule.sort((a, b) => a.time.localeCompare(b.time)).slice(0, 5);
            const typeIcons = {
                class: '🎓', study: '📚', meeting: '🤝', 
                break: '☕', other: '📌'
            };

            container.innerHTML = sortedSchedule.map(item => {
                const timeFormatted = new Date(`2000-01-01T${item.time}`).toLocaleString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });

                return `
                    <div class="time-slot">
                        <div class="time-label">${timeFormatted}</div>
                        <div>
                            <div class="item-title">${typeIcons[item.type]} ${item.activity}</div>
                            <div class="item-details">
                                ${item.location ? `📍 ${item.location}` : ''}
                            </div>
                        </div>
                    </div>`;
            }).join('');
        }

        function renderRecentTasks() {
            const recentTasks = tasks.slice(-5).reverse();
            const container = document.getElementById('recentTasks');
            
            if (recentTasks.length === 0) {
                container.innerHTML = '<div class="empty-state"><p>No recent tasks</p></div>';
                return;
            }

            const categoryIcons = {
                study: '📚', assignment: '📝', exam: '🎯', 
                project: '💼', personal: '👤', other: '📌'
            };

            container.innerHTML = recentTasks.map(task => `
                <div class="item ${task.completed ? 'completed' : ''} priority-${task.priority}">
                    <div class="item-content">
                        <div class="item-title">${categoryIcons[task.category]} ${task.title}</div>
                        <div class="item-details">
                            ${task.completed ? 'Completed' : 'Pending'} • ${task.priority} priority
                        </div>
                    </div>
                </div>
            `).join('');
        }

        function renderAll() {
            renderTasks();
            renderSchedule();
            if (activeTab === 'dashboard') {
                renderDashboard();
            }
        }

        function markAllCompleted() {
            const pendingTasks = tasks.filter(t => !t.completed);
            if (pendingTasks.length === 0) {
                showNotification('No pending tasks to complete', 'error');
                return;
            }

            pendingTasks.forEach(task => task.completed = true);
            saveData();
            renderAll();
            showNotification(`${pendingTasks.length} tasks marked as completed!`);
        }

        function checkReminders() {
            const now = new Date();
            
            // Check task reminders
            tasks.forEach(task => {
                if (task.dueDate && !task.completed) {
                    const timeDiff = new Date(task.dueDate) - now;
                    const minutesLeft = Math.floor(timeDiff / (1000 * 60));
                    
                    if (minutesLeft === 30) {
                        showNotification(`⏰ Task "${task.title}" is due in 30 minutes!`, 'error', false);
                    } else if (minutesLeft === 10) {
                        showNotification(`⚠️ Task "${task.title}" is due in 10 minutes!`, 'error', true);
                    } else if (minutesLeft === 5) {
                        showNotification(`🚨 URGENT: Task "${task.title}" is due in 5 minutes!`, 'error', true);
                        // Flash the notification multiple times for 5-minute warning
                        let flashCount = 0;
                        const flashInterval = setInterval(() => {
                            if (flashCount < 3) {
                                setTimeout(() => {
                                    showNotification(`🚨 URGENT: Task "${task.title}" is due in 5 minutes!`, 'error', true);
                                }, 1000);
                                flashCount++;
                            } else {
                                clearInterval(flashInterval);
                            }
                        }, 2000);
                    }
                }
            });

            // Check schedule reminders
            schedule.forEach(item => {
                if (item.reminder > 0) {
                    const today = new Date();
                    const scheduleDateTime = new Date(today.toDateString() + ' ' + item.time);
                    const timeDiff = scheduleDateTime - now;
                    const minutesLeft = Math.floor(timeDiff / (1000 * 60));
                    
                    if (minutesLeft === item.reminder) {
                        if (item.reminder === 5) {
                            showNotification(`� URGENT: "${item.activity}" starts in 5 minutes!`, 'error', true);
                            // Flash the notification multiple times for 5-minute warning
                            let flashCount = 0;
                            const flashInterval = setInterval(() => {
                                if (flashCount < 3) {
                                    setTimeout(() => {
                                        showNotification(`🚨 URGENT: "${item.activity}" starts in 5 minutes!`, 'error', true);
                                    }, 1000);
                                    flashCount++;
                                } else {
                                    clearInterval(flashInterval);
                                }
                            }, 2000);
                        } else {
                            showNotification(`�📅 "${item.activity}" starts in ${item.reminder} minutes!`, 'error', item.reminder <= 10);
                        }
                    }
                }
            });
        }

        function saveData() {
            // In a real app, you'd save to localStorage or a database
            // For this demo, data persists only during the session
        }

        function loadData() {
            // In a real app, you'd load from localStorage or a database
            // For this demo, we start with empty data
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'Enter') {
                if (activeTab === 'tasks') {
                    addTask();
                } else if (activeTab === 'schedule') {
                    addScheduleItem();
                }
            }
        });
    