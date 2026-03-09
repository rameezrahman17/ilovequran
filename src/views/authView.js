import { api } from '../api.js';

export default {
    isLogin: true,

    async render(container) {
        // Check for password recovery link
        // Supabase puts tokens in the hash like #access_token=...&type=recovery
        const hash = window.location.hash;
        const hashParams = new URLSearchParams(hash.substring(1));
        const isRecovery = hashParams.get('type') === 'recovery' || hash.includes('type=recovery');

        if (isRecovery) {
            this.renderUpdatePasswordForm(container);
            return;
        }

        const user = await api.getUser();
        
        if (user) {
            await this.renderProfile(container, user);
        } else {
            this.renderAuthForm(container);
        }
    },

    renderAuthForm(container) {
        container.innerHTML = `
            <div class="auth-container fade-in">
                <div class="auth-card glass-card premium-auth">
                    <div class="auth-header">
                        <div class="auth-icon-wrapper">
                            <svg class="auth-header-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                            </svg>
                        </div>
                        <h2 id="authTitle">${this.isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                        <p id="authSubtitle">${this.isLogin ? 'Sign in to access your bookmarks' : 'Sign up to save your personal settings'}</p>
                    </div>
                    
                    <form id="authForm">
                        ${!this.isLogin ? `
                        <div class="form-group">
                            <label>Full Name</label>
                            <div class="input-with-icon">
                                <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                </svg>
                                <input type="text" id="fullName" required placeholder="Your full name">
                            </div>
                        </div>
                        ` : ''}
                        <div class="form-group">
                            <label>Email Address</label>
                            <div class="input-with-icon">
                                <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                                </svg>
                                <input type="email" id="email" required placeholder="your@email.com">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Password</label>
                            <div class="input-with-icon password-input-container">
                                <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM9 8V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9z"/>
                                </svg>
                                <input type="password" id="password" required placeholder="••••••••">
                                <button type="button" id="togglePassword" class="password-toggle" title="Toggle Password">
                                    <svg class="eye-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                    </svg>
                                </button>
                            </div>

                        </div>
                        <button type="submit" class="btn-primary auth-submit-btn" id="authSubmitBtn">
                            ${this.isLogin ? 'Sign In <span class="arrow">→</span>' : 'Sign Up <span class="arrow">→</span>'}
                        </button>
                    </form>
                    
                    <div class="auth-toggle">
                        <p id="toggleText">
                            ${this.isLogin 
                                ? 'Don\'t have an account? <span class="toggle-link" id="toggleAuth">Sign Up</span>' 
                                : 'Already have an account? <span class="toggle-link" id="toggleAuth">Sign In</span>'}
                        </p>
                    </div>

                    <div class="auth-divider">
                        <span>or continue with</span>
                    </div>

                    <button id="googleSignInBtn" class="google-btn" type="button">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Continue with Google
                    </button>

                    <div id="authMessage" class="auth-message"></div>
                </div>
                
                <div id="react-footer-anchor"></div>
            </div>
        `;

        this.setupAuthListeners(container);
    },

    renderForgotPasswordForm(container) {
        container.innerHTML = `
            <div class="auth-container fade-in">
                <div class="auth-card glass-card premium-auth">
                    <div class="auth-header">
                        <h2 id="authTitle">Reset Password</h2>
                        <p id="authSubtitle">Enter your email to receive a reset link</p>
                    </div>
                    
                    <form id="forgotPasswordForm">
                        <div class="form-group">
                            <label>Email Address</label>
                            <div class="input-with-icon">
                                <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                                </svg>
                                <input type="email" id="resetEmail" required placeholder="your@email.com">
                            </div>
                        </div>
                        <button type="submit" class="btn-primary auth-submit-btn">
                            Send Reset Link <span class="arrow">→</span>
                        </button>
                    </form>
                    
                    <div class="auth-toggle">
                        <p><span class="toggle-link" id="backToLogin">Back to Sign In</span></p>
                    </div>

                    <div id="authMessage" class="auth-message"></div>
                </div>
                <div id="react-footer-anchor"></div>
            </div>
        `;
        this.setupAuthListeners(container);
    },

    renderUpdatePasswordForm(container) {
        container.innerHTML = `
            <div class="auth-container fade-in">
                <div class="auth-card glass-card premium-auth">
                    <div class="auth-header">
                        <h2 id="authTitle">New Password</h2>
                        <p id="authSubtitle">Set a fresh password for your account</p>
                    </div>
                    
                    <form id="updatePasswordForm">
                        <div class="form-group">
                            <label>New Password</label>
                            <div class="input-with-icon">
                                <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM9 8V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9z"/>
                                </svg>
                                <input type="password" id="newPassword" required placeholder="••••••••">
                            </div>
                        </div>
                        <button type="submit" class="btn-primary auth-submit-btn">
                            Update Password <span class="arrow">→</span>
                        </button>
                    </form>

                    <div id="authMessage" class="auth-message"></div>
                </div>
                <div id="react-footer-anchor"></div>
            </div>
        `;
        this.setupAuthListeners(container);
    },

    async renderProfile(container, user) {
        // Initial skeleton render
        container.innerHTML = `
            <div class="profile-page fade-in">
                <!-- Profile Hero Card -->
                <div class="profile-hero glass-card">
                    <div class="profile-avatar">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                    </div>
                    <div class="profile-info">
                        <div class="profile-name-row">
                            <h2 id="profileDisplayName">${user.user_metadata?.display_name || user.email.split('@')[0]}</h2>
                            <button id="editNameBtn" class="edit-profile-btn" title="Edit Name">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                            </button>
                        </div>
                        <div id="editNameForm" class="edit-name-form" style="display: none;">
                            <input type="text" id="newNameInput" value="${user.user_metadata?.display_name || user.email.split('@')[0]}" placeholder="Enter your name">
                            <div class="edit-name-actions">
                                <button id="saveNameBtn" class="save-btn">Save</button>
                                <button id="cancelNameBtn" class="cancel-btn">Cancel</button>
                            </div>
                        </div>
                        <p class="profile-email">${user.email}</p>
                        <span class="profile-badge">Verified Reader</span>
                    </div>
                    <button id="logoutBtn" class="signout-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                        </svg>
                        Sign Out
                    </button>
                </div>

                <!-- Streak Section -->
                <div class="profile-streak-section glass-card fade-in" style="margin-bottom: 2rem;">
                    <div class="section-title-row">
                        <div class="section-title-icon" style="background: linear-gradient(135deg, #FF6B00, #FF8A00);">
                            <span>🔥</span>
                        </div>
                        <h3>Quran Streak</h3>
                        <span class="streak-count-badge" id="profileStreakCount">...</span>
                    </div>
                    
                    <div id="profileStreakContent" class="streak-profile-content">
                        <div class="loader">Loading your progress...</div>
                    </div>
                </div>

                <!-- Settings Section -->
                <div class="profile-settings-section glass-card fade-in" style="margin-bottom: 2rem;">
                    <div class="section-title-row">
                        <div class="section-title-icon" style="background: linear-gradient(135deg, #2ecc71, #27ae60);">
                            <span>⚙️</span>
                        </div>
                        <h3>Preferences</h3>
                    </div>
                    
                    <div class="settings-grid" style="display: grid; gap: 1rem; margin-top: 1rem;">
                        <div class="setting-item" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 12px;">
                            <div>
                                <h4 style="margin: 0;">Audio Reciter</h4>
                                <small style="opacity: 0.7;">Select your preferred voice</small>
                            </div>
                            <select id="profileReciterSelect" class="reciter-select" style="min-width: 150px;">
                                <!-- Populated dynamically -->
                            </select>
                        </div>

                        <div class="setting-item" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 12px;">
                            <div>
                                <h4 style="margin: 0;">App Theme</h4>
                                <small style="opacity: 0.7;">Choose background color</small>
                            </div>
                            <select id="profileThemeSelect" class="reciter-select" style="min-width: 150px;">
                                <option value="sepia">Sepia (Classic)</option>
                                <option value="botanic">Botanic (Green)</option>
                                <option value="white">White</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Bookmarks Section -->
                <div class="profile-bookmarks-section">
                    <div class="section-title-row">
                        <div class="section-title-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                            </svg>
                        </div>
                        <h3>My Bookmarks</h3>
                        <span class="bookmark-count-badge" id="bmCount">...</span>
                    </div>
                    <div id="profileBookmarksList" class="profile-bookmarks-grid">
                        <div class="loader">Loading bookmarks...</div>
                    </div>
                </div>
                
                <div id="react-footer-anchor"></div>
            </div>
        `;

        // Attach logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await api.signOut();
                window.location.hash = '#search';
            });
        }

        // Attach edit name listeners
        const editBtn = document.getElementById('editNameBtn');
        const saveBtn = document.getElementById('saveNameBtn');
        const cancelBtn = document.getElementById('cancelNameBtn');
        const nameRow = document.querySelector('.profile-name-row');
        const editForm = document.getElementById('editNameForm');
        const nameInput = document.getElementById('newNameInput');
        const displayName = document.getElementById('profileDisplayName');

        if (editBtn) {
            editBtn.addEventListener('click', () => {
                nameRow.style.display = 'none';
                editForm.style.display = 'flex';
                nameInput.focus();
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                nameRow.style.display = 'flex';
                editForm.style.display = 'none';
                nameInput.value = displayName.textContent;
            });
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                const newName = nameInput.value.trim();
                if (!newName) return;

                saveBtn.disabled = true;
                saveBtn.textContent = 'Saving...';

                try {
                    await api.updateUserProfile(newName);
                    displayName.textContent = newName;
                    nameRow.style.display = 'flex';
                    editForm.style.display = 'none';
                    
                    // Success flash
                    displayName.style.color = 'var(--primary-color)';
                    setTimeout(() => displayName.style.color = '', 1000);
                } catch (err) {
                    alert('Failed to update name: ' + err.message);
                } finally {
                    saveBtn.disabled = false;
                    saveBtn.textContent = 'Save';
                }
            });
        }

        // Apply settings logic inside profile
        const reciterSelect = document.getElementById('profileReciterSelect');
        if (reciterSelect) {
            api.reciters.forEach(reciter => {
                const option = document.createElement('option');
                option.value = reciter.id;
                option.textContent = reciter.name;
                reciterSelect.appendChild(option);
            });
            reciterSelect.value = api.currentReciterId;
            reciterSelect.addEventListener('change', (e) => {
                api.setReciter(e.target.value);
            });
        }

        const themeSelect = document.getElementById('profileThemeSelect');
        if (themeSelect) {
            let savedTheme = localStorage.getItem('appTheme') || 'sepia';
            themeSelect.value = savedTheme;
            themeSelect.addEventListener('change', (e) => {
                const newTheme = e.target.value;
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('appTheme', newTheme);
            });
        }

        // Load data
        this.loadProfileStreak();
        await this.loadProfileBookmarks();
    },

    async loadProfileStreak() {
        const contentEl = document.getElementById('profileStreakContent');
        const countBadge = document.getElementById('profileStreakCount');
        if (!contentEl) return;

        const streak = await api.getStreak();
        if (!streak) {
            contentEl.innerHTML = `<p class="error">Start reading to begin your streak!</p>`;
            return;
        }

        const currentStreak = streak.current_streak || 0;
        const goalType = streak.goal_type || 'time';
        const goalValue = streak.goal_value || 10;
        
        let progress = 0;
        let goal = goalValue;
        let unit = 'mins';

        if (goalType === 'time') {
            progress = streak.daily_progress_minutes || 0;
            unit = 'mins';
        } else {
            progress = streak.daily_progress_verses || 0;
            unit = 'verses';
        }

        const percent = Math.min(Math.round((progress / goal) * 100), 100);
        const isAchieved = percent >= 100;

        if (countBadge) countBadge.textContent = `${currentStreak} Days`;

        contentEl.innerHTML = `
            <div class="streak-progress-section" style="background: transparent; padding: 0;">
                <div class="progress-info-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="progress-text" style="font-weight: 600; font-size: 1.1rem;">${percent}% Complete</span>
                        ${isAchieved ? '<span class="achievement-badge" style="background: #32CD32; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem; font-weight: bold;">TARGET ACHIEVED</span>' : ''}
                    </div>
                    <span class="progress-target-hint" style="opacity: 0.8;">${progress} / ${goal} ${unit}</span>
                </div>
                <div class="progress-bar-container" style="height: 14px; margin-bottom: 1.5rem; background: rgba(0,0,0,0.1);">
                    <div class="progress-fill" style="width: ${percent}%; background: ${isAchieved ? 'linear-gradient(90deg, #32CD32, #2ecc71)' : 'var(--primary-color)'}; box-shadow: ${isAchieved ? '0 0 15px rgba(50, 205, 50, 0.4)' : 'none'};"></div>
                </div>
            </div>

            <div class="streak-stats-row" style="margin-bottom: 1.5rem; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                <div class="stat-item" style="text-align: center; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 1rem;">
                    <span class="stat-val" style="display: block; font-size: 1.5rem; font-weight: 700;">${streak.current_streak || 0}</span>
                    <span class="stat-lbl" style="font-size: 0.7rem; opacity: 0.7; text-transform: uppercase;">Current Streak</span>
                </div>
                <div class="stat-item" style="text-align: center; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 1rem;">
                    <span class="stat-val" style="display: block; font-size: 1.5rem; font-weight: 700;">${streak.longest_streak || 0}</span>
                    <span class="stat-lbl" style="font-size: 0.7rem; opacity: 0.7; text-transform: uppercase;">Longest Streak</span>
                </div>
                <div class="stat-item" style="text-align: center; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 1rem;">
                    <span class="stat-val" style="display: block; font-size: 1.5rem; font-weight: 700;">${streak.total_verses_read || 0}</span>
                    <span class="stat-lbl" style="font-size: 0.7rem; opacity: 0.7; text-transform: uppercase;">Verses Read</span>
                </div>
            </div>

            <div class="streak-goal-section">
                <h5 style="margin-bottom: 1rem; opacity: 0.9;">Manage Goal</h5>
                <div class="goal-options" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem;">
                    <div class="goal-option ${goalType === 'time' && goalValue === 10 ? 'selected' : ''}" data-type="time" data-val="10">
                        <div class="goal-info">
                            <span>Light (10m)</span>
                            <small>Daily habit</small>
                        </div>
                        <div class="goal-check"></div>
                    </div>
                    <div class="goal-option ${goalType === 'time' && goalValue === 30 ? 'selected' : ''}" data-type="time" data-val="30">
                        <div class="goal-info">
                            <span>Steady (30m)</span>
                            <small>Moderate reading</small>
                        </div>
                        <div class="goal-check"></div>
                    </div>
                    <div class="goal-option ${goalType === 'quran_30_days' ? 'selected' : ''}" data-type="quran_30_days" data-val="208">
                        <div class="goal-info">
                            <span>Khatam (30 Days)</span>
                            <small>208 verses daily</small>
                        </div>
                        <div class="goal-check"></div>
                    </div>
                    <div class="goal-option ${goalType === 'custom' ? 'selected' : ''}" data-type="custom" data-val="50">
                        <div class="goal-info">
                            <span>Custom Target</span>
                            <small>Set your own verses</small>
                        </div>
                        <div class="goal-check"></div>
                    </div>
                </div>
            </div>
        `;

        // Attach goal selection listeners
        contentEl.querySelectorAll('.goal-option').forEach(opt => {
            opt.onclick = async () => {
                const val = parseInt(opt.dataset.val);
                const type = opt.dataset.type || 'time';
                await api.updateStreakGoal(type, val);
                this.loadProfileStreak();
            };
        });
    },

    async loadProfileBookmarks() {
        const listEl = document.getElementById('profileBookmarksList');
        const countEl = document.getElementById('bmCount');
        if (!listEl) return;

        const bookmarks = await api.getBookmarks();

        if (countEl) countEl.textContent = bookmarks.length;

        if (!bookmarks || bookmarks.length === 0) {
            listEl.innerHTML = `
                <div class="bm-empty">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                    </svg>
                    <p>No bookmarks yet.</p>
                    <a href="#read" class="bm-read-link">Start reading →</a>
                </div>
            `;
            return;
        }

        listEl.innerHTML = bookmarks.map(bm => `
            <div class="bm-card glass-card">
                <div class="bm-card-header">
                    <div class="bm-meta">
                        <span class="bm-surah-name">${bm.surah_name}</span>
                        <span class="bm-ayah-tag">Ayah ${bm.ayah_number}</span>
                    </div>
                </div>
                <div class="bm-arabic">${bm.ayah_text || ''}</div>
                <button class="bm-read-btn" data-surah="${bm.surah_number}">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1z"/>
                    </svg>
                    Read in Surah
                </button>
            </div>
        `).join('');

        // Attach listeners
        listEl.querySelectorAll('.bm-remove-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const surah = parseInt(btn.dataset.surah, 10);
                const ayah = parseInt(btn.dataset.ayah, 10);
                // Animate out
                const card = btn.closest('.bm-card');
                card.style.transform = 'scale(0.95)';
                card.style.opacity = '0.5';
                try {
                    await api.removeBookmark(surah, ayah);
                    card.style.transition = 'all 0.3s ease';
                    card.style.transform = 'scale(0)';
                    card.style.opacity = '0';
                    setTimeout(() => card.remove(), 300);
                    // Update count
                    const remaining = document.querySelectorAll('.bm-card').length - 1;
                    if (countEl) countEl.textContent = remaining;
                    if (remaining === 0) this.loadProfileBookmarks();
                } catch (err) {
                    card.style.transform = '';
                    card.style.opacity = '';
                    console.error('Remove failed:', err);
                }
            });
        });

        listEl.querySelectorAll('.bm-read-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                window.location.hash = `#surah/${btn.dataset.surah}`;
            });
        });
    },

    setupAuthListeners(container) {
        const form = document.getElementById('authForm');
        const forgotForm = document.getElementById('forgotPasswordForm');
        const updateForm = document.getElementById('updatePasswordForm');
        const toggleBtn = document.getElementById('toggleAuth');
        const forgotBtn = document.getElementById('forgotPassword');
        const backToLoginBtn = document.getElementById('backToLogin');
        const message = document.getElementById('authMessage');
        const passwordInput = document.getElementById('password') || document.getElementById('newPassword');
        const togglePasswordBtn = document.getElementById('togglePassword');
        const googleBtn = document.getElementById('googleSignInBtn');

        if (forgotBtn) {
            forgotBtn.addEventListener('click', () => {
                this.renderForgotPasswordForm(container);
            });
        }

        if (backToLoginBtn) {
            backToLoginBtn.addEventListener('click', () => {
                this.isLogin = true;
                this.renderAuthForm(container);
            });
        }

        if (forgotForm) {
            forgotForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('resetEmail').value.trim();
                const submitBtn = forgotForm.querySelector('button');
                
                if (!email) return;

                submitBtn.disabled = true;
                message.textContent = 'Initiating reset request...';
                message.className = 'auth-message info';
                message.style.display = 'block';

                console.log('Attempting password reset for:', email);

                try {
                    const { data, error } = await api.resetPassword(email);
                    
                    if (error) {
                        console.error('Supabase Reset Error:', error);
                        
                        let politeError = error.message;
                        if (error.status === 429) {
                            politeError = "Sending limit reached. Please wait a few minutes before trying again.";
                        } else if (error.message.includes('email_not_found')) {
                            politeError = "No account found with this email.";
                        } else if (error.message.toLowerCase().includes('error sending recovery email')) {
                            politeError = "Supabase Error: Failed to send the email. Please check your Supabase Dashboard > Authentication > Email settings to ensure the email service is working or set up Custom SMTP.";
                        }
                        
                        throw new Error(politeError);
                    }

                    console.log('Reset response data:', data);
                    message.textContent = 'Success! Check your inbox for the reset link.';
                    message.className = 'auth-message success';
                    
                    // Keep the button disabled to prevent rapid re-sending
                    setTimeout(() => {
                        message.innerHTML += '<br><small style="opacity: 0.7;">Didn\'t get it? Check your spam or wait 5 minutes.</small>';
                    }, 5000);

                } catch (err) {
                    message.textContent = err.message;
                    message.className = 'auth-message error';
                    submitBtn.disabled = false;
                }
            });
        }

        if (updateForm) {
            updateForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const newPassword = document.getElementById('newPassword').value;
                const submitBtn = updateForm.querySelector('button');
                submitBtn.disabled = true;
                message.textContent = 'Updating password...';
                message.className = 'auth-message info';
                message.style.display = 'block';

                try {
                    const { error } = await api.updatePassword(newPassword);
                    if (error) throw error;
                    message.textContent = 'Password updated! Redirecting to login...';
                    message.className = 'auth-message success';
                    setTimeout(() => {
                        window.location.hash = '#auth';
                        window.location.reload(); // Refresh to clear recovery state
                    }, 2000);
                } catch (err) {
                    message.textContent = err.message;
                    message.className = 'auth-message error';
                    submitBtn.disabled = false;
                }
            });
        }

        // Google OAuth logic
        if (googleBtn) {
            googleBtn.addEventListener('click', async () => {
                googleBtn.disabled = true;
                googleBtn.innerHTML = `
                    <svg class="spin" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="30 70"/>
                    </svg>
                    Connecting...
                `;
                try {
                    const { error } = await api.signInWithGoogle();
                    if (error) throw error;
                } catch (err) {
                    if (message) {
                        message.textContent = err.message || 'Google sign in failed';
                        message.className = 'auth-message error';
                        message.style.display = 'block';
                    }
                    googleBtn.disabled = false;
                    googleBtn.innerHTML = `
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Continue with Google
                    `;
                }
            });
        }

        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.isLogin = !this.isLogin;
                this.renderAuthForm(container);
            });
        }

        if (togglePasswordBtn && passwordInput) {
            togglePasswordBtn.addEventListener('click', () => {
                const isPassword = passwordInput.type === 'password';
                passwordInput.type = isPassword ? 'text' : 'password';
                togglePasswordBtn.textContent = isPassword ? '🙈' : '👁️';
            });
        }

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('email').value.trim().toLowerCase();
                const password = document.getElementById('password').value.trim();
                
                message.textContent = 'Processing...';
                message.className = 'auth-message info';
                message.style.display = 'block';

                try {
                    const fullName = !this.isLogin ? document.getElementById('fullName').value.trim() : null;
                    const { data, error } = this.isLogin 
                        ? await api.signIn(email, password)
                        : await api.signUp(email, password, fullName);

                    if (error) {
                        console.error('Auth Error Details:', error);
                        
                        // Special handling for unconfirmed email
                        if (error.message.toLowerCase().includes('email not confirmed')) {
                            throw new Error('Please confirm your email using the link we sent you. If you didn\'t get it, try resetting your password.');
                        } else if (error.message.toLowerCase().includes('invalid login credentials')) {
                            throw new Error('Invalid email or password. Please try again.');
                        }
                        
                        // If it's a generic failure, show exactly what Supabase says for better debugging
                        throw error;
                    }

                    // Security check: if sign up succeeded but identity array is empty, the email was already taken
                    if (!this.isLogin && data?.user?.identities && data.user.identities.length === 0) {
                        throw new Error('An account with this email already exists. Please sign in instead.');
                    }

                    message.textContent = this.isLogin ? 'Success! Redirecting...' : 'Sign up successful! You can now sign in.';
                    message.className = 'auth-message success';
                    
                    if (this.isLogin) {
                        setTimeout(() => {
                            window.location.hash = '#read';
                        }, 1500);
                    } else {
                        // Switch to login form after a delay
                        setTimeout(() => {
                            this.isLogin = true;
                            this.renderAuthForm(container);
                            
                            const postSignupMsg = document.getElementById('authMessage');
                            if (postSignupMsg) {
                                // If supabase requires confirmation, we ask them to check email.
                                // If confirmation is off, they can just sign in. We show a generic success.
                                postSignupMsg.textContent = 'Account created successfully! You can now sign in (check your email to confirm if required).';
                                postSignupMsg.className = 'auth-message success';
                                postSignupMsg.style.display = 'block';
                            }
                        }, 2000);
                    }
                } catch (err) {
                    let errorMessage = err.message;
                    if (errorMessage.toLowerCase().includes('failed to fetch')) {
                        errorMessage = "Connection Error: Please disable your ad-blocker or check your internet.";
                    } else if (errorMessage.toLowerCase().includes('confirmation email')) {
                        errorMessage = "Dashboard Config Error: Please go to Supabase > Auth > Settings and disable 'Confirm Email'.";
                    } else if (errorMessage.toLowerCase().includes('rate limit exceeded') || errorMessage.toLowerCase().includes('email rate')) {
                        errorMessage = "Action limited. Please wait a few minutes.";
                    }
                    message.textContent = errorMessage;
                    message.className = 'auth-message error';
                }
            });
        }
    }
};
