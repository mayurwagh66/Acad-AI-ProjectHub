document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/api';
    let currentProject = null;
    let socket = null;
    if (typeof io !== 'undefined') {
        socket = io();
        socket.on('new_message', (message) => {
            if (currentProject && currentProject._id === message.project) {
                const chatMessagesContainer = document.getElementById('chat-messages-container');
                const systemMessage = chatMessagesContainer.querySelector('.system-message');
                if (systemMessage) systemMessage.remove();

                const messageElement = document.createElement('div');
                messageElement.classList.add('chat-message');
                messageElement.innerHTML = `
                    <strong>${message.sender.username}:</strong> ${message.message}
                    <span class="chat-timestamp">${new Date(message.timestamp).toLocaleString()}</span>
                `;
                chatMessagesContainer.appendChild(messageElement);
                chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
            }
        });
    }
    var charts = {};

    // --- Consolidated DOM Elements --- //

    // Navigation & User Info
    const navDashboard = document.getElementById('nav-dashboard');
    const navProjects = document.getElementById('nav-projects');
    const navProjectShortcuts = document.getElementById('nav-project-shortcuts');
    const navAddTask = document.getElementById('nav-add-task');
    const navProjectChat = document.getElementById('nav-project-chat');
    const navUploadFiles = document.getElementById('nav-upload-files');
    const navSeeSuggestions = document.getElementById('nav-see-suggestions');
    const navSmartReminders = document.getElementById('nav-smart-reminders');
    const navProfile = document.getElementById('nav-profile');
    const navLogin = document.getElementById('nav-login');
    const navRegister = document.getElementById('nav-register');
    const navLogout = document.getElementById('nav-logout');
    const navAuthLinks = document.getElementById('nav-auth-links');
    const navUserLinks = document.getElementById('nav-user-links');
    const loggedInUsername = document.getElementById('logged-in-username');
    const welcomeMessage = document.getElementById('welcome-message');

    // Views
    const authView = document.getElementById('auth-view');
    const dashboardView = document.getElementById('dashboard-view');
    const projectDetailsView = document.getElementById('project-details-view');

    // Project Details
    const backToDashboardBtn = document.getElementById('back-to-dashboard');
    const projectDetailsNameHeader = document.getElementById('project-details-name');
    const currentProjectIdSpan = document.getElementById('current-project-id');
    const projectDetailsDescriptionDisplay = document.getElementById('project-details-description-display');
    const projectDetailsStatusDisplay = document.getElementById('project-details-status');
    const projectDetailsOwnerDisplay = document.getElementById('project-details-owner');
    const projectDetailsCreatedAtDisplay = document.getElementById('project-created-at');
    const projectDetailsUpdatedAtDisplay = document.getElementById('project-updated-at');
    const projectDetailsAiPlanStatusDisplay = document.getElementById('project-ai-plan-status');
    const projectDetailsFacultyEvaluationDisplay = document.getElementById('project-faculty-evaluation');
    const projectDetailsProjectGradeDisplay = document.getElementById('project-grade');
    const teamMembersUl = document.getElementById('team-members-ul');
    const studentProjectActions = document.getElementById('student-project-actions');
    const teamLeaderProjectActions = document.getElementById('team-leader-project-actions');
    const facultyProjectActions = document.getElementById('faculty-project-actions');
    const facultyAddProjectBtn = document.getElementById('faculty-add-project-btn');
    const facultyAddProjectModal = document.getElementById('faculty-add-project-modal');
    const facultyProjectIdInput = document.getElementById('faculty-project-id');
    const submitFacultyAddProjectBtn = document.getElementById('submit-faculty-add-project-btn');
    const facultyAddProjectError = document.getElementById('faculty-add-project-error');

    // Dashboard Elements
    const studentDashboard = document.getElementById('student-dashboard');
    const facultyDashboard = document.getElementById('faculty-dashboard');

    // Faculty Dashboard Elements
    const facultyProjectsUl = document.getElementById('faculty-projects-ul');
    const facultyTotalProjects = document.getElementById('faculty-total-projects');
    const facultyActiveProjects = document.getElementById('faculty-active-projects');
    const facultyCompletedProjects = document.getElementById('faculty-completed-projects');
    const facultyPendingProjects = document.getElementById('faculty-pending-projects');

    // Student Dashboard Elements (removed metrics elements)

    // Faculty Evaluation Dashboard Widget
    const facultyEvalWidget = document.getElementById('faculty-eval-widget');
    const facultyEvalProjectIdInput = document.getElementById('faculty-eval-project-id');
    const facultyEvalText = document.getElementById('faculty-eval-text');
    const facultyEvalGrade = document.getElementById('faculty-eval-grade');
    const facultyEvalSubmitBtn = document.getElementById('faculty-eval-submit-btn');
    const facultyEvalStatus = document.getElementById('faculty-eval-status');

    // File Upload Elements
    const fileUploadInput = document.getElementById('file-upload-input');
    const fileNameDisplay = document.getElementById('file-name-display');
    const uploadFileBtn = document.getElementById('upload-file-btn');
    const filesUl = document.getElementById('files-ul');

    // Modals
    const aiPlannedTasksModal = document.getElementById('ai-planned-tasks-section');
    const aiPlanProjectName = document.getElementById('ai-plan-project-name');
    const aiSuggestedTasksUl = document.getElementById('ai-suggested-tasks-ul');
    const aiSuggestedMilestonesUl = document.getElementById('ai-suggested-milestones-ul');
    const aiItineraryUl = document.getElementById('ai-itinerary-ul');
    const acceptAiPlanBtn = document.getElementById('accept-ai-plan-btn');
    const approvePlanBtn = document.getElementById('approve-plan-btn');
    const rejectPlanBtn = document.getElementById('reject-plan-btn');

    const productivityInsightsModal = document.getElementById('productivity-insights-section');
    // Smart Reminders Modal
    const smartRemindersModal = document.getElementById('smart-reminders-section');
    const remindersProjectName = document.getElementById('reminders-project-name');
    const remindersTopUl = document.getElementById('reminders-top-ul');
    const remindersGroupsContainer = document.getElementById('reminders-groups-container');
    const insightsProjectName = document.getElementById('insights-project-name');
    const completedTasksCount = document.getElementById('completed-tasks-count');
    const inProgressTasksCount = document.getElementById('in-progress-tasks-count');
    const totalTasksCount = document.getElementById('total-tasks-count');
    const completionRateSpan = document.getElementById('completion-rate');
    const aiProductivitySuggestionsUl = document.getElementById('ai-productivity-suggestions-ul');
    const insightPerformingWell = document.getElementById('insight-performing-well');
    const insightNeedsImprovement = document.getElementById('insight-needs-improvement');
    const insightTeamSuggestion = document.getElementById('insight-team-suggestion');

    const facultyFeedbackModal = document.getElementById('faculty-feedback-section');
    const feedbackProjectName = document.getElementById('feedback-project-name');
    const facultyFeedbackSummary = document.getElementById('faculty-feedback-summary');
    const aiFeedbackSuggestionsUl = document.getElementById('ai-feedback-suggestions-ul');
    const feedbackTasksCompleted = document.getElementById('feedback-tasks-completed');
    const feedbackTasksInProgress = document.getElementById('feedback-tasks-in-progress');
    const feedbackOverdueTasks = document.getElementById('feedback-overdue-tasks');
    const feedbackAvgCompletionTime = document.getElementById('feedback-avg-completion-time');

    const facultyEvaluationModal = document.getElementById('faculty-evaluation-section');
    const evaluationProjectName = document.getElementById('evaluation-project-name');
    const facultyEvaluationTextarea = document.getElementById('faculty-evaluation-text');
    const projectGradeSelect = document.getElementById('project-grade-select');
    const submitEvaluationBtn = document.getElementById('submit-evaluation-btn');
    const evaluationStatus = document.getElementById('evaluation-status');

    const createProjectModal = document.getElementById('create-project-modal');
    const projectNameInput = createProjectModal.querySelector('#project-name'); // Scoped to modal
    const projectDescriptionInput = createProjectModal.querySelector('#project-description'); // Scoped to modal
    const saveProjectBtn = createProjectModal.querySelector('#save-project-btn'); // Scoped to modal
    const projectError = createProjectModal.querySelector('#project-error'); // Scoped to modal

    const createTaskModal = document.getElementById('create-task-modal');
    const taskProjectName = document.getElementById('task-project-name');
    const taskNameInput = createTaskModal.querySelector('#task-name'); // Scoped to modal
    const taskDescriptionInput = createTaskModal.querySelector('#task-description'); // Scoped to modal
    const taskDueDateInput = createTaskModal.querySelector('#task-due-date'); // Scoped to modal
    const taskPriorityInput = createTaskModal.querySelector('#task-priority'); // Scoped to modal
    const saveTaskBtn = createTaskModal.querySelector('#save-task-btn'); // Scoped to modal
    const taskError = createTaskModal.querySelector('#task-error'); // Scoped to modal
    const taskAssigneeGroup = document.getElementById('task-assignee-group');
    const taskAssigneeSelect = document.getElementById('task-assignee');

    // Project Joining
    const joinProjectBtn = document.getElementById('join-project-btn');
    const joinProjectModal = document.getElementById('join-project-modal');
    const joinProjectIdInput = document.getElementById('join-project-id');
    const submitJoinProjectBtn = document.getElementById('submit-join-project-btn');
    const joinProjectError = document.getElementById('join-project-error');

    // Chat Elements
    const chatMessagesContainer = document.getElementById('chat-messages-container');
    const chatMessageInput = document.getElementById('chat-message-input');
    const sendMessageBtn = document.getElementById('send-message-btn');
    const chatInputForm = document.getElementById('chat-input-form');
    
    // Buttons within Project Details View
    const aiPlanProjectBtn = document.getElementById('ai-plan-project-btn');
    const viewProductivityBtn = document.getElementById('view-productivity-btn');
    const generateReportBtn = document.getElementById('generate-report-btn');
    const viewFeedbackBtn = document.getElementById('view-feedback-btn');
    const projectsUl = document.getElementById('projects-ul');
    const completeProjectBtn = document.getElementById('complete-project-btn');
    const createProjectBtn = document.getElementById('create-project-btn');
    const tasksUl = document.getElementById('tasks-ul');
    // Task filters and counts (may be null if HTML not yet added)
    const tasksCountsSpan = document.getElementById('tasks-counts');
    const tasksFilterAllBtn = document.getElementById('tasks-filter-all');
    const tasksFilterPendingBtn = document.getElementById('tasks-filter-pending');
    const tasksFilterCompletedBtn = document.getElementById('tasks-filter-completed');
    let latestTasksForFilter = [];
    const createTaskBtn = document.getElementById('create-task-btn');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginEmailInput = document.getElementById('login-email');
    const loginPasswordInput = document.getElementById('login-password');
    const loginError = document.getElementById('login-error');
    const registerUsernameInput = document.getElementById('register-username');
    const registerEmailInput = document.getElementById('register-email');
    const registerPasswordInput = document.getElementById('register-password');
    const registerRoleSelect = document.getElementById('register-role');
    const registerError = document.getElementById('register-error');
    const switchToRegisterLink = document.getElementById('switch-to-register');
    const switchToLoginLink = document.getElementById('switch-to-login');

    // Auto Milestones UI references
    const autoMilestonesBtn = document.getElementById('auto-milestones-btn');
    const autoMsModal = document.getElementById('auto-milestones-section');
    const autoMsProjectName = document.getElementById('auto-ms-project-name');
    const autoMsDurationDays = document.getElementById('auto-ms-duration-days');
    const autoMsDeadline = document.getElementById('auto-ms-deadline');
    const autoMsList = document.getElementById('auto-ms-list');
    const generateAutoMsBtn = document.getElementById('generate-auto-ms-btn');

    const facultySuggestionsUl = document.getElementById('faculty-suggestions-ul');
    const facultySuggestionCompose = document.getElementById('faculty-suggestion-compose');
    const facultySuggestionText = document.getElementById('faculty-suggestion-text');
    const submitFacultySuggestionBtn = document.getElementById('submit-faculty-suggestion-btn');
    const facultySuggestionError = document.getElementById('faculty-suggestion-error');

    // const facultyChartsWidget = document.getElementById('faculty-charts-widget'); // Element doesn't exist
    const projectHealthPanel = document.getElementById('project-health-panel');

    async function renderProjectCharts(projectId) {
        if (!projectHealthPanel || getUserRole() !== 'faculty') return;
        const token = getAuthToken();
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/analytics/productivity/${projectId}`, {
                headers: { 'x-auth-token': token }
            });
            const data = await res.json();
            if (!res.ok) return;
            const total = data.totalTasks || 0;
            const counts = {
                completed: data.completedTasks || 0,
                inProgress: data.inProgressTasks || 0,
                pending: (data.totalTasks || 0) - (data.completedTasks || 0) - (data.inProgressTasks || 0) - (data.blockedTasks || 0),
                blocked: (data.blockedTasks || 0)
            };
            // If endpoint doesn't expose blocked, infer 0
            if (counts.pending < 0) counts.pending = 0;
            const completionRate = Number(data.completionRate || 0);
            const ctxs = {
                completion: document.getElementById('chart-completion'),
                completed: document.getElementById('chart-completed'),
                inprogress: document.getElementById('chart-inprogress'),
                pending: document.getElementById('chart-pending'),
                blocked: document.getElementById('chart-blocked'),
            };
            projectHealthPanel.style.display = 'block';
            const makeDonut = (ctx, value, label, color, mode) => {
                if (!ctx) return;
                const pct = mode === 'pct' ? Math.round(value) : (total > 0 ? Math.round((value / total) * 100) : 0);
                // Ensure consistent sizing
                ctx.width = 160; ctx.height = 160;
                if (charts[ctx.id]) charts[ctx.id].destroy();
                charts[ctx.id] = new Chart(ctx, {
                    type: 'doughnut',
                    data: { datasets: [{ data: [pct, 100 - pct], backgroundColor: [color, '#eee'], borderWidth: 0 }] },
                    options: {
                        responsive: false,
                        cutout: '68%',
                        layout: { padding: 6 },
                        plugins: { legend: { display: false }, tooltip: { enabled: true } }
                    }
                });
                const card = ctx.parentElement;
                card.style.position = 'relative';
                // Centered percent text overlay
                let center = card.querySelector('.chart-center');
                if (!center) {
                    center = document.createElement('div');
                    center.className = 'chart-center';
                    center.style.position = 'absolute';
                    center.style.top = '50%';
                    center.style.left = '50%';
                    center.style.transform = 'translate(-50%, -58%)';
                    center.style.fontWeight = '700';
                    center.style.fontSize = '14px';
                    center.style.pointerEvents = 'none';
                    card.appendChild(center);
                }
                center.textContent = `${pct}%`;
                // Caption with count below
                let labelEl = card.querySelector('.chart-label');
                if (!labelEl) {
                    labelEl = document.createElement('div');
                    labelEl.className = 'chart-label';
                    labelEl.style.position = 'absolute';
                    labelEl.style.bottom = '-10px';
                    labelEl.style.left = '50%';
                    labelEl.style.transform = 'translateX(-50%)';
                    labelEl.style.textAlign = 'center';
                    labelEl.style.color = '#555';
                    labelEl.style.fontSize = '12px';
                    card.appendChild(labelEl);
                }
                labelEl.textContent = label + (mode === 'count' ? ` (${value})` : '');
            };
            makeDonut(ctxs.completion, completionRate, 'Completion Rate', '#3f51b5', 'pct');
            makeDonut(ctxs.completed, counts.completed, 'Completed', '#43a047', 'count');
            makeDonut(ctxs.inprogress, counts.inProgress, 'In Progress', '#1e88e5', 'count');
            makeDonut(ctxs.pending, counts.pending, 'Pending', '#fbc02d', 'count');
            makeDonut(ctxs.blocked, counts.blocked, 'Blocked', '#e53935', 'count');
        } catch (e) {
            console.error('Project charts error', e);
        }
    }

    // --- Helper Functions --- //
    const setAuthToken = (token) => {
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
        updateNavAndUserInfo();
    };

    const getAuthToken = () => {
        return localStorage.getItem('token');
    };

    const getUserRole = () => {
        return localStorage.getItem('userRole');
    };

    const getUsername = () => {
        return localStorage.getItem('username');
    };

    const updateNavAndUserInfo = () => {
        if (getAuthToken()) {
            if (navAuthLinks) navAuthLinks.style.display = 'none';
            if (navUserLinks) navUserLinks.style.display = 'block';
            if (loggedInUsername) loggedInUsername.textContent = getUsername();
            if (welcomeMessage) welcomeMessage.textContent = `Welcome, ${getUsername()}!`;

            // Show/hide dashboard sections based on role
            if (getUserRole() === 'student') {
                if (studentDashboard) studentDashboard.style.display = 'block';
                if (facultyDashboard) facultyDashboard.style.display = 'none';
                if (studentProjectActions) studentProjectActions.style.display = 'flex';
                if (navProjectShortcuts) navProjectShortcuts.style.display = 'none';
            } else if (getUserRole() === 'faculty') {
                if (studentDashboard) studentDashboard.style.display = 'none';
                if (facultyDashboard) facultyDashboard.style.display = 'flex';
                if (navProjectShortcuts) navProjectShortcuts.style.display = 'none';
                // Faculty charts widget removed - element doesn't exist
            } else {
                if (studentDashboard) studentDashboard.style.display = 'none';
                if (facultyDashboard) facultyDashboard.style.display = 'none';
                if (navProjectShortcuts) navProjectShortcuts.style.display = 'none';
            }

        } else {
            if (navAuthLinks) navAuthLinks.style.display = 'block';
            if (navUserLinks) navUserLinks.style.display = 'none';
            if (loggedInUsername) loggedInUsername.textContent = '';
            if (welcomeMessage) welcomeMessage.textContent = 'Welcome to Acad AI ProjectHub!';
            if (studentProjectActions) studentProjectActions.style.display = 'none'; // Hide if not logged in
        }
    };

    const showView = (viewId) => {
        // Clear chat polling when changing view
        

        document.querySelectorAll('.content-view').forEach(view => {
            view.style.display = 'none';
            view.classList.remove('active');
        });
        const activeView = document.getElementById(viewId);
        if (activeView) {
            activeView.style.display = 'block';
            activeView.classList.add('active');
        }

        // Toggle project shortcuts only on project details for students
        if (navProjectShortcuts) {
            if (viewId === 'project-details-view' && getUserRole() === 'student') {
                navProjectShortcuts.style.display = 'grid';
            } else {
                navProjectShortcuts.style.display = 'none';
            }
        }

        // Update active class for sidebar nav items (guard elements that may not exist)
        document.querySelectorAll('.main-nav a').forEach(link => {
            if (link) link.classList.remove('active');
        });
        if (viewId === 'dashboard-view') {
            if (navDashboard) navDashboard.classList.add('active');
        } else if (viewId === 'project-details-view') {
            // If Projects link doesn't exist, fall back to Dashboard
            if (navProjects) {
                navProjects.classList.add('active');
            } else if (navDashboard) {
                navDashboard.classList.add('active');
            }
        } else if (viewId === 'auth-view') {
            if (navLogin && navLogin.closest('li')) navLogin.closest('li').classList.add('active');
        }
    };

    const openModal = (modalId, projectName = '') => {
        console.log(`Attempting to open modal: ${modalId}`); // Added for debugging
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            // Set project name in modal headers if needed
            const nameSpan = modal.querySelector('[id$="project-name"]');
            if (nameSpan && projectName) {
                nameSpan.textContent = projectName;
            }
        }
    };

    const closeModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    };

    // --- Initial Setup --- //
    updateNavAndUserInfo();
    if (getAuthToken()) {
        showView('dashboard-view');
        fetchDashboardData();
    } else {
        showView('auth-view');
    }

    // --- Event Listeners for Navigation --- //
    navDashboard.addEventListener('click', (e) => {
        e.preventDefault();
        showView('dashboard-view');
        fetchDashboardData();
    });

    // --- Sidebar Project Shortcuts --- //
    if (navAddTask) {
        navAddTask.addEventListener('click', (e) => {
            e.preventDefault();
            if (!currentProject) return alert('Open a project first.');
            taskNameInput.value = '';
            taskDescriptionInput.value = '';
            taskDueDateInput.value = '';
            taskPriorityInput.value = 'medium';
            taskProjectName.textContent = currentProject.name;
            openModal('create-task-modal', currentProject.name);
        });
    }
    if (navProjectChat) {
        navProjectChat.addEventListener('click', (e) => {
            e.preventDefault();
            if (!currentProject) return alert('Open a project first.');
            showView('project-details-view');
            const el = document.getElementById('chat-panel');
            if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth' });
        });
    }
    if (navUploadFiles) {
        navUploadFiles.addEventListener('click', (e) => {
            e.preventDefault();
            if (!currentProject) return alert('Open a project first.');
            showView('project-details-view');
            const el = document.getElementById('files-panel');
            if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth' });
        });
    }
    if (navSeeSuggestions) {
        navSeeSuggestions.addEventListener('click', (e) => {
            e.preventDefault();
            if (!currentProject) return alert('Open a project first.');
            showView('project-details-view');
            const el = document.getElementById('faculty-suggestions-section');
            if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth' });
        });
    }
    if (navSmartReminders) {
        navSmartReminders.addEventListener('click', async (e) => {
            e.preventDefault();
            if (!currentProject) return alert('Open a project first.');
            await fetchAndDisplaySmartReminders(currentProject._id, currentProject.name);
        });
    }
    // --- Faculty Evaluation Widget (Dashboard) Submit --- //
    if (facultyEvalSubmitBtn) {
        facultyEvalSubmitBtn.addEventListener('click', async () => {
            const token = getAuthToken();
            if (!token) return;

            const projectId = (facultyEvalProjectIdInput.value || '').trim();
            const facultyEvaluation = (facultyEvalText.value || '').trim();
            const projectGrade = facultyEvalGrade.value;

            facultyEvalStatus.textContent = '';

            if (!projectId) {
                facultyEvalStatus.textContent = 'Project ID is required.';
                return;
            }

            try {
                const res = await fetch(`${API_URL}/projects/evaluate/${projectId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': token,
                    },
                    body: JSON.stringify({ facultyEvaluation, projectGrade }),
                });
                const data = await res.json();
                if (res.ok) {
                    facultyEvalStatus.style.color = 'green';
                    facultyEvalStatus.textContent = 'Evaluation submitted successfully!';
                    if (currentProject && currentProject._id === projectId) {
                        fetchProjectDetails(projectId);
                    }
                } else {
                    facultyEvalStatus.style.color = 'red';
                    facultyEvalStatus.textContent = data.msg || 'Failed to submit evaluation';
                }
            } catch (err) {
                console.error('Error submitting faculty evaluation:', err);
                facultyEvalStatus.style.color = 'red';
                facultyEvalStatus.textContent = 'Server error during evaluation submission';
            }
        });
    }
    if (navProjects) {
        navProjects.addEventListener('click', (e) => {
            e.preventDefault();
            // For now, projects list is part of dashboard, but this could become a separate view
            showView('dashboard-view');
            fetchDashboardData();
        });
    }

    if (navProfile) {
        navProfile.addEventListener('click', (e) => {
            e.preventDefault();
            // Route to dashboard projects for now; can be replaced with profile view later
            showView('dashboard-view');
            fetchDashboardData();
        });
    }

    navLogin.addEventListener('click', (e) => {
        e.preventDefault();
        showView('auth-view');
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        loginError.textContent = '';
    });

    navRegister.addEventListener('click', (e) => {
        e.preventDefault();
        showView('auth-view');
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        registerError.textContent = '';
    });

    navLogout.addEventListener('click', (e) => {
        e.preventDefault();
        setAuthToken(null);
        localStorage.removeItem('userRole');
        localStorage.removeItem('username');
        showView('auth-view');
        loginEmailInput.value = '';
        loginPasswordInput.value = '';
        welcomeMessage.textContent = 'Welcome to Acad AI ProjectHub!';
        projectsUl.innerHTML = '';
    });

    // --- Auth Form Switching --- //
    switchToRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        loginError.textContent = '';
    });

    switchToLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        registerError.textContent = '';
    });

    // --- Login Form Submission --- //
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginEmailInput.value;
        const password = loginPasswordInput.value;
        loginError.textContent = '';

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (res.ok) {
                setAuthToken(data.token);
                // Decode token to get user role and username
                const payload = JSON.parse(atob(data.token.split('.')[1]));
                localStorage.setItem('userRole', payload.user.role);
                localStorage.setItem('username', payload.user.username || 'User'); // Assuming username is in token

                updateNavAndUserInfo(); // Update topbar username
                showView('dashboard-view');
                fetchDashboardData();
            } else {
                if (data.errors) {
                    loginError.textContent = data.errors.map(err => err.msg).join(', ');
                } else {
                    loginError.textContent = data.msg || 'Login failed';
                }
            }
        } catch (err) {
            console.error(err);
            loginError.textContent = 'Server error';
        }
    });

    // --- Register Form Submission --- //
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = registerUsernameInput.value;
        const email = registerEmailInput.value;
        const password = registerPasswordInput.value;
        const role = registerRoleSelect.value;
        registerError.textContent = '';

        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password, role }),
            });
            const data = await res.json();
            if (res.ok) {
                setAuthToken(data.token);
                const payload = JSON.parse(atob(data.token.split('.')[1]));
                localStorage.setItem('userRole', payload.user.role);
                localStorage.setItem('username', payload.user.username || 'User');

                updateNavAndUserInfo();
                showView('dashboard-view');
                fetchDashboardData();
            } else {
                if (data.errors) {
                    registerError.textContent = data.errors.map(err => err.msg).join(', ');
                } else {
                    registerError.textContent = data.msg || 'Registration failed';
                }
            }
        } catch (err) {
            console.error(err);
            registerError.textContent = 'Server error';
        }
    });

    // --- Fetch Dashboard Data --- //
    async function fetchDashboardData() {
        const token = getAuthToken();
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/dashboard`, {
                headers: {
                    'x-auth-token': token,
                },
            });
            const data = await res.json();
            if (res.ok) {
                welcomeMessage.textContent = `${data.msg}, ${getUsername()}!`;

                if (getUserRole() === 'student') {
                    displayStudentDashboard(data);
                } else if (getUserRole() === 'faculty') {
                    displayFacultyDashboard(data);
                }
            } else {
                console.error('Failed to fetch dashboard data:', data.msg);
                setAuthToken(null);
                // Also clear cached role/username if any
                localStorage.removeItem('role');
                localStorage.removeItem('username');
                showView('auth-view');
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setAuthToken(null);
            showView('auth-view');
        }
    }

    // Expose functions needed by inline handlers (safe wrappers)
    window.fetchProjectDetails = async (projectId) => {
        try { await fetchProjectDetails(projectId); } catch (_) { }
    };
    window.generateReport = async (projectId) => {
        try {
            const token = getAuthToken();
            if (!token) return;
            const res = await fetch(`${API_URL}/reports/${projectId}?ts=${Date.now()}`, {
                headers: { 'x-auth-token': token }
            });
            if (!res.ok) { alert(await res.text()); return; }
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `report-${projectId}.pdf`;
            document.body.appendChild(a); a.click(); a.remove();
            window.URL.revokeObjectURL(url);
        } catch (e) { console.error('Report error', e); }
    };

    // --- Display Student Dashboard --- //
    function displayStudentDashboard(data) {
        console.log('Student dashboard data:', data);

        // Display projects
        if (projectsUl) {
            projectsUl.innerHTML = '';
            console.log('Student projects:', data.projects);
            if (data.projects && data.projects.length > 0) {
                data.projects.forEach(project => {
                    const projectItem = createStudentProjectItem(project);
                    projectsUl.appendChild(projectItem);
                });
            } else {
                projectsUl.innerHTML = '<li class="no-projects">No projects yet. Create a new project or join an existing one to get started.</li>';
            }
        }
    }

    // --- Create Student Project Item --- //
    function createStudentProjectItem(project) {
        const li = document.createElement('li');
        li.className = 'student-project-item';

        const statusClass = project.status === 'in-progress' ? 'in-progress' :
            project.status === 'completed' ? 'completed' : 'pending';

        const teamMembers = project.members ? project.members.map(m => m.user?.username || 'Unknown').join(', ') : 'No members';
        const ownerName = project.owner?.username || 'Unknown';
        const isOwner = project.owner?._id === localStorage.getItem('userId');

        li.innerHTML = `
            <div class="student-project-header">
                <h4 class="student-project-title">${project.name}</h4>
                <span class="student-project-status ${statusClass}">${project.status}</span>
            </div>
            <div class="student-project-meta">
                <div class="student-project-meta-item">
                    <span class="material-icons">person</span>
                    <span>Owner: ${ownerName}</span>
                </div>
                <div class="student-project-meta-item">
                    <span class="material-icons">group</span>
                    <span>Team: ${teamMembers}</span>
                </div>
                <div class="student-project-meta-item">
                    <span class="material-icons">schedule</span>
                    <span>Updated: ${new Date(project.updatedAt).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="student-project-actions">
                <button class="btn primary-btn js-view-project" data-id="${project._id}">
                    <span class="material-icons">visibility</span>View Project
                </button>
                ${isOwner ? `
                    <button class="btn secondary-btn js-copy-id" data-id="${project._id}">
                        <span class="material-icons">content_copy</span>Copy ID
                    </button>
                ` : ''}
            </div>
        `;

        const viewBtn = li.querySelector('.js-view-project');
        const copyBtn = li.querySelector('.js-copy-id');
        if (viewBtn) viewBtn.addEventListener('click', () => window.fetchProjectDetails(project._id));
        if (copyBtn) copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(project._id);
            alert('Project ID copied to clipboard!');
        });

        return li;
    }

    // --- Display Faculty Dashboard --- //
    function displayFacultyDashboard(data) {
        console.log('Faculty dashboard data:', data);

        // Update metrics
        if (facultyTotalProjects) facultyTotalProjects.textContent = data.metrics?.totalAssigned || 0;
        if (facultyActiveProjects) facultyActiveProjects.textContent = data.metrics?.active || 0;
        if (facultyCompletedProjects) facultyCompletedProjects.textContent = data.metrics?.completed || 0;
        if (facultyPendingProjects) facultyPendingProjects.textContent = data.metrics?.pending || 0;

        // Display assigned projects
        if (facultyProjectsUl) {
            facultyProjectsUl.innerHTML = '';
            console.log('Assigned projects:', data.assignedProjects);
            if (data.assignedProjects && data.assignedProjects.length > 0) {
                data.assignedProjects.forEach(project => {
                    const projectItem = createFacultyProjectItem(project);
                    facultyProjectsUl.appendChild(projectItem);
                });
            } else {
                facultyProjectsUl.innerHTML = '<li class="no-projects">No assigned projects yet. Add a student project to get started.</li>';
            }
        }
    }

    // --- Create Faculty Project Item --- //
    function createFacultyProjectItem(project) {
        const li = document.createElement('li');
        li.className = 'faculty-project-item';

        const statusClass = project.status === 'in-progress' ? 'in-progress' :
            project.status === 'completed' ? 'completed' : 'pending';

        const teamMembers = project.members ? project.members.map(m => m.user?.username || 'Unknown').join(', ') : 'No members';
        const ownerName = project.owner?.username || 'Unknown';

        li.innerHTML = `
            <div class="faculty-project-header">
                <h4 class="faculty-project-title">${project.name}</h4>
                <span class="faculty-project-status ${statusClass}">${project.status}</span>
            </div>
            <div class="faculty-project-meta">
                <div class="faculty-project-meta-item">
                    <span class="material-icons">person</span>
                    <span>Owner: ${ownerName}</span>
                </div>
                <div class="faculty-project-meta-item">
                    <span class="material-icons">group</span>
                    <span>Team: ${teamMembers}</span>
                </div>
                <div class="faculty-project-meta-item">
                    <span class="material-icons">schedule</span>
                    <span>Updated: ${new Date(project.updatedAt).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="faculty-project-actions">
                <button class="btn primary-btn js-view-project" data-id="${project._id}">
                    <span class="material-icons">visibility</span>View Project
                </button>
                <button class="btn secondary-btn js-generate-report" data-id="${project._id}">
                    <span class="material-icons">assessment</span>Generate Report
                </button>
            </div>
        `;

        const viewBtn = li.querySelector('.js-view-project');
        const reportBtn = li.querySelector('.js-generate-report');
        if (viewBtn) viewBtn.addEventListener('click', () => window.fetchProjectDetails(project._id));
        if (reportBtn) reportBtn.addEventListener('click', () => window.generateReport(project._id));

        return li;
    }

    // --- Display Projects --- //
    async function displayProjects(projects, userRole) {
        projectsUl.innerHTML = '';
        if (projects && projects.length > 0) {
            for (const project of projects) {
                const statusKey = (project.status || 'pending').toLowerCase().replace(/\s+/g, '_');
                const li = document.createElement('li');
                li.className = 'project-card';
                li.innerHTML = `
                    <span>
                        <strong>${project.name || 'Untitled Project'}</strong>
                        <span class="status-badge ${statusKey}"> ${project.status || 'pending'} </span>
                        <span style="color:#888; margin-left:8px;">ID:</span> <strong>${project._id}</strong>
                    </span>
                    <div>
                        <button data-copy-id="${project._id}" class="btn tiny-btn flat-btn" title="Copy ID"><span class="material-icons">content_copy</span>Copy</button>
                        <button data-project-id="${project._id}" class="btn flat-btn view-project-btn"><span class="material-icons">visibility</span>View</button>
                    </div>
                `;
                projectsUl.appendChild(li);
            }
        } else {
            projectsUl.innerHTML = '<li>No projects found. Create or join one!</li>';
        }
    }

    // --- Handle View Project Button --- //
    projectsUl.addEventListener('click', async (e) => {
        const copyBtn = e.target.closest('[data-copy-id]');
        if (copyBtn) {
            const id = copyBtn.getAttribute('data-copy-id');
            try { await navigator.clipboard.writeText(id); } catch (_) { }
            copyBtn.innerHTML = '<span class="material-icons">check</span>Copied';
            setTimeout(() => { copyBtn.innerHTML = '<span class="material-icons">content_copy</span>Copy'; }, 1200);
            return;
        }

        const viewBtn = e.target.closest('.view-project-btn');
        if (viewBtn) {
            const projectId = viewBtn.dataset.projectId;
            await fetchProjectDetails(projectId);
            return;
        }

        const card = e.target.closest('li.project-card');
        if (card) {
            const view = card.querySelector('.view-project-btn');
            if (view) {
                const projectId = view.dataset.projectId;
                await fetchProjectDetails(projectId);
            }
        }
    });

    // --- Fetch Project Details and Tasks --- //
    async function fetchProjectDetails(projectId) {
        const token = getAuthToken();
        if (!token) return;

        // Clear any existing chat polling when loading a new project
        

        try {
            // Fetch a single project by ID to get populated member details
            const res = await fetch(`${API_URL}/projects/${projectId}`, {
                headers: {
                    'x-auth-token': token,
                },
            });
            const project = await res.json();

            if (res.ok && project) {
                currentProject = project;
                projectDetailsNameHeader.textContent = project.name;
                currentProjectIdSpan.textContent = project._id; // Display project ID
                console.log('Project object (for files debug):', project);
                projectDetailsDescriptionDisplay.textContent = project.description;
                projectDetailsStatusDisplay.textContent = project.status;
                projectDetailsOwnerDisplay.textContent = project.owner ? project.owner.username : 'N/A';
                const created = new Date(project.createdAt);
                const updated = new Date(project.updatedAt);
                projectDetailsCreatedAtDisplay.textContent = isNaN(created.getTime()) ? '-' : created.toLocaleDateString();
                projectDetailsUpdatedAtDisplay.textContent = isNaN(updated.getTime()) ? '-' : updated.toLocaleDateString();
                projectDetailsAiPlanStatusDisplay.textContent = project.aiPlanStatus.replace(/_/g, ' ');
                projectDetailsFacultyEvaluationDisplay.textContent = project.facultyEvaluation || 'No evaluation yet.';
                projectDetailsProjectGradeDisplay.textContent = project.projectGrade || 'N/A';

                // Display Team Members
                displayTeamMembers(project.members);

                // Display Tasks (fetch from tasks API to ensure list is populated)
                tasksUl.innerHTML = '<li>Loading tasks...</li>';
                try {
                    const tasksRes = await fetch(`${API_URL}/tasks/project/${projectId}`, {
                        headers: { 'x-auth-token': token }
                    });
                    let tasksData = null;
                    try { tasksData = await tasksRes.json(); } catch (_) { tasksData = null; }
                    if (tasksRes.ok && Array.isArray(tasksData)) {
                        displayTasksForProjectDetails(tasksData);
                    } else {
                        const msg = tasksData && tasksData.msg ? tasksData.msg : `Status ${tasksRes.status}`;
                        console.error('Tasks API error:', msg);
                        tasksUl.innerHTML = `<li>No tasks found or failed to load (${msg}).</li>`;
                    }
                } catch (e) {
                    console.error('Error loading tasks', e);
                    tasksUl.innerHTML = '<li>Error loading tasks. Check connection and try again.</li>';
                }

                // Ensure files are loaded; fallback to files endpoint if not provided
                if (!project.files || !Array.isArray(project.files)) {
                    try {
                        const filesRes = await fetch(`${API_URL}/files/project/${projectId}`, {
                            headers: {
                                'x-auth-token': token,
                            },
                        });
                        const filesData = await filesRes.json();
                        console.log('Files fallback response:', filesData);
                        if (filesRes.ok) {
                            if (Array.isArray(filesData)) {
                                project.files = filesData;
                            } else if (Array.isArray(filesData.files)) {
                                project.files = filesData.files;
                            } else {
                                project.files = [];
                            }
                        } else {
                            project.files = [];
                        }
                    } catch (err) {
                        console.error('Error fetching files fallback:', err);
                        project.files = [];
                    }
                }

                // Display Files
                console.log('Rendering files list:', project.files);
                filesUl.innerHTML = '';
                if (project.files && project.files.length > 0) {
                    project.files.forEach(file => {
                        const li = document.createElement('li');
                        const uploadedByUsername = file.uploadedBy && file.uploadedBy.username ? file.uploadedBy.username : 'Unknown';
                        const downloadHref = file._id ? `${API_URL}/files/download/${file._id}` : `${window.location.origin}/uploads/${encodeURIComponent(file.fileName)}`;
                        const badge = file.storageProvider === 'nextcloud' ? '<span class="badge nextcloud-badge" style="background:linear-gradient(135deg, #0082c9, #005689);color:#fff;font-size:0.7rem;padding:2px 8px;border-radius:4px;margin-left:6px;font-weight:600;">☁️ Nextcloud</span>' : '';
                        li.innerHTML = `
                            <span>${file.fileName} (v${file.version})${badge} - Uploaded by: ${uploadedByUsername} on ${new Date(file.uploadDate).toLocaleDateString()}</span>
                            <div>
                                <a href="${downloadHref}" class="btn flat-btn" download><span class="material-icons">download</span>Download</a>
                                <button data-file-id="${file._id}" class="btn flat-btn delete-file-btn"><span class="material-icons">delete</span>Delete</button>
                            </div>
                        `;
                        filesUl.appendChild(li);
                    });
                } else {
                    filesUl.innerHTML = '<li>No files uploaded for this project.</li>';
                }

                // Add event listeners for delete file buttons (delegation for dynamic elements)
                filesUl.addEventListener('click', async (e) => {
                    if (e.target.closest('.delete-file-btn')) {
                        const fileId = e.target.closest('.delete-file-btn').dataset.fileId;
                        const token = getAuthToken();
                        if (!token) return;
                        if (confirm('Are you sure you want to delete this file?')) {
                            try {
                                // Try preferred endpoint first
                                let res = await fetch(`${API_URL}/files/${fileId}`, {
                                    method: 'DELETE',
                                    headers: {
                                        'x-auth-token': token,
                                    },
                                });

                                // Fallbacks for different backend route shapes
                                if (res.status === 404) {
                                    // Try /files/delete/:id
                                    res = await fetch(`${API_URL}/files/delete/${fileId}`, {
                                        method: 'DELETE',
                                        headers: {
                                            'x-auth-token': token,
                                        },
                                    });
                                }
                                if (res.status === 404) {
                                    // Try POST variant /files/:id/delete
                                    res = await fetch(`${API_URL}/files/${fileId}/delete`, {
                                        method: 'POST',
                                        headers: {
                                            'x-auth-token': token,
                                        },
                                    });
                                }

                                let data = {};
                                try { data = await res.json(); } catch (_) { /* ignore parse issues */ }

                                if (res.ok) {
                                    alert(data.msg || 'File deleted successfully!');
                                    fetchProjectDetails(currentProject._id); // Refresh files list
                                } else {
                                    console.error('Delete failed', res.status, data);
                                    alert(data.msg || `Failed to delete file (status ${res.status}).`);
                                }
                            } catch (err) {
                                console.error('Error deleting file:', err);
                                alert('Server error during file deletion.');
                            }
                        }
                    }
                });

                // Chat: only for non-faculty roles to avoid 401 spam and flicker
                if (getUserRole() !== 'faculty') {
                    await fetchAndDisplayChatMessages(projectId);
                    
                }

                // UI visibility based on roles and project status
                const userRole = getUserRole();

                // Hide non-required panels for faculty: tasks, files, chat
                const tasksPanelEl = document.getElementById('tasks-panel');
                const filesPanelEl = document.getElementById('files-panel');
                const chatPanelEl = document.getElementById('chat-panel');
                if (userRole === 'faculty') {
                    if (tasksPanelEl) tasksPanelEl.style.display = 'none';
                    if (filesPanelEl) filesPanelEl.style.display = 'none';
                    if (chatPanelEl) chatPanelEl.style.display = 'none';
                    // Show charts for this project
                    await renderProjectCharts(projectId);
                } else {
                    if (tasksPanelEl) tasksPanelEl.style.display = 'block';
                    if (filesPanelEl) filesPanelEl.style.display = 'block';
                    if (chatPanelEl) chatPanelEl.style.display = 'block';
                    if (projectHealthPanel) projectHealthPanel.style.display = 'none';
                }

                // AI Plan Tasks button: Always visible, but accept/approve/reject logic changes
                if (project.aiPlanStatus === 'approved') {
                    aiPlanProjectBtn.style.display = 'none'; // Hide if already approved
                } else {
                    aiPlanProjectBtn.style.display = userRole === 'faculty' ? 'none' : 'inline-flex';
                }
                // Auto Milestones visibility (hide for faculty)
                if (autoMilestonesBtn) {
                    autoMilestonesBtn.style.display = userRole === 'faculty' ? 'none' : 'inline-flex';
                }

                // View Feedback button: Faculty only
                if (userRole === 'faculty') {
                    viewFeedbackBtn.style.display = 'inline-flex';
                } else {
                    viewFeedbackBtn.style.display = 'none';
                }

                // Complete Project button: owner or team leader can complete
                let currentUserId = null;
                try { currentUserId = JSON.parse(atob(getAuthToken().split('.')[1])).user.id; } catch (_) { }
                const isOwner = project.owner && project.owner._id && currentUserId ? (project.owner._id.toString() === currentUserId) : false;
                const isTeamLeaderMember = Array.isArray(project.members) && currentUserId
                    ? project.members.some(m => m && m.role === 'team_leader' && m.user && (m.user._id || m.user.id) && (m.user._id?.toString?.() === currentUserId || m.user.id === currentUserId))
                    : false;
                if (completeProjectBtn) {
                    const role = getUserRole();
                    const canComplete = (role === 'team_leader' || role === 'faculty');
                    completeProjectBtn.style.display = (canComplete) && project.status !== 'completed' ? 'inline-flex' : 'none';
                }

                // Faculty Evaluation section: Faculty only
                if (userRole === 'faculty') {
                    document.getElementById('evaluate-project-btn').style.display = 'inline-flex';
                } else {
                    document.getElementById('evaluate-project-btn').style.display = 'none';
                }

                // Faculty can see compose box, others only read
                if (userRole === 'faculty') {
                    facultySuggestionCompose.style.display = 'block';
                    // Optionally auto-assign faculty when opened
                    try { await fetch(`${API_URL}/projects/assign-faculty/${projectId}`, { method: 'PUT', headers: { 'x-auth-token': token } }); } catch (_) { }
                } else {
                    facultySuggestionCompose.style.display = 'none';
                }

                // Load faculty suggestions
                try {
                    const sugRes = await fetch(`${API_URL}/projects/${projectId}/faculty-suggestions`, { headers: { 'x-auth-token': token } });
                    const sugData = await sugRes.json();
                    facultySuggestionsUl.innerHTML = '';
                    if (sugRes.ok && sugData.suggestions && sugData.suggestions.length > 0) {
                        sugData.suggestions.forEach(s => {
                            const li = document.createElement('li');
                            const who = s.faculty && s.faculty.username ? s.faculty.username : 'Faculty';
                            li.innerHTML = `<span><strong>${who}</strong>: ${s.message}</span><span>${new Date(s.createdAt).toLocaleString()}</span>`;
                            facultySuggestionsUl.appendChild(li);
                        });
                    } else {
                        facultySuggestionsUl.innerHTML = '<li>No faculty suggestions yet.</li>';
                    }
                } catch (err) {
                    console.error('Error loading suggestions', err);
                    facultySuggestionsUl.innerHTML = '<li>Error loading suggestions.</li>';
                }

                showView('project-details-view');

            } else {
                console.error('Failed to fetch project details:', project.msg);
                alert(project.msg || 'Failed to load project details.');
            }
        } catch (err) {
            console.error('Error fetching project details:', err);
            alert('Server error loading project details.');
        }
    }

    // --- Display Team Members --- //
    function displayTeamMembers(members, ownerId) {
        teamMembersUl.innerHTML = '';
        if (members && members.length > 0) {
            members.forEach(member => {
                const li = document.createElement('li');
                const memberRole = member.user._id === ownerId ? 'Owner' : member.role;
                li.innerHTML = `
                    <span class="material-icons">person</span>
                    <span><strong>${member.user.username}</strong> (${memberRole}) - ${member.user.email}</span>
                `;
                teamMembersUl.appendChild(li);
            });
        } else {
            teamMembersUl.innerHTML = '<li>No team members yet.</li>';
        }
    }

    // --- Display Tasks in Project Details --- //
    function displayTasksForProjectDetails(tasks) {
        latestTasksForFilter = Array.isArray(tasks) ? tasks : [];
        renderTasksWithFilter('all');
    }

    function renderTasksWithFilter(filter) {
        const listTasks = latestTasksForFilter;
        const pending = listTasks.filter(t => (t.status || 'pending').toLowerCase() !== 'completed');
        const completed = listTasks.filter(t => (t.status || 'pending').toLowerCase() === 'completed');
        if (tasksCountsSpan) tasksCountsSpan.textContent = `(Pending: ${pending.length}, Completed: ${completed.length})`;

        const renderList = (arr) => {
            const ul = document.createElement('ul');
            ul.className = 'item-list';
            if (arr.length === 0) {
                ul.innerHTML = '<li>None</li>';
                return ul;
            }
            arr.forEach(task => {
                const li = document.createElement('li');
                const assigned = task.assignedTo && (task.assignedTo.username || task.assignedTo.email) ? (task.assignedTo.username || task.assignedTo.email) : 'Unassigned';
                li.className = `task-item task-${(task.status || 'pending').toLowerCase().replace(' ', '-')}`;
                li.innerHTML = `
                    <span>${task.name} - Status: ${task.status || 'pending'} - Due: ${task.dueDate ? new Date(task.dueDate).toDateString() : 'N/A'} <em>(Assigned: ${assigned})</em></span>
                    <div>
                        <button data-task-id="${task._id}" class="btn flat-btn complete-task-btn"><span class="material-icons">check_circle</span>Complete</button>
                        <button data-task-id="${task._id}" class="btn flat-btn suggest-assignee-btn"><span class="material-icons">person_add</span>Suggest Assignee</button>
                    </div>
                `;
                ul.appendChild(li);
            });
            return ul;
        };

        tasksUl.innerHTML = '';
        if (filter === 'pending') {
            const pendingHeader = document.createElement('h4');
            pendingHeader.textContent = `Pending Tasks (${pending.length})`;
            tasksUl.appendChild(pendingHeader);
            tasksUl.appendChild(renderList(pending));
            return;
        }
        if (filter === 'completed') {
            const completedHeader = document.createElement('h4');
            completedHeader.textContent = `Completed Tasks (${completed.length})`;
            tasksUl.appendChild(completedHeader);
            tasksUl.appendChild(renderList(completed));
            return;
        }
        const pendingHeader = document.createElement('h4');
        pendingHeader.textContent = `Pending Tasks (${pending.length})`;
        const completedHeader = document.createElement('h4');
        completedHeader.style.marginTop = '12px';
        completedHeader.textContent = `Completed Tasks (${completed.length})`;
        tasksUl.appendChild(pendingHeader);
        tasksUl.appendChild(renderList(pending));
        tasksUl.appendChild(completedHeader);
        tasksUl.appendChild(renderList(completed));
    }

    if (tasksFilterAllBtn) tasksFilterAllBtn.addEventListener('click', () => renderTasksWithFilter('all'));
    if (tasksFilterPendingBtn) tasksFilterPendingBtn.addEventListener('click', () => renderTasksWithFilter('pending'));
    if (tasksFilterCompletedBtn) tasksFilterCompletedBtn.addEventListener('click', () => renderTasksWithFilter('completed'));

    // --- Create Project Button --- //
    createProjectBtn.addEventListener('click', () => {
        console.log('Create Project button clicked!'); // Added for debugging
        projectNameInput.value = '';
        projectDescriptionInput.value = '';
        projectError.textContent = '';
        openModal('create-project-modal');
    });

    // --- Save Project Button (inside modal) --- //
    saveProjectBtn.addEventListener('click', async () => {
        const token = getAuthToken();
        if (!token) return;

        const name = projectNameInput.value;
        const description = projectDescriptionInput.value;
        projectError.textContent = '';

        try {
            const res = await fetch(`${API_URL}/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token,
                },
                body: JSON.stringify({ name, description }),
            });
            const data = await res.json();
            if (res.ok) {
                closeModal('create-project-modal');
                fetchDashboardData();
                alert(`Project created successfully! Project ID: ${data._id}`);
            } else {
                if (data.errors) {
                    projectError.textContent = data.errors.map(err => err.msg).join(', ');
                } else {
                    projectError.textContent = data.msg || 'Failed to create project';
                }
            }
        } catch (err) {
            console.error(err);
            projectError.textContent = 'Server error';
        }
    });

    // --- Join Project Button --- //
    joinProjectBtn.addEventListener('click', () => {
        joinProjectIdInput.value = '';
        joinProjectError.textContent = '';
        openModal('join-project-modal');
    });

    // --- Submit Join Project Button (inside modal) --- //
    submitJoinProjectBtn.addEventListener('click', async () => {
        const token = getAuthToken();
        if (!token) return;

        const projectId = joinProjectIdInput.value.trim();
        joinProjectError.textContent = '';

        if (!projectId) {
            joinProjectError.textContent = 'Project ID cannot be empty.';
            return;
        }

        try {
            const res = await fetch(`${API_URL}/projects/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token,
                },
                body: JSON.stringify({ projectId }),
            });
            const data = await res.json();
            if (res.ok) {
                closeModal('join-project-modal');
                fetchDashboardData();
                alert('Successfully joined project!');
            } else {
                if (data.errors) {
                    joinProjectError.textContent = data.errors.map(err => err.msg).join(', ');
                } else {
                    joinProjectError.textContent = data.msg || 'Failed to join project';
                }
            }
        } catch (err) {
            console.error(err);
            joinProjectError.textContent = 'Server error';
        }
    });

    // --- Create Task Button --- //
    createTaskBtn.addEventListener('click', () => {
        if (!currentProject) {
            alert('Please select a project first.');
            return;
        }
        taskNameInput.value = '';
        taskDescriptionInput.value = '';
        taskDueDateInput.value = '';
        taskPriorityInput.value = 'medium';
        taskError.textContent = '';
        taskProjectName.textContent = currentProject.name; // Set project name in task modal
        // Populate assignee options if team leader
        if (getUserRole() === 'team_leader' && taskAssigneeGroup && taskAssigneeSelect) {
            taskAssigneeGroup.style.display = 'block';
            taskAssigneeSelect.innerHTML = '';
            const members = Array.isArray(currentProject.members) ? currentProject.members : [];
            members.forEach(m => {
                const id = (m.user && (m.user._id || m.user.id)) ? (m.user._id || m.user.id) : null;
                const name = m.user && (m.user.username || m.user.email) ? (m.user.username || m.user.email) : 'Member';
                if (id) {
                    const opt = document.createElement('option');
                    opt.value = id;
                    opt.textContent = `${name} ${m.role === 'team_leader' ? '(Leader)' : ''}`;
                    taskAssigneeSelect.appendChild(opt);
                }
            });
        } else if (taskAssigneeGroup) {
            taskAssigneeGroup.style.display = 'none';
        }
        openModal('create-task-modal', currentProject.name);
    });

    // --- Save Task Button (inside modal) --- //
    saveTaskBtn.addEventListener('click', async () => {
        const token = getAuthToken();
        if (!token || !currentProject) return;

        const name = taskNameInput.value;
        const description = taskDescriptionInput.value;
        const dueDate = taskDueDateInput.value;
        const priority = taskPriorityInput.value;
        const assignedTo = (getUserRole() === 'team_leader' && taskAssigneeSelect && taskAssigneeSelect.value) ? taskAssigneeSelect.value : undefined;
        taskError.textContent = '';

        try {
            const res = await fetch(`${API_URL}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token,
                },
                body: JSON.stringify({ project: currentProject._id, name, description, dueDate, priority, assignedTo }),
            });
            const data = await res.json();
            if (res.ok) {
                closeModal('create-task-modal');
                fetchProjectDetails(currentProject._id); // Refresh tasks
                alert('Task created successfully!');
            } else {
                if (data.errors) {
                    taskError.textContent = data.errors.map(err => err.msg).join(', ');
                } else {
                    taskError.textContent = data.msg || 'Failed to create task';
                }
            }
        } catch (err) {
            console.error(err);
            taskError.textContent = 'Server error';
        }
    });

    // --- AI Plan Project Button --- //
    aiPlanProjectBtn.addEventListener('click', async () => {
        const token = getAuthToken();
        if (!token || !currentProject) return;

        try {
            // If a plan is awaiting review and we already have it saved on the project, show it
            if (currentProject.aiPlanStatus === 'pending_review' && currentProject.aiPlanDetails) {
                displayAiPlannedTasks(currentProject.aiPlanDetails, currentProject.name);
                return;
            }

            const res = await fetch(`${API_URL}/projects/ai-plan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token,
                },
                body: JSON.stringify({ projectId: currentProject._id }),
            });
            const raw = await res.text();
            let data = null;
            try { data = raw ? JSON.parse(raw) : null; } catch (_) { /* not JSON */ }
            if (res.ok && data && data.aiPlannedTasks) {
                displayAiPlannedTasks(data.aiPlannedTasks, currentProject.name);
            } else {
                const msg = (data && data.msg) ? data.msg : (raw || 'Failed to get AI plan');
                alert(msg);
            }
        } catch (err) {
            console.error(err);
            alert('Server error during AI planning');
        }
    });

    // --- Display AI Planned Tasks (in modal) --- //
    function displayAiPlannedTasks(aiPlannedTasks, projectName) {
        aiSuggestedTasksUl.innerHTML = '';
        aiSuggestedMilestonesUl.innerHTML = '';
        if (aiItineraryUl) aiItineraryUl.innerHTML = '';
        aiPlanProjectName.textContent = projectName; // Set project name in modal
        acceptAiPlanBtn.style.display = 'none'; // Hide by default
        approvePlanBtn.style.display = 'none';
        rejectPlanBtn.style.display = 'none';

        if (aiPlannedTasks.suggestions && aiPlannedTasks.suggestions.length > 0) {
            aiPlannedTasks.suggestions.forEach(task => {
                const li = document.createElement('li');
                li.textContent = `${task.taskName} (Timeline: ${task.timeline})`;
                aiSuggestedTasksUl.appendChild(li);
            });
        } else {
            aiSuggestedTasksUl.innerHTML = '<li>No AI suggested tasks.</li>';
        }

        if (aiPlannedTasks.milestones && aiPlannedTasks.milestones.length > 0) {
            aiPlannedTasks.milestones.forEach(milestone => {
                const li = document.createElement('li');
                li.textContent = `${milestone.name} (Due: ${new Date(milestone.dueDate).toDateString()})`;
                aiSuggestedMilestonesUl.appendChild(li);
            });
        } else {
            aiSuggestedMilestonesUl.innerHTML = '<li>No AI suggested milestones.</li>';
        }

        // Render itinerary if present
        if (aiPlannedTasks.itinerary && Array.isArray(aiPlannedTasks.itinerary) && aiItineraryUl) {
            aiPlannedTasks.itinerary.forEach(week => {
                const li = document.createElement('li');
                const daysHtml = (week.days || []).map(d => `<div><strong>${d.day}:</strong> ${d.todo}${d.tips ? ` <em style=\"color:#666\">(${d.tips})</em>` : ''}</div>`).join('');
                li.innerHTML = `<span><strong>Week ${week.week}</strong></span><div style="display:block;">${daysHtml}</div>`;
                aiItineraryUl.appendChild(li);
            });
        } else if (aiItineraryUl) {
            aiItineraryUl.innerHTML = '<li>No itinerary provided.</li>';
        }

        // Determine button visibility based on role and plan status
        const userRole = getUserRole();
        if (userRole === 'team_leader') {
            approvePlanBtn.style.display = 'inline-flex';
            rejectPlanBtn.style.display = 'inline-flex';
        } else if (userRole === 'student') {
            acceptAiPlanBtn.style.display = 'inline-flex';
        }

        openModal('ai-planned-tasks-section', projectName);
    }

    // --- Accept AI Plan Button --- //
    acceptAiPlanBtn.addEventListener('click', async () => {
        const token = getAuthToken();
        if (!token || !currentProject) return;

        const suggestedTasks = Array.from(aiSuggestedTasksUl.children).map(li => {
            const text = li.textContent;
            const match = text.match(/(.*) \(Timeline: (.*)\)/);
            return { name: match[1], description: `AI Suggested Task: ${match[1]}`, timeline: match[2] };
        });

        try {
            for (const task of suggestedTasks) {
                await fetch(`${API_URL}/tasks`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': token,
                    },
                    body: JSON.stringify({
                        project: currentProject._id,
                        name: task.name,
                        description: task.description,
                        dueDate: new Date(Date.now() + (task.timeline.includes('week') ? parseInt(task.timeline) * 7 : 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Simple due date logic
                        priority: 'medium',
                    }),
                });
            }

            // Update project AI plan status to pending_review after accepting by student
            await fetch(`${API_URL}/projects/${currentProject._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token,
                },
                body: JSON.stringify({ aiPlanStatus: 'pending_review', aiPlanDetails: { suggestions: suggestedTasks, milestones: Array.from(aiSuggestedMilestonesUl.children).map(li => { const text = li.textContent; const match = text.match(/(.*) \(Due: (.*)\)/); return { name: match[1], dueDate: match[2] }; }) } }),
            });

            closeModal('ai-planned-tasks-section');
            fetchProjectDetails(currentProject._id); // Refresh tasks
            alert('AI Plan Accepted and tasks created! Awaiting Team Leader approval.');

        } catch (err) {
            console.error('Error accepting AI plan and creating tasks:', err);
            alert('Failed to accept AI plan and create tasks.');
        }
    });

    // --- Approve Plan Button (Team Leader Only) --- //
    approvePlanBtn.addEventListener('click', async () => {
        const token = getAuthToken();
        if (!token || !currentProject) return;

        try {
            const res = await fetch(`${API_URL}/projects/approve-plan/${currentProject._id}`, {
                method: 'PUT',
                headers: {
                    'x-auth-token': token,
                },
            });
            const data = await res.json();
            if (res.ok) {
                closeModal('ai-planned-tasks-section');
                alert(data.msg);
                fetchProjectDetails(currentProject._id); // Refresh project details
            } else {
                alert(data.msg || 'Failed to approve plan');
            }
        } catch (err) {
            console.error(err);
            alert('Server error during plan approval');
        }
    });

    // --- Reject Plan Button (Team Leader Only) --- //
    rejectPlanBtn.addEventListener('click', async () => {
        const token = getAuthToken();
        if (!token || !currentProject) return;

        try {
            const res = await fetch(`${API_URL}/projects/reject-plan/${currentProject._id}`, {
                method: 'PUT',
                headers: {
                    'x-auth-token': token,
                },
            });
            const data = await res.json();
            if (res.ok) {
                closeModal('ai-planned-tasks-section');
                alert(data.msg);
                fetchProjectDetails(currentProject._id); // Refresh project details
            } else {
                alert(data.msg || 'Failed to reject plan');
            }
        } catch (err) {
            console.error(err);
            alert('Server error during plan rejection');
        }
    });

    // --- View Productivity Insights Button --- //
    viewProductivityBtn.addEventListener('click', async () => {
        const token = getAuthToken();
        if (!token || !currentProject) return;

        try {
            const res = await fetch(`${API_URL}/analytics/productivity/${currentProject._id}`, {
                headers: {
                    'x-auth-token': token,
                },
            });
            const data = await res.json();
            if (res.ok) {
                displayProductivityInsights(data, currentProject.name);
            } else {
                alert(data.msg || 'Failed to get productivity insights');
            }
        } catch (err) {
            console.error(err);
            alert('Server error during fetching productivity insights');
        }
    });

    // --- Display Productivity Insights (in modal) --- //
    function displayProductivityInsights(insights, projectName) {
        insightsProjectName.textContent = projectName;
        completedTasksCount.textContent = insights.completedTasks;
        inProgressTasksCount.textContent = insights.inProgressTasks;
        totalTasksCount.textContent = insights.totalTasks;
        completionRateSpan.textContent = insights.completionRate;

        aiProductivitySuggestionsUl.innerHTML = '';
        if (Array.isArray(insights.aiSuggestions) && insights.aiSuggestions.length > 0) {
            insights.aiSuggestions.forEach(suggestion => {
                const li = document.createElement('li');
                li.textContent = suggestion;
                aiProductivitySuggestionsUl.appendChild(li);
            });
        } else {
            aiProductivitySuggestionsUl.innerHTML = '<li>No AI suggestions for productivity.</li>';
        }

        const defaultInsights = {
            performingWell: 'Team member with highest completion is performing well.',
            needsImprovement: 'Member with lowest completion needs improvement; plan focus time.',
            teamSuggestion: 'Rebalance workload and review blockers in daily standups.'
        };
        const ii = insights.aiInsights || defaultInsights;
        if (insightPerformingWell) insightPerformingWell.textContent = ii.performingWell || defaultInsights.performingWell;
        if (insightNeedsImprovement) insightNeedsImprovement.textContent = ii.needsImprovement || defaultInsights.needsImprovement;
        if (insightTeamSuggestion) insightTeamSuggestion.textContent = ii.teamSuggestion || defaultInsights.teamSuggestion;
        openModal('productivity-insights-section', projectName);
    }

    // --- Smart Reminders --- //
    async function fetchAndDisplaySmartReminders(projectId, projectName) {
        const token = getAuthToken();
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/reminders/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ projectId })
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data.msg || 'Failed to generate reminders');
                return;
            }

            remindersProjectName.textContent = projectName;
            // Top list
            remindersTopUl.innerHTML = '';
            if (Array.isArray(data.top) && data.top.length) {
                data.top.forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = item.message;
                    remindersTopUl.appendChild(li);
                });
            } else {
                remindersTopUl.innerHTML = '<li>No urgent reminders.</li>';
            }

            // Groups
            remindersGroupsContainer.innerHTML = '';
            if (Array.isArray(data.groups) && data.groups.length) {
                data.groups.forEach(group => {
                    const div = document.createElement('div');
                    div.className = 'section-card';
                    const itemsHtml = group.items.map(it => `<li>${it.message}</li>`).join('');
                    div.innerHTML = `<h5>${group.title} (${group.priority.toUpperCase()})</h5><ul class="item-list">${itemsHtml}</ul>`;
                    remindersGroupsContainer.appendChild(div);
                });
            }

            openModal('smart-reminders-section', projectName);
        } catch (err) {
            console.error('Error fetching reminders', err);
            alert('Server error generating reminders');
        }
    }

    // --- Generate Report Button --- //
    generateReportBtn.addEventListener('click', async () => {
        const token = getAuthToken();
        if (!token || !currentProject) return;

        try {
            const ts = Date.now();
            const res = await fetch(`${API_URL}/reports/${currentProject._id}?ts=${ts}`, {
                headers: { 'x-auth-token': token }
            });
            if (!res.ok) {
                const msg = await res.text();
                alert(msg || 'Failed to generate report');
                return;
            }
            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('application/pdf')) {
                // Fallback for PDF binary
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `report-${currentProject.name || 'project'}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } else {
                // Received HTML (Vercel Serverless solution)
                const htmlContent = await res.text();
                const printWindow = window.open('', '_blank');
                printWindow.document.write(htmlContent);
                printWindow.document.close();
                // Wait for any images/scripts to layout before printing
                printWindow.onload = () => {
                    printWindow.print();
                };
            }
        } catch (err) {
            console.error('Report download error', err);
            alert('Server error generating report');
        }
    });

    // --- Auto Milestones Button --- //
    if (autoMilestonesBtn) {
        autoMilestonesBtn.addEventListener('click', () => {
            if (!currentProject) return alert('Open a project first.');
            autoMsProjectName.textContent = currentProject.name;
            autoMsDurationDays.value = '';
            autoMsDeadline.value = '';
            autoMsList.innerHTML = '';
            openModal('auto-milestones-section', currentProject.name);
        });
    }

    if (generateAutoMsBtn) {
        generateAutoMsBtn.addEventListener('click', async () => {
            const token = getAuthToken();
            if (!token || !currentProject) return;
            const durationDays = parseInt(autoMsDurationDays.value, 10) || undefined;
            const deadline = autoMsDeadline.value || undefined;

            try {
                const res = await fetch(`${API_URL}/projects/auto-milestones`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                    body: JSON.stringify({ projectId: currentProject._id, durationDays, deadline })
                });
                const data = await res.json();
                if (!res.ok) {
                    alert(data.msg || 'Failed to generate milestones');
                    return;
                }
                autoMsList.innerHTML = '';
                (data.milestones || []).forEach(ms => {
                    const li = document.createElement('li');
                    li.innerHTML = `<span><strong>${ms.name}</strong> (Due: ${ms.dueDate})</span><div>${ms.summary || ''}</div>`;
                    autoMsList.appendChild(li);
                });
                // Refresh project details so milestones are reflected elsewhere
                fetchProjectDetails(currentProject._id);
            } catch (err) {
                console.error('Auto milestones error', err);
                alert('Server error generating milestones');
            }
        });
    }

    // --- View Feedback Button (Faculty only) --- //
    viewFeedbackBtn.addEventListener('click', async () => {
        const token = getAuthToken();
        if (!token || !currentProject) return;

        try {
            const res = await fetch(`${API_URL}/feedback/faculty/${currentProject._id}`, {
                headers: {
                    'x-auth-token': token,
                },
            });
            const data = await res.json();
            if (res.ok) {
                displayFacultyFeedback(data.aiFeedback, currentProject.name);
            } else {
                alert(data.msg || 'Failed to get faculty feedback');
            }
        } catch (err) {
            console.error(err);
            alert('Server error during fetching faculty feedback');
        }
    });

    // --- Display Faculty Feedback (in modal) --- //
    function displayFacultyFeedback(aiFeedback, projectName) {
        feedbackProjectName.textContent = projectName;
        facultyFeedbackSummary.textContent = aiFeedback.summary;
        aiFeedbackSuggestionsUl.innerHTML = '';

        if (aiFeedback.suggestions && aiFeedback.suggestions.length > 0) {
            aiFeedback.suggestions.forEach(suggestion => {
                const li = document.createElement('li');
                li.textContent = suggestion;
                aiFeedbackSuggestionsUl.appendChild(li);
            });
        } else {
            aiFeedbackSuggestionsUl.innerHTML = '<li>No AI feedback suggestions.</li>';
        }

        feedbackTasksCompleted.textContent = aiFeedback.performanceMetrics.tasksCompleted;
        feedbackTasksInProgress.textContent = aiFeedback.performanceMetrics.tasksInProgress;
        feedbackOverdueTasks.textContent = aiFeedback.performanceMetrics.overdueTasks;
        feedbackAvgCompletionTime.textContent = aiFeedback.performanceMetrics.avgCompletionTime;

        openModal('faculty-feedback-modal', projectName);
    }

    // --- Submit Faculty Evaluation (in modal) --- //
    submitEvaluationBtn.addEventListener('click', async () => {
        const token = getAuthToken();
        if (!token || !currentProject) return;

        const facultyEvaluation = facultyEvaluationTextarea.value;
        const projectGrade = projectGradeSelect.value;
        evaluationStatus.textContent = '';

        try {
            const res = await fetch(`${API_URL}/projects/evaluate/${currentProject._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token,
                },
                body: JSON.stringify({ facultyEvaluation, projectGrade }),
            });
            const data = await res.json();
            if (res.ok) {
                evaluationStatus.textContent = 'Evaluation submitted successfully!';
                evaluationStatus.style.color = 'green';
                closeModal('faculty-evaluation-section');
                fetchProjectDetails(currentProject._id); // Refresh project details
                alert('Evaluation submitted successfully!');
            } else {
                evaluationStatus.textContent = data.msg || 'Failed to submit evaluation';
                evaluationStatus.style.color = 'red';
            }
        } catch (err) {
            console.error(err);
            evaluationStatus.textContent = 'Server error during evaluation submission';
            evaluationStatus.style.color = 'red';
        }
    });

    // --- Back to Dashboard Button --- //
    backToDashboardBtn.addEventListener('click', () => {
        showView('dashboard-view');
        fetchDashboardData();
    });

    // --- Close Modal Buttons --- //
    document.querySelectorAll('.modal .close-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });

    // --- File Upload --- //
    // --- File Input Change Listener --- //
    fileUploadInput.addEventListener('change', (e) => {
        const fileName = e.target.files.length > 0 ? e.target.files[0].name : 'No file chosen';
        fileNameDisplay.textContent = fileName;
    });

    // --- Upload File Button --- //
    uploadFileBtn.addEventListener('click', async () => {
        const token = getAuthToken();
        if (!token || !currentProject || !fileUploadInput.files.length) {
            alert('Please select a file and ensure you are logged in and a project is selected.');
            return;
        }

        const formData = new FormData();
        formData.append('file', fileUploadInput.files[0]);

        try {
            const res = await fetch(`${API_URL}/files/upload/${currentProject._id}`, {
                method: 'POST',
                headers: {
                    'x-auth-token': token,
                },
                body: formData,
            });

            const data = await res.json();
            if (res.ok) {
                alert(data.msg || 'File uploaded successfully!');
                fileNameDisplay.textContent = 'No file chosen'; // Reset file input display
                fileUploadInput.value = ''; // Clear file input
                fetchProjectDetails(currentProject._id); // Refresh files list
            } else {
                alert(data.msg || 'Failed to upload file.');
            }
        } catch (err) {
            console.error('Error uploading file:', err);
            alert('Server error during file upload.');
        }
    });

    // --- Task Management: Complete/Suggest/Assign --- //
    tasksUl.addEventListener('click', async (e) => {
        // Complete Task Button
        if (e.target.closest('.complete-task-btn')) {
            const taskId = e.target.closest('.complete-task-btn').dataset.taskId;
            const token = getAuthToken();
            if (!token) return;

            try {
                const res = await fetch(`${API_URL}/tasks/${taskId}/status`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': token,
                    },
                    body: JSON.stringify({ status: 'completed' }),
                });
                const data = await res.json();
                if (res.ok) {
                    // Green flash effect
                    const row = e.target.closest('li');
                    if (row) {
                        row.style.transition = 'background-color 0.6s ease';
                        row.style.backgroundColor = '#e6ffed';
                        setTimeout(() => { row.style.backgroundColor = ''; }, 800);
                    }
                    fetchProjectDetails(currentProject._id); // Refresh tasks
                    alert('Task marked as completed!');
                } else {
                    alert(data.msg || 'Failed to complete task');
                }
            } catch (err) {
                console.error(err);
                alert('Server error');
            }
        }
        // Suggest Assignee Button
        else if (e.target.closest('.suggest-assignee-btn')) {
            const taskId = e.target.closest('.suggest-assignee-btn').dataset.taskId;
            const token = getAuthToken();
            if (!token) return;

            try {
                const res = await fetch(`${API_URL}/tasks/${taskId}/ai-assign`, {
                    method: 'POST',
                    headers: {
                        'x-auth-token': token,
                    },
                });
                const data = await res.json();

                if (res.ok && data.suggestedAssignee) {
                    alert(`AI suggested: ${data.suggestedAssignee.username}. Click assign to confirm.`);
                    // Update button to 'Assign' and store suggested user ID
                    const originalButton = e.target.closest('.suggest-assignee-btn');
                    originalButton.innerHTML = `<span class="material-icons">assignment_ind</span>Assign ${data.suggestedAssignee.username}`;
                    originalButton.classList.remove('suggest-assignee-btn');
                    originalButton.classList.add('assign-task-btn');
                    originalButton.dataset.userId = data.suggestedAssignee.id;

                } else {
                    alert(data.msg || 'Failed to get AI assignee suggestion');
                }
            } catch (err) {
                console.error(err);
                alert('Server error during AI assignment suggestion');
            }
        }
        // Assign Task Button
        else if (e.target.closest('.assign-task-btn')) {
            const taskId = e.target.closest('.assign-task-btn').dataset.taskId;
            const userId = e.target.closest('.assign-task-btn').dataset.userId;
            const token = getAuthToken();
            if (!token) return;

            try {
                const res = await fetch(`${API_URL}/tasks/${taskId}/assign`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': token,
                    },
                    body: JSON.stringify({ userId }),
                });
                const data = await res.json();
                if (res.ok) {
                    alert(data.msg);
                    fetchProjectDetails(currentProject._id); // Refresh tasks
                } else {
                    alert(data.msg || 'Failed to assign task');
                }
            } catch (err) {
                console.error(err);
                alert('Server error during task assignment');
            }
        }
    });

    // --- Faculty Evaluate Project button (opens modal) ---
    document.getElementById('evaluate-project-btn').addEventListener('click', () => {
        if (!currentProject) {
            alert('Please select a project first.');
            return;
        }
        evaluationProjectName.textContent = currentProject.name;
        facultyEvaluationTextarea.value = currentProject.facultyEvaluation || '';
        projectGradeSelect.value = currentProject.projectGrade || 'N/A';
        evaluationStatus.textContent = '';
        openModal('faculty-evaluation-section', currentProject.name);
    });

    // --- Complete Project --- //
    if (completeProjectBtn) {
        completeProjectBtn.addEventListener('click', async () => {
            const token = getAuthToken();
            if (!token || !currentProject) return;
            if (!confirm('Mark this project as completed?')) return;

            try {
                const res = await fetch(`${API_URL}/projects/${currentProject._id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': token,
                    },
                    body: JSON.stringify({ status: 'completed' })
                });
                const data = await res.json();
                if (res.ok) {
                    alert('Project marked as completed.');
                    fetchProjectDetails(currentProject._id);
                } else {
                    alert(data.msg || 'Failed to complete project');
                }
            } catch (err) {
                console.error('Error completing project:', err);
                alert('Server error while completing project.');
            }
        });
    }

    // --- Student Quick Actions removed --- //

    // --- Faculty Add Project Flow --- //
    if (facultyAddProjectBtn) {
        facultyAddProjectBtn.addEventListener('click', () => {
            facultyProjectIdInput.value = '';
            facultyAddProjectError.textContent = '';
            openModal('faculty-add-project-modal');
        });
    }

    if (submitFacultyAddProjectBtn) {
        submitFacultyAddProjectBtn.addEventListener('click', async () => {
            const token = getAuthToken();
            if (!token) return;
            const projectId = facultyProjectIdInput.value.trim();
            if (!projectId) {
                facultyAddProjectError.textContent = 'Project ID cannot be empty.';
                return;
            }
            facultyAddProjectError.textContent = '';
            try {
                // First assign faculty to the project
                const assignResponse = await fetch(`${API_URL}/projects/assign-faculty/${projectId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': getAuthToken()
                    }
                });

                if (!assignResponse.ok) {
                    const errorData = await assignResponse.json();
                    throw new Error(errorData.msg || 'Failed to assign faculty to project');
                }

                // Then open the project for monitoring
                await fetchProjectDetails(projectId);
                closeModal('faculty-add-project-modal');

                // Show success message
                facultyAddProjectError.textContent = 'Successfully assigned to project!';
                facultyAddProjectError.style.color = 'green';

                // Refresh dashboard to show the newly assigned project
                await fetchDashboardData();

                // Clear success message after 3 seconds
                setTimeout(() => {
                    facultyAddProjectError.textContent = '';
                    facultyAddProjectError.style.color = '';
                }, 3000);
            } catch (err) {
                console.error('Error assigning faculty to project:', err);
                facultyAddProjectError.textContent = err.message || 'Failed to assign faculty to project. Check the ID.';
            }
        });
    }

    // --- Faculty Suggestion Compose --- //
    if (facultySuggestionCompose) {
        facultySuggestionCompose.addEventListener('click', () => {
            facultySuggestionText.value = '';
            facultySuggestionError.textContent = '';
        });
    }

    if (submitFacultySuggestionBtn) {
        submitFacultySuggestionBtn.addEventListener('click', async () => {
            const token = getAuthToken();
            if (!token || !currentProject) return;
            const message = (facultySuggestionText.value || '').trim();
            facultySuggestionError.textContent = '';
            if (!message) {
                facultySuggestionError.textContent = 'Suggestion cannot be empty.';
                return;
            }
            try {
                const res = await fetch(`${API_URL}/projects/${currentProject._id}/faculty-suggestions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                    body: JSON.stringify({ message })
                });
                const data = await res.json();
                if (res.ok) {
                    facultySuggestionText.value = '';
                    // Refresh list
                    facultySuggestionsUl.innerHTML = '';
                    data.suggestions.forEach(s => {
                        const li = document.createElement('li');
                        const who = s.faculty && s.faculty.username ? s.faculty.username : 'Faculty';
                        li.innerHTML = `<span><strong>${who}</strong>: ${s.message}</span><span>${new Date(s.createdAt).toLocaleString()}</span>`;
                        facultySuggestionsUl.appendChild(li);
                    });
                } else {
                    facultySuggestionError.textContent = data.msg || 'Failed to submit suggestion';
                }
            } catch (err) {
                console.error('Error submitting suggestion', err);
                facultySuggestionError.textContent = 'Server error';
            }
        });
    }

    // --- Chat functionality --- //
    // Fetch and display chat messages
    async function fetchAndDisplayChatMessages(projectId) {
        if (socket) {
            socket.emit('join_project', projectId);
        }
        const token = getAuthToken();
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/chat/projects/${projectId}`, {
                headers: {
                    'x-auth-token': token,
                },
            });
            const messages = await res.json();

            chatMessagesContainer.innerHTML = ''; // Clear existing messages
            if (res.ok && messages && messages.length > 0) {
                messages.forEach(message => {
                    const messageElement = document.createElement('div');
                    messageElement.classList.add('chat-message');
                    messageElement.innerHTML = `
                        <strong>${message.sender.username}:</strong> ${message.message}
                        <span class="chat-timestamp">${new Date(message.timestamp).toLocaleString()}</span>
                    `;
                    chatMessagesContainer.appendChild(messageElement);
                });
                chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight; // Scroll to bottom
            } else if (res.ok) {
                chatMessagesContainer.innerHTML = '<div class="chat-message system-message">No messages yet. Start the conversation!</div>';
            } else {
                console.error('Failed to fetch chat messages:', messages.msg);
                chatMessagesContainer.innerHTML = '<div class="chat-message system-message error">Error loading chat messages.</div>';
            }
        } catch (err) {
            console.error('Error fetching chat messages:', err);
            chatMessagesContainer.innerHTML = '<div class="chat-message system-message error">Server error loading chat.</div>';
        }
    }

    // Send chat message
    chatInputForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = getAuthToken();
        if (!token || !currentProject) return;

        const message = chatMessageInput.value.trim();
        if (!message) return;

        try {
            const res = await fetch(`${API_URL}/chat/projects/${currentProject._id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token,
                },
                body: JSON.stringify({ message }),
            });

            if (res.ok) {
                chatMessageInput.value = ''; // Clear input
                // Socket will handle incoming message rendering instantly
            } else {
                const errorData = await res.json();
                alert(errorData.msg || 'Failed to send message.');
            }
        } catch (err) {
            console.error('Error sending message:', err);
            alert('Server error sending message.');
        }
    });

});
