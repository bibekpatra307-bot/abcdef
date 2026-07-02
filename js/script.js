// ============================================
// FILE: /krayvo-website/js/script.js
// Main Application Logic
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    // Initialize all systems
    initPlatformBar();
    initCategoryTabs();
    initSearch();
    initWishlist();
    initThemeToggle();
    initMobileMenu();
    updateWishlistCount();
    initSEO();

    // Load initial product grid
    await loadProductGrid('all', 'all');

    // Handle browser back/forward
    window.addEventListener('popstate', handlePopState);
}

// === Product Grid Rendering ===
async function loadProductGrid(category = 'all', platform = 'all', searchQuery = '') {
    const productGrid = document.getElementById('product-grid');
    const loadingSkeleton = document.getElementById('loading-skeleton');
    const platformContainer = document.getElementById('platform-container');

    // If platform view is active, don't interrupt
    if (isPlatformViewActive && platform === 'all' && category === 'all' && !searchQuery) {
        return;
    }
    // If a specific platform is selected via the bar, use platform handler
    if (platform !== 'all' && activePlatform !== platform) {
        const btn = document.querySelector(`.platform-btn[data-platform="${platform}"]`);
        if (btn) {
            handlePlatformSelect(platform, btn);
            return;
        }
    }

    // Hide platform container if visible
    if (platformContainer.style.display !== 'none') {
        platformContainer.style.display = 'none';
        document.getElementById('platform-iframe').src = '';
        document.getElementById('platform-gateway-overlay').style.display = 'none';
    }
    isPlatformViewActive = false;
    activePlatform = 'all';
    document.querySelectorAll('.platform-btn').forEach(b => b.classList.remove('active'));
    const allBtn = document.querySelector('.platform-btn[data-platform="all"]');
    if (allBtn) allBtn.classList.add('active');

    // Show loading skeleton
    productGrid.style.display = 'none';
    loadingSkeleton.style.display = 'block';

    try {
        const products = await fetchProducts({ category, platform: 'all', searchQuery, limit: 16 });

        // Further filter by platform if needed (client-side)
        let filteredProducts = products;
        if (platform !== 'all') {
            filteredProducts = products.filter(p => p.platform === platform);
        }

        renderProductCards(filteredProducts);
    } catch (error) {
        console.error('Error loading products:', error);
        renderProductCards(DEMO_PRODUCTS);
    } finally {
        loadingSkeleton.style.display = 'none';
        productGrid.style.display = 'grid';
        productGrid.style.opacity = '1';
    }
}

function renderProductCards(products) {
    const productGrid = document.getElementById('product-grid');
    if (!productGrid) return;

    if (products.length === 0) {
        productGrid.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1;text-align:center;padding:40px;">
                <p style="font-size:1.1rem;color:var(--text-muted);">No products found.</p>
                <p style="font-size:0.9rem;color:var(--text-muted);">Try a different search or category.</p>
            </div>`;
        return;
    }

    const wishlist = getWishlist();
    productGrid.innerHTML = products.map(product => {
        const isWishlisted = wishlist.some(w => w.id === product.id);
        const platformInfo = PLATFORMS[product.platform] || {};
        return `
        <article class="product-card" data-product-id="${product.id}" data-platform="${product.platform}" 
                 onclick="handleProductClick(event, '${product.id}', '${product.platform}')" 
                 aria-label="${product.brand} - ${product.title}">
            <div class="product-card-image">
                <img src="${product.image}" alt="${product.brand} ${product.title}" loading="lazy" 
                     onerror="this.src='https://picsum.photos/seed/fallback${product.id}/400/400'">
                <span class="product-card-badge ${platformInfo.badgeClass || ''}">${platformInfo.name || product.platform}</span>
                ${product.discount ? `<span class="product-card-discount">-${product.discount}%</span>` : ''}
                <button class="product-card-wishlist ${isWishlisted ? 'wishlisted' : ''}" 
                        onclick="toggleWishlistCard(event, '${product.id}')" 
                        aria-label="${isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}">
                    ${isWishlisted ? '♥' : '♡'}
                </button>
            </div>
            <div class="product-card-info">
                <span class="product-card-brand">${product.brand}</span>
                <h3 class="product-card-title">${product.title}</h3>
                <div class="product-card-price">
                    <span class="product-card-price-current">₹${product.price.toLocaleString('en-IN')}</span>
                    ${product.originalPrice ? `<span class="product-card-price-original">₹${product.originalPrice.toLocaleString('en-IN')}</span>` : ''}
                </div>
            </div>
        </article>`;
    }).join('');
}

// === Product Click Handler ===
function handleProductClick(event, productId, platform) {
    // Don't navigate if clicking wishlist button
    if (event.target.closest('.product-card-wishlist')) return;

    const platformUrl = getPlatformUrl(platform);
    if (platformUrl && platformUrl !== '#') {
        window.open(platformUrl, '_blank');
    }
    // Also save to recently viewed
    saveRecentlyViewed(productId);
}

// === Category Tabs ===
function initCategoryTabs() {
    const catTabs = document.querySelectorAll('.cat-tab');
    catTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            catTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            const category = this.dataset.category;

            // Deselect platform
            if (isPlatformViewActive) {
                handlePlatformSelect('all', document.querySelector('.platform-btn[data-platform="all"]'));
            }
            activePlatform = 'all';
            document.querySelectorAll('.platform-btn').forEach(b => b.classList.remove('active'));
            const allBtn = document.querySelector('.platform-btn[data-platform="all"]');
            if (allBtn) allBtn.classList.add('active');

            loadProductGrid(category, 'all');
        });
    });
}

// === Search Initialization ===
function initSearch() {
    const searchInput = document.getElementById('global-search');
    const searchClear = document.getElementById('search-clear');
    const autocomplete = document.getElementById('search-autocomplete');

    if (!searchInput) return;

    let debounceTimer;
    searchInput.addEventListener('input', function () {
        const query = this.value.trim();
        searchClear.style.display = query ? 'flex' : 'none';

        clearTimeout(debounceTimer);
        if (query.length >= 2) {
            debounceTimer = setTimeout(async () => {
                const suggestions = await getSearchSuggestions(query);
                renderAutocomplete(suggestions, query);
            }, 300);
        } else {
            autocomplete.style.display = 'none';
        }
    });

    searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            const query = this.value.trim();
            if (query) {
                autocomplete.style.display = 'none';
                loadProductGrid('all', 'all', query);
            }
        }
    });

    searchClear.addEventListener('click', function () {
        searchInput.value = '';
        searchClear.style.display = 'none';
        autocomplete.style.display = 'none';
        loadProductGrid('all', 'all');
        searchInput.focus();
    });

    // Close autocomplete on click outside
    document.addEventListener('click', function (e) {
        if (!e.target.closest('.search-container')) {
            autocomplete.style.display = 'none';
        }
    });
}

async function getSearchSuggestions(query) {
    const q = query.toLowerCase();
    const allProducts = [...DEMO_PRODUCTS];
    return allProducts.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    ).slice(0, 6);
}

function renderAutocomplete(suggestions, query) {
    const autocomplete = document.getElementById('search-autocomplete');
    if (!autocomplete) return;
    if (suggestions.length === 0) {
        autocomplete.style.display = 'none';
        return;
    }
    autocomplete.innerHTML = suggestions.map(s => `
        <div class="autocomplete-item" data-product-id="${s.id}" data-platform="${s.platform}">
            <span style="font-weight:600;">${s.brand}</span> — ${s.title.substring(0, 40)}...
        </div>
    `).join('');
    autocomplete.style.display = 'block';

    // Add click handlers
    autocomplete.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('click', function () {
            const platform = this.dataset.platform;
            const platformUrl = getPlatformUrl(platform);
            if (platformUrl && platformUrl !== '#') {
                window.open(platformUrl, '_blank');
            }
            autocomplete.style.display = 'none';
            document.getElementById('global-search').value = '';
            document.getElementById('search-clear').style.display = 'none';
        });
    });
}

// === Theme Toggle ===
function initThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    const icon = toggle?.querySelector('.theme-icon');
    if (!toggle) return;

    // Load saved theme
    const savedTheme = localStorage.getItem('krayvo-theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (icon) icon.textContent = '☀️';
    }

    toggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('krayvo-theme', next);
        if (icon) icon.textContent = next === 'dark' ? '☀️' : '🌙';
    });
}

// === Mobile Menu ===
function initMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const overlay = document.getElementById('mobile-nav-overlay');
    if (!btn || !overlay) return;

    btn.addEventListener('click', () => {
        overlay.classList.toggle('active');
        const isOpen = overlay.classList.contains('active');
        btn.setAttribute('aria-expanded', isOpen);
    });

    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
            overlay.classList.remove('active');
            btn.setAttribute('aria-expanded', 'false');
        }
    });
}

// === Recently Viewed ===
function saveRecentlyViewed(productId) {
    let viewed = JSON.parse(localStorage.getItem('krayvo-recently-viewed') || '[]');
    viewed = viewed.filter(id => id !== productId);
    viewed.unshift(productId);
    viewed = viewed.slice(0, 20);
    localStorage.setItem('krayvo-recently-viewed', JSON.stringify(viewed));
}

// === History State ===
function handlePopState(event) {
    if (event.state) {
        const { category, platform } = event.state;
        loadProductGrid(category || 'all', platform || 'all');
    }
}

// === Update wishlist count in header ===
function updateWishlistCount() {
    const count = getWishlistCount();
    const el = document.getElementById('header-wishlist-count');
    if (el) el.textContent = count;
}
