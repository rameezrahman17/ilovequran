import { api } from '../api.js';
import { player } from '../components/audioPlayer.js';

export default {
    currentSurah: 1,
    ayahsData: [], // Store data for sequential playback

    async render(container, startSurahId = 1) {
        this.currentSurah = parseInt(startSurahId) || 1;

        container.innerHTML = `
            <div class="read-container fade-in">
                <div class="read-header">
                    <div class="header-left">
                        <h2 class="arabic-title">القرآن الكريم</h2>
                    </div>
                    <div class="header-right controls">
                        <button id="prevSurah" class="btn-nav">← Prev</button>
                        <select id="surahSelect" class="surah-select">
                            <option>Loading Surahs...</option>
                        </select>
                        <button id="nextSurah" class="btn-nav">Next →</button>
                    </div>
                    </div>
                </div>

                <div class="main-section-divider"></div>

                <div class="reading-button-row">
                    <button id="btnSurahInfo" class="btn-primary">Reading 📖</button>
                </div>
                <div id="quranContent" class="quran-content">
                    <div class="loader">Loading Surah...</div>
                </div>
            </div>
        `;

        await this.loadSurahList();
        await this.loadSurah(this.currentSurah);
        this.setupEventListeners();
        this.showRamadanBanner();
    },

    showRamadanBanner() {
        const activeJuz = sessionStorage.getItem('ramadan_active_juz');
        if (!activeJuz) return;

        const juzNum = parseInt(activeJuz);
        const readContainer = document.querySelector('.read-container');
        if (!readContainer) return;

        // Create and insert banner at the top
        const banner = document.createElement('div');
        banner.id = 'ramadanReadBanner';
        banner.className = 'glass-card';
        banner.style.cssText = 'text-align: center; padding: 1rem 1.5rem; margin-bottom: 1.5rem; border-radius: 16px; border: 1px solid var(--primary-accent); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;';
        banner.innerHTML = `
            <div style="text-align: left;">
                <div style="font-size: 1rem; color: var(--primary-color); font-weight: 700;">🌙 Ramadan Challenge — Juz ${juzNum}</div>
                <div style="font-size: 0.85rem; color: var(--text-muted);">Read through this Juz, then mark it complete when done.</div>
            </div>
            <button id="markJuzCompleteBtn" style="background: var(--primary-color); color: #fff; border: none; padding: 0.6rem 1.5rem; border-radius: 12px; font-weight: 600; cursor: pointer; font-size: 0.9rem; transition: all 0.3s ease; white-space: nowrap;">
                ✅ Mark Juz ${juzNum} Complete
            </button>
        `;
        readContainer.insertBefore(banner, readContainer.firstChild);

        // Click handler
        document.getElementById('markJuzCompleteBtn').addEventListener('click', () => {
            this.markJuzComplete(juzNum);
        });
    },

    markJuzComplete(juzNum) {
        // Read challenge data from localStorage
        const raw = localStorage.getItem('ramadan_challenge');
        let data = null;
        try { data = raw ? JSON.parse(raw) : null; } catch { data = null; }

        if (data && data.chapters && data.chapters[juzNum]) {
            data.chapters[juzNum].completed = true;
            data.chapters[juzNum].completedAt = new Date().toISOString();
            localStorage.setItem('ramadan_challenge', JSON.stringify(data));
        }

        // Clear active Juz session
        sessionStorage.removeItem('ramadan_active_juz');

        // Replace banner with success message
        const banner = document.getElementById('ramadanReadBanner');
        if (banner) {
            banner.style.borderColor = '#2ecc71';
            banner.style.background = 'rgba(46, 204, 113, 0.08)';
            banner.innerHTML = `
                <div style="text-align: center; width: 100%;">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">✅</div>
                    <div style="font-size: 1.2rem; font-weight: 700; color: #2ecc71;">Done with today's target!</div>
                    <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem;">Juz ${juzNum} marked as complete. Masha'Allah!</div>
                    <a href="#ramadan" style="color: var(--primary-color); font-weight: 600; text-decoration: none;">← Back to Ramadan Challenge</a>
                </div>
            `;
        }
    },

    async loadSurahList() {
        const data = await api.getSurahs();
        if (data && data.data) {
            const select = document.getElementById('surahSelect');
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
        // Stop any currently playing audio and reset index to prevent "carry-over" glitch
        player.stop();
        this.currentAyahIndex = 0;
        this.updateGlobalBarState(false);

        const container = document.getElementById('quranContent');
        container.innerHTML = '<div class="loader">Loading Surah...</div>';

        // Update selection without triggering event loop if called manually
        const select = document.getElementById('surahSelect');
        if (select) select.value = number;
        this.currentSurah = parseInt(number);

        try {
            const data = await api.getSurahEditions(number);
            if (!data || !data.data) {
                container.innerHTML = '<p class="error">Failed to load Surah.</p>';
                return;
            }

            const [arabic, english, urdu, audio] = data.data;
            this.ayahsData = []; // Reset Data
            let html = '';

            let lastJuz = null;
            let lastManzil = null;
            let lastPage = null;
            let lastRuku = null;
            let lastHizb = null;

            arabic.ayahs.forEach((ayah, index) => {
                // Use dynamic audio URL based on selected reciter
                // Note: ayah.number is global, ayah.numberInSurah is relative
                const audioUrl = api.getAyahAudioUrl(this.currentSurah, ayah.numberInSurah);
                const engText = english.ayahs[index].text;
                const urduText = urdu.ayahs[index].text;

                // --- Metadata Markers Logic (Subtle Inline) ---
                let metaTags = '';

                // Juz Marker
                if (ayah.juz !== lastJuz) {
                    // localized: Juz -> الجزء
                    metaTags += `<span class="meta-tag juz-tag">۞ الجزء ${ayah.juz}</span>`;
                    lastJuz = ayah.juz;
                }

                // Manzil Marker
                if (ayah.manzil !== lastManzil) {
                    // localized: Manzil -> منزل
                    metaTags += `<span class="meta-tag manzil-tag">منزل ${ayah.manzil}</span>`;
                    lastManzil = ayah.manzil;
                }

                // Ruku Marker
                if (ayah.ruku !== lastRuku) {
                    // localized: Ruku -> ركوع
                    metaTags += `<span class="meta-tag ruku-tag">ع ${ayah.ruku}</span>`;
                    lastRuku = ayah.ruku;
                }

                // Hizb Marker (Quarter)
                if (ayah.hizbQuarter !== lastHizb) {
                    // localized: Hizb -> الحزب
                    const hizbNum = Math.ceil(ayah.hizbQuarter / 4);
                    metaTags += `<span class="meta-tag hizb-tag">الحزب ${hizbNum}</span>`;
                    lastHizb = ayah.hizbQuarter;
                }

                // Sajda Warning
                let sajdaBadge = '';
                if (ayah.sajda) {
                    sajdaBadge = `<span class="sajda-badge" title="Sajda Required">۩</span>`;
                }

                // Store for sequential access
                this.ayahsData.push({
                    index: index,
                    audioUrl: audioUrl,
                    domId: `ayah-row-${index}`
                });

                html += `
                    <div id="ayah-row-${index}" class="ayah-row fade-in">
                        <div class="ayah-actions">
                            <span class="ayah-number">${ayah.numberInSurah}</span>
                            <button class="play-ayah" data-index="${index}">
                                ▶
                            </button>
                            <button class="btn-icon btn-book" data-index="${index}" title="Read Tafsir">
                                📖
                            </button>
                            <button class="btn-icon btn-bookmark" data-index="${index}" title="Bookmark">
                                🔖
                            </button>
                        </div>
                        <div class="ayah-text">
                            <div class="ayah-ar">
                                ${ayah.text} 
                                ${sajdaBadge}
                                ${metaTags}
                            </div>
                            <div class="ayah-ur">${urduText}</div>
                            <div class="ayah-en">${engText}</div>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;
            this.attachAudioListeners(container);
            
            // Check for target ayah (from keyword search)
            this.checkTargetAyah();

        } catch (err) {
            console.error(err);
            container.innerHTML = '<p class="error">Error loading Surah.</p>';
        }
    },

    setupEventListeners() {
        document.getElementById('surahSelect').addEventListener('change', (e) => {
            this.loadSurah(e.target.value);
        });

        document.getElementById('prevSurah').addEventListener('click', () => {
            if (this.currentSurah > 1) this.loadSurah(this.currentSurah - 1);
        });

        document.getElementById('nextSurah').addEventListener('click', () => {
            if (this.currentSurah < 114) this.loadSurah(this.currentSurah + 1);
        });

        // --- Global Player Bar Event Listeners ---
        const playerBarBtnPlay = document.getElementById('playerPlay');
        const playerBarBtnNext = document.getElementById('playerNext');
        const playerBarBtnPrev = document.getElementById('playerPrev');

        // Unbind previous to avoid duplicates if view re-renders (simple approach: clone or use once)
        // Ideally we should manage this better, but for single-view app logic:

        playerBarBtnPlay.onclick = () => {
            // Toggle Play/Pause using current state
            if (!this.currentAyahIndex && this.currentAyahIndex !== 0) return;

            // Check if actively playing or paused
            if (playerBarBtnPlay.textContent.includes('▶')) {
                // Resume or Play
                this.playAyah(this.currentAyahIndex || 0);
            } else {
                // Pause
                player.stop(); // Or pause if we had a pause method exposed
                // Since our player.stop() cancels audio, we restart for now or better implementation later. 
                // Actually AudioPlayer.stop() kills playback. 
                // Let's rely on re-clicking row or update AudioPlayer to have toggle.
                // For now, let's just use stop/play.
                this.updateGlobalBarState(false);
            }
        };

        playerBarBtnNext.onclick = () => {
            // Next Ayah
            if (this.currentAyahIndex < this.ayahsData.length - 1) {
                this.playAyah(this.currentAyahIndex + 1);
            } else {
                // Next Surah
                this.autoPlayNextSurah();
            }
        };

        playerBarBtnPrev.onclick = () => {
            if (this.currentAyahIndex > 0) {
                this.playAyah(this.currentAyahIndex - 1);
            }
        };

        // Surah Info Event
        const btnInfo = document.getElementById('btnSurahInfo');
        if (btnInfo) {
            btnInfo.onclick = () => {
                this.showSurahInfoModal();
            };
        }
    },

    currentAyahIndex: 0, // Track active index

    attachAudioListeners(container) {
        container.querySelectorAll('.play-ayah').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(btn.dataset.index);
                this.playAyah(index);
            });
        });

        container.querySelectorAll('.btn-book').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(btn.dataset.index);
                this.showTafsirModal(index);
            });
        });

        container.querySelectorAll('.btn-bookmark').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const index = parseInt(btn.dataset.index);
                const ayah = this.ayahsData[index];
                const row = document.getElementById(ayah.domId);
                const ayahText = row.querySelector('.ayah-ar').innerText;
                const surahDetails = document.querySelector('#surahSelect option:checked');
                const surahName = surahDetails ? surahDetails.textContent.split('(')[0].trim() : `Surah ${this.currentSurah}`;

                try {
                    btn.classList.add('loading');
                    const result = await api.addBookmark(this.currentSurah, index + 1, surahName, ayahText);
                    const isSuccess = result.success;
                    
                    if (isSuccess) {
                        btn.classList.add('bookmarked');
                        alert(result.message || 'Ayah bookmarked!');
                    }
                } catch (err) {
                    if (err.message.includes('Must be logged in')) {
                        window.location.hash = '#auth';
                    } else {
                        alert('Failed to bookmark Ayah.');
                    }
                } finally {
                    btn.classList.remove('loading');
                }
            });
        });
    },

    playAyah(index) {
        // --- CONTINUOUS PLAYBACK LOGIC ---
        if (index >= this.ayahsData.length) {
            // End of Surah Reached
            this.autoPlayNextSurah();
            return;
        }

        this.currentAyahIndex = index;
        const ayah = this.ayahsData[index];
        const row = document.getElementById(ayah.domId);
        const btn = row.querySelector('.play-ayah');

        // Reset all others (visuals)
        this.resetVisuals();

        // Highlight Current
        row.classList.add('playing');

        // Update Global Bar Info
        this.showGlobalPlayerBox(ayah);

        player.play(
            ayah.audioUrl,
            () => { // On Play
                btn.textContent = '⏸';
                btn.classList.add('playing-icon');
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                this.updateGlobalBarState(true);

                // Track activity (1 verse read)
                api.trackActivity(0, 1).catch(e => console.error("Streak track failed", e));

                // Set progress callback
                player.setProgressCallback((percent) => {
                    const progressFill = document.getElementById('playerProgress');
                    if (progressFill) progressFill.style.width = `${percent}%`;
                });

                // Add SEEK listener to progress container
                const progressContainer = document.querySelector('.player-progress-container');
                if (progressContainer) {
                    progressContainer.onclick = (e) => {
                        const rect = progressContainer.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const percent = (x / rect.width) * 100;
                        player.seek(percent);
                    };
                }
            },
            () => { // On Pause
                btn.textContent = '▶';
                btn.classList.remove('playing-icon');
                this.updateGlobalBarState(false);
            },
            () => { // On Ended
                btn.textContent = '▶';
                btn.classList.remove('playing-icon');
                row.classList.remove('playing');
                // Auto-play Next Ayah
                this.playAyah(index + 1);
            }
        );
    },

    async autoPlayNextSurah() {
        if (this.currentSurah < 114) {
            console.log("Auto-playing next Surah...");
            // Load next surah
            await this.loadSurah(this.currentSurah + 1);
            // Wait slight delay for DOM
            setTimeout(() => {
                this.playAyah(0);
            }, 1000);
        } else {
            console.log("Quran Completed.");
            this.updateGlobalBarState(false);
        }
    },

    showGlobalPlayerBox(ayahInfo) {
        const bar = document.getElementById('playerBar');
        const sName = document.getElementById('playerSurah');
        const aNum = document.getElementById('playerAyah');
        const surahDetails = document.querySelector('#surahSelect option:checked');
        let sTitle = surahDetails ? surahDetails.textContent.split('(')[0] : `Surah ${this.currentSurah}`;

        bar.classList.remove('hidden');
        sName.textContent = sTitle;
        aNum.textContent = `Ayah ${ayahInfo.index + 1}`;
    },

    updateGlobalBarState(isPlaying) {
        const pBtn = document.getElementById('playerPlay');
        if (pBtn) pBtn.textContent = isPlaying ? '⏸' : '▶';
    },

    resetVisuals() {
        document.querySelectorAll('.ayah-row').forEach(r => r.classList.remove('playing'));
        document.querySelectorAll('.play-ayah').forEach(b => {
            b.textContent = '▶';
            b.classList.remove('playing-icon');
        });
    },

    async showTafsirModal(index) {
        const ayah = this.ayahsData[index];
        // Create modal structure if not exists (or dynamic create)
        let modal = document.getElementById('tafsirModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'tafsirModal';
            modal.className = 'modal fade-in';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close-modal">&times;</span>
                    <h3 id="tafsirTitle" class="arabic-text" style="font-size: 1.5rem; margin-bottom: 1rem; color: var(--primary-color);"></h3>
                    <div id="tafsirBody" class="tafsir-body">
                        <div class="loader">Loading Tafsir...</div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Close events
            modal.querySelector('.close-modal').addEventListener('click', () => {
                modal.remove();
            });
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
        }

        const titleParams = document.getElementById('tafsirTitle');
        const bodyParams = document.getElementById('tafsirBody');
        
        // Show current Ayah text in title
        // We can get text from the DOM or data
        // For accurate data, re-fetch or use what we have? 
        // We have text in the DOM, let's use that for immediate feedback or just "Ayah X"
        // Better: Use the api data if we stored it? We only stored audioUrl. 
        // But we can easily get it from the rendered DOM for now.
        const row = document.getElementById(ayah.domId);
        const ayahText = row.querySelector('.ayah-ar').innerText;
        titleParams.innerHTML = ayahText;
        bodyParams.innerHTML = '<div class="loader">Loading Tafsir...</div>';

        // Fetch Tafsir
        // ayah.number is not stored in ayahsData, only index. 
        // ayahsData index corresponds to numberInSurah - 1 usually? 
        // WAIT. ayahsData matches the array order. The array order matches numberInSurah? 
        // YES. arabic.ayahs.forEach((ayah, index)...
        // So numberInSurah = index + 1;
        const numberInSurah = index + 1;
        
        try {
            const data = await api.getAyahTafsir(this.currentSurah, numberInSurah);
            if (data && data.data) {
                // data.data is array of editions
                // 0: Ibn Kathir, 1: Maududi (if available)
                const tafsir = data.data[0]; // Prefer Ibn Kathir
                const secondary = data.data[1]; // Maududi

                let content = '';
                
                 if (tafsir) {
                    content += `<h4>${tafsir.edition.name}</h4>`;
                    content += `<div class="tafsir-text">${tafsir.text}</div>`;
                }

                if (secondary) {
                     content += `<hr style="border-color: var(--glass-border); margin: 1rem 0;">`;
                     content += `<h4>${secondary.edition.name}</h4>`;
                     content += `<div class="tafsir-text">${secondary.text}</div>`;
                }

                bodyParams.innerHTML = content;
            } else {
                 bodyParams.innerHTML = '<p class="error">Tafsir not available for this Ayah.</p>';
            }
        } catch (err) {
            console.error(err);
             bodyParams.innerHTML = '<p class="error">Failed to load Tafsir.</p>';
        }
    },

    async showSurahInfoModal() {
        // Create modal structure if not exists (similar to tafsir modal but separate ID)
        let modal = document.getElementById('surahInfoModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'surahInfoModal';
            modal.className = 'modal fade-in';
            modal.innerHTML = `
                <div class="modal-content surah-info-content">
                    <span class="close-modal">&times;</span>
                    <h3 id="surahInfoTitle" style="font-size: 1.8rem; margin-bottom: 1rem; color: var(--primary-color);"></h3>
                    <div id="surahInfoBody" class="tafsir-body">
                        <div class="loader">Loading Info...</div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Close events
            modal.querySelector('.close-modal').addEventListener('click', () => {
                modal.remove();
            });
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
        }

        const titleParams = document.getElementById('surahInfoTitle');
        const bodyParams = document.getElementById('surahInfoBody');
        
        // Set Title
        const select = document.getElementById('surahSelect');
        const surahName = select.options[select.selectedIndex].text;
        titleParams.textContent = `About ${surahName}`;
        bodyParams.innerHTML = '<div class="loader">Loading Info...</div>';

        try {
            const data = await api.getSurahInfo(this.currentSurah);
            if (data && data.chapter_info) {
                // data.chapter_info.text contains HTML from quran.com
                // Ideally prompt user about source: "Source: Tafhim al-Qur'an - Maududi"
                const source = data.chapter_info.source;
                let htmlContent = `<div class="info-source" style="margin-bottom:1rem; font-style:italic; color:var(--text-muted); font-size:0.9rem;">Source: ${source}</div>`;
                htmlContent += data.chapter_info.text;
                bodyParams.innerHTML = htmlContent;
            } else {
                 bodyParams.innerHTML = '<p class="error">Info not available for this Surah.</p>';
            }
        } catch (err) {
            console.error(err);
             bodyParams.innerHTML = '<p class="error">Failed to load Surah Info.</p>';
        }
    },

    checkTargetAyah() {
        const targetAyah = sessionStorage.getItem('targetAyah');
        if (targetAyah) {
            const index = parseInt(targetAyah) - 1;
            const ayahRow = document.getElementById(`ayah-row-${index}`);
            if (ayahRow) {
                // Focus/Scroll after a brief delay for rendering
                setTimeout(() => {
                    ayahRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    ayahRow.classList.add('highlight-flash');
                    // Remove flash after animation
                    setTimeout(() => ayahRow.classList.remove('highlight-flash'), 2000);
                }, 300);
            }
            sessionStorage.removeItem('targetAyah');
        }
    }
};
