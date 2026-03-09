import searchView from './views/searchView.js';
import readView from './views/readView.js';
import surahView from './views/surahView.js';
import holyBookView from './views/holyBookView.js';
import contactView from './views/contactView.js';
import kidsView from './views/kidsView.js';
import authView from './views/authView.js';
import bookmarksView from './views/bookmarksView.js';
import ramadanView from './views/ramadanView.js';

const routes = {
    '': searchView,
    '#search': searchView,
    '#read': readView,
    '#holybook': holyBookView,
    '#surahs': surahView,
    '#contact': contactView,
    '#kids': kidsView,
    '#auth': authView,
    '#bookmarks': bookmarksView,
    '#ramadan': ramadanView
};

export default class Router {
    constructor() {
        this.contentContainer = document.getElementById('app-content');
        this.navLinks = document.querySelectorAll('.nav-item');
    }

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute(); // Load initial route
    }

    async handleRoute() {
        const hash = window.location.hash || '#search';

        // ── Global UI State Handling ──────────────────────────────────
        
        // 1. Background Image Logic: Only for Search (Home)
        if (hash === '' || hash === '#search') {
            this.contentContainer.classList.add('home-bg');
        } else {
            this.contentContainer.classList.remove('home-bg');
        }

        // 2. Global Player Bar visibility (Read Section Only)
        // Hidden by default in index.html, only show in #read or dynamic #surah/
        const playerBar = document.getElementById('playerBar');
        if (playerBar) {
            const isReadSection = hash === '#read' || hash.startsWith('#surah/');
            if (!isReadSection) {
                playerBar.classList.add('hidden');
            }
        }
        // ──────────────────────────────────────────────────────────────

        // Handle dynamic routes (e.g., #surah/1)
        if (hash.startsWith('#surah/')) {
            const surahId = hash.split('/')[1];
            // Reuse readView logic for displaying the surah
            await readView.render(this.contentContainer, surahId);
            this.updateActiveNav('#surahs');
            return;
        }

        const view = routes[hash];

        if (view) {
            this.contentContainer.innerHTML = ''; // Clear current content
            await view.render(this.contentContainer);
            this.updateActiveNav(hash);
        } else {
            this.contentContainer.innerHTML = '<h2>404 - Page Not Found</h2>';
        }
    }

    updateActiveNav(hash) {
        this.navLinks.forEach(link => {
            if (link.getAttribute('href') === hash) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
}
