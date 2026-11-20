document.addEventListener('DOMContentLoaded', () => {

    // 1. GREETING & CLOCK
    const clockDisplay = document.getElementById('clockDisplay');
    const dateDisplay = document.getElementById('dateDisplay');
    const greetingText = document.getElementById('greetingText');
    const greetingIcon = document.getElementById('greetingIcon');
    const nameInput = document.getElementById('nameInput');

    const savedName = localStorage.getItem('dashboard_user_name') || 'User';
    nameInput.value = savedName;

    function adjustNameInputWidth() {
        nameInput.style.width = Math.max((nameInput.value.length || 1) * 14, 70) + 'px';
    }
    adjustNameInputWidth();

    nameInput.addEventListener('input', () => {
        adjustNameInputWidth();
        localStorage.setItem('dashboard_user_name', nameInput.value.trim());
    });

    function updateClockAndGreeting() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        clockDisplay.textContent = `${hours}:${minutes}:${seconds}`;

        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateDisplay.textContent = now.toLocaleDateString('en-US', options);

        const currentHour = now.getHours();
        let greeting = 'Good Morning,';
        let iconSVG = '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>';

        if (currentHour >= 12 && currentHour < 17) {
            greeting = 'Good Afternoon,';
            iconSVG = '<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2"/><circle cx="12" cy="12" r="4"/>';
        } else if (currentHour >= 17 || currentHour < 5) {
            greeting = 'Good Evening,';
            iconSVG = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
        }
        
        greetingText.textContent = greeting;
        greetingIcon.innerHTML = iconSVG;
    }

    setInterval(updateClockAndGreeting, 1000);
    updateClockAndGreeting();

    // 2. FOCUS TIMER
    const timerDisplay = document.getElementById('timerDisplay');
    const timerStatus = document.getElementById('timerStatus');
    const timerStatusText = document.getElementById('timerStatusText');
    const startTimerBtn = document.getElementById('startTimerBtn');
    const startTimerLabel = document.getElementById('startTimerLabel');
    const stopTimerBtn = document.getElementById('stopTimerBtn');
    const resetTimerBtn = document.getElementById('resetTimerBtn');
    const presetBtns = document.querySelectorAll('.timer-preset-group .btn-chip');

    let timerInterval = null;
    let totalSeconds = 25 * 60;
    let remainingSeconds = 25 * 60;
    let timerState = 'idle'; // idle | running | paused | finished

    const timerStates = {
        idle:     { text: 'Ready to focus',           startLabel: 'Start',    startDisabled: false, stopDisabled: true },
        running:  { text: 'Focus session in progress', startLabel: 'Running…', startDisabled: true,  stopDisabled: false },
        paused:   { text: 'Paused — resume anytime',   startLabel: 'Resume',   startDisabled: false, stopDisabled: true },
        finished: { text: 'Session complete!',         startLabel: 'Start',    startDisabled: true,  stopDisabled: true }
    };

    function updateTimerUI() {
        const config = timerStates[timerState];
        timerStatus.dataset.state = timerState;
        timerStatusText.textContent = config.text;
        startTimerLabel.textContent = config.startLabel;
        startTimerBtn.disabled = config.startDisabled;
        stopTimerBtn.disabled = config.stopDisabled;
        startTimerBtn.setAttribute('aria-pressed', String(timerState === 'running'));
    }

    function updateTimerDisplay() {
        const mins = Math.floor(remainingSeconds / 60);
        const secs = remainingSeconds % 60;
        timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    function startTimer() {
        if (timerState === 'running' || timerState === 'finished') return;
        timerState = 'running';
        updateTimerUI();
        timerInterval = setInterval(() => {
            remainingSeconds--;
            if (remainingSeconds <= 0) {
                remainingSeconds = 0;
                clearInterval(timerInterval);
                timerInterval = null;
                timerState = 'finished';
                updateTimerUI();
                showToast('Time is up! Great session!');
            }
            updateTimerDisplay();
        }, 1000);
    }

    function stopTimer() {
        if (timerState !== 'running') return;
        clearInterval(timerInterval);
        timerInterval = null;
        timerState = 'paused';
        updateTimerUI();
    }

    function resetTimer() {
        clearInterval(timerInterval);
        timerInterval = null;
        timerState = 'idle';
        remainingSeconds = totalSeconds;
        updateTimerDisplay();
        updateTimerUI();
    }

    startTimerBtn.addEventListener('click', startTimer);
    stopTimerBtn.addEventListener('click', stopTimer);
    resetTimerBtn.addEventListener('click', resetTimer);

    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            presetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const selectedMinutes = parseInt(btn.dataset.time, 10);
            totalSeconds = selectedMinutes * 60;
            resetTimer();
        });
    });

    updateTimerDisplay();
    updateTimerUI();

    // 3. TO-DO LIST
    const todoForm = document.getElementById('todoForm');
    const todoInput = document.getElementById('todoInput');
    const todoList = document.getElementById('todoList');
    const sortSelect = document.getElementById('sortSelect');
    const taskCount = document.getElementById('taskCount');

    let todos = JSON.parse(localStorage.getItem('dashboard_todos')) || [
        { id: 1, text: 'belanja', completed: false, createdAt: 1 },
        { id: 2, text: 'belajar', completed: false, createdAt: 2 }
    ];

    function saveTodos() {
        localStorage.setItem('dashboard_todos', JSON.stringify(todos));
    }

    function renderTodos() {
        todoList.innerHTML = '';
        let sortedTodos = [...todos];
        const sortType = sortSelect.value;

        if (sortType === 'status') {
            sortedTodos.sort((a, b) => a.completed - b.completed);
        } else if (sortType === 'alpha') {
            sortedTodos.sort((a, b) => a.text.localeCompare(b.text));
        } else {
            sortedTodos.sort((a, b) => a.createdAt - b.createdAt);
        }

        taskCount.textContent = `${todos.filter(t => !t.completed).length} pending / ${todos.length} total`;

        if (sortedTodos.length === 0) {
            todoList.innerHTML = `<div class="empty-state">No tasks yet.</div>`;
            return;
        }

        sortedTodos.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            
            li.innerHTML = `
                <div class="todo-left">
                    <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
                    <span class="todo-text">${escapeHtml(todo.text)}</span>
                </div>
                <div class="todo-actions">
                    <button class="icon-btn edit-btn" title="Edit Task">
                        <svg class="icon-svg" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="icon-btn delete-btn" title="Delete Task">
                        <svg class="icon-svg" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            `;

            const checkbox = li.querySelector('.todo-checkbox');
            checkbox.addEventListener('change', () => {
                todo.completed = checkbox.checked;
                saveTodos();
                renderTodos();
            });

            const editBtn = li.querySelector('.edit-btn');
            editBtn.addEventListener('click', () => {
                const newText = prompt('Edit task:', todo.text);
                if (newText !== null && newText.trim() !== '') {
                    const trimmed = newText.trim();
                    if (todos.some(t => t.id !== todo.id && t.text.toLowerCase() === trimmed.toLowerCase())) {
                        showToast('Task already exists!');
                        return;
                    }
                    todo.text = trimmed;
                    saveTodos();
                    renderTodos();
                }
            });

            const deleteBtn = li.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => {
                todos = todos.filter(t => t.id !== todo.id);
                saveTodos();
                renderTodos();
            });

            todoList.appendChild(li);
        });
    }

    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const taskText = todoInput.value.trim();
        if (!taskText) return;

        if (todos.some(t => t.text.toLowerCase() === taskText.toLowerCase())) {
            showToast('Task already exists!');
            return;
        }

        todos.push({
            id: Date.now(),
            text: taskText,
            completed: false,
            createdAt: Date.now()
        });

        saveTodos();
        renderTodos();
        todoInput.value = '';
    });

    sortSelect.addEventListener('change', renderTodos);
    renderTodos();

    // 4. QUICK LINKS
    const linkForm = document.getElementById('linkForm');
    const linkNameInput = document.getElementById('linkNameInput');
    const linkUrlInput = document.getElementById('linkUrlInput');
    const linksContainer = document.getElementById('linksContainer');

    let quickLinks = JSON.parse(localStorage.getItem('dashboard_links')) || [
        { id: 1, name: 'Google', url: 'https://google.com' },
        { id: 2, name: 'Gmail', url: 'https://mail.google.com' },
        { id: 3, name: 'Calendar', url: 'https://calendar.google.com' }
    ];

    function saveLinks() {
        localStorage.setItem('dashboard_links', JSON.stringify(quickLinks));
    }

    function renderLinks() {
        linksContainer.innerHTML = '';
        if (quickLinks.length === 0) {
            linksContainer.innerHTML = `<span style="font-size:0.8rem; color:var(--text-light);">No quick links saved.</span>`;
            return;
        }

        quickLinks.forEach(link => {
            const a = document.createElement('a');
            a.className = 'link-chip';
            a.href = link.url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            
            a.innerHTML = `
                <span>${escapeHtml(link.name)}</span>
                <button class="delete-link-btn" title="Remove link">
                    <svg class="icon-svg" style="width:14px;height:14px;" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            `;

            const deleteBtn = a.querySelector('.delete-link-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                quickLinks = quickLinks.filter(l => l.id !== link.id);
                saveLinks();
                renderLinks();
            });

            linksContainer.appendChild(a);
        });
    }

    linkForm.addEventListener('submit', (e) => {
        e.preventDefault();
        let url = linkUrlInput.value.trim();
        const name = linkNameInput.value.trim();

        if (!name || !url) return;
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

        quickLinks.push({ id: Date.now(), name, url });
        saveLinks();
        renderLinks();
        linkNameInput.value = '';
        linkUrlInput.value = '';
    });

    renderLinks();

    // 5. THEME TOGGLE
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');

    const savedTheme = localStorage.getItem('dashboard_theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeIcon.innerHTML = '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>';
        themeText.textContent = 'Light Mode';
    }

    themeToggleBtn.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-mode');
        if (isDark) {
            themeIcon.innerHTML = '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>';
            themeText.textContent = 'Light Mode';
            localStorage.setItem('dashboard_theme', 'dark');
        } else {
            themeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
            themeText.textContent = 'Dark Mode';
            localStorage.setItem('dashboard_theme', 'light');
        }
    });

    // UTILS
    function showToast(message) {
        const toast = document.getElementById('toastMessage');
        document.getElementById('toastText').textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
    }

    function escapeHtml(str) {
        return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
    }
});
