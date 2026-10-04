// Kopi Koffee - Core Application Logic
// Customer Ordering, Real-time Cart, Table Management, & Protected Kitchen Display System

const STAFF_PIN_CODE = "10699";

let currentTable = localStorage.getItem('kopiCurrentTable') || '';
let cart = JSON.parse(localStorage.getItem('kopiCart')) || [];
let activeMainGroup = 'categories';
let activeSubcat = 'all';
let viewLayout = localStorage.getItem('kopiViewLayout') || 'grid';
let searchQuery = '';
let currentView = 'portal'; // 'portal' | 'customer' | 'admin'
let adminFilter = 'all';
let soundEnabled = localStorage.getItem('kopiSoundEnabled') !== 'false';
let customerActiveOrderId = localStorage.getItem('kopiActiveOrderId') || null;

// PIN State
let enteredPin = "";

// ==========================================================================
// AUDIO SYNTHESIS (Clean native chimes via Web Audio API)
// ==========================================================================
class SoundFX {
    static getContext() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    }

    static playChime(freqs = [523.25, 659.25, 783.99], type = 'sine') {
        if (!soundEnabled) return;
        try {
            const ctx = this.getContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            
            freqs.forEach((freq, index) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = type;
                osc.frequency.setValueAtTime(freq, now + index * 0.1);
                
                gain.gain.setValueAtTime(0.001, now + index * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.3, now + index * 0.1 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.1 + 0.35);
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.start(now + index * 0.1);
                osc.stop(now + index * 0.1 + 0.4);
            });
        } catch (e) {
            console.warn('Audio not allowed or supported', e);
        }
    }

    static orderSuccess() {
        this.playChime([523.25, 659.25, 1046.50]); // C5, E5, C6
    }

    static kitchenAlert() {
        this.playChime([440, 554.37, 659.25, 880]); // A4, C#5, E5, A5
    }

    static itemAdded() {
        this.playChime([659.25, 880]); // E5, A5
    }

    static accessGranted() {
        this.playChime([440, 659.25, 880]); // A4, E5, A5
    }

    static accessDenied() {
        this.playChime([300, 220], 'sawtooth');
    }
}

// ==========================================================================
// TOAST NOTIFICATIONS
// ==========================================================================
function showToast(message, icon = '✨') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3000);
}

// ==========================================================================
// INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    updateCartTableUI();
    renderMainGroups();
    renderSubcategories();
    renderMenu();
    updateCartUI();
    renderAdminKDS();
    checkCustomerOrderStatus();

    // Table input listeners
    const modalCustomInput = document.getElementById('table-modal-custom');
    if (modalCustomInput) {
        modalCustomInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                confirmTableAndSubmit();
            }
        });
    }

    const cartCustomInput = document.getElementById('cart-custom-table');
    if (cartCustomInput) {
        cartCustomInput.addEventListener('input', (e) => {
            setCartTable(e.target.value.trim(), false);
        });
        cartCustomInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                submitOrder();
            }
        });
    }

    // Check URL parameters for direct view routing (e.g. ?view=customer or ?view=kitchen)
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    if (viewParam === 'customer') {
        enterCustomerView();
    } else if (viewParam === 'kitchen' || viewParam === 'admin') {
        if (sessionStorage.getItem('kopiStaffAuth') === 'true') {
            enterAdminView();
        } else {
            openPinModal();
        }
    } else {
        // Default to portal welcome screen
        switchView('portal');
    }

    // Setup Search
    const searchInput = document.getElementById('menu-search');
    const searchClear = document.getElementById('search-clear');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            if (searchClear) {
                if (searchQuery.length > 0) {
                    searchClear.classList.add('visible');
                } else {
                    searchClear.classList.remove('visible');
                }
            }
            renderMenu();
        });
    }

    if (searchClear) {
        searchClear.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            searchQuery = '';
            searchClear.classList.remove('visible');
            renderMenu();
        });
    }

    // Sound toggle in admin
    const soundToggle = document.getElementById('sound-toggle');
    if (soundToggle) {
        updateSoundButtonUI();
        soundToggle.addEventListener('click', () => {
            soundEnabled = !soundEnabled;
            localStorage.setItem('kopiSoundEnabled', soundEnabled);
            updateSoundButtonUI();
            if (soundEnabled) SoundFX.playChime([523, 659]);
        });
    }

    // Keyboard support for PIN entry
    window.addEventListener('keydown', (e) => {
        const overlay = document.getElementById('pin-modal-overlay');
        if (overlay && overlay.classList.contains('open')) {
            if (e.key >= '0' && e.key <= '9') {
                appendPinDigit(e.key);
            } else if (e.key === 'Backspace') {
                clearPin();
            } else if (e.key === 'Enter') {
                submitCurrentPin();
            } else if (e.key === 'Escape') {
                closePinModal();
            }
        }
    });

    // Real-time synchronization across browser tabs
    window.addEventListener('storage', (e) => {
        if (e.key === 'kopiOrders') {
            const previousCount = window.__lastOrderCount || 0;
            const orders = JSON.parse(e.newValue || '[]');
            if (orders.length > previousCount && currentView === 'admin') {
                SoundFX.kitchenAlert();
                showToast("Nouvelle commande reçue en cuisine !", "🔔");
            }
            window.__lastOrderCount = orders.length;
            renderAdminKDS();
            checkCustomerOrderStatus();
        }
    });

    const initialOrders = JSON.parse(localStorage.getItem('kopiOrders') || '[]');
    window.__lastOrderCount = initialOrders.length;
});

function updateSoundButtonUI() {
    const btn = document.getElementById('sound-toggle');
    if (!btn) return;
    if (soundEnabled) {
        btn.classList.add('sound-on');
        btn.innerHTML = `🔔 Son Activé`;
    } else {
        btn.classList.remove('sound-on');
        btn.innerHTML = `🔕 Son Coupé`;
    }
}

// ==========================================================================
// PIN SECURITY SYSTEM (Passcode: 10699)
// ==========================================================================
function openPinModal() {
    enteredPin = "";
    updatePinDots();
    const errorEl = document.getElementById('pin-error-msg');
    if (errorEl) errorEl.innerText = "";
    
    const overlay = document.getElementById('pin-modal-overlay');
    if (overlay) overlay.classList.add('open');
}

function closePinModal() {
    const overlay = document.getElementById('pin-modal-overlay');
    if (overlay) overlay.classList.remove('open');
    enteredPin = "";
}

function handlePinOverlayClick(e) {
    if (e.target.id === 'pin-modal-overlay') {
        closePinModal();
    }
}

function appendPinDigit(digit) {
    if (enteredPin.length < 5) {
        enteredPin += digit;
        updatePinDots();
        
        // Auto-validate when 5 digits are entered
        if (enteredPin.length === 5) {
            setTimeout(submitCurrentPin, 150);
        }
    }
}

function clearPin() {
    enteredPin = "";
    updatePinDots();
    const errorEl = document.getElementById('pin-error-msg');
    if (errorEl) errorEl.innerText = "";
}

function updatePinDots() {
    for (let i = 0; i < 5; i++) {
        const dot = document.getElementById(`dot-${i}`);
        if (dot) {
            if (i < enteredPin.length) {
                dot.classList.add('filled');
            } else {
                dot.classList.remove('filled');
            }
        }
    }
}

function submitCurrentPin() {
    const errorEl = document.getElementById('pin-error-msg');
    const modal = document.getElementById('pin-modal-card');

    if (enteredPin === STAFF_PIN_CODE) {
        sessionStorage.setItem('kopiStaffAuth', 'true');
        SoundFX.accessGranted();
        showToast("Accès Cuisine Autorisé", "🔓");
        closePinModal();
        enterAdminView();
    } else {
        SoundFX.accessDenied();
        if (errorEl) errorEl.innerText = "Code PIN incorrect. Veuillez réessayer.";
        if (modal) {
            modal.classList.add('shake');
            setTimeout(() => modal.classList.remove('shake'), 450);
        }
        enteredPin = "";
        updatePinDots();
    }
}

// ==========================================================================
// VIEW SWITCHING (Portal / Customer / Kitchen)
// ==========================================================================
function switchView(view) {
    currentView = view;
    const portalView = document.getElementById('portal-view');
    const customerView = document.getElementById('customer-view');
    const adminView = document.getElementById('admin-view');
    const siteHeader = document.getElementById('site-header');
    const headerStatusText = document.getElementById('header-status-text');
    const headerSubtitleText = document.getElementById('header-subtitle-text');
    const headerExitBtn = document.getElementById('header-exit-btn');
    const cartBar = document.getElementById('floating-cart-bar');

    // Hide all main containers first
    if (portalView) portalView.classList.add('hidden');
    if (customerView) customerView.classList.add('hidden');
    if (adminView) adminView.classList.add('hidden');
    if (cartBar) cartBar.classList.add('hidden');

    if (view === 'portal') {
        if (portalView) portalView.classList.remove('hidden');
        if (siteHeader) siteHeader.classList.add('hidden');
    } else if (view === 'customer') {
        if (customerView) customerView.classList.remove('hidden');
        if (siteHeader) siteHeader.classList.remove('hidden');
        if (headerStatusText) headerStatusText.innerText = "Ouvert • Service à table";
        if (headerSubtitleText) headerSubtitleText.innerText = "Food & Drink • Café Lounge";
        if (headerExitBtn) headerExitBtn.innerHTML = "<span>✕</span> Changer d'espace";
        updateCartUI();
    } else if (view === 'admin') {
        if (adminView) adminView.classList.remove('hidden');
        if (siteHeader) siteHeader.classList.remove('hidden');
        if (headerStatusText) headerStatusText.innerText = "👨‍🍳 Écran Cuisine & Caisse (Direct)";
        if (headerSubtitleText) headerSubtitleText.innerText = "Console de Préparation & Commandes";
        if (headerExitBtn) headerExitBtn.innerHTML = "<span>🔒</span> Verrouiller / Quitter";
        renderAdminKDS();
    }
}

function enterCustomerView() {
    switchView('customer');
    renderMainGroups();
    renderMenu();
}

function enterAdminView() {
    switchView('admin');
}

function returnToPortal() {
    if (currentView === 'admin') {
        sessionStorage.removeItem('kopiStaffAuth');
        showToast("Session cuisine verrouillée", "🔒");
    }
    switchView('portal');
}

// ==========================================================================
// TABLE SELECTION LOGIC (In-Cart & Order-Time Prompt)
// ==========================================================================
// TABLE SELECTION LOGIC (Direct Input in Cart & Prompt Modal)
// ==========================================================================
function setCartTable(num, notify = true) {
    const trimmed = String(num || '').trim();
    if (!trimmed) {
        currentTable = '';
        localStorage.removeItem('kopiCurrentTable');
    } else {
        currentTable = trimmed;
        localStorage.setItem('kopiCurrentTable', currentTable);
    }
    updateCartTableUI();
    if (notify && currentTable) {
        showToast(`Table ${currentTable} enregistrée`, "📍");
    }
}

function setTable(num) {
    setCartTable(num);
}

function updateCartTableUI() {
    const label = document.getElementById('cart-selected-table-label');
    const customInput = document.getElementById('cart-custom-table');

    if (label) {
        if (currentTable) {
            label.innerText = `Table ${currentTable}`;
            label.style.color = 'var(--gold-primary)';
        } else {
            label.innerText = 'Non renseigné';
            label.style.color = 'var(--text-muted)';
        }
    }

    if (customInput && customInput.value !== currentTable) {
        customInput.value = currentTable || '';
    }
}

function openTableModal() {
    const overlay = document.getElementById('table-modal-overlay');
    const customInput = document.getElementById('table-modal-custom');
    if (customInput) {
        customInput.value = currentTable || '';
    }
    if (overlay) overlay.classList.add('open');
    if (customInput) {
        setTimeout(() => {
            customInput.focus();
            customInput.select();
        }, 200);
    }
}

function closeTableModal() {
    const overlay = document.getElementById('table-modal-overlay');
    if (overlay) overlay.classList.remove('open');
}

function handleTableOverlayClick(e) {
    if (e.target.id === 'table-modal-overlay') {
        closeTableModal();
    }
}

function confirmTableAndSubmit() {
    const customInput = document.getElementById('table-modal-custom');
    const customVal = customInput ? customInput.value.trim() : '';

    if (!customVal) {
        alert("Veuillez indiquer le numéro de votre table.");
        if (customInput) customInput.focus();
        return;
    }

    setCartTable(customVal, false);
    closeTableModal();
    submitOrder();
}

// ==========================================================================
// CATEGORY NAVIGATION & DIRECTORY HUB
// ==========================================================================
function renderMainGroups() {
    const scroller = document.getElementById('main-groups-scroller');
    if (!scroller) return;

    scroller.innerHTML = '';
    MAIN_GROUPS.forEach(group => {
        const btn = document.createElement('button');
        btn.className = `group-tab-btn ${group.id === activeMainGroup ? 'active' : ''}`;
        btn.innerHTML = `<span>${group.icon}</span> <span>${group.name}</span>`;
        btn.addEventListener('click', () => {
            if (group.id === 'categories') {
                backToCategories();
            } else {
                selectCategory(group.id);
            }
        });
        scroller.appendChild(btn);
    });

    const activeBtn = scroller.querySelector('.group-tab-btn.active');
    if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
}

function selectCategory(groupId) {
    activeMainGroup = groupId;
    activeSubcat = 'all';

    const searchInput = document.getElementById('menu-search');
    const searchClear = document.getElementById('search-clear');
    if (searchQuery) {
        searchQuery = '';
        if (searchInput) searchInput.value = '';
        if (searchClear) searchClear.classList.remove('visible');
    }

    const group = MAIN_GROUPS.find(g => g.id === groupId);
    const banner = document.getElementById('category-banner');
    const bannerIcon = document.getElementById('category-banner-icon');
    const bannerTitle = document.getElementById('category-banner-title');
    const bannerCount = document.getElementById('category-banner-count');

    if (banner && group) {
        banner.style.display = 'flex';
        if (bannerIcon) bannerIcon.innerText = group.icon;
        if (bannerTitle) bannerTitle.innerText = group.name;

        const count = MENU_ITEMS.filter(i => i.groupId === groupId).length;
        if (bannerCount) bannerCount.innerText = `${count} délices au menu`;
    }

    renderMainGroups();
    renderSubcategories();
    renderMenu();

    if (banner) {
        banner.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function backToCategories() {
    activeMainGroup = 'categories';
    activeSubcat = 'all';

    const banner = document.getElementById('category-banner');
    if (banner) banner.style.display = 'none';

    const subcatsContainer = document.getElementById('subcategories-container');
    if (subcatsContainer) subcatsContainer.style.display = 'none';

    renderMainGroups();
    renderMenu();

    const scroller = document.getElementById('main-groups-scroller');
    if (scroller) {
        scroller.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function renderSubcategories() {
    const container = document.getElementById('subcategories-container');
    if (!container) return;

    container.innerHTML = '';

    if (activeMainGroup === 'categories') {
        container.style.display = 'none';
        return;
    }

    const subcats = MENU_CATEGORIES.filter(c => c.groupId === activeMainGroup && c.id !== 'all');
    if (subcats.length <= 1) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'flex';

    const totalCount = MENU_ITEMS.filter(i => i.groupId === activeMainGroup).length;
    const allPill = document.createElement('button');
    allPill.className = `subcat-pill ${activeSubcat === 'all' ? 'active' : ''}`;
    allPill.innerText = `Tous (${totalCount})`;
    allPill.addEventListener('click', () => {
        activeSubcat = 'all';
        renderSubcategories();
        renderMenu();
    });
    container.appendChild(allPill);

    subcats.forEach(sub => {
        const subCount = MENU_ITEMS.filter(i => i.categoryId === sub.id).length;
        const pill = document.createElement('button');
        pill.className = `subcat-pill ${sub.id === activeSubcat ? 'active' : ''}`;
        pill.innerHTML = `${sub.icon} ${sub.name} <span style="opacity: 0.75; font-size: 0.75rem;">(${subCount})</span>`;
        pill.addEventListener('click', () => {
            activeSubcat = sub.id;
            renderSubcategories();
            renderMenu();
        });
        container.appendChild(pill);
    });
}

function setViewLayout(layout) {
    viewLayout = layout;
    localStorage.setItem('kopiViewLayout', layout);
    document.querySelectorAll('.layout-btn').forEach(btn => {
        if (btn.dataset.layout === layout) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    renderMenu();
}

// ==========================================================================
// MENU & CATEGORY HUB RENDERING
// ==========================================================================
function renderCategoryHub() {
    const container = document.getElementById('menu-sections-container');
    if (!container) return;

    const diningGroups = MAIN_GROUPS.filter(g => g.id !== 'categories');

    let cardsHtml = diningGroups.map(group => {
        const count = MENU_ITEMS.filter(item => item.groupId === group.id).length;
        const badgeText = group.badge || `${count} articles`;
        return `
            <div class="category-card" onclick="selectCategory('${group.id}')" role="button" tabindex="0" 
                 onkeydown="if(event.key==='Enter') selectCategory('${group.id}')" aria-label="${group.name}">
                <img class="category-card-img" src="${group.image}" alt="${group.name}" loading="lazy" 
                     onerror="this.src='https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=600&q=80'">
                <div class="category-card-overlay"></div>
                <div class="category-card-badge">${badgeText}</div>
                <div class="category-card-content">
                    <div class="category-card-header">
                        <span class="category-card-icon">${group.icon}</span>
                        <h3 class="category-card-title">${group.name}</h3>
                    </div>
                    <p class="category-card-desc">${group.desc || 'Découvrez notre sélection gourmande et raffinée.'}</p>
                    <span class="category-card-cta">Explorer la sélection ➔</span>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="category-hub">
            <div class="category-hub-intro">
                <h2 class="category-hub-title">Notre Carte Gourmande</h2>
                <p class="category-hub-subtitle">Appuyez sur une catégorie pour afficher nos cafés, délices et formules préparés sur commande</p>
            </div>
            <div class="category-hub-grid">
                ${cardsHtml}
            </div>
        </div>
    `;
}

function renderMenu() {
    const container = document.getElementById('menu-sections-container');
    const banner = document.getElementById('category-banner');
    if (!container) return;

    // Search Mode takes precedence over category browsing
    if (searchQuery) {
        if (banner) banner.style.display = 'none';
        const subcatsContainer = document.getElementById('subcategories-container');
        if (subcatsContainer) subcatsContainer.style.display = 'none';

        const matchingItems = MENU_ITEMS.filter(item => 
            item.name.toLowerCase().includes(searchQuery) ||
            item.description.toLowerCase().includes(searchQuery)
        );

        if (matchingItems.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
                    <div style="font-size: 3rem; margin-bottom: 12px;">🔍</div>
                    <h3 style="font-size: 1.3rem; color: var(--gold-light); margin-bottom: 8px;">Aucun produit trouvé</h3>
                    <p>Aucun article ne correspond à "${searchQuery}". Essayez avec un autre mot ou parcourez nos catégories.</p>
                    <button class="category-back-btn" style="margin-top: 18px;" onclick="backToCategories()">
                        Voir Toutes les Catégories
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        const searchSection = createCategorySection(`Résultats pour "${searchQuery}"`, "🔎", matchingItems);
        container.appendChild(searchSection);
        return;
    }

    // Level 1: Category Directory Hub (Clean, no clutter, no 126 products dumped)
    if (activeMainGroup === 'categories') {
        if (banner) banner.style.display = 'none';
        const subcatsContainer = document.getElementById('subcategories-container');
        if (subcatsContainer) subcatsContainer.style.display = 'none';
        renderCategoryHub();
        return;
    }

    // Level 2: Specific Category Items (Only elements of that category)
    if (banner) {
        banner.style.display = 'flex';
        const group = MAIN_GROUPS.find(g => g.id === activeMainGroup);
        if (group) {
            const bannerIcon = document.getElementById('category-banner-icon');
            const bannerTitle = document.getElementById('category-banner-title');
            const bannerCount = document.getElementById('category-banner-count');
            if (bannerIcon) bannerIcon.innerText = group.icon;
            if (bannerTitle) bannerTitle.innerText = group.name;
            const count = MENU_ITEMS.filter(i => i.groupId === activeMainGroup).length;
            if (bannerCount) bannerCount.innerText = `${count} délices au menu`;
        }
    }
    renderSubcategories();

    let filteredItems = MENU_ITEMS.filter(item => item.groupId === activeMainGroup);

    if (activeSubcat !== 'all') {
        filteredItems = filteredItems.filter(item => item.categoryId === activeSubcat);
    }

    container.innerHTML = '';

    if (filteredItems.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
                <div style="font-size: 3rem; margin-bottom: 12px;">🍽️</div>
                <h3 style="font-size: 1.3rem; color: var(--gold-light); margin-bottom: 8px;">Aucun produit dans cette sous-catégorie</h3>
                <button class="category-back-btn" style="margin-top: 14px;" onclick="backToCategories()">
                    ← Revenir aux Catégories
                </button>
            </div>
        `;
        return;
    }

    if (activeSubcat === 'all') {
        const subcats = MENU_CATEGORIES.filter(c => c.groupId === activeMainGroup && c.id !== 'all');
        if (subcats.length > 1) {
            subcats.forEach(sub => {
                const itemsInSub = filteredItems.filter(i => i.categoryId === sub.id);
                if (itemsInSub.length > 0) {
                    const section = createCategorySection(sub.name, sub.icon, itemsInSub);
                    container.appendChild(section);
                }
            });
        } else {
            const currentGroup = MAIN_GROUPS.find(g => g.id === activeMainGroup);
            const section = createCategorySection(currentGroup ? currentGroup.name : "Menu", currentGroup ? currentGroup.icon : "✨", filteredItems);
            container.appendChild(section);
        }
    } else {
        const cat = MENU_CATEGORIES.find(c => c.id === activeSubcat);
        const section = createCategorySection(cat ? cat.name : "Sélection", cat ? cat.icon : "✨", filteredItems);
        container.appendChild(section);
    }
}

function createCategorySection(title, icon, items) {
    const section = document.createElement('div');
    section.className = 'category-section';

    section.innerHTML = `
        <div class="section-header">
            <span style="font-size: 1.4rem;">${icon}</span>
            <h2 class="section-title">${title}</h2>
            <span class="section-count">${items.length} articles</span>
        </div>
        <div class="menu-grid ${viewLayout === 'list' ? 'layout-list' : ''}"></div>
    `;

    const grid = section.querySelector('.menu-grid');
    items.forEach(item => {
        const card = createProductCard(item);
        grid.appendChild(card);
    });

    return section;
}

function createProductCard(item) {
    const card = document.createElement('div');
    card.className = 'menu-card';
    card.id = `card-${item.id}`;

    const cartItem = cart.find(ci => ci.id === item.id);
    const qtyInCart = cartItem ? cartItem.quantity : 0;

    const badgeHtml = item.badge 
        ? `<div class="card-badge">${item.badge}</div>` 
        : '';

    card.innerHTML = `
        <div class="card-image-wrap">
            <img class="card-img" src="${item.image}" alt="${item.name}" loading="lazy" 
                 onerror="this.src='https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=600&q=80'">
            ${badgeHtml}
        </div>
        <div class="card-content">
            <div class="card-top">
                <h3 class="card-title">${item.name}</h3>
                <div class="card-price">${item.price} DT</div>
            </div>
            <p class="card-desc">${item.description}</p>
            <div class="card-actions">
                <div class="card-stepper">
                    <button class="step-btn" onclick="changeCardQuantity('${item.id}', -1)" aria-label="Moins">-</button>
                    <span class="step-qty" id="qty-${item.id}">${qtyInCart > 0 ? qtyInCart : 1}</span>
                    <button class="step-btn" onclick="changeCardQuantity('${item.id}', 1)" aria-label="Plus">+</button>
                </div>
                <button class="add-btn" onclick="addFromCard('${item.id}')">
                    <span>${qtyInCart > 0 ? '✓ Ajouté' : '+ Ajouter'}</span>
                </button>
            </div>
        </div>
    `;

    return card;
}

let tempCardQuantities = {};

function changeCardQuantity(itemId, delta) {
    let current = tempCardQuantities[itemId] || 1;
    current += delta;
    if (current < 1) current = 1;
    tempCardQuantities[itemId] = current;
    
    const qtySpan = document.getElementById(`qty-${itemId}`);
    if (qtySpan) qtySpan.innerText = current;
}

function addFromCard(itemId) {
    const item = MENU_ITEMS.find(i => i.id === itemId);
    if (!item) return;

    const qty = tempCardQuantities[itemId] || 1;
    addToCart(item, qty);
    
    tempCardQuantities[itemId] = 1;
    const qtySpan = document.getElementById(`qty-${itemId}`);
    if (qtySpan) qtySpan.innerText = 1;

    SoundFX.itemAdded();
    showToast(`${qty}x ${item.name} ajouté(s)`, "🛒");
}

// ==========================================================================
// CART MANAGEMENT
// ==========================================================================
function addToCart(item, quantity = 1) {
    const existingIndex = cart.findIndex(ci => ci.id === item.id);
    if (existingIndex > -1) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push({
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: quantity
        });
    }

    saveCart();
    updateCartUI();
    renderCartDrawerItems();
}

function updateCartQuantity(itemId, delta) {
    const index = cart.findIndex(ci => ci.id === itemId);
    if (index > -1) {
        cart[index].quantity += delta;
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
    }
    saveCart();
    updateCartUI();
    renderCartDrawerItems();
    renderMenu();
}

function removeFromCart(itemId) {
    cart = cart.filter(ci => ci.id !== itemId);
    saveCart();
    updateCartUI();
    renderCartDrawerItems();
    renderMenu();
}

function saveCart() {
    localStorage.setItem('kopiCart', JSON.stringify(cart));
}

function updateCartUI() {
    if (currentView !== 'customer') return;

    const bar = document.getElementById('floating-cart-bar');
    const badge = document.getElementById('cart-badge');
    const totalEl = document.getElementById('cart-bar-total');

    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (totalCount > 0) {
        if (bar) bar.classList.remove('hidden');
        if (badge) badge.innerText = totalCount;
        if (totalEl) totalEl.innerText = `${totalPrice.toFixed(1)} DT`;
    } else {
        if (bar) bar.classList.add('hidden');
    }
}

// ==========================================================================
// CART DRAWER (SLIDE-OVER)
// ==========================================================================
function openCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    updateCartTableUI();
    renderCartDrawerItems();
    if (drawer) drawer.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    if (drawer) drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    document.body.style.overflow = '';
}

function renderCartDrawerItems() {
    const body = document.getElementById('drawer-items-list');
    const totalSpan = document.getElementById('drawer-total-price');
    if (!body) return;

    if (cart.length === 0) {
        body.innerHTML = `
            <div class="cart-empty-message">
                <div style="font-size: 2.5rem; margin-bottom: 8px;">☕</div>
                <p>Votre panier est vide pour le moment.</p>
                <p style="font-size: 0.85rem; margin-top: 6px; color: var(--gold-light);">Sélectionnez vos délices pour commencer votre commande !</p>
            </div>
        `;
        if (totalSpan) totalSpan.innerText = '0.0 DT';
        return;
    }

    body.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const row = document.createElement('div');
        row.className = 'cart-item-row';
        row.innerHTML = `
            <img class="cart-item-thumb" src="${item.image}" alt="${item.name}" 
                 onerror="this.src='https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=600&q=80'">
            <div class="cart-item-info">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">${itemTotal.toFixed(1)} DT <span style="font-size: 0.75rem; color: var(--text-muted);">(${item.price} DT/u)</span></div>
            </div>
            <div class="card-stepper" style="background: rgba(0,0,0,0.45);">
                <button class="step-btn" onclick="updateCartQuantity('${item.id}', -1)">-</button>
                <span class="step-qty">${item.quantity}</span>
                <button class="step-btn" onclick="updateCartQuantity('${item.id}', 1)">+</button>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart('${item.id}')" title="Supprimer">🗑️</button>
        `;
        body.appendChild(row);
    });

    if (totalSpan) totalSpan.innerText = `${total.toFixed(1)} DT`;
}

// ==========================================================================
// SUBMIT ORDER TO KITCHEN
// ==========================================================================
function submitOrder() {
    if (cart.length === 0) {
        alert("Votre panier est vide !");
        return;
    }

    // Prompt table selection modal if table is not yet chosen
    if (!currentTable || currentTable.trim() === '') {
        openTableModal();
        return;
    }

    const notesInput = document.getElementById('order-special-notes');
    const notes = notesInput ? notesInput.value.trim() : '';

    const totalPrice = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);

    const newOrder = {
        id: 'KP-' + Date.now().toString().slice(-6),
        table: currentTable,
        items: [...cart],
        notes: notes,
        total: totalPrice,
        status: 'pending',
        timestamp: new Date().toISOString(),
        timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const orders = JSON.parse(localStorage.getItem('kopiOrders') || '[]');
    orders.unshift(newOrder);
    localStorage.setItem('kopiOrders', JSON.stringify(orders));

    customerActiveOrderId = newOrder.id;
    localStorage.setItem('kopiActiveOrderId', customerActiveOrderId);

    cart = [];
    saveCart();
    updateCartUI();
    if (notesInput) notesInput.value = '';

    closeCartDrawer();
    SoundFX.orderSuccess();
    
    showCustomerOrderModal(newOrder);
    renderAdminKDS();
}

// ==========================================================================
// CUSTOMER ORDER STATUS TRACKER MODAL
// ==========================================================================
function checkCustomerOrderStatus() {
    if (!customerActiveOrderId) return;
    const orders = JSON.parse(localStorage.getItem('kopiOrders') || '[]');
    const order = orders.find(o => o.id === customerActiveOrderId);
    if (!order) return;

    updateCustomerOrderModalSteps(order.status);
}

function showCustomerOrderModal(order) {
    const overlay = document.getElementById('status-modal-overlay');
    const modalOrderNum = document.getElementById('modal-order-id');
    const modalTable = document.getElementById('modal-table-num');

    if (modalOrderNum) modalOrderNum.innerText = `#${order.id}`;
    if (modalTable) modalTable.innerText = `Table ${order.table}`;

    updateCustomerOrderModalSteps(order.status);
    if (overlay) overlay.classList.add('open');
}

function updateCustomerOrderModalSteps(status) {
    const step1 = document.getElementById('step-received');
    const step2 = document.getElementById('step-prep');
    const step3 = document.getElementById('step-ready');
    const statusDesc = document.getElementById('modal-status-description');

    [step1, step2, step3].forEach(s => {
        if (s) s.classList.remove('active', 'completed');
    });

    if (status === 'pending') {
        if (step1) step1.classList.add('active');
        if (statusDesc) statusDesc.innerText = "Votre commande est bien reçue par le comptoir et attend la préparation.";
    } else if (status === 'preparing') {
        if (step1) step1.classList.add('completed');
        if (step2) step2.classList.add('active');
        if (statusDesc) statusDesc.innerText = "Notre barista & cuisine préparent actuellement vos délices fraîchement !";
    } else if (status === 'completed') {
        if (step1) step1.classList.add('completed');
        if (step2) step2.classList.add('completed');
        if (step3) step3.classList.add('active', 'completed');
        if (statusDesc) statusDesc.innerText = "Votre commande est prête et servie à votre table ! Bon appétit !";
    }
}

function closeStatusModal() {
    const overlay = document.getElementById('status-modal-overlay');
    if (overlay) overlay.classList.remove('open');
}

// ==========================================================================
// KITCHEN & ADMIN DISPLAY SYSTEM (KDS)
// ==========================================================================
function renderAdminKDS() {
    const container = document.getElementById('admin-orders-container');
    const metricActive = document.getElementById('metric-active-orders');
    const metricRevenue = document.getElementById('metric-today-revenue');
    const metricItems = document.getElementById('metric-items-prepared');

    const orders = JSON.parse(localStorage.getItem('kopiOrders') || '[]');

    const activeOrders = orders.filter(o => o.status !== 'completed');
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalItems = orders.reduce((sum, o) => sum + o.items.reduce((isum, i) => isum + i.quantity, 0), 0);

    if (metricActive) metricActive.innerText = activeOrders.length;
    if (metricRevenue) metricRevenue.innerText = `${totalRevenue.toFixed(1)} DT`;
    if (metricItems) metricItems.innerText = totalItems;

    if (!container) return;

    let filteredOrders = orders;
    if (adminFilter !== 'all') {
        filteredOrders = orders.filter(o => o.status === adminFilter);
    }

    if (filteredOrders.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--gold-border);">
                <div style="font-size: 2.5rem; margin-bottom: 8px;">🍽️</div>
                <h3 style="color: var(--gold-light); font-size: 1.2rem;">Aucune commande dans cette section</h3>
                <p>Toutes les commandes ont été traitées ou aucune commande en cours.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    filteredOrders.forEach(order => {
        const card = document.createElement('div');
        card.className = `order-card status-${order.status}`;

        let statusBadgeText = "En attente";
        let statusBadgeClass = "status-badge-pending";
        let actionButtons = `
            <button class="kds-btn btn-prep" onclick="updateOrderStatus('${order.id}', 'preparing')">👨‍🍳 Préparer</button>
            <button class="kds-btn btn-print" onclick="printReceipt('${order.id}')">🖨️ Ticket</button>
        `;

        if (order.status === 'preparing') {
            statusBadgeText = "En préparation";
            statusBadgeClass = "status-badge-preparing";
            actionButtons = `
                <button class="kds-btn btn-ready" onclick="updateOrderStatus('${order.id}', 'completed')">✓ Marquer Servi</button>
                <button class="kds-btn btn-print" onclick="printReceipt('${order.id}')">🖨️ Ticket</button>
            `;
        } else if (order.status === 'completed') {
            statusBadgeText = "Prête / Servie";
            statusBadgeClass = "status-badge-completed";
            actionButtons = `
                <button class="kds-btn btn-print" onclick="printReceipt('${order.id}')">🖨️ Ticket</button>
                <button class="kds-btn btn-delete" onclick="deleteOrder('${order.id}')">🗑️ Archiver</button>
            `;
        }

        const itemsList = order.items.map(item => `
            <li class="order-card-item">
                <span><span class="order-item-qty">${item.quantity}x</span> ${item.name}</span>
                <span style="color: var(--text-secondary);">${(item.price * item.quantity).toFixed(1)} DT</span>
            </li>
        `).join('');

        const noteBlock = order.notes 
            ? `<div class="order-note-box"><strong>Note client :</strong> ${order.notes}</div>` 
            : '';

        card.innerHTML = `
            <div class="order-card-header">
                <div>
                    <span class="order-table-badge">Table ${order.table}</span>
                    <span class="order-time-badge" style="margin-left: 8px;">${order.timeStr}</span>
                </div>
                <span class="order-status-badge ${statusBadgeClass}">${statusBadgeText}</span>
            </div>
            <ul class="order-card-items">
                ${itemsList}
            </ul>
            ${noteBlock}
            <div class="order-card-footer">
                <div class="order-total-row">
                    <span>Total Commande</span>
                    <span>${order.total.toFixed(1)} DT</span>
                </div>
                <div class="order-actions">
                    ${actionButtons}
                </div>
            </div>
        `;

        container.appendChild(card);
    });
}

function updateOrderStatus(orderId, newStatus) {
    let orders = JSON.parse(localStorage.getItem('kopiOrders') || '[]');
    const order = orders.find(o => o.id === orderId);
    if (order) {
        order.status = newStatus;
        localStorage.setItem('kopiOrders', JSON.stringify(orders));
        SoundFX.playChime([523, 659]);
        renderAdminKDS();
        checkCustomerOrderStatus();
        showToast(`Commande ${orderId} : ${newStatus}`, "✅");
    }
}

function deleteOrder(orderId) {
    if (!confirm("Voulez-vous archiver cette commande ?")) return;
    let orders = JSON.parse(localStorage.getItem('kopiOrders') || '[]');
    orders = orders.filter(o => o.id !== orderId);
    localStorage.setItem('kopiOrders', JSON.stringify(orders));
    renderAdminKDS();
    showToast("Commande archivée", "📁");
}

function setAdminFilter(filter) {
    adminFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    renderAdminKDS();
}

function clearAllOrders() {
    if (!confirm("Êtes-vous sûr de vouloir réinitialiser l'historique des commandes d'aujourd'hui ?")) return;
    localStorage.setItem('kopiOrders', JSON.stringify([]));
    renderAdminKDS();
    showToast("Toutes les commandes ont été effacées", "🧹");
}

// ==========================================================================
// RECEIPT PRINTING
// ==========================================================================
function printReceipt(orderId) {
    const orders = JSON.parse(localStorage.getItem('kopiOrders') || '[]');
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    let itemsText = order.items.map(i => `
        <tr>
            <td style="padding: 4px 0;">${i.quantity}x ${i.name}</td>
            <td style="text-align: right; padding: 4px 0;">${(i.price * i.quantity).toFixed(1)} DT</td>
        </tr>
    `).join('');

    const printWindow = window.open('', '_blank', 'width=380,height=600');
    if (!printWindow) {
        alert("Veuillez autoriser les fenêtres pop-up pour imprimer le ticket.");
        return;
    }

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Ticket #${order.id} - Kopi Koffee</title>
            <style>
                body {
                    font-family: monospace;
                    padding: 16px;
                    width: 280px;
                    margin: 0 auto;
                    color: #000;
                }
                .text-center { text-align: center; }
                .divider { border-top: 1px dashed #000; margin: 10px 0; }
                table { width: 100%; border-collapse: collapse; font-size: 13px; }
                h2, h3 { margin: 4px 0; }
            </style>
        </head>
        <body>
            <div class="text-center">
                <h2>KOPI KOFFEE</h2>
                <p style="margin: 2px 0;">Food & Drink • Café Lounge</p>
                <p style="font-size: 11px;">Merci de votre visite !</p>
            </div>
            <div class="divider"></div>
            <div>
                <strong>Commande:</strong> #${order.id}<br>
                <strong>Table:</strong> ${order.table}<br>
                <strong>Heure:</strong> ${order.timeStr}
            </div>
            <div class="divider"></div>
            <table>
                ${itemsText}
            </table>
            <div class="divider"></div>
            ${order.notes ? `<p><strong>Note:</strong> ${order.notes}</p><div class="divider"></div>` : ''}
            <div style="font-size: 16px; font-weight: bold; display: flex; justify-content: space-between;">
                <span>TOTAL:</span>
                <span>${order.total.toFixed(1)} DT</span>
            </div>
            <div class="divider"></div>
            <div class="text-center" style="font-size: 11px; margin-top: 15px;">
                Bonne dégustation !
            </div>
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() { window.close(); }, 500);
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}
