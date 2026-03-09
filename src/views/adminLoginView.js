export default {
    async render(container) {
        container.innerHTML = `
            <div class="admin-login-container fade-in">
                <div class="admin-login-card">
                    <div class="admin-header">
                        <h2 class="admin-title">Admin Login</h2>
                        <p class="admin-subtitle">Access the admin dashboard</p>
                    </div>

                    <form id="adminLoginForm" class="admin-login-form">
                        <div class="form-group">
                            <label for="adminUsername">Username</label>
                            <input 
                                type="text" 
                                id="adminUsername" 
                                name="adminUsername" 
                                placeholder="Enter username" 
                                required
                                autocomplete="username"
                            >
                        </div>

                        <div class="form-group">
                            <label for="adminPassword">Password</label>
                            <input 
                                type="password" 
                                id="adminPassword" 
                                name="adminPassword" 
                                placeholder="Enter password" 
                                required
                                autocomplete="current-password"
                            >
                        </div>

                        <button type="submit" class="btn-primary admin-login-btn">
                            Login
                        </button>
                    </form>

                    <div id="loginMessage" class="form-message"></div>

                    <div class="back-to-home">
                        <a href="#search" data-link>← Back to Home</a>
                    </div>
                </div>
            </div>

            <style>
                .admin-login-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem;
                    background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
                }

                .admin-login-card {
                    background: var(--card-bg);
                    border: 1px solid var(--glass-border);
                    border-radius: 16px;
                    padding: 3rem;
                    max-width: 450px;
                    width: 100%;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    backdrop-filter: blur(10px);
                }

                .admin-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }

                .admin-title {
                    font-size: 2rem;
                    color: var(--text-primary);
                    margin-bottom: 0.5rem;
                    font-weight: 700;
                }

                .admin-subtitle {
                    color: var(--text-muted);
                    font-size: 0.95rem;
                }

                .admin-login-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .admin-login-form .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .admin-login-form label {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--text-primary);
                }

                .admin-login-form input {
                    padding: 0.875rem 1rem;
                    border: 1px solid var(--glass-border);
                    border-radius: 8px;
                    background: var(--input-bg);
                    color: var(--text-primary);
                    font-size: 1rem;
                    transition: all 0.3s ease;
                }

                .admin-login-form input:focus {
                    outline: none;
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
                }

                .admin-login-btn {
                    margin-top: 1rem;
                    padding: 1rem;
                    font-size: 1rem;
                    font-weight: 600;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .admin-login-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
                }

                .back-to-home {
                    text-align: center;
                    margin-top: 2rem;
                    padding-top: 1.5rem;
                    border-top: 1px solid var(--glass-border);
                }

                .back-to-home a {
                    color: var(--primary-color);
                    text-decoration: none;
                    font-weight: 500;
                    transition: color 0.3s ease;
                }

                .back-to-home a:hover {
                    color: var(--secondary-color);
                }

                @media (max-width: 768px) {
                    .admin-login-card {
                        padding: 2rem;
                    }

                    .admin-title {
                        font-size: 1.75rem;
                    }
                }
            </style>
        `;

        this.setupLoginHandler();
    },

    setupLoginHandler() {
        const form = document.getElementById('adminLoginForm');
        const messageDiv = document.getElementById('loginMessage');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('adminUsername').value;
            const password = document.getElementById('adminPassword').value;

            // Show loading state
            messageDiv.innerHTML = `
                <div class="loading-message">
                    <p>🔐 Authenticating...</p>
                </div>
            `;
            messageDiv.style.display = 'block';

            try {
                const response = await fetch('http://localhost:3000/api/admin/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });

                const result = await response.json();

                if (result.success) {
                    // Store token in sessionStorage
                    sessionStorage.setItem('adminToken', result.token);

                    // Show success message
                    messageDiv.innerHTML = `
                        <div class="success-message">
                            <p>✅ Login successful! Redirecting...</p>
                        </div>
                    `;

                    // Redirect to admin dashboard
                    setTimeout(() => {
                        window.location.hash = '#admin-dashboard';
                    }, 1000);

                } else {
                    messageDiv.innerHTML = `
                        <div class="error-message">
                            <p>❌ ${result.message}</p>
                        </div>
                    `;
                }

            } catch (error) {
                console.error('Login error:', error);
                messageDiv.innerHTML = `
                    <div class="error-message">
                        <p>❌ Login failed. Please make sure the server is running.</p>
                    </div>
                `;
            }
        });
    }
};
