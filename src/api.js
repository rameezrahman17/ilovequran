const API_BASE_QURAN = 'http://api.alquran.cloud/v1';
const API_BASE_MEDIA = 'https://cdn.islamic.network/quran';

// Initialize Supabase Client (from CDN global)
const SUPABASE_URL = 'https://olffnnxkssmkrhqihrat.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZmZubnhrc3Nta3JocWlocmF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNTgyNzgsImV4cCI6MjA4NjgzNDI3OH0.2Sv1P9ZClM0WxPy-f8faFIRRK7TMZc5xAcztdU2-qbk';

export const supabase = (function() {
    if (typeof window !== 'undefined' && window.supabase) {
        return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    console.warn('Supabase JS not found. Check if the script tag in index.html is correct.');
    return null;
})();

// ── Local Keyword Map (instant lookup, no network needed) ──────────────────
// Format: 'keyword' → 'surah' OR 'surah:ayah'
// Supabase table is the source of truth; this is a client-side cache for speed.
const KEYWORD_MAP = {
  // Famous Verses
  'ayatul kursi': '2:255', 'kursi': '2:255', 'throne verse': '2:255',
  'last 2 ayat baqarah': '2:285', 'amanar rasool': '2:285',
  'fasting verse': '2:183', 'ramadan verse': '2:185',
  'shahada verse': '3:18', '3 quls': '112', 'kul huwa allahu ahad': '112:1',

  // Surah Popular Names
  'surah yaseen': '36', 'yaseen': '36',
  'surah rahman': '55', 'ar rahman': '55',
  'surah mulk': '67', 'tabarak': '67',
  'surah kahf': '18', 'surah ikhlas': '112',
  'surah falaq': '113', 'surah nas': '114',
  'surah baqarah': '2', 'surah fatiha': '1',
  'ummul kitab': '1', 'seven oft repeated': '1',

  // Protection & Dua
  'protection verse': '2:255', 'ruqyah verse': '2:255',
  'evil eye verse': '113', 'hasbunallahu': '3:173',
  'tawakkul verse': '65:3', 'dua for forgiveness': '39:53',
  'mercy verse': '39:53', 'la tahzan': '9:40',
  'sabr verse': '2:153', 'patience verse': '2:153',
  'hardship ease': '94:5',

  // Topic Based
  'jihad verse': '22:39', 'hijab verse': '24:31',
  'marriage verse': '30:21', 'interest riba': '2:275',
  'justice verse': '4:135', 'parents respect': '17:23',
  'zina verse': '17:32', 'backbiting verse': '49:12',
  'equality verse': '49:13', 'trust amanah': '4:58',

  // Emotional Searches
  'depression verse': '13:28', 'anxiety verse': '94:5',
  'hope verse': '39:53', 'sadness verse': '9:40',
  'gratitude verse': '14:7', 'guidance verse': '1:6',
  'light verse': '24:35',
};

// Extended API with Reciter Support
export const api = {
    currentReciterId: 'Alafasy_128kbps', // Default Alafasy

    // --- Keyword Mapping ---
    // Returns a reference string like '2:255', '36', '94:5' or null
    keywordFuseSearchInstance: null,

    async initKeywordFuzzySearch() {
        if (this.keywordFuseSearchInstance) return true;

        const combinedKeywords = [];
        
        // 1. Add local keywords
        for (const [kw, ref] of Object.entries(KEYWORD_MAP)) {
            combinedKeywords.push({ keyword: kw, reference: ref });
        }

        // 2. Fetch all from Supabase for fuzzy matching
        if (supabase) {
            try {
                const { data } = await supabase.from('keyword_mappings').select('keyword, reference');
                if (data) {
                    data.forEach(item => {
                        // Avoid duplicates if already in local map
                        if (!KEYWORD_MAP[item.keyword.toLowerCase()]) {
                            combinedKeywords.push({ keyword: item.keyword.toLowerCase(), reference: item.reference });
                        }
                    });
                }
            } catch (e) {
                console.warn("Could not fetch remote keywords for fuzzy init", e);
            }
        }

        if (combinedKeywords.length > 0) {
            this.keywordFuseSearchInstance = new window.Fuse(combinedKeywords, {
                keys: ['keyword'],
                threshold: 0.35, // Strict enough to avoid unrelated jumps, loose enough for typos
                includeScore: true
            });
            return true;
        }
        return false;
    },

    async checkKeywordMap(query) {
        const key = query.trim().toLowerCase();

        // 1. Instant local/exact lookup (fastest)
        if (KEYWORD_MAP[key]) return { reference: KEYWORD_MAP[key], keyword: key };

        // 2. Fallback to Supabase for exact match (for new ones not in local cache)
        if (supabase) {
            try {
                const { data } = await supabase
                    .from('keyword_mappings')
                    .select('reference, keyword')
                    .eq('keyword', key)
                    .single();
                if (data) return { reference: data.reference, keyword: data.keyword };
            } catch {}
        }

        // 3. Fuzzy search fallback for typos
        if (!this.keywordFuseSearchInstance) {
            await this.initKeywordFuzzySearch();
        }

        if (this.keywordFuseSearchInstance) {
            const results = this.keywordFuseSearchInstance.search(key);
            // score < 0.4 is a good balance for typos
            if (results.length > 0 && results[0].score < 0.4) {
                return { 
                    reference: results[0].item.reference, 
                    keyword: results[0].item.keyword 
                };
            }
        }

        return null;
    },

    // --- Search Cache & Fuse Variables ---
    cachedEnglishTranslation: null,
    fuseSearchInstance: null,

    async initFuzzySearch() {
        // Also init keyword fuzzy search if not done
        this.initKeywordFuzzySearch().catch(() => {});

        if (this.fuseSearchInstance) return true;

        try {
            const response = await fetch(`${API_BASE_QURAN}/quran/en.asad`);
            if (!response.ok) throw new Error('Failed to load English translation');
            const data = await response.json();
            
            if (data && data.data && data.data.surahs) {
                this.cachedEnglishTranslation = data.data.surahs;
                
                const allAyahs = [];
                for (const surah of this.cachedEnglishTranslation) {
                    for (const ayah of surah.ayahs) {
                         allAyahs.push({
                             surahNumber: surah.number,
                             surahName: surah.englishName,
                             surahTranslation: surah.englishNameTranslation,
                             ayahNumber: ayah.numberInSurah,
                             text: ayah.text
                         });
                    }
                }

                this.fuseSearchInstance = new window.Fuse(allAyahs, {
                    keys: [
                        { name: 'surahName', weight: 0.5 },
                        { name: 'surahTranslation', weight: 0.2 },
                        { name: 'text', weight: 0.3 }
                    ],
                    includeScore: true,
                    threshold: 0.4, 
                    ignoreLocation: true,
                });
                return true;
            }
            return false;
        } catch(error) {
            console.error('Fuzzy Search Init Error:', error);
            return false;
        }
    },

    async fuzzySearchLocal(query) {
        if (!this.fuseSearchInstance) {
            const initialized = await this.initFuzzySearch();
            if (!initialized) return { data: { matches: [] } };
        }

        // Clean query to improve surah name matching (e.g., "surah al kahf" -> "al kahf")
        const cleanQuery = query.toLowerCase().replace(/^surah\s+/i, '').trim();
        const searchQuery = cleanQuery || query;

        const results = this.fuseSearchInstance.search(searchQuery);
        
        const matches = results.map(res => {
             return {
                 surah: {
                     number: res.item.surahNumber,
                     englishName: res.item.surahName
                 },
                 numberInSurah: res.item.ayahNumber
             }
        });

        return { data: { matches } };
    },

    // Using EveryAyah source directly for more options
    reciters: [
        { id: 'Alafasy_128kbps', name: 'Mishary Rashid Alafasy' },
        { id: 'Abu_Bakr_Ash-Shaatree_128kbps', name: 'Abu Bakr Al Shatri' },
        { id: 'Nasser_Alqatami_128kbps', name: 'Nasser Al Qatami' },
        { id: 'Yasser_Ad-Dussary_128kbps', name: 'Yasser Al Dosari' },
        { id: 'Hani_Rifai_192kbps', name: 'Hani Ar Rifai' },
        { id: 'MaherAlMuaiqly128kbps', name: 'Maher Al Muaiqly' },
        { id: 'Saood_ash-Shuraym_128kbps', name: 'Saud Al Shuraim' },
        { id: 'Abdurrahmaan_As-Sudais_192kbps', name: 'Abdul Rahman Al Sudais' }
    ],

    setReciter(id) {
        if (this.reciters.find(r => r.id === id)) {
            this.currentReciterId = id;
            return true;
        }
        return false;
    },

    // Search Verse
    async search(query, lang = 'en') {
        try {
            const response = await fetch(`${API_BASE_QURAN}/search/${query}/all/${lang}`);
            if (!response.ok) throw new Error('Search failed');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    },

    // Get Full Quran (Uthmani - Restored for Waqf/Stop signs)
    async getQuran() {
        try {
            const response = await fetch(`${API_BASE_QURAN}/quran/quran-uthmanion`);
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    },

    // Get Translation (Asad for English)
    async getTranslation(edition = 'en.asad') {
        try {
            const response = await fetch(`${API_BASE_QURAN}/quran/${edition}`);
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    },

    // Get Surahs List
    async getSurahs() {
        try {
            const response = await fetch(`${API_BASE_QURAN}/surah`);
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    },

    // Get Specific Surah
    async getSurah(number) {
        try {
            const response = await fetch(`${API_BASE_QURAN}/surah/${number}/editions/quran-uthmanion,en.asad`);
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    },

    // Get Surah with all editions for Read View
    async getSurahEditions(number) {
        try {
            // Fetching Arabic (Uthmani), English, Urdu text and Reciter Audio
            // Note: ar.alafasy returns objects with audio url
            const response = await fetch(`${API_BASE_QURAN}/surah/${number}/editions/quran-uthmanion,en.asad,ur.jalandhry,ar.alafasy`);
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    },

    // Get detailed verse data (Arabic, English, Urdu, Tafsir)
    async getVerseDetails(surah, ayah) {
        try {
            // Fetching Arabic (Uthmani), English (Asad), Urdu (Jalandhry)
            const response = await fetch(`${API_BASE_QURAN}/ayah/${surah}:${ayah}/editions/quran-uthmanion,en.asad,ur.jalandhry`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    },

    // Get Tafsir (Ibn Kathir) for a specific Ayah
    async getAyahTafsir(surah, ayah) {
        try {
            // Fetching English Tafsir (Ibn Kathir)
            const response = await fetch(`${API_BASE_QURAN}/ayah/${surah}:${ayah}/editions/en.ibnkathir,en.maududi`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    },

    // Get Surah Info (History/Context) - using Quran.com V4 API
    async getSurahInfo(surahNumber) {
        try {
            const response = await fetch(`https://api.quran.com/api/v4/chapters/${surahNumber}/info`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    },

    // Get all Chapters (Quran.com V4 API) for revelation orders
    async getAllChaptersInfo(lang = 'en') {
        try {
            const response = await fetch(`https://api.quran.com/api/v4/chapters?language=${lang}`);
            const data = await response.json();
            return data.chapters;
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    },

    // Get Arabic-only Surah (for Holy Book view)
    async getArabicSurah(number) {
        try {
            const response = await fetch(`${API_BASE_QURAN}/surah/${number}/quran-uthmani`);
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    },

    // Audio Helpers
    getAudioUrl(edition, number) {
        return `${API_BASE_QURAN}/quran/${edition}`; // Note: Audio usually fetched via specific ayah endpoints or CDN
    },

    // Dynamic Audio URL based on Reciter
    getAyahAudioUrl(surah, ayah) {
        // EveryAyah format: http://everyayah.com/data/{Subfolder}/{000000}.mp3
        // Padding: Surah (3 digits) + Ayah (3 digits)

        if (!surah || !ayah) return '';

        const pad = (num) => num.toString().padStart(3, '0');
        const fileName = `${pad(surah)}${pad(ayah)}.mp3`;

        return `https://everyayah.com/data/${this.currentReciterId}/${fileName}`;
    },

    getSurahAudioUrl(surahNumber, bitrate = 128) {
        return `https://cdn.islamic.network/quran/audio-surah/${bitrate}/ar.alafasy/${surahNumber}.mp3`;
    },

    getAyahImageUrl(surah, ayah) {
        return `https://cdn.islamic.network/quran/images/high-resolution/${surah}_${ayah}.png`;
    },

    // Voice Search via Backend
    async voiceSearch(audioBlob) {
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');

            const response = await fetch('/api/voice-search', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Voice search failed');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    },

    // AI Search assistance
    async searchAssist(query) {
        try {
            const response = await fetch('/api/search/assist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });

            if (!response.ok) throw new Error('AI assist failed');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    },

    // --- Authentication Methods ---
    async signUp(email, password, fullName) {
        return await supabase.auth.signUp({ 
            email, 
            password,
            options: {
                data: {
                    display_name: fullName
                }
            }
        });
    },

    async signIn(email, password) {
        return await supabase.auth.signInWithPassword({ email, password });
    },

    async signOut() {
        return await supabase.auth.signOut();
    },

    // Google OAuth — Supabase exchanges the OAuth code server-side using secrets
    // stored only in Supabase's dashboard. No Google secrets ever touch the frontend.
    async signInWithGoogle() {
        const redirectTo = `${window.location.origin}/`;
        return await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo
            }
        });
    },

    async resetPassword(email) {
        return await supabase.auth.resetPasswordForEmail(email);
    },

    async updatePassword(newPassword) {
        return await supabase.auth.updateUser({ password: newPassword });
    },

    async getUser() {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    },

    async updateUserProfile(fullName) {
        const { data, error } = await supabase.auth.updateUser({
            data: { display_name: fullName }
        });
        if (error) throw error;
        return data.user;
    },

    // --- Bookmark Methods ---
    async getBookmarks() {
        const user = await this.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('bookmarks')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching bookmarks:', error);
            return [];
        }
        return data;
    },

    async addBookmark(surah, ayah, surahName, ayahText) {
        const user = await this.getUser();
        if (!user) throw new Error('Must be logged in to bookmark');

        const { data, error } = await supabase
            .from('bookmarks')
            .insert([{
                user_id: user.id,
                surah_number: surah,
                ayah_number: ayah,
                surah_name: surahName,
                ayah_text: ayahText
            }]);

        if (error) {
            if (error.code === '23505') return { success: true, message: 'Already bookmarked' };
            throw error;
        }
        return { success: true, data };
    },

    async removeBookmark(surah, ayah) {
        const user = await this.getUser();
        if (!user) throw new Error('Must be logged in to remove bookmark');

        const { error } = await supabase
            .from('bookmarks')
            .delete()
            .match({ user_id: user.id, surah_number: surah, ayah_number: ayah });

        if (error) throw error;
        return { success: true };
    },

    async isBookmarked(surah, ayah) {
        const user = await this.getUser();
        if (!user) return false;

        const { data, error } = await supabase
            .from('bookmarks')
            .select('id')
            .match({ user_id: user.id, surah_number: surah, ayah_number: ayah })
            .single();

        return !!data;
    },

    // --- Streak & Activity Methods ---
    async getStreak() {
        const user = await this.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('streaks')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') {
             console.error('Error fetching streak:', error);
        }
        return data;
    },

    async updateStreakGoal(goalType, goalValue) {
        const user = await this.getUser();
        if (!user) throw new Error('Must be logged in');

        const { data, error } = await supabase
            .from('streaks')
            .upsert({
                user_id: user.id,
                goal_type: goalType,
                goal_value: goalValue,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (error) throw error;
        return data;
    },

    async trackActivity(minutesIncrement = 0, versesCount = 0) {
        const user = await this.getUser();
        if (!user) return;

        const { data: current } = await supabase
            .from('streaks')
            .select('*')
            .eq('user_id', user.id)
            .single();

        const today = new Date().toISOString().split('T')[0];
        let updateData = {
            user_id: user.id,
            last_activity_date: today,
            updated_at: new Date().toISOString(),
            total_verses_read: (current?.total_verses_read || 0) + versesCount
        };

        if (current) {
            const lastDate = current.last_activity_date;
            let dailyProgressMins = current.daily_progress_minutes || 0;
            let dailyProgressVerses = current.daily_progress_verses || 0;
            let currentStreak = current.current_streak || 0;
            let longestStreak = current.longest_streak || 0;

            if (lastDate === today) {
                dailyProgressMins += minutesIncrement;
                dailyProgressVerses += versesCount;
            } else {
                // Check if yesterday
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                if (lastDate === yesterdayStr) {
                    currentStreak += 1;
                } else {
                    currentStreak = 1;
                }
                dailyProgressMins = minutesIncrement;
                dailyProgressVerses = versesCount;
            }

            if (currentStreak > longestStreak) longestStreak = currentStreak;

            updateData = {
                ...updateData,
                daily_progress_minutes: Math.round(dailyProgressMins),
                daily_progress_verses: dailyProgressVerses,
                current_streak: currentStreak,
                longest_streak: longestStreak
            };
        } else {
            // First time tracking
            updateData = {
                ...updateData,
                daily_progress_minutes: Math.round(minutesIncrement),
                daily_progress_verses: versesCount,
                current_streak: 1,
                longest_streak: 1
            };
        }

        const { error } = await supabase
            .from('streaks')
            .upsert(updateData, { onConflict: 'user_id' });

        if (error) console.error('Error tracking activity:', error);
    }
};
