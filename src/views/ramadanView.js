import { api } from '../api.js';

const STORAGE_KEY = 'ramadan_challenge';

// Juz-to-starting-Surah mapping (Juz number -> first Surah number)
const JUZ_START_SURAH = {
    1: 1, 2: 2, 3: 2, 4: 3, 5: 4, 6: 4, 7: 5, 8: 6, 9: 7, 10: 8,
    11: 9, 12: 11, 13: 12, 14: 15, 15: 17, 16: 18, 17: 21, 18: 23,
    19: 25, 20: 27, 21: 29, 22: 33, 23: 36, 24: 39, 25: 41, 26: 46,
    27: 51, 28: 58, 29: 67, 30: 78
};

function getChallengeData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
}

function saveChallengeData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function initChallenge() {
    const data = {
        started: true,
        startDate: new Date().toISOString(),
        chapters: {}
    };
    for (let i = 1; i <= 30; i++) {
        data.chapters[i] = { completed: false, completedAt: null };
    }
    saveChallengeData(data);
    return data;
}

function getCompletedCount(data) {
    if (!data || !data.chapters) return 0;
    return Object.values(data.chapters).filter(c => c.completed).length;
}

export default {
    async render(container) {
        let data = getChallengeData();
        if (!data) {
            data = initChallenge();
        }

        const completedCount = getCompletedCount(data);
        const percent = Math.round((completedCount / 30) * 100);

        container.innerHTML = `
            <div class="ramadan-view fade-in" style="max-width: 900px; margin: 0 auto; padding: 1rem;">
                
                <div style="text-align: center; margin-bottom: 2rem;">
                    <a href="#search" style="color: var(--text-muted); text-decoration: none; font-size: 0.9rem;">← Back to Search</a>
                </div>

                <div class="ramadan-hero glass-card" style="text-align: center; padding: 2rem; margin-bottom: 2rem; border-radius: 20px;">
                    <h2 style="font-size: 2rem; color: var(--primary-color); margin-bottom: 0.5rem;">🌙 Ramadan Challenge</h2>
                    <p style="color: var(--text-muted); font-size: 1.1rem; margin-bottom: 1.5rem;">Complete 1 Juz per day — finish the Quran in 30 days</p>
                    
                    <div style="max-width: 500px; margin: 0 auto;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.85rem; color: var(--text-muted);">
                            <span>${completedCount}/30 Juzs</span>
                            <span>${percent}%</span>
                        </div>
                        <div style="background: var(--glass-border); border-radius: 10px; height: 12px; overflow: hidden;">
                            <div style="background: linear-gradient(90deg, var(--primary-color), var(--primary-accent)); height: 100%; width: ${percent}%; border-radius: 10px; transition: width 0.5s ease;"></div>
                        </div>
                    </div>

                    ${completedCount === 30 ? `
                        <div style="margin-top: 1.5rem; padding: 1rem; background: rgba(46, 204, 113, 0.1); border: 1px solid #2ecc71; border-radius: 12px;">
                            <span style="font-size: 1.5rem;">🎉</span>
                            <p style="color: #2ecc71; font-weight: 700; font-size: 1.1rem; margin-top: 0.5rem;">Masha'Allah! Challenge Complete!</p>
                        </div>
                    ` : ''}
                </div>

                <!-- Completion banner (shown after marking a Juz done) -->
                <div id="completionBanner" style="display: none; text-align: center; padding: 1.5rem; margin-bottom: 2rem; border-radius: 16px; background: rgba(46, 204, 113, 0.1); border: 1px solid #2ecc71;">
                    <span style="font-size: 2rem;">✅</span>
                    <p style="color: #2ecc71; font-weight: 700; font-size: 1.2rem; margin-top: 0.5rem;">Done with today's target!</p>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">Keep it up! Come back tomorrow for the next Juz.</p>
                </div>

                <h3 style="text-align: center; color: var(--text-light); margin-bottom: 1.5rem; font-size: 1.2rem;">Select a Juz to read</h3>

                <div id="juzGrid" class="quran-grid" style="grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1rem;">
                </div>

                <div id="react-footer-anchor"></div>
            </div>
        `;

        this.renderJuzGrid(data);
    },

    renderJuzGrid(data) {
        const grid = document.getElementById('juzGrid');
        if (!grid) return;

        let html = '';
        for (let juz = 1; juz <= 30; juz++) {
            const chapterState = data.chapters[juz] || { completed: false };
            const isCompleted = chapterState.completed;

            const statusIcon = isCompleted ? '✅' : '📖';
            const statusLabel = isCompleted ? 'Completed' : 'Tap to Read';
            const cardClass = isCompleted ? 'juz-completed' : '';
            const disabledStyle = isCompleted ? 'pointer-events: none; opacity: 0.7;' : '';
            const startSurah = JUZ_START_SURAH[juz] || 1;

            html += `
                <div class="juz-card glass-card ${cardClass}" data-juz="${juz}" data-surah="${startSurah}" style="cursor: pointer; text-align: center; padding: 1.2rem; border-radius: 16px; transition: all 0.3s ease; ${disabledStyle}">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">${statusIcon}</div>
                    <div style="font-size: 1.2rem; font-weight: 700; color: var(--primary-color); margin-bottom: 0.3rem;">Juz ${juz}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">${statusLabel}</div>
                </div>
            `;
        }
        grid.innerHTML = html;

        // Click listeners — only for non-completed Juzs
        grid.querySelectorAll('.juz-card:not(.juz-completed)').forEach(card => {
            card.addEventListener('click', () => {
                const juz = parseInt(card.getAttribute('data-juz'));
                const surah = parseInt(card.getAttribute('data-surah'));
                this.startJuz(juz, surah, data);
            });
        });
    },

    startJuz(juz, surah, data) {
        // Store the active Juz in sessionStorage so readView can show a "Mark Complete" button
        sessionStorage.setItem('ramadan_active_juz', juz);
        // Navigate to the starting Surah of this Juz
        window.location.hash = `#surah/${surah}`;
    }
};
