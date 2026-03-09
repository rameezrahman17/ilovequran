export class AudioPlayer {
    constructor() {
        this.currentAudio = null;
        this.currentUrl = null;
    }

    play(url, onPlay, onPause, onEnded) {
        // If same audio is paused, just resume
        if (this.currentAudio && this.currentUrl === url) {
            if (this.currentAudio.paused) {
                this.currentAudio.play();
            } else {
                this.currentAudio.pause();
            }
            return;
        }

        // Stop existing
        this.stop();

        this.currentUrl = url;
        this.currentAudio = new Audio(url);

        if (onPlay) this.currentAudio.addEventListener('play', onPlay);
        if (onPause) this.currentAudio.addEventListener('pause', onPause);
        if (onEnded) this.currentAudio.addEventListener('ended', onEnded);

        // Progress Tracking
        this.currentAudio.addEventListener('timeupdate', () => {
            if (this.onProgress) {
                const percent = (this.currentAudio.currentTime / this.currentAudio.duration) * 100;
                this.onProgress(percent, this.currentAudio.currentTime, this.currentAudio.duration);
            }
        });

        this.currentAudio.play().catch(e => console.error("Playback failed", e));
    }

    setProgressCallback(callback) {
        this.onProgress = callback;
    }

    playAudio(url) {
        // Legacy support or simple play
        this.play(url);
    }

    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            // this.currentAudio = null; // Don't nullify immediately if we want to resume
            // But current logic is simple. Let's keep strict stop behavior for new track load, 
            // but for toggle we might need explicit pause
        }
        window.speechSynthesis.cancel();
    }

    pause() {
        if (this.currentAudio) {
            this.currentAudio.pause();
        }
    }

    seek(percent) {
        if (this.currentAudio && this.currentAudio.duration) {
            this.currentAudio.currentTime = (percent / 100) * this.currentAudio.duration;
        }
    }

    playTts(text, lang = 'en-US', onStart, onEnd, onError) {
        this.stop();

        if (!window.speechSynthesis) {
            console.error("TTS not supported");
            if (onError) onError("TTS not supported");
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;

        // Improve voice selection if possible
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            // Try to find a good voice for the lang
            const voice = voices.find(v => v.lang.startsWith(lang) && !v.name.includes('Google')); // Prefer native if available
            if (voice) utterance.voice = voice;
        }

        utterance.onstart = () => {
            if (onStart) onStart();
        };

        utterance.onend = () => {
            if (onEnd) onEnd();
        };

        utterance.onerror = (e) => {
            console.error("TTS Error:", e);
            if (onError) onError(e);
        };

        window.speechSynthesis.speak(utterance);
    }
}

export const player = new AudioPlayer();
