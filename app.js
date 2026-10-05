// Kopi Koffee - Customer Ordering Application Logic (app.js)
// Elder-friendly UX, clear table management, instant cart, and live order tracking

let currentTable = localStorage.getItem('kopiCurrentTable') || '';
let cart = JSON.parse(localStorage.getItem('kopiCart')) || [];
let activeMainGroup = 'categories';
let activeSubcat = 'all';
let viewLayout = localStorage.getItem('kopiViewLayout') || 'grid';
let searchQuery = '';
let soundEnabled = true;
let customerActiveOrderId = localStorage.getItem('kopiActiveOrderId') || null;

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

    static itemAdded() {
        this.playChime([659.25, 880]); // E5, A5
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
    }, 2800);
}

// ==========================================================================
// INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    updateActiveTableDisplay();
    updateCartTableUI();
    renderMainGroups();
    renderSubcategories();
    renderMenu();
    updateCartUI();
    checkCustomerOrderStatus();

    // Table modal input listeners
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

    // Real-time synchronization: listen for status changes from kitchen
    window.addEventListener('storage', (e) => {
        if (e.key === 'kopiOrders') {
            checkCustomerOrderStatus();
        }
    });

    // Backup polling for active order status (every 2.5 seconds)
    setInterval(() => {
        if (customerActiveOrderId) {
            checkCustomerOrderStatus();
        }
    }, 2500);
});

// ==========================================================================
// ELDER-FRIENDLY TABLE MANAGEMENT
// ==========================================================================
function updateActiveTableDisplay() {
    const display = document.getElementById('active-table-display');
    const btnText = document.getElementById('table-btn-text');

    if (display) {
        if (currentTable) {
            display.innerHTML = `<span style="color: var(--gold-light); font-weight: 800;">Table ${currentTable}</span> • Service direct à votre place`;
        } else {
            display.innerText = "Table non renseignée • Toucher ici pour choisir";
        }
    }

    if (btnText) {
        btnText.innerText = currentTable ? "✏️ Changer de table" : "✏️ Choisir ma table";
    }

    // Highlight active quick table button in modal
    document.querySelectorAll('.quick-table-btn').forEach(btn => {
        const tableNum = btn.innerText.replace('Table ', '').trim();
        if (tableNum === currentTable) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function setCartTable(num, notify = true) {
    const trimmed = String(num || '').trim();
    if (!trimmed) {
        currentTable = '';
        localStorage.removeItem('kopiCurrentTable');
    } else {
        currentTable = trimmed;
        localStorage.setItem('kopiCurrentTable', currentTable);
    }

    updateActiveTableDisplay();
    updateCartTableUI();

    if (notify && currentTable) {
        showToast(`Table ${currentTable} sélectionnée avec succès`, "📍");
    }
}

function selectQuickTable(num) {
    setCartTable(num, true);
    const customInput = document.getElementById('table-modal-custom');
    if (customInput) customInput.value = num;
    closeTableModal();
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
    updateActiveTableDisplay();
    if (overlay) overlay.classList.add('open');
    if (customInput) {
        setTimeout(() => {
            customInput.focus();
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

    if (!customVal && !currentTable) {
        alert("Veuillez sélectionner ou indiquer le numéro de votre table.");
        if (customInput) customInput.focus();
        return;
    }

    if (customVal) {
        setCartTable(customVal, true);
    }
    closeTableModal();

    // If customer has items in cart and clicked confirm, proceed with submit
    if (cart.length > 0) {
        submitOrder();
    }
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
                    <span class="category-card-cta">Consulter la carte ➔</span>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="category-hub">
            <div class="category-hub-intro">
                <h2 class="category-hub-title">Carte des Délices Kopi Koffee</h2>
                <p class="category-hub-subtitle">Appuyez simplement sur une catégorie pour afficher nos cafés, délices et formules préparés à la commande</p>
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

    // Search Mode takes precedence
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
                        ← Revenir aux Catégories
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

    // Level 1: Category Directory Hub
    if (activeMainGroup === 'categories') {
        if (banner) banner.style.display = 'none';
        const subcatsContainer = document.getElementById('subcategories-container');
        if (subcatsContainer) subcatsContainer.style.display = 'none';
        renderCategoryHub();
        return;
    }

    // Level 2: Specific Category Items
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
                    <span>${qtyInCart > 0 ? '✓ Ajouté (' + qtyInCart + ')' : '+ Ajouter'}</span>
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
    showToast(`${qty}x ${item.name} ajouté au panier`, "🛒");
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
    renderMenu();
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
                <p style="font-size: 0.85rem; margin-top: 6px; color: var(--gold-light);">Sélectionnez vos boissons ou plats préférés pour commencer !</p>
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
                <button class="step-btn" onclick="updateCartQuantity('${item.id}', -1)" aria-label="Moins">-</button>
                <span class="step-qty">${item.quantity}</span>
                <button class="step-btn" onclick="updateCartQuantity('${item.id}', 1)" aria-label="Plus">+</button>
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
        closeCartDrawer();
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
