import { api } from '../api.js';

export default {
    currentSurah: 1,

    async render(container, startSurahId = 1) {
        this.currentSurah = parseInt(startSurahId) || 1;

        container.innerHTML = `
            <div class="holy-book-container fade-in">
                <div class="holy-book-header">
                    <h2 class="arabic-title">المصحف الشريف</h2>
                    <div class="book-controls">
                        <button id="prevSurahBook" class="btn-nav">← Prev</button>
                        <select id="surahSelectBook" class="surah-select">
                            <option>Loading Surahs...</option>
                        </select>
                        <button id="nextSurahBook" class="btn-nav">Next →</button>
                    </div>
                    </div>
                </div>

                <div class="main-section-divider"></div>

                <div id="bookContent" class="book-content">
                    <div class="loader">Loading Surah...</div>
                </div>
            </div>
        `;

        await this.loadSurahList();
        await this.loadSurah(this.currentSurah);
        this.setupEventListeners();
    },

    async loadSurahList() {
        const data = await api.getSurahs();
        if (data && data.data) {
            const select = document.getElementById('surahSelectBook');
            select.innerHTML = '';
            data.data.forEach(surah => {
                const option = document.createElement('option');
                option.value = surah.number;
                option.textContent = `${surah.number}. ${surah.englishName} (${surah.name})`;
                if (surah.number === this.currentSurah) option.selected = true;
                select.appendChild(option);
            });
        }
    },

    async loadSurah(number) {
        const container = document.getElementById('bookContent');
        container.innerHTML = '<div class="loader">Loading Surah...</div>';

        const select = document.getElementById('surahSelectBook');
        if (select) select.value = number;
        this.currentSurah = parseInt(number);

        try {
            const data = await api.getArabicSurah(number);
            if (!data || !data.data) {
                container.innerHTML = '<p class="error">Failed to load Surah.</p>';
                return;
            }

            const surahData = data.data;
            let html = `
                <div class="book-surah-header">
                    <h3 class="book-surah-name">${surahData.name}</h3>
                    <p class="book-surah-info">${surahData.englishName} - ${surahData.englishNameTranslation}</p>
                    <p class="book-surah-meta">${surahData.revelationType} • ${surahData.numberOfAyahs} Ayahs</p>
                </div>
                <div class="bismillah-container">
                    ${number !== 1 && number !== 9 ? '<p class="bismillah">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>' : ''}
                </div>
                <div class="book-ayahs">
            `;

            surahData.ayahs.forEach((ayah, index) => {
                // Skip Bismillah if it's the first ayah of Al-Fatiha
                if (number === 1 && index === 0) {
                    return; // Skip, already shown above
                }
                
                html += `
                    <span class="book-ayah">
                        ${ayah.text}
                        <span class="ayah-number-circle">﴿${ayah.numberInSurah}﴾</span>
                    </span>
                `;
            });

            html += `</div>`;
            container.innerHTML = html;

        } catch (err) {
            console.error(err);
            container.innerHTML = '<p class="error">Error loading Surah.</p>';
        }
    },

    setupEventListeners() {
        document.getElementById('surahSelectBook').addEventListener('change', (e) => {
            this.loadSurah(e.target.value);
        });

        document.getElementById('prevSurahBook').addEventListener('click', () => {
            if (this.currentSurah > 1) this.loadSurah(this.currentSurah - 1);
        });

        document.getElementById('nextSurahBook').addEventListener('click', () => {
            if (this.currentSurah < 114) this.loadSurah(this.currentSurah + 1);
        });
    }
};
