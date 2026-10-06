// Kopi Koffee - Customer Ordering Application Logic (app.js)
// Elder-friendly UX, modern luxury typography, vector icons, instant cart, and live order tracking

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
// TOAST NOTIFICATIONS (Using clean vector icons)
// ==========================================================================
function showToast(message, iconKey = 'sparkle') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span style="color: var(--gold-light); display: inline-flex; align-items: center;">${getIcon(iconKey)}</span> <span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 2800);
}

// ==========================================================================
// INITIALIZATION & I18N SUPPORT
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    updateStaticTranslations();
    updateActiveTableDisplay();
    updateCartTableUI();
    renderMainGroups();
    renderSubcategories();
    renderMenu();
    updateCartUI();
    checkCustomerOrderStatus();

    // Real-time synchronization for customer order status tracking
    if (typeof KopiSync !== 'undefined') {
        KopiSync.addListener((data) => {
            if (data.event === 'update_status' && data.orderId === customerActiveOrderId) {
                checkCustomerOrderStatus();
                if (data.status === 'completed') {
                    SoundFX.orderSuccess();
                }
            } else if (data.event === 'remote_sync') {
                checkCustomerOrderStatus();
            }
        });
    }

    // Cross-tab storage fallback
    window.addEventListener('storage', (e) => {
        if (e.key === 'kopiOrders') {
            checkCustomerOrderStatus();
        }
    });

    // Periodic check backup (every 3 seconds)
    setInterval(() => {
        checkCustomerOrderStatus();
    }, 3000);

    // Listen to global language change event (FR / AR)
    window.addEventListener('kopiLangChanged', () => {
        updateStaticTranslations();
        updateActiveTableDisplay();
        updateCartTableUI();
        renderMainGroups();
        renderSubcategories();
        renderMenu();
        renderCartDrawerItems();
        updateCartUI();
    });

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

function updateStaticTranslations() {
    if (typeof KOPI_I18N === 'undefined') return;
    const t = (k) => KOPI_I18N.t(k);

    const headerStatus = document.getElementById('header-status-text');
    if (headerStatus) headerStatus.innerText = t('store_status');

    const headerSubtitle = document.getElementById('header-subtitle-text');
    if (headerSubtitle) headerSubtitle.innerText = t('brand_subtitle');

    const stripLabel = document.querySelector('.table-strip-label');
    if (stripLabel) stripLabel.innerText = t('table_service');

    const searchInput = document.getElementById('menu-search');
    if (searchInput) searchInput.placeholder = t('search_placeholder');

    const floatingLabel = document.querySelector('.cart-bar-label');
    if (floatingLabel) floatingLabel.innerText = t('floating_cart_label');

    const floatingBtn = document.querySelector('.cart-view-btn span');
    if (floatingBtn) floatingBtn.innerText = t('floating_cart_btn');

    const drawerTitle = document.querySelector('.drawer-title');
    if (drawerTitle) drawerTitle.innerText = t('cart_title');

    const drawerTableTitle = document.querySelector('.drawer-table-title');
    if (drawerTableTitle) drawerTableTitle.innerText = t('serve_to_table');

    const tableInputPrefix = document.querySelector('.table-input-prefix');
    if (tableInputPrefix) tableInputPrefix.innerText = t('table_number_prefix');

    const customTableInput = document.getElementById('cart-custom-table');
    if (customTableInput) customTableInput.placeholder = t('table_number_placeholder');

    const drawerNotesLabel = document.querySelector('.drawer-notes label');
    if (drawerNotesLabel) drawerNotesLabel.innerText = t('order_notes_label');

    const orderNotes = document.getElementById('order-special-notes');
    if (orderNotes) orderNotes.placeholder = t('order_notes_placeholder');

    const drawerTotalLabel = document.querySelector('.drawer-summary-row span:first-child');
    if (drawerTotalLabel) drawerTotalLabel.innerText = t('total_to_pay');

    const drawerCheckoutBtn = document.querySelector('.drawer-checkout-btn span');
    if (drawerCheckoutBtn) drawerCheckoutBtn.innerText = t('checkout_btn');

    const modalTitle = document.querySelector('#table-modal-overlay .modal-title');
    if (modalTitle) modalTitle.innerText = t('modal_table_title');

    const modalDesc = document.querySelector('#table-modal-overlay .modal-desc');
    if (modalDesc) modalDesc.innerText = t('modal_table_desc');

    const modalConfirmBtn = document.querySelector('#table-modal-overlay .modal-confirm-btn');
    if (modalConfirmBtn) modalConfirmBtn.innerText = t('modal_table_confirm');

    const modalCancelBtn = document.querySelector('#table-modal-overlay .modal-cancel-btn');
    if (modalCancelBtn) modalCancelBtn.innerText = t('modal_table_cancel');

    const modalQuickLabel = document.querySelector('#table-modal-overlay .modal-subtitle');
    if (modalQuickLabel) modalQuickLabel.innerText = t('modal_table_quick');

    const statusModalTitle = document.querySelector('#status-modal-overlay .status-title');
    if (statusModalTitle) statusModalTitle.innerText = t('order_received_title');

    const stepRec = document.querySelector('#step-received .step-label');
    if (stepRec) stepRec.innerText = t('step_received');

    const stepKit = document.querySelector('#step-prep .step-label');
    if (stepKit) stepKit.innerText = t('step_kitchen');

    const stepSrv = document.querySelector('#step-ready .step-label');
    if (stepSrv) stepSrv.innerText = t('step_served');

    const statusCloseBtn = document.querySelector('#status-modal-overlay .modal-close-btn');
    if (statusCloseBtn) statusCloseBtn.innerText = t('continue_menu');
}

// ==========================================================================
// ELDER-FRIENDLY TABLE MANAGEMENT
// ==========================================================================
function updateActiveTableDisplay() {
    const display = document.getElementById('active-table-display');
    const btnText = document.getElementById('table-btn-text');
    const t = (k) => (typeof KOPI_I18N !== 'undefined' ? KOPI_I18N.t(k) : k);

    if (display) {
        if (currentTable) {
            const tablePrefix = t('table_selected_prefix');
            display.innerHTML = `<span style="color: var(--gold-light); font-weight: 800;">${tablePrefix} ${currentTable}</span> • ${t('table_service')}`;
        } else {
            display.innerText = t('table_not_set');
        }
    }

    if (btnText) {
        btnText.innerText = currentTable ? t('table_change_btn') : t('table_choose_btn');
    }

    // Highlight active quick table button in modal
    document.querySelectorAll('.quick-table-btn').forEach(btn => {
        const tableNum = btn.innerText.replace(/[^0-9]/g, '').trim();
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
        const msg = (typeof KOPI_I18N !== 'undefined') 
            ? KOPI_I18N.t('toast_table_selected').replace('{num}', currentTable)
            : `Table ${currentTable} sélectionnée`;
        showToast(msg, "pin");
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
    const t = (k) => (typeof KOPI_I18N !== 'undefined' ? KOPI_I18N.t(k) : k);

    if (label) {
        if (currentTable) {
            label.innerText = `${t('table_selected_prefix')} ${currentTable}`;
            label.style.color = 'var(--gold-primary)';
        } else {
            label.innerText = t('table_not_specified');
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
        const alertMsg = (typeof KOPI_I18N !== 'undefined')
            ? KOPI_I18N.t('alert_choose_table')
            : "Veuillez sélectionner ou indiquer le numéro de votre table.";
        alert(alertMsg);
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
        const groupName = (typeof KOPI_I18N !== 'undefined')
            ? KOPI_I18N.getCategoryName(group.id, group.name)
            : group.name;
        const btn = document.createElement('button');
        btn.className = `group-tab-btn ${group.id === activeMainGroup ? 'active' : ''}`;
        btn.innerHTML = `<span>${getIcon(group.icon)}</span> <span>${groupName}</span>`;
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
        const groupName = (typeof KOPI_I18N !== 'undefined')
            ? KOPI_I18N.getCategoryName(group.id, group.name)
            : group.name;
        const countSuffix = (typeof KOPI_I18N !== 'undefined')
            ? KOPI_I18N.t('delights_count')
            : 'délices au menu';

        if (bannerIcon) bannerIcon.innerHTML = getIcon(group.icon, 'icon-svg-lg');
        if (bannerTitle) bannerTitle.innerText = groupName;

        const count = MENU_ITEMS.filter(i => i.groupId === groupId).length;
        if (bannerCount) bannerCount.innerText = `${count} ${countSuffix}`;
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
    const allLabel = (typeof KOPI_I18N !== 'undefined') ? KOPI_I18N.t('all_items') : 'Tous';
    const allPill = document.createElement('button');
    allPill.className = `subcat-pill ${activeSubcat === 'all' ? 'active' : ''}`;
    allPill.innerHTML = `${getIcon('sparkle')} <span>${allLabel} (${totalCount})</span>`;
    allPill.addEventListener('click', () => {
        activeSubcat = 'all';
        renderSubcategories();
        renderMenu();
    });
    container.appendChild(allPill);

    subcats.forEach(sub => {
        const subCount = MENU_ITEMS.filter(i => i.categoryId === sub.id).length;
        const subName = (typeof KOPI_I18N !== 'undefined')
            ? KOPI_I18N.getCategoryName(sub.id, sub.name)
            : sub.name;
        const pill = document.createElement('button');
        pill.className = `subcat-pill ${sub.id === activeSubcat ? 'active' : ''}`;
        pill.innerHTML = `${getIcon(sub.icon)} <span>${subName}</span> <span style="opacity: 0.75; font-size: 0.75rem;">(${subCount})</span>`;
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
    const t = (k) => (typeof KOPI_I18N !== 'undefined' ? KOPI_I18N.t(k) : k);

    let cardsHtml = diningGroups.map(group => {
        const count = MENU_ITEMS.filter(item => item.groupId === group.id).length;
        const groupName = (typeof KOPI_I18N !== 'undefined') ? KOPI_I18N.getCategoryName(group.id, group.name) : group.name;
        const groupDesc = (typeof KOPI_I18N !== 'undefined') ? KOPI_I18N.getCategoryDesc(group.id, group.desc) : (group.desc || 'Découvrez notre sélection gourmande et raffinée.');
        const badgeText = group.badge || `${count} ${t('items_count')}`;

        return `
            <div class="category-card" onclick="selectCategory('${group.id}')" role="button" tabindex="0" 
                 onkeydown="if(event.key==='Enter') selectCategory('${group.id}')" aria-label="${groupName}">
                <img class="category-card-img" src="${group.image}" alt="${groupName}" loading="lazy" 
                     onerror="this.src='https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=600&q=80'">
                <div class="category-card-overlay"></div>
                <div class="category-card-badge">${badgeText}</div>
                <div class="category-card-content">
                    <div class="category-card-header">
                        <span class="category-card-icon" style="color: var(--gold-light);">${getIcon(group.icon, 'icon-svg-lg')}</span>
                        <h3 class="category-card-title">${groupName}</h3>
                    </div>
                    <p class="category-card-desc">${groupDesc}</p>
                    <span class="category-card-cta">
                        <span>${t('browse_menu')}</span>
                        ${getIcon('arrow-right')}
                    </span>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="category-hub">
            <div class="category-hub-intro">
                <h2 class="category-hub-title">${t('hub_title')}</h2>
                <p class="category-hub-subtitle">${t('hub_subtitle')}</p>
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

    const t = (k) => (typeof KOPI_I18N !== 'undefined' ? KOPI_I18N.t(k) : k);

    // Search Mode takes precedence
    if (searchQuery) {
        if (banner) banner.style.display = 'none';
        const subcatsContainer = document.getElementById('subcategories-container');
        if (subcatsContainer) subcatsContainer.style.display = 'none';

        const matchingItems = MENU_ITEMS.filter(item => {
            const name = (typeof KOPI_I18N !== 'undefined') ? KOPI_I18N.getItemName(item).toLowerCase() : item.name.toLowerCase();
            const originalName = item.name.toLowerCase();
            const desc = (item.description || '').toLowerCase();
            return name.includes(searchQuery) || originalName.includes(searchQuery) || desc.includes(searchQuery);
        });

        if (matchingItems.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
                    <div style="margin-bottom: 14px; color: var(--gold-light);">${getIcon('search', 'icon-svg-xl')}</div>
                    <h3 style="font-size: 1.3rem; color: var(--gold-light); margin-bottom: 8px;">${t('no_products')}</h3>
                    <p>${t('no_products_desc')}</p>
                    <button class="category-back-btn" style="margin-top: 18px;" onclick="backToCategories()">
                        ${getIcon('arrow-left')}
                        <span>${t('back_to_categories')}</span>
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        const searchSection = createCategorySection(`${t('results_for')} "${searchQuery}"`, "search", matchingItems);
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
            const groupName = (typeof KOPI_I18N !== 'undefined') ? KOPI_I18N.getCategoryName(group.id, group.name) : group.name;
            if (bannerIcon) bannerIcon.innerHTML = getIcon(group.icon, 'icon-svg-lg');
            if (bannerTitle) bannerTitle.innerText = groupName;
            const count = MENU_ITEMS.filter(i => i.groupId === activeMainGroup).length;
            if (bannerCount) bannerCount.innerText = `${count} ${t('delights_count')}`;
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
                <div style="margin-bottom: 14px; color: var(--gold-light);">${getIcon('plate', 'icon-svg-xl')}</div>
                <h3 style="font-size: 1.3rem; color: var(--gold-light); margin-bottom: 8px;">${t('empty_subcat')}</h3>
                <button class="category-back-btn" style="margin-top: 14px;" onclick="backToCategories()">
                    ${getIcon('arrow-left')}
                    <span>${t('back_to_categories')}</span>
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
                    const subTitle = (typeof KOPI_I18N !== 'undefined') ? KOPI_I18N.getCategoryName(sub.id, sub.name) : sub.name;
                    const section = createCategorySection(subTitle, sub.icon, itemsInSub);
                    container.appendChild(section);
                }
            });
        } else {
            const currentGroup = MAIN_GROUPS.find(g => g.id === activeMainGroup);
            const groupTitle = currentGroup ? ((typeof KOPI_I18N !== 'undefined') ? KOPI_I18N.getCategoryName(currentGroup.id, currentGroup.name) : currentGroup.name) : "Menu";
            const section = createCategorySection(groupTitle, currentGroup ? currentGroup.icon : "sparkle", filteredItems);
            container.appendChild(section);
        }
    } else {
        const cat = MENU_CATEGORIES.find(c => c.id === activeSubcat);
        const catTitle = cat ? ((typeof KOPI_I18N !== 'undefined') ? KOPI_I18N.getCategoryName(cat.id, cat.name) : cat.name) : "Sélection";
        const section = createCategorySection(catTitle, cat ? cat.icon : "sparkle", filteredItems);
        container.appendChild(section);
    }
}

function createCategorySection(title, iconKey, items) {
    const section = document.createElement('div');
    section.className = 'category-section';
    const itemsCountSuffix = (typeof KOPI_I18N !== 'undefined') ? KOPI_I18N.t('items_count') : 'articles';

    section.innerHTML = `
        <div class="section-header">
            <span style="display: inline-flex; align-items: center; color: var(--gold-light);">${getIcon(iconKey, 'icon-svg-lg')}</span>
            <h2 class="section-title">${title}</h2>
            <span class="section-count">${items.length} ${itemsCountSuffix}</span>
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

    const t = (k) => (typeof KOPI_I18N !== 'undefined' ? KOPI_I18N.t(k) : k);
    const itemName = (typeof KOPI_I18N !== 'undefined') ? KOPI_I18N.getItemName(item) : item.name;
    const itemDesc = (typeof KOPI_I18N !== 'undefined') ? KOPI_I18N.getItemDesc(item) : item.description;
    const currency = t('currency');

    const addBtnContent = qtyInCart > 0 
        ? `${getIcon('check')} <span>${t('added')} (${qtyInCart})</span>`
        : `${getIcon('plus')} <span>${t('add_to_cart')}</span>`;

    card.innerHTML = `
        <div class="card-image-wrap">
            <img class="card-img" src="${item.image}" alt="${itemName}" loading="lazy" 
                 onerror="this.src='https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=600&q=80'">
            ${badgeHtml}
        </div>
        <div class="card-content">
            <div class="card-top">
                <h3 class="card-title">${itemName}</h3>
                <div class="card-price">${item.price} ${currency}</div>
            </div>
            <p class="card-desc">${itemDesc}</p>
            <div class="card-actions">
                <div class="card-stepper">
                    <button class="step-btn" onclick="changeCardQuantity('${item.id}', -1)" aria-label="Moins">
                        <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </button>
                    <span class="step-qty" id="qty-${item.id}">${qtyInCart > 0 ? qtyInCart : 1}</span>
                    <button class="step-btn" onclick="changeCardQuantity('${item.id}', 1)" aria-label="Plus">
                        <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </button>
                </div>
                <button class="add-btn" onclick="addFromCard('${item.id}')">
                    ${addBtnContent}
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

    const itemName = (typeof KOPI_I18N !== 'undefined') ? KOPI_I18N.getItemName(item) : item.name;
    const addedMsg = (typeof KOPI_I18N !== 'undefined') ? KOPI_I18N.t('toast_item_added') : 'ajouté au panier';

    SoundFX.itemAdded();
    showToast(`${qty}x ${itemName} ${addedMsg}`, "cart");
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
    const currency = (typeof KOPI_I18N !== 'undefined') ? KOPI_I18N.t('currency') : 'DT';

    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (totalCount > 0) {
        if (bar) bar.classList.remove('hidden');
        if (badge) badge.innerText = totalCount;
        if (totalEl) totalEl.innerText = `${totalPrice.toFixed(1)} ${currency}`;
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

    const t = (k) => (typeof KOPI_I18N !== 'undefined' ? KOPI_I18N.t(k) : k);
    const currency = t('currency');

    if (cart.length === 0) {
        body.innerHTML = `
            <div class="cart-empty-message">
                <div style="margin-bottom: 12px; color: var(--gold-light);">${getIcon('coffee', 'icon-svg-xl')}</div>
                <p>${t('cart_empty')}</p>
                <p style="font-size: 0.85rem; margin-top: 6px; color: var(--gold-light);">${t('cart_empty_desc')}</p>
            </div>
        `;
        if (totalSpan) totalSpan.innerText = `0.0 ${currency}`;
        return;
    }

    body.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const itemName = (typeof KOPI_I18N !== 'undefined') ? KOPI_I18N.getItemName(item) : item.name;

        const row = document.createElement('div');
        row.className = 'cart-item-row';
        row.innerHTML = `
            <img class="cart-item-thumb" src="${item.image}" alt="${itemName}" 
                 onerror="this.src='https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=600&q=80'">
            <div class="cart-item-info">
                <div class="cart-item-title">${itemName}</div>
                <div class="cart-item-price">${itemTotal.toFixed(1)} ${currency} <span style="font-size: 0.75rem; color: var(--text-muted);">(${item.price} ${currency}/u)</span></div>
            </div>
            <div class="card-stepper" style="background: rgba(0,0,0,0.45);">
                <button class="step-btn" onclick="updateCartQuantity('${item.id}', -1)" aria-label="Moins">
                    <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
                <span class="step-qty">${item.quantity}</span>
                <button class="step-btn" onclick="updateCartQuantity('${item.id}', 1)" aria-label="Plus">
                    <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart('${item.id}')" title="Supprimer" aria-label="Supprimer">
                ${getIcon('trash')}
            </button>
        `;
        body.appendChild(row);
    });

    if (totalSpan) totalSpan.innerText = `${total.toFixed(1)} ${currency}`;
}

// ==========================================================================
// SUBMIT ORDER TO KITCHEN
// ==========================================================================
function submitOrder() {
    const t = (k) => (typeof KOPI_I18N !== 'undefined' ? KOPI_I18N.t(k) : k);

    if (cart.length === 0) {
        alert(t('alert_empty_cart'));
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

    if (typeof KopiSync !== 'undefined') {
        KopiSync.sendNewOrder(newOrder);
    } else {
        const orders = JSON.parse(localStorage.getItem('kopiOrders') || '[]');
        orders.unshift(newOrder);
        localStorage.setItem('kopiOrders', JSON.stringify(orders));
    }

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
    const orders = (typeof KopiSync !== 'undefined') ? KopiSync.getOrders() : JSON.parse(localStorage.getItem('kopiOrders') || '[]');
    const order = orders.find(o => o.id === customerActiveOrderId);
    if (!order) return;

    updateCustomerOrderModalSteps(order.status);
}

function showCustomerOrderModal(order) {
    const overlay = document.getElementById('status-modal-overlay');
    const modalOrderNum = document.getElementById('modal-order-id');
    const modalTable = document.getElementById('modal-table-num');
    const t = (k) => (typeof KOPI_I18N !== 'undefined' ? KOPI_I18N.t(k) : k);

    if (modalOrderNum) modalOrderNum.innerText = `#${order.id}`;
    if (modalTable) modalTable.innerText = `${t('table_selected_prefix')} ${order.table}`;

    updateCustomerOrderModalSteps(order.status);
    if (overlay) overlay.classList.add('open');
}

function updateCustomerOrderModalSteps(status) {
    const step1 = document.getElementById('step-received');
    const step2 = document.getElementById('step-prep');
    const step3 = document.getElementById('step-ready');
    const statusDesc = document.getElementById('modal-status-description');
    const t = (k) => (typeof KOPI_I18N !== 'undefined' ? KOPI_I18N.t(k) : k);

    [step1, step2, step3].forEach(s => {
        if (s) s.classList.remove('active', 'completed');
    });

    if (status === 'pending') {
        if (step1) step1.classList.add('active');
        if (statusDesc) statusDesc.innerText = t('status_desc_pending');
    } else if (status === 'preparing') {
        if (step1) step1.classList.add('completed');
        if (step2) step2.classList.add('active');
        if (statusDesc) statusDesc.innerText = t('status_desc_prep');
    } else if (status === 'completed') {
        if (step1) step1.classList.add('completed');
        if (step2) step2.classList.add('completed');
        if (step3) step3.classList.add('active', 'completed');
        if (statusDesc) statusDesc.innerText = t('status_desc_ready');
    }
}

function closeStatusModal() {
    const overlay = document.getElementById('status-modal-overlay');
    if (overlay) overlay.classList.remove('open');
}
