import { api } from '../api.js';

export default {
    async render(container) {
        container.innerHTML = `
            <div class="surah-container fade-in">
                <h2 class="arabic-title" style="text-align: center; margin-bottom: 2rem;">Surah Index</h2>
                <div id="surahGrid" class="surah-grid">
                    <div class="loader">Loading Surahs...</div>
                </div>
            </div>
        `;

        const data = await api.getSurahs();
        const grid = document.getElementById('surahGrid');

        if (!data || !data.data) {
            grid.innerHTML = '<p class="error">Failed to load index.</p>';
            return;
        }

        grid.innerHTML = '';
        data.data.forEach(surah => {
            const card = document.createElement('a');
            card.href = `#surah/${surah.number}`;
            card.className = 'surah-card glass-card';
            card.innerHTML = `
                <span class="surah-number">${surah.number}</span>
                <div class="surah-info">
                    <span class="surah-name-en">${surah.englishName}</span>
                    <span class="surah-meaning">${surah.englishNameTranslation}</span>
                </div>
                <span class="surah-name-ar">${surah.name}</span>
            `;
            grid.appendChild(card);
        });
    },

    // renderDetail is now handled by readView, but kept empty/deprecated if router changes
    async renderDetail(container, id) {
        // redirect to read
    }
};
