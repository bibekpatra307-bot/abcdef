// ============================================
// FILE: /krayvo-website/js/platforms.js
// Platform Routing, Iframe Detection & Gateway Logic
// ============================================

// Platform configuration
const PLATFORMS = {
    flipkart: {
        name: 'Flipkart',
        url: 'https://www.flipkart.com/',
        iframeSupported: true,
        dotClass: 'flipkart-dot',
        badgeClass: 'badge-flipkart',
    },
    savana: {
        name: 'Savana',
        url: 'https://www.savana.com/',
        iframeSupported: true,
        dotClass: 'savana-dot',
        badgeClass: 'badge-savana',
    },
    amazon: {
        name: 'Amazon',
        url: 'https://www.amazon.in/',
        iframeSupported: false,
        gatewayUrl: 'platforms/amazon-poster.html',
        dotClass: 'amazon-dot',
        badgeClass: 'badge-amazon',
    },
    myntra: {
        name: 'Myntra',
        url: 'https://www.myntra.com/',
        iframeSupported: false,
        gatewayUrl: 'platforms/myntra-poster.html',
        dotClass: 'myntra-dot',
        badgeClass: 'badge-myntra',
    },
    ajio: {
        name: 'Ajio',
        url: 'https://www.ajio.com/',
        iframeSupported: false,
        gatewayUrl: 'platforms/ajio-poster.html',
        dotClass: 'ajio-dot',
        badgeClass: 'badge-ajio',
    },
    meesho: {
        name: 'Meesho',
        url: 'https://www.meesho.com/',
        iframeSupported: false,
        gatewayUrl: 'platforms/meesho-poster.html',
        dotClass: 'meesho-dot',
        badgeClass: 'badge-meesho',
    },
};

let activePlatform = 'all';
let isPlatformViewActive = false;

// Initialize platform bar event listeners
function initPlatformBar() {
    const platformBtns = document.querySelectorAll('.platform-btn');
    platformBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const platformKey = this.dataset.platform;
            handlePlatformSelect(platformKey, this);
        });
    });
}

// Handle platform selection
async function handlePlatformSelect(platformKey, btnElement) {
    // Update active button state
    document.querySelectorAll('.platform-btn').forEach(b => b.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');

    // Reset category tabs to "For You"
    document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
    const forYouTab = document.querySelector('.cat-tab[data-category="all"]');
    if (forYouTab) forYouTab.classList.add('active');

    activePlatform = platformKey;
    const productGrid = document.getElementById('product-grid');
    const platformContainer = document.getElementById('platform-container');
    const loadingSkeleton = document.getElementById('loading-skeleton');
    const platformTransition = document.getElementById('platform-transition');
    const platformIframe = document.getElementById('platform-iframe');
    const gatewayOverlay = document.getElementById('platform-gateway-overlay');

    if (platformKey === 'all') {
        // Return to product grid
        isPlatformViewActive = false;
        await fadeOutElement(platformContainer);
        platformContainer.style.display = 'none';
        platformIframe.src = '';
        gatewayOverlay.style.display = 'none';
        productGrid.style.display = '';
        await fadeInElement(productGrid);
        loadProductGrid('all', 'all');
    } else {
        const platform = PLATFORMS[platformKey];
        if (!platform) return;

        // Hide product grid with fade
        isPlatformViewActive = true;
        await fadeOutElement(productGrid);
        productGrid.style.display = 'none';

        // Show platform container
        platformContainer.style.display = 'block';
        platformTransition.classList.remove('hidden');
        platformIframe.style.display = 'none';
        gatewayOverlay.style.display = 'none';
        platformContainer.classList.add('fade-in');

        if (platform.iframeSupported) {
            // Load real iframe (Flipkart, Savana)
            platformIframe.src = platform.url;
            platformIframe.style.display = 'block';
            gatewayOverlay.style.display = 'none';
            platformIframe.onload = () => {
                platformTransition.classList.add('hidden');
            };
            // Fallback if iframe fails to load
            setTimeout(() => {
                if (platformTransition && !platformTransition.classList.contains('hidden')) {
                    platformTransition.classList.add('hidden');
                }
            }, 5000);
        } else {
            // Load gateway page (Amazon, Myntra, Ajio, Meesho)
            platformIframe.style.display = 'block';
            platformIframe.src = platform.gatewayUrl;
            gatewayOverlay.style.display = 'block';
            platformIframe.onload = () => {
                platformTransition.classList.add('hidden');
            };
            // Set up gateway overlay click → open real site
            gatewayOverlay.onclick = function (e) {
                e.stopPropagation();
                window.open(platform.url, '_blank');
            };
            // Also capture clicks on the iframe itself via the overlay
            setTimeout(() => {
                if (platformTransition && !platformTransition.classList.contains('hidden')) {
                    platformTransition.classList.add('hidden');
                }
            }, 3000);
        }

        // Fade in
        setTimeout(() => {
            platformContainer.classList.remove('fade-in');
        }, 400);
    }
}

// Fade helpers
function fadeOutElement(el) {
    return new Promise(resolve => {
        if (!el || el.style.display === 'none') { resolve(); return; }
        el.style.transition = 'opacity 0.25s ease';
        el.style.opacity = '0';
        setTimeout(() => {
            el.style.opacity = '';
            el.style.transition = '';
            resolve();
        }, 250);
    });
}
function fadeInElement(el) {
    return new Promise(resolve => {
        if (!el) { resolve(); return; }
        el.style.opacity = '0';
        el.style.display = '';
        requestAnimationFrame(() => {
            el.style.transition = 'opacity 0.3s ease';
            el.style.opacity = '1';
            setTimeout(() => {
                el.style.opacity = '';
                el.style.transition = '';
                resolve();
            }, 300);
        });
    });
}

// Get platform URL for external linking
function getPlatformUrl(platformKey) {
    return PLATFORMS[platformKey]?.url || '#';
}
