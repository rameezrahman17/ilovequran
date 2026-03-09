import Router from './router.js';
import { api, supabase } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    // ── Handle OAuth Callback ──────────────────────────────────────
    // When Supabase redirects back from Google, the URL contains
    // #access_token=... — let Supabase pick it up and establish session.
    const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
    const searchParams = new URLSearchParams(window.location.search);

    const hasOAuthResponse = hashParams.get('access_token') ||
                             hashParams.get('error') ||
                             searchParams.get('code');

    if (hasOAuthResponse) {
        const { data, error } = await supabase.auth.getSession();
        const isRecovery = hashParams.get('type') === 'recovery';
        
        if (!error && data.session) {
            if (isRecovery) {
                // Keep the hash but clean up the tokens if possible, or just keep it for authView
                // Actually, if we use access_token, the session is already established.
                // We just need to make sure authView sees type=recovery
                window.location.hash = '#auth?type=recovery';
            } else {
                history.replaceState(null, '', '/');
                window.location.hash = '#search';
            }
        } else {
            history.replaceState(null, '', '/');
        }
    }
    // ──────────────────────────────────────────────────────────────

    const router = new Router();
    router.init();

    // Initialize Reciter Selector
    const reciterSelect = document.getElementById('reciterSelect');
    if (reciterSelect) {
        api.reciters.forEach(reciter => {
            const option = document.createElement('option');
            option.value = reciter.id;
            option.textContent = reciter.name;
            reciterSelect.appendChild(option);
        });

        reciterSelect.value = api.currentReciterId;

        reciterSelect.addEventListener('change', (e) => {
            api.setReciter(e.target.value);
            router.handleRoute();
        });
    }

    // Initialize Theme Selector
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
        let savedTheme = localStorage.getItem('appTheme') || 'sepia';
        if (savedTheme === 'dark') savedTheme = 'sepia';
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeSelect.value = savedTheme;

        themeSelect.addEventListener('change', (e) => {
            const newTheme = e.target.value;
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('appTheme', newTheme);
        });
    }

    // Dynamic Auth Label (Top Right Widget)
    const updateAuthLabel = async () => {
        const user = await api.getUser();
        const topAuthWidget = document.getElementById('topAuthWidget');
        const authSidebarLink = document.querySelector('a[href="#auth"]');

        if (topAuthWidget) {
            topAuthWidget.onclick = () => { window.location.hash = '#auth'; };
            if (user) {
                topAuthWidget.style.display = 'none';
            } else {
                topAuthWidget.style.display = 'flex';
                topAuthWidget.innerHTML = `
                    <span>Sign In</span>
                    <svg class="top-auth-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>
                    </svg>
                `;
            }
        }

        if (authSidebarLink) {
            authSidebarLink.innerHTML = user
                ? '<span class="icon">👤</span> Profile'
                : '<span class="icon">👤</span> Sign In';
        }
    };

    updateAuthLabel();
    window.addEventListener('hashchange', updateAuthLabel);

    // Listen for real-time auth state changes (handles Google OAuth session)
    supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'SIGNED_OUT') {
            updateAuthLabel();
        }
    });

    // --- Streak & Activity Tracking ---
    const { default: streakTracker } = await import('./components/streakTracker.js');
    streakTracker.init();
    window.addEventListener('hashchange', () => streakTracker.updateFloatingUI());

    // --- Global Footer Integration ---
    const renderGlobalFooter = async () => {
        const tryRender = async (retries = 5) => {
            const anchor = document.getElementById('react-footer-anchor');
            if (!anchor) {
                if (retries > 0) {
                    setTimeout(() => tryRender(retries - 1), 100);
                }
                return;
            }

            // Import plain JS footer component
            const { default: Footer } = await import('./components/layout/Footer.js');
            
            // Load styles if not already present
            if (!document.getElementById('footer-styles')) {
                const link = document.createElement('link');
                link.id = 'footer-styles';
                link.rel = 'stylesheet';
                link.href = 'src/styles/footer.css';
                document.head.appendChild(link);
            }

            const hash = window.location.hash || '#read';
            const showSocials = hash === '#contact';
            const isKidsPage = hash === '#kids';
            const isSearchPage = hash === '#search';

            if (isKidsPage || isSearchPage) {
                anchor.innerHTML = '';
                return;
            }

            Footer.render(anchor, showSocials);
        };

        tryRender();
    };

    // Initial render and on route change
    renderGlobalFooter();
    window.addEventListener('hashchange', renderGlobalFooter);

    // --- Three.js Background Canvas ---
    const initThreeJSBackground = () => {
        const canvas = document.getElementById('bg-canvas');
        if (!canvas || !window.THREE) return;

        const scene = new window.THREE.Scene();
        const camera = new window.THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new window.THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        // Add subtle geometric particles
        const geometry = new window.THREE.BufferGeometry();
        const particlesCount = 300;
        const posArray = new Float32Array(particlesCount * 3);

        for (let i = 0; i < particlesCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 10;
        }

        geometry.setAttribute('position', new window.THREE.BufferAttribute(posArray, 3));
        const material = new window.THREE.PointsMaterial({
            size: 0.02,
            color: document.documentElement.getAttribute('data-theme') === 'sepia' ? 0x8d6e63 : 0x556b2f,
            transparent: true,
            opacity: 0.6
        });

        const particlesMesh = new window.THREE.Points(geometry, material);
        scene.add(particlesMesh);

        camera.position.z = 3;

        const animate = () => {
            requestAnimationFrame(animate);
            particlesMesh.rotation.y += 0.001;
            particlesMesh.rotation.x += 0.0005;
            renderer.render(scene, camera);
        };
        animate();

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Update color on theme change
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'data-theme') {
                    const theme = document.documentElement.getAttribute('data-theme');
                    material.color.setHex(theme === 'sepia' ? 0x8d6e63 : (theme === 'white' ? 0xbdc3c7 : 0x556b2f));
                }
            });
        });
        observer.observe(document.documentElement, { attributes: true });
    };

    initThreeJSBackground();

    // --- Active Nav Link Handler ---
    const updateActiveNav = () => {
        const hash = window.location.hash || '#search';
        document.querySelectorAll('.bottom-nav .nav-item').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === hash) {
                link.classList.add('active');
            }
        });
    };
    window.addEventListener('hashchange', updateActiveNav);
    updateActiveNav();

});
