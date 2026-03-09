import { api } from '../api.js';

export default {
    trackingInterval: null,
    isMenuOpen: false,

    init() {
        // Start background tracking heart-beat (every minute)
        if (this.trackingInterval) clearInterval(this.trackingInterval);
        this.trackingInterval = setInterval(() => {
            this.heartbeat();
        }, 60000); // 1 minute

        // Initial check
        this.heartbeat();
    },

    async heartbeat() {
        const user = await api.getUser();
        if (!user) return;

        // Check if we are in a reading section to increment progress
        const isReading = window.location.hash === '#read' || window.location.hash.startsWith('#surah/');
        
        if (isReading) {
            await api.trackActivity(1); // Increment by 1 minute
        }

        const streakData = await api.getStreak();
        if (streakData) {
            this.checkCompletion(streakData);
        }

        this.updateFloatingUI();
    },

    checkCompletion(data) {
        const goalType = data.goal_type || 'time';
        const goal = data.goal_value || 10;
        const progress = goalType === 'time' ? (data.daily_progress_minutes || 0) : (data.daily_progress_verses || 0);
        
        const percent = Math.min(Math.round((progress / goal) * 100), 100);
        
        // Persistent check to trigger celebrate once per day
        const today = new Date().toISOString().split('T')[0];
        const lastCelebrated = localStorage.getItem('last_celebrated_date');

        if (percent >= 100 && lastCelebrated !== today) {
            this.celebrate();
            localStorage.setItem('last_celebrated_date', today);
        }
    },

    celebrate() {
        // Trigger Confetti
        if (window.confetti) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#FFD700', '#FF4500', '#32CD32']
            });
        }

        // Show Notification
        const notification = document.createElement('div');
        notification.className = 'streak-notification fade-in';
        notification.innerHTML = `
            <div class="notif-content">
                <span class="notif-icon">🌟</span>
                <div class="notif-text">
                    <strong>Daily Target Achieved!</strong>
                    <span>Mastermind! You've reached 100% of your Quran goal today.</span>
                </div>
            </div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 5000);
    },

    async updateFloatingUI() {
        const hash = window.location.hash || '#search';
        const showIn = ['#search', '#auth', '#bookmarks', ''];
        
        // Check if we should show the floating menu
        const containerId = 'streakFloatingRoot';
        let container = document.getElementById(containerId);

        const shouldShow = showIn.includes(hash) || hash === '#auth';
        
        if (!shouldShow) {
            if (container) container.style.display = 'none';
            return;
        }

        if (!container) {
            container = document.createElement('div');
            container.id = containerId;
            container.className = 'streak-floating-container';
            document.body.appendChild(container);
        } else {
            container.style.display = 'block';
        }

        const streakData = await api.getStreak();
        
        // If not logged in, hide completely
        const user = await api.getUser();
        if (!user) {
            container.style.display = 'none';
            return;
        }

        // Default or Fetch Data
        const currentStreak = streakData?.current_streak || 0;
        const goalType = streakData?.goal_type || 'time';
        const goalValue = streakData?.goal_value || 10;
        const isNew = !streakData;
        
        let progress = 0;
        let goal = goalValue;
        let unit = 'mins';

        if (goalType === 'time') {
            progress = streakData?.daily_progress_minutes || 0;
            unit = 'mins';
        } else {
            progress = streakData?.daily_progress_verses || 0;
            unit = 'verses';
        }

        const percent = Math.min(Math.round((progress / goal) * 100), 100);
        const circumference = 2 * Math.PI * 10;
        const offset = circumference - (percent / 100) * circumference;

        container.innerHTML = `
            <div class="streak-mini-badge ${isNew ? 'pulse-primary' : ''}" id="streakBadgeTrigger">
                <span class="streak-icon-fire">${isNew ? '✨' : (percent >= 100 ? '✅' : '🔥')}</span>
                <span class="streak-count-text">${isNew ? 'Start' : currentStreak}</span>
                <div class="streak-progress-mini">
                    <svg width="24" height="24">
                        <circle class="streak-bg-circle" cx="12" cy="12" r="10"></circle>
                        <circle class="streak-fg-circle" cx="12" cy="12" r="10" 
                                style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${isNew ? circumference : offset};"></circle>
                    </svg>
                </div>
            </div>
            <div class="streak-menu-modal ${this.isMenuOpen ? 'active' : ''}" id="streakMenu">
                <div class="streak-menu-header">
                    <h4>${isNew ? 'Start Your Journey' : 'Quran Streak'}</h4>
                    <p class="progress-target-hint">${isNew ? 'Choose a goal below to begin tracking' : (percent >= 100 ? 'Daily Goal Achieved! 🌟' : `Daily Goal: ${goal} ${unit}`)}</p>
                </div>

                <div class="streak-progress-section" style="${isNew ? 'display:none' : ''}">
                    <span class="progress-text">${percent}% Complete</span>
                    <div class="progress-bar-container">
                        <div class="progress-fill" style="width: ${percent}%"></div>
                    </div>
                    <p class="progress-target-hint" style="margin-top: 6px; font-size: 0.75rem;">${progress} / ${goal} ${unit} achieved today</p>
                </div>

                <div class="streak-stats-row">
                    <div class="stat-item">
                        <span class="stat-val">${currentStreak}</span>
                        <span class="stat-lbl">Current</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-val">${streakData?.longest_streak || 0}</span>
                        <span class="stat-lbl">Longest</span>
                    </div>
                </div>

                <div class="streak-goal-section">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h5 style="margin:0;">${isNew ? 'Choose a Target' : 'Current Target'}</h5>
                        ${!isNew ? `<button id="changeTargetBtn" class="change-goal-btn" style="background: var(--primary-color); border: none; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; cursor: pointer;">${this.isChangingGoal ? 'Cancel' : 'Change'}</button>` : ''}
                    </div>
                    
                    <div class="goal-options ${!isNew && !this.isChangingGoal ? 'only-selected' : ''}">
                        <div class="goal-option ${goalType === 'time' && goalValue === 10 ? 'selected' : ''}" data-type="time" data-val="10">
                            <div class="goal-info">
                                <span>Light</span>
                                <small>10 mins daily</small>
                            </div>
                            <div class="goal-check"></div>
                        </div>
                        <div class="goal-option ${goalType === 'time' && goalValue === 30 ? 'selected' : ''}" data-type="time" data-val="30">
                            <div class="goal-info">
                                <span>Steady</span>
                                <small>30 mins daily</small>
                            </div>
                            <div class="goal-check"></div>
                        </div>
                        <div class="goal-option ${goalType === 'quran_30_days' ? 'selected' : ''}" data-type="quran_30_days" data-val="208">
                            <div class="goal-info">
                                <span>Khatam Challenge</span>
                                <small>Finish Quran in 30 days (208 verses/day)</small>
                            </div>
                            <div class="goal-check"></div>
                        </div>
                        <div class="goal-option ${goalType === 'custom' ? 'selected show-custom' : ''}" data-type="custom" data-val="${goalType === 'custom' ? goalValue : 50}">
                            <div class="goal-info">
                                <span>Custom Goal</span>
                                <small>Track daily verses</small>
                                <div class="custom-goal-input">
                                    <input type="number" id="customGoalVal" value="${goalType === 'custom' ? goalValue : 50}" min="1" placeholder="Verses count...">
                                </div>
                            </div>
                            <div class="goal-check"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupListeners();
    },

    setupListeners() {
        const trigger = document.getElementById('streakBadgeTrigger');
        const menu = document.getElementById('streakMenu');
        if (!trigger || !menu) return;

        trigger.onclick = (e) => {
            e.stopPropagation();
            this.isMenuOpen = !this.isMenuOpen;
            this.updateFloatingUI();
        };

        const changeBtn = document.getElementById('changeTargetBtn');
        if (changeBtn) {
            changeBtn.onclick = (e) => {
                e.stopPropagation();
                this.isChangingGoal = !this.isChangingGoal;
                this.updateFloatingUI();
            };
        }

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isMenuOpen && !menu.contains(e.target) && !trigger.contains(e.target)) {
                this.isMenuOpen = false;
                this.isChangingGoal = false;
                this.updateFloatingUI();
            }
        });

        // Goal Selection
        menu.querySelectorAll('.goal-option').forEach(opt => {
            opt.onclick = async (e) => {
                if (e.target.tagName === 'INPUT') return;
                
                const type = opt.dataset.type;
                let val = parseInt(opt.dataset.val);
                
                if (type === 'custom') {
                    const input = opt.querySelector('input');
                    val = parseInt(input.value) || 50;
                }
                
                try {
                    opt.style.opacity = '0.5';
                    await api.updateStreakGoal(type, val);
                    this.isChangingGoal = false;
                    await this.updateFloatingUI();
                } catch (err) {
                    console.error('Goal update failed', err);
                }
            };
        });

        const customInput = document.getElementById('customGoalVal');
        if (customInput) {
            customInput.onchange = async () => {
                const val = parseInt(customInput.value) || 50;
                await api.updateStreakGoal('custom', val);
                await this.updateFloatingUI();
            };
        }
    }
};
