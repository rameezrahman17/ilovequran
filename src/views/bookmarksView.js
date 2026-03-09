import { api } from '../api.js';

export default {
    async render(container) {
        const user = await api.getUser();
        
        if (!user) {
            container.innerHTML = `
                <div class="bookmarks-page fade-in">
                    <div class="empty-state glass-card">
                        <div class="empty-icon-wrapper">
                            <span class="empty-emoji">🔖</span>
                        </div>
                        <h2>Bookmarks</h2>
                        <p>Sign in to save and sync your favorite Ayahs across all your devices.</p>
                        <a href="#auth" class="btn-primary auth-btn">
                            Sign In to Sync
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                        </a>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="bookmarks-page fade-in">
                <div class="bookmarks-header-row">
                    <div class="header-main">
                        <div class="bm-header-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                            </svg>
                        </div>
                        <div class="bm-header-content">
                            <h1>My Bookmarks</h1>
                            <p>Your personal collection of saved verses</p>
                        </div>
                    </div>
                    <div class="bm-stats">
                        <span id="bmCountFull" class="stats-badge">... Saved</span>
                    </div>
                </div>
                
                <div id="bookmarksList" class="profile-bookmarks-grid">
                    <div class="loader">Loading your collection...</div>
                </div>
                
                <div id="react-footer-anchor"></div>
            </div>
        `;

        await this.loadBookmarks();
    },

    async loadBookmarks() {
        const listEl = document.getElementById('bookmarksList');
        const countEl = document.getElementById('bmCountFull');
        if (!listEl) return;

        const bookmarks = await api.getBookmarks();
        if (countEl) countEl.textContent = `${bookmarks.length} Saved`;

        if (!bookmarks || bookmarks.length === 0) {
            listEl.innerHTML = `
                <div class="bm-empty-large glass-card">
                    <div class="empty-illustration">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                        </svg>
                    </div>
                    <h3>Your collection is empty</h3>
                    <p>When you find a verse that inspires you, click the bookmark icon to save it here.</p>
                    <a href="#read" class="btn-primary">
                        Start Reading
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                    </a>
                </div>
            `;
            listEl.style.display = 'block'; // Make empty state center
            return;
        }

        listEl.style.display = 'grid'; // Ensure grid for items
        listEl.innerHTML = bookmarks.map(bm => `
            <div class="bm-card glass-card fade-in">
                <div class="bm-card-header">
                    <div class="bm-meta">
                        <span class="bm-surah-name">${bm.surah_name || 'Surah'}</span>
                        <span class="bm-ayah-tag">Ayah ${bm.ayah_number}</span>
                    </div>
                    <button class="bm-remove-btn delete-action" title="Remove bookmark" data-surah="${bm.surah_number}" data-ayah="${bm.ayah_number}">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                    </button>
                </div>
                <div class="bm-arabic">${bm.ayah_text || ''}</div>
                <button class="bm-read-btn" onclick="window.location.hash='#surah/${bm.surah_number}'">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1z"/>
                    </svg>
                    <span>Read Verse</span>
                </button>
            </div>
        `).join('');

        this.setupListeners();
    },

    setupListeners() {
        document.querySelectorAll('.bm-remove-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const surah = btn.dataset.surah;
                const ayah = btn.dataset.ayah;
                const card = btn.closest('.bm-card');

                // Confirmation UI
                btn.classList.add('confirming');
                const originalContent = btn.innerHTML;
                btn.innerHTML = '<span style="font-size: 10px; font-weight: 800;">SURE?</span>';
                
                const timeout = setTimeout(() => {
                    btn.classList.remove('confirming');
                    btn.innerHTML = originalContent;
                }, 3000);

                btn.onclick = async (ev) => {
                    ev.stopPropagation();
                    clearTimeout(timeout);
                    card.style.opacity = '0.5';
                    card.style.transform = 'scale(0.95)';
                    
                    try {
                        await api.removeBookmark(surah, ayah);
                        card.style.transition = 'all 0.4s ease';
                        card.style.transform = 'scale(0.5)';
                        card.style.opacity = '0';
                        setTimeout(() => this.loadBookmarks(), 400);
                    } catch (err) {
                        card.style.opacity = '1';
                        card.style.transform = 'none';
                        alert('Could not remove bookmark. Try again.');
                    }
                };
            }, { once: true });
        });
    }
};
