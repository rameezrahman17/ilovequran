export default {
    async render(container) {
        // Check if user is authenticated
        const token = sessionStorage.getItem('adminToken');
        if (!token) {
            window.location.hash = '#admin-login';
            return;
        }

        container.innerHTML = `
            <div class="admin-dashboard-container fade-in">
                <div class="admin-dashboard-header">
                    <div class="header-content">
                        <h2 class="dashboard-title">Admin Dashboard</h2>
                        <p class="dashboard-subtitle">Contact Form Submissions</p>
                    </div>
                    <button id="logoutBtn" class="btn-logout">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        Logout
                    </button>
                </div>

                <div class="main-section-divider"></div>

                <div class="dashboard-controls">
                    <div class="search-box">
                        <input 
                            type="text" 
                            id="searchInput" 
                            placeholder="Search by name, email, or message..."
                            class="search-input"
                        >
                    </div>
                    <div class="stats-box">
                        <span class="stat-label">Total Submissions:</span>
                        <span id="totalCount" class="stat-value">0</span>
                    </div>
                </div>

                <div id="loadingIndicator" class="loading-indicator">
                    <p>⏳ Loading submissions...</p>
                </div>

                <div id="submissionsContainer" class="submissions-container" style="display: none;">
                    <!-- Submissions will be loaded here -->
                </div>

                <div id="errorMessage" class="error-message" style="display: none;">
                    <!-- Error messages will appear here -->
                </div>
            </div>

            <style>
                .admin-dashboard-container {
                    padding: 2rem;
                    max-width: 1400px;
                    margin: 0 auto;
                }

                .admin-dashboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                    flex-wrap: wrap;
                    gap: 1rem;
                }

                .header-content h2 {
                    font-size: 2rem;
                    color: var(--text-primary);
                    margin-bottom: 0.25rem;
                }

                .dashboard-subtitle {
                    color: var(--text-muted);
                    font-size: 0.95rem;
                }

                .btn-logout {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    background: var(--card-bg);
                    border: 1px solid var(--glass-border);
                    border-radius: 8px;
                    color: var(--text-primary);
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .btn-logout:hover {
                    background: rgba(239, 68, 68, 0.1);
                    border-color: rgba(239, 68, 68, 0.3);
                    color: #ef4444;
                }

                .dashboard-controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 2rem;
                    flex-wrap: wrap;
                }

                .search-box {
                    flex: 1;
                    min-width: 250px;
                }

                .search-input {
                    width: 100%;
                    padding: 0.875rem 1rem;
                    border: 1px solid var(--glass-border);
                    border-radius: 8px;
                    background: var(--card-bg);
                    color: var(--text-primary);
                    font-size: 0.95rem;
                    transition: all 0.3s ease;
                }

                .search-input:focus {
                    outline: none;
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
                }

                .stats-box {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.875rem 1.5rem;
                    background: var(--card-bg);
                    border: 1px solid var(--glass-border);
                    border-radius: 8px;
                }

                .stat-label {
                    color: var(--text-muted);
                    font-size: 0.9rem;
                }

                .stat-value {
                    color: var(--primary-color);
                    font-size: 1.25rem;
                    font-weight: 700;
                }

                .loading-indicator {
                    text-align: center;
                    padding: 3rem;
                    color: var(--text-muted);
                    font-size: 1.1rem;
                }

                .submissions-container {
                    background: var(--card-bg);
                    border: 1px solid var(--glass-border);
                    border-radius: 12px;
                    overflow: hidden;
                }

                .submissions-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .submissions-table thead {
                    background: rgba(var(--primary-rgb), 0.1);
                }

                .submissions-table th {
                    padding: 1rem;
                    text-align: left;
                    font-weight: 600;
                    color: var(--text-primary);
                    font-size: 0.9rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    border-bottom: 2px solid var(--glass-border);
                }

                .submissions-table td {
                    padding: 1rem;
                    border-bottom: 1px solid var(--glass-border);
                    color: var(--text-primary);
                    font-size: 0.95rem;
                }

                .submissions-table tbody tr {
                    transition: background 0.2s ease;
                }

                .submissions-table tbody tr:hover {
                    background: rgba(var(--primary-rgb), 0.05);
                }

                .rating-stars {
                    color: #fbbf24;
                    font-size: 1rem;
                }

                .message-cell {
                    max-width: 300px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .message-cell:hover {
                    white-space: normal;
                    overflow: visible;
                }

                .date-cell {
                    color: var(--text-muted);
                    font-size: 0.85rem;
                }

                .no-submissions {
                    text-align: center;
                    padding: 3rem;
                    color: var(--text-muted);
                }

                @media (max-width: 768px) {
                    .admin-dashboard-container {
                        padding: 1rem;
                    }

                    .admin-dashboard-header {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .dashboard-controls {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .submissions-table {
                        font-size: 0.85rem;
                    }

                    .submissions-table th,
                    .submissions-table td {
                        padding: 0.75rem 0.5rem;
                    }

                    .message-cell {
                        max-width: 150px;
                    }
                }
            </style>
        `;

        this.setupDashboard();
    },

    async setupDashboard() {
        const token = sessionStorage.getItem('adminToken');
        const logoutBtn = document.getElementById('logoutBtn');
        const searchInput = document.getElementById('searchInput');
        const loadingIndicator = document.getElementById('loadingIndicator');
        const submissionsContainer = document.getElementById('submissionsContainer');
        const errorMessage = document.getElementById('errorMessage');
        const totalCount = document.getElementById('totalCount');

        let allSubmissions = [];

        // Logout handler
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('adminToken');
            window.location.hash = '#admin-login';
        });

        // Fetch submissions
        try {
            const response = await fetch('http://localhost:3000/api/admin/submissions', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (result.success) {
                allSubmissions = result.submissions;
                totalCount.textContent = allSubmissions.length;
                this.displaySubmissions(allSubmissions);
                loadingIndicator.style.display = 'none';
                submissionsContainer.style.display = 'block';
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            console.error('Error fetching submissions:', error);
            loadingIndicator.style.display = 'none';
            errorMessage.innerHTML = `
                <p>❌ Failed to load submissions. Please check your connection and try again.</p>
            `;
            errorMessage.style.display = 'block';
        }

        // Search functionality
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filtered = allSubmissions.filter(sub => 
                sub.name.toLowerCase().includes(searchTerm) ||
                sub.email.toLowerCase().includes(searchTerm) ||
                sub.message.toLowerCase().includes(searchTerm) ||
                (sub.contact && sub.contact.toLowerCase().includes(searchTerm))
            );
            this.displaySubmissions(filtered);
        });
    },

    displaySubmissions(submissions) {
        const container = document.getElementById('submissionsContainer');

        if (submissions.length === 0) {
            container.innerHTML = `
                <div class="no-submissions">
                    <p>📭 No submissions found</p>
                </div>
            `;
            return;
        }

        const tableHTML = `
            <table class="submissions-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Contact</th>
                        <th>Rating</th>
                        <th>Message</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${submissions.map(sub => `
                        <tr>
                            <td>${this.escapeHtml(sub.name)}</td>
                            <td>${this.escapeHtml(sub.email)}</td>
                            <td>${sub.contact ? this.escapeHtml(sub.contact) : '-'}</td>
                            <td>
                                ${sub.rating ? `<span class="rating-stars">${'★'.repeat(sub.rating)}${'☆'.repeat(5 - sub.rating)}</span>` : '-'}
                            </td>
                            <td class="message-cell" title="${this.escapeHtml(sub.message)}">
                                ${this.escapeHtml(sub.message)}
                            </td>
                            <td class="date-cell">
                                ${new Date(sub.created_at).toLocaleString()}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = tableHTML;
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};
