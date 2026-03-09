import { api } from '../api.js';

export default {
    async render(container) {
        container.innerHTML = `
            <div class="search-container fade-in">
                <div class="search-header">
                    <h2 class="arabic-title">أُحِبُّ الْقُرْآنَ</h2>
                    <h3>Search Any Verse</h3>
                </div>
                
                <div class="main-section-divider"></div>

                <div class="search-box-wrapper premium-search-box">
                    <input type="text" id="searchInput" placeholder="Recite or type to search... (e.g. Yaseen)" autocomplete="off">
                    <button id="aiBtn" class="ai-assist-btn" title="Ask AI Assistant">
                         <!-- AI Icon -->
                        <svg class="ai-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/>
                            <path d="M12 6v6l4 2"/>
                        </svg>
                    </button>
                    <button id="voiceBtn" class="voice-btn" title="Voice Search">
                         <!-- Mic Icon -->
                        <svg class="mic-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                        </svg>
                    </button>
                </div>

                <div id="searchSuggestionsContainer" class="search-suggestions fade-in"></div>
                <div id="aiAssistContainer" class="ai-assist-container" style="display: none;"></div>
                <div id="searchResults" class="results-grid"></div>

                <div class="quick-links-section fade-in" style="display: flex; flex-direction: column; align-items: center; gap: 1.5rem; margin-bottom: 3rem;">
                    <div class="ramadan-challenge-box glass-card" id="ramadanBox">
                    </div>
                    
                    <a href="#surahs" class="navigate-quran-btn glass-effect-btn">
                        📖 Navigate Quran
                    </a>
                </div>

                <!-- Explore Section (Scroll to view) -->
                <div class="explore-section fade-in">
                    <div class="explore-tabs">
                        <button class="explore-tab active" data-target="surahsPane">Surahs</button>
                        <button class="explore-tab" data-target="juzsPane">Juzs</button>
                    </div>
                    
                    <div id="surahsPane" class="explore-pane active">
                        <div class="sort-controls" style="justify-content: center;">
                            <div class="switch-container">
                                <button class="sort-btn active" data-sort="traditional">Traditional</button>
                                <button class="sort-btn" data-sort="revelation">Revelation Order</button>
                            </div>
                        </div>
                        <div id="chaptersGrid" class="quran-grid">
                            <div class="loader">Loading chapters...</div>
                        </div>
                    </div>
                    
                    <div id="juzsPane" class="explore-pane" style="display: none;">
                        <div id="juzsGrid" class="quran-grid">
                            <div class="loader">Loading Juzs...</div>
                        </div>
                    </div>
                </div>
                
                <div id="react-footer-anchor"></div>
            </div>
        `;

        this.chaptersData = []; // Cache to prevent over-fetching
        
        this.setupEventListeners();
        this.renderSuggestions();
        this.renderRamadanBox();
        this.loadExploreSection();

        // Auto-focus input so suggestions appear immediately when navigation to Search occurs
        const input = document.getElementById('searchInput');
        if (input) input.focus();

        // Pre-load fuzzy search corpus in the background
        api.initFuzzySearch().catch(console.error);
    },

    renderRamadanBox() {
        const box = document.getElementById('ramadanBox');
        if (!box) return;

        const raw = localStorage.getItem('ramadan_challenge');
        let data = null;
        try { data = raw ? JSON.parse(raw) : null; } catch { data = null; }

        const hasStarted = data && data.started;
        let completedCount = 0;
        if (data && data.chapters) {
            completedCount = Object.values(data.chapters).filter(c => c.completed).length;
        }
        const percent = hasStarted ? Math.round((completedCount / 30) * 100) : 0;

        if (hasStarted) {
            box.innerHTML = `
                <div style="font-size: 1.2rem; margin-bottom: 0.4rem; color: var(--primary-color);">🌙 <strong>Ramadan Challenge</strong></div>
                <div style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1rem;">
                    Target: <strong>1 Juz / Day</strong> — ${completedCount}/30 done (${percent}%)
                </div>
                <div style="max-width: 400px; margin: 0 auto 1rem;">
                    <div style="background: var(--glass-border); border-radius: 10px; height: 8px; overflow: hidden;">
                        <div style="background: linear-gradient(90deg, var(--primary-color), var(--primary-accent)); height: 100%; width: ${percent}%; border-radius: 10px; transition: width 0.5s ease;"></div>
                    </div>
                </div>
                <button class="small-btn" onclick="window.location.hash='#ramadan'" style="border-radius: 12px; background: var(--primary-color); border: none; color: #fff; cursor: pointer; padding: 0.6rem 2rem; font-weight: 600; transition: all 0.3s ease;">
                    📖 Continue Challenge
                </button>
            `;
        } else {
            box.innerHTML = `
                <div style="font-size: 1.2rem; margin-bottom: 0.4rem; color: var(--primary-color);">🌙 <strong>Ramadan Challenge</strong></div>
                <div style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1rem;">
                    Target: <strong>1 Juz / Day</strong> — Complete the Quran in 30 days
                </div>
                <button class="small-btn" onclick="window.location.hash='#ramadan'" style="border-radius: 12px; background: var(--primary-color); border: none; color: #fff; cursor: pointer; padding: 0.6rem 2rem; font-weight: 600; transition: all 0.3s ease;">
                    🔥 Join Challenge
                </button>
            `;
        }
    },

    renderSuggestions() {
        const container = document.getElementById('searchSuggestionsContainer');
        if (!container) return;

        const input = document.getElementById('searchInput');
        const resultsContainer = document.getElementById('searchResults');
        
        const hasText = input && input.value.trim().length > 0;
        const hasResults = (resultsContainer && resultsContainer.children.length > 0) || this.isSearching;

        // Hide suggestions only when user has typed text and results are showing
        if (hasText && hasResults) {
            container.style.display = 'none';
            return;
        }

        // Always show popular searches below the search bar
        if (hasText) {
            container.style.display = 'none';
            return;
        }

        const popularSearches = ['Al-Fatihah', 'Ayatul Kursi', 'Yaseen', 'Ar-Rahman', 'Al-Mulk'];
        const recentSearches = JSON.parse(localStorage.getItem('ilovequran_recent_searches')) || [];

        let html = '<div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem;">';
        
        if (recentSearches.length > 0) {
            html += `
                <div class="suggestion-group glass-card" style="flex: 1; min-width: 200px; max-width: 400px; text-align: center; padding: 1rem 1.2rem; border-radius: 16px;">
                    <h4 style="margin-bottom: 0.6rem; font-size: 0.9rem; color: var(--primary-color);">Recent Searches</h4>
                    <div class="suggestion-chips" style="display: flex; justify-content: center; flex-wrap: wrap; gap: 0.5rem;">
                        ${recentSearches.map(s => `<button class="chip" data-query="${s}">${s}</button>`).join('')}
                    </div>
                </div>
            `;
        }

        html += `
            <div class="suggestion-group glass-card" style="flex: 1; min-width: 200px; max-width: 400px; text-align: center; padding: 1rem 1.2rem; border-radius: 16px;">
                <h4 style="margin-bottom: 0.6rem; font-size: 0.9rem; color: var(--primary-color);">Most Searched</h4>
                <div class="suggestion-chips" style="display: flex; justify-content: center; flex-wrap: wrap; gap: 0.5rem;">
                    ${popularSearches.map(s => `<button class="chip" data-query="${s}">${s}</button>`).join('')}
                </div>
            </div>
        `;
        
        html += '</div>';
        
        container.innerHTML = html;
        container.style.display = 'block';

        container.querySelectorAll('.chip').forEach(chip => {
            // Note: use mousedown instead of click to fire before input blur
            chip.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const query = chip.getAttribute('data-query');
                input.value = query;
                this.performSearch(query);
            });
        });
    },

    renderAiAssist(data) {
        const container = document.getElementById('aiAssistContainer');
        container.innerHTML = `
            <div class="ai-assist-box glass-card fade-in">
                <div class="ai-header">
                    <span class="ai-badge">AI GUIDANCE</span>
                    <button class="close-ai" onclick="this.parentElement.parentElement.parentElement.style.display='none'">×</button>
                </div>
                <p class="ai-explanation">${data.explanation}</p>
                <div class="ai-suggestions">
                    <p class="suggestion-label">Try searching for:</p>
                    <div class="keyword-tags">
                        ${data.keywords.map(kw => `<button class="keyword-tag" data-keyword="${kw}">${kw}</button>`).join('')}
                    </div>
                </div>
            </div>
        `;

        // Add listeners to keyword tags
        container.querySelectorAll('.keyword-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                const keyword = tag.getAttribute('data-keyword');
                document.getElementById('searchInput').value = keyword;
                container.style.display = 'none';
                this.performSearch(keyword);
            });
        });
    },

    setupEventListeners() {
        const input = document.getElementById('searchInput');
        const voiceBtn = document.getElementById('voiceBtn');
        const aiBtn = document.getElementById('aiBtn');
        const resultsContainer = document.getElementById('searchResults');
        const aiAssistContainer = document.getElementById('aiAssistContainer');

        // Toggle suggestions on interactions
        input.addEventListener('focus', () => this.renderSuggestions());
        input.addEventListener('input', () => {
            if (input.value.trim() === '') {
                resultsContainer.innerHTML = '';
                this.isSearching = false; // Reset searching flag
            }
            this.renderSuggestions();
        });
        input.addEventListener('blur', () => {
            // Delay slightly so click on chips (which happens after blur in some browsers) can work
            // Actually chips use mousedown + preventDefault now, so blur won't fire instantly
            setTimeout(() => this.renderSuggestions(), 200);
        });

        // Typing search (debounce this in production)
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                aiAssistContainer.style.display = 'none';
                this.performSearch(input.value);
            }
        });

        // AI Search Assistance
        aiBtn.addEventListener('click', async () => {
            const query = input.value.trim();
            if (!query) {
                alert("Please enter a topic or question first.");
                return;
            }

            aiBtn.classList.add('loading');
            aiAssistContainer.style.display = 'block';
            aiAssistContainer.innerHTML = '<div class="ai-loader">Consulting AI Assistant...</div>';

            const result = await api.searchAssist(query);
            aiBtn.classList.remove('loading');

            if (result && result.success) {
                this.renderAiAssist(result.data);
            } else {
                aiAssistContainer.innerHTML = '<p class="error">Failed to get AI assistance. Please try again.</p>';
            }
        });

        // Voice Search using MediaRecorder and OpenAI Backend
        let mediaRecorder;
        let audioChunks = [];

        voiceBtn.addEventListener('click', async () => {
            if (voiceBtn.classList.contains('listening')) {
                // Stop recording
                mediaRecorder.stop();
                voiceBtn.classList.remove('listening');
                voiceBtn.innerHTML = '...';
                return;
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];

                mediaRecorder.ondataavailable = (event) => {
                    audioChunks.push(event.data);
                };

                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    voiceBtn.innerHTML = 'Analyzing...';
                    
                    const result = await api.voiceSearch(audioBlob);
                    
                    if (result && result.success) {
                        input.value = result.arabicQuery;
                        // For Quran search result display:
                        this.renderVoiceResults(result);
                    } else {
                        voiceBtn.innerHTML = '❌';
                        setTimeout(() => voiceBtn.innerHTML = `
                            <svg class="mic-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                            </svg>
                        `, 2000);
                    }
                    
                    // Stop all tracks to release microphone
                    stream.getTracks().forEach(track => track.stop());
                };

                mediaRecorder.start();
                voiceBtn.classList.add('listening');
                voiceBtn.innerHTML = '⏹';

            } catch (err) {
                console.error("Microphone access denied or error:", err);
                alert("Microphone access denied or error occurred.");
                voiceBtn.innerHTML = '❌';
                setTimeout(() => voiceBtn.innerHTML = `
                    <svg class="mic-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                    </svg>
                `, 2000);
            }
        });
        // Explore Tabs
        const tabs = document.querySelectorAll('.explore-tab');
        const panes = document.querySelectorAll('.explore-pane');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.getAttribute('data-target');
                tabs.forEach(t => t.classList.remove('active'));
                panes.forEach(p => p.style.display = 'none');
                
                tab.classList.add('active');
                document.getElementById(target).style.display = 'block';
            });
        });

        // Surah Sort Controls
        const sortBtns = document.querySelectorAll('.sort-btn');
        sortBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                sortBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderChaptersGrid(btn.getAttribute('data-sort'));
            });
        });
    },

    async loadExploreSection() {
        // Load Juzs (1-30 static rendering since they don't change)
        const juzsGrid = document.getElementById('juzsGrid');
        if (juzsGrid) {
            let juzHtml = '';
            for (let i = 1; i <= 30; i++) {
                juzHtml += `
                    <a href="#read" class="quran-card glass-card" onclick="sessionStorage.setItem('targetJuz', ${i})">
                        <div class="quran-card-left">
                            <div class="quran-number">${i}</div>
                            <div class="quran-details">
                                <h4>Juz ${i}</h4>
                                <span class="quran-meta">Part ${i} of 30</span>
                            </div>
                        </div>
                    </a>
                `;
            }
            juzsGrid.innerHTML = juzHtml;
        }

        // Load Chapters
        const chaptersData = await api.getAllChaptersInfo();
        if (chaptersData) {
            this.chaptersData = chaptersData;
            this.renderChaptersGrid('traditional');
        } else {
            const grid = document.getElementById('chaptersGrid');
            if(grid) grid.innerHTML = '<p class="error">Failed to load chapters.</p>';
        }
    },

    renderChaptersGrid(sortOrder) {
        const grid = document.getElementById('chaptersGrid');
        if (!grid || !this.chaptersData) return;

        let sortedData = [...this.chaptersData];
        if (sortOrder === 'revelation') {
            sortedData.sort((a, b) => a.revelation_order - b.revelation_order);
        } else {
            sortedData.sort((a, b) => a.id - b.id); // traditional (1-114)
        }

        let html = '';
        sortedData.forEach(chapter => {
            html += `
                <a href="#surah/${chapter.id}" class="quran-card glass-card">
                    <div class="quran-card-left">
                        <div class="quran-number">${chapter.id}</div>
                        <div class="quran-details">
                            <h4>${chapter.name_simple}</h4>
                            <span class="quran-meta">${chapter.translated_name.name} • ${chapter.verses_count} Ayahs</span>
                        </div>
                    </div>
                    <div class="quran-card-right arabic-text">
                        ${chapter.name_arabic}
                    </div>
                </a>
            `;
        });
        grid.innerHTML = html;
    },

    async renderVoiceResults(result) {
        const container = document.getElementById('searchResults');
        container.innerHTML = `
            <div class="voice-search-status">
                <p><strong>Heard:</strong> "${result.transcription}"</p>
                <p><strong>Arabic Query:</strong> ${result.arabicQuery}</p>
            </div>
        `;

        if (!result.results || result.results.length === 0) {
            container.innerHTML += '<p class="no-results">No matching verses found.</p>';
            return;
        }

        // Reuse the logic from performSearch but with the backend results
        for (const match of result.results.slice(0, 5)) {
            // Match from search API has slightly different structure
            // In matches, it's match.surah.number and match.numberInSurah
            const details = await api.getVerseDetails(match.surah.number, match.numberInSurah);
            if (!details || !details.data) continue;

            const [arabic, english, urdu] = details.data;

            const card = document.createElement('div');
            card.className = 'verse-card glass-card';
            card.innerHTML = `
                <div class="verse-header">
                    <span class="surah-badge">${match.surah.englishName} (${match.surah.number}:${match.numberInSurah})</span>
                    <div class="audio-controls">
                        <button class="btn-icon play-btn" data-audio-ar="${api.getAyahAudioUrl(match.surah.number, match.numberInSurah)}" data-text-en="${english.text}" data-text-ur="${urdu.text}">
                            ▶ Play
                        </button>

                    </div>
                </div>
                <p class="verse-text-ar">${arabic.text}</p>
                <p class="verse-text-ur">${urdu.text}</p>
                <p class="verse-text-en">${english.text}</p>
                <div class="verse-actions">
                     <button class="btn-icon tafsir-btn">Read Tafsir</button>
                </div>
                <div class="tafsir-content" style="display:none; margin-top:1rem; color: #ccc; font-size: 0.9rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                         <strong>Tafsir (Context):</strong>
                         <button class="btn-icon play-tafsir-btn" style="font-size: 0.8rem; padding: 0.3rem 0.8rem;">Listen</button>
                    </div>
                    <p class="tafsir-text">
                        Surah ${match.surah.englishName} (${match.surah.englishName}). 
                        Verse ${match.numberInSurah}: "${english.text}"
                        <br><br>
                        <em>(Detailed Tafsir audio is generated from this text context)</em>
                    </p>
                </div>
            `;
            container.appendChild(card);
            this.attachCardListeners(card, match);
        }
    },

    async performSearch(query) {
        if (!query.trim()) return;

        this.isSearching = true; // Flag to keep suggestions hidden
        this.renderSuggestions(); // Immediate hide

        // Save to recent searches
        let recentSearches = JSON.parse(localStorage.getItem('ilovequran_recent_searches')) || [];
        recentSearches = recentSearches.filter(s => s.toLowerCase() !== query.toLowerCase());
        recentSearches.unshift(query.trim());
        if (recentSearches.length > 5) recentSearches.pop();
        localStorage.setItem('ilovequran_recent_searches', JSON.stringify(recentSearches));
        this.renderSuggestions();

        const container = document.getElementById('searchResults');
        container.innerHTML = '<div class="loader">Searching...</div>';

        // ── Keyword Map Check ──────────────────────────────────────────
        const matchInfo = await api.checkKeywordMap(query);
        if (matchInfo) {
            const { reference, keyword } = matchInfo;
            // Parse reference: '2:255', '36', '94:5'
            const parts = reference.split(':');
            const surahNum = parseInt(parts[0], 10);
            const ayahNum = parts[1] ? parseInt(parts[1], 10) : null;

            // Build a friendly label
            const label = ayahNum
                ? `Surah ${surahNum}, Ayah ${ayahNum}`
                : `Surah ${surahNum}`;

            // Show a Quick Navigate banner
            container.innerHTML = `
                <div class="keyword-match-banner glass-card fade-in">
                    <div class="km-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                        </svg>
                    </div>
                    <div class="km-content">
                        <span class="km-label">Quick Navigate</span>
                        <h3 class="km-title">${keyword.replace(/\b\w/g, l => l.toUpperCase())}</h3>
                        <p class="km-ref">${label} &nbsp;·&nbsp; Reference: ${reference}</p>
                    </div>
                    <button class="km-goto-btn" id="kmGotoBtn" data-surah="${surahNum}" data-ayah="${ayahNum || ''}">
                        Open Verse
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                    </button>
                </div>
            `;

            document.getElementById('kmGotoBtn').addEventListener('click', (e) => {
                const s = e.currentTarget.dataset.surah;
                const a = e.currentTarget.dataset.ayah;
                // Store target ayah in sessionStorage so readView can scroll to it
                if (a) sessionStorage.setItem('targetAyah', a);
                window.location.hash = `#surah/${s}`;
            });

            // Also run normal fuzzy search below the banner
            this._runFuzzySearch(query, container, true);
            return;
        }
        // ──────────────────────────────────────────────────────────────

        container.innerHTML = '<div class="loader">Searching... (This might take a moment on first search)</div>';
        this.isSearching = false;
        this._runFuzzySearch(query, container, false);
    },

    async _runFuzzySearch(query, container, append) {
        try {
            const data = await api.fuzzySearchLocal(query);

            if (!append) container.innerHTML = '';

            if (!data || !data.data || data.data.matches.length === 0) {
                if (!append) {
                    container.innerHTML = '<p class="no-results">No verses found.</p>';
                }
                return;
            }

            // Add a subtle "Related Results" header when appending below banner
            if (append) {
                const header = document.createElement('p');
                header.style.cssText = 'color: var(--text-muted); font-size: 0.85rem; margin: 1.5rem 0 0.5rem; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;';
                header.textContent = 'Related Verses';
                container.appendChild(header);
            }

            const matches = data.data.matches.slice(0, 5);

            for (const match of matches) {
                const details = await api.getVerseDetails(match.surah.number, match.numberInSurah);
                if (!details || !details.data) continue;

                const [arabic, english, urdu] = details.data;

                const card = document.createElement('div');
                card.className = 'verse-card glass-card';
                card.innerHTML = `
                    <div class="verse-header">
                        <span class="surah-badge">${match.surah.englishName} (${match.surah.number}:${match.numberInSurah})</span>
                        <div class="audio-controls">
                            <button class="btn-icon play-btn" data-audio-ar="${api.getAyahAudioUrl(match.surah.number, match.numberInSurah)}" data-text-en="${english.text}" data-text-ur="${urdu.text}">
                                ▶ Play
                            </button>
                        </div>
                    </div>
                    <p class="verse-text-ar">${arabic.text}</p>
                    <p class="verse-text-ur">${urdu.text}</p>
                    <p class="verse-text-en">${english.text}</p>
                    <div class="verse-actions">
                         <button class="btn-icon tafsir-btn">Read Tafsir</button>
                    </div>
                    <div class="tafsir-content" style="display:none; margin-top:1rem; color: #ccc; font-size: 0.9rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1rem;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                             <strong>Tafsir (Context):</strong>
                             <button class="btn-icon play-tafsir-btn" style="font-size: 0.8rem; padding: 0.3rem 0.8rem;">Listen</button>
                        </div>
                        <p class="tafsir-text">
                            Surah ${match.surah.englishName} (${match.surah.englishName}). 
                            Verse ${match.numberInSurah}: "${english.text}"
                            <br><br>
                            <em>(Detailed Tafsir audio is generated from this text context)</em>
                        </p>
                    </div>
                `;
                container.appendChild(card);
                this.attachCardListeners(card, match);
            }
        } catch (err) {
            console.error(err);
            if (!append) container.innerHTML = '<p class="error">An error occurred while searching.</p>';
        }
    },

    attachCardListeners(card, match) {
        const playBtn = card.querySelector('.play-btn');
        const langOpts = card.querySelectorAll('.lang-opt');
        const tafsirBtn = card.querySelector('.tafsir-btn');
        const tafsirContent = card.querySelector('.tafsir-content');
        const playTafsirBtn = card.querySelector('.play-tafsir-btn');

        // Default to Arabic
        let currentLang = 'ar';
        // Updated to use dynamic reciter URL with correct args
        const arabicAudioUrl = api.getAyahAudioUrl(match.surah.number, match.numberInSurah);

        // Simple logic to handle source toggle
        langOpts.forEach(opt => {
            opt.addEventListener('click', (e) => {
                currentLang = e.target.dataset.lang;
                // Visual feedback for selection could be added here
                alert(`Audio set to ${e.target.innerText}`);
            });
        });

        playBtn.addEventListener('click', () => {
            import('../components/audioPlayer.js').then(({ player }) => {
                if (currentLang === 'ar') {
                    // Using new play method with toggle support
                    player.play(
                        arabicAudioUrl,
                        () => { playBtn.innerHTML = '⏸ Pause'; playBtn.classList.add('active'); },
                        () => { playBtn.innerHTML = '▶ Play'; playBtn.classList.remove('active'); },
                        () => { playBtn.innerHTML = '▶ Play'; playBtn.classList.remove('active'); }
                    );
                } else if (currentLang === 'en') {
                    player.playTts(card.querySelector('.verse-text-en').innerText, 'en-US');
                } else if (currentLang === 'ur') {
                    player.playTts(card.querySelector('.verse-text-ur').innerText, 'ur-PK');
                }
            });
        });

        tafsirBtn.addEventListener('click', () => {
            tafsirContent.style.display = tafsirContent.style.display === 'none' ? 'block' : 'none';
        });

        playTafsirBtn.addEventListener('click', () => {
            const textToRead = card.querySelector('.tafsir-text').innerText;
            import('../components/audioPlayer.js').then(({ player }) => {
                const originalText = playTafsirBtn.innerText;
                player.playTts(
                    textToRead,
                    'en-US',
                    () => { // onStart
                        playTafsirBtn.innerText = '🔊 Reading...';
                        playTafsirBtn.style.color = 'var(--primary-accent)';
                    },
                    () => { // onEnd
                        playTafsirBtn.innerText = originalText;
                        playTafsirBtn.style.color = '';
                    },
                    (err) => { // onError
                        console.error(err);
                        playTafsirBtn.innerText = '❌ Error';
                        setTimeout(() => playTafsirBtn.innerText = originalText, 2000);
                    }
                );
            });
        });
    }
};
