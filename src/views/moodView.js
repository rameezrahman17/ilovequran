import { api } from '../api.js';

export default {
    moods: [
        { id: 'sad', label: 'Sad', ref: { surah: 94, ayah: 6 } },
        { id: 'anxious', label: 'Anxious', ref: { surah: 13, ayah: 28 } },
        { id: 'happy', label: 'Grateful', ref: { surah: 14, ayah: 7 } },
        { id: 'lost', label: 'Lost', ref: { surah: 93, ayah: 7 } },
        { id: 'sinful', label: 'Regretful', ref: { surah: 39, ayah: 53 } },
        { id: 'angry', label: 'Angry', ref: { surah: 3, ayah: 134 } },
        { id: 'lonely', label: 'Lonely', ref: { surah: 50, ayah: 16 } },
        { id: 'confused', label: 'Confused', ref: { surah: 2, ayah: 286 } }
    ],

    async render(container) {
        container.innerHTML = `
            <div class="mood-container fade-in">
                <div class="mood-header">
                    <h2 class="arabic-title">How are you feeling today?</h2>
                    <p class="subtitle">Select your mood to receive a message from the Quran</p>
                </div>
                
                <div class="mood-grid">
                    ${this.moods.map(mood => `
                        <button class="mood-btn glass-card" data-mood="${mood.id}">
                            ${mood.label}
                        </button>
                    `).join('')}
                </div>

                <div id="moodResult" class="mood-result"></div>
            </div>
        `;

        this.setupEventListeners();
    },

    setupEventListeners() {
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Highlight active
                document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active-mood'));
                btn.classList.add('active-mood');

                const moodId = btn.dataset.mood;
                const mood = this.moods.find(m => m.id === moodId);
                this.loadVerse(mood.ref);
            });
        });
    },

    async loadVerse(ref) {
        const container = document.getElementById('moodResult');
        container.innerHTML = '<div class="loader">Seeking guidance...</div>';

        try {
            const data = await api.getVerseDetails(ref.surah, ref.ayah);
            if (!data || !data.data) {
                container.innerHTML = '<p class="error">Could not retrieve verse.</p>';
                return;
            }

            const [arabic, english, urdu] = data.data;

            container.innerHTML = `
                <div class="verse-card glass-card fade-in" style="margin-top: 2rem;">
                     <div class="verse-header">
                        <span class="surah-badge">${arabic.surah.englishName} (${arabic.surah.number}:${arabic.numberInSurah})</span>
                         <button class="btn-icon play-btn" data-audio="${api.getAyahAudioUrl(arabic.number)}">▶ Play</button>
                    </div>
                    <p class="verse-text-ar">${arabic.text}</p>
                    <p class="verse-text-ur">${urdu.text}</p>
                    <p class="verse-text-en">${english.text}</p>
                </div>
            `;

            container.querySelector('.play-btn').addEventListener('click', (e) => {
                import('../components/audioPlayer.js').then(({ player }) => {
                    player.playAudio(e.target.dataset.audio);
                });
            });

        } catch (error) {
            console.error(error);
            container.innerHTML = '<p class="error">Error loading verse.</p>';
        }
    }
};
