// Kopi Koffee - Dedicated Admin & Kitchen Display System Logic (admin.js)
// Password: 10699 • Real-Time Order Processing & Modern KDS Dashboard (Vector Icons)

const ADMIN_PASSWORD = "10699";

let adminFilter = 'all';
let searchQuery = '';
let soundEnabled = localStorage.getItem('kopiSoundEnabled') !== 'false';
let enteredPin = "";
let lastKnownOrderCount = 0;

// ==========================================================================
// AUDIO SYNTHESIS FOR KITCHEN ALERTS (Native Web Audio API)
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
                gain.gain.exponentialRampToValueAtTime(0.35, now + index * 0.1 + 0.02);
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

    static newOrderAlert() {
        this.playChime([440, 554.37, 659.25, 880]); // A4, C#5, E5, A5
    }

    static actionSuccess() {
        this.playChime([523.25, 659.25]); // C5, E5
    }

    static accessDenied() {
        this.playChime([300, 220], 'sawtooth');
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
// INITIALIZATION & AUTH STATE CHECK
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    updateAdminStaticTranslations();
    checkAuthState();
    startClock();
    setupSoundToggle();
    setupKeyboardListeners();

    // Listen to global language change (FR / AR)
    window.addEventListener('kopiLangChanged', () => {
        updateAdminStaticTranslations();
        renderAdminKDS();
    });

    // Initialize order count tracking
    const initialOrders = (typeof KopiSync !== 'undefined') ? KopiSync.getOrders() : JSON.parse(localStorage.getItem('kopiOrders') || '[]');
    lastKnownOrderCount = initialOrders.length;

    // Listen to KopiSync for real-time cross-device and cross-tab order events
    if (typeof KopiSync !== 'undefined') {
        KopiSync.addListener((data) => {
            if (data.event === 'new_order') {
                SoundFX.newOrderAlert();
                const t = (k) => (typeof KOPI_I18N !== 'undefined' ? KOPI_I18N.t(k) : k);
                showToast(t('admin_order_notif'), "bell");
                renderAdminKDS();
            } else if (data.event === 'update_status' || data.event === 'delete_order' || data.event === 'remote_sync') {
                renderAdminKDS();
            }
        });
    }

    // Cross-Tab Real-time synchronization fallback
    window.addEventListener('storage', (e) => {
        if (e.key === 'kopiOrders') {
            handleIncomingOrdersUpdate();
        }
    });

    // Interval polling backup (every 2 seconds)
    setInterval(() => {
        if (sessionStorage.getItem('kopiStaffAuth') === 'true') {
            checkOrdersPoll();
        }
    }, 2000);

    // Dynamic elapsed time update ticker (every 30 seconds)
    setInterval(() => {
        if (sessionStorage.getItem('kopiStaffAuth') === 'true') {
            updateElapsedTimesInDOM();
        }
    }, 30000);
});

function updateAdminStaticTranslations() {
    if (typeof KOPI_I18N === 'undefined') return;
    const t = (k) => KOPI_I18N.t(k);

    // Auth screen
    const authTitle = document.getElementById('admin-auth-title');
    if (authTitle) authTitle.innerText = t('admin_auth_title');

    const authDesc = document.getElementById('admin-auth-desc');
    if (authDesc) authDesc.innerText = t('admin_auth_subtitle');

    const keyClear = document.querySelector('.key-clear span');
    if (keyClear) keyClear.innerText = t('admin_pin_clear');

    const keyEnter = document.querySelector('.key-enter span');
    if (keyEnter) keyEnter.innerText = t('admin_pin_submit');

    const keyHint = document.querySelector('.pin-keyboard-hint span');
    if (keyHint) keyHint.innerText = t('admin_keyboard_hint');

    const backClient = document.querySelector('#admin-auth-view .admin-nav-btn span');
    if (backClient) backClient.innerText = t('admin_back_client');

    // Header KDS
    const badgePill = document.querySelector('.admin-badge-pill');
    if (badgePill) badgePill.innerText = t('admin_kds_badge');

    const livePill = document.querySelector('.live-status-pill');
    if (livePill) livePill.innerHTML = `<span class="live-status-dot"></span> ${t('admin_live')}`;

    const subHeader = document.querySelector('.admin-nav-left > div > span');
    if (subHeader) subHeader.innerText = t('admin_kds_sub');

    const fullText = document.getElementById('fullscreen-text');
    if (fullText) fullText.innerText = document.fullscreenElement ? t('admin_minimize') : t('admin_fullscreen');

    updateSoundButtonUI();

    const clientLink = document.querySelector('a[href="index.html"].admin-nav-btn span');
    if (clientLink) clientLink.innerText = t('admin_client_space');

    const lockBtn = document.querySelector('.admin-lock-btn span');
    if (lockBtn) lockBtn.innerText = t('admin_lock');

    // Metrics labels
    const labelPending = document.querySelector('.card-pending .metric-label');
    if (labelPending) labelPending.innerText = t('admin_metric_pending');

    const labelPrep = document.querySelector('.card-preparing .metric-label');
    if (labelPrep) labelPrep.innerText = t('admin_metric_prep');

    const labelRev = document.querySelector('.card-revenue .metric-label');
    if (labelRev) labelRev.innerText = t('admin_metric_revenue');

    const labelItems = document.querySelector('.card-items .metric-label');
    if (labelItems) labelItems.innerText = t('admin_metric_items');

    // Search and filters
    const searchInput = document.getElementById('admin-search-input');
    if (searchInput) searchInput.placeholder = t('admin_search_placeholder');

    const btnFilterAll = document.querySelector('.filter-btn[data-filter="all"] > span:first-child');
    if (btnFilterAll) btnFilterAll.innerText = t('admin_filter_all');

    const btnFilterPending = document.querySelector('.filter-btn[data-filter="pending"] > span:first-child');
    if (btnFilterPending) btnFilterPending.innerText = t('admin_filter_pending');

    const btnFilterPrep = document.querySelector('.filter-btn[data-filter="preparing"] > span:first-child');
    if (btnFilterPrep) btnFilterPrep.innerText = t('admin_filter_prep');

    const btnFilterCompleted = document.querySelector('.filter-btn[data-filter="completed"] > span:first-child');
    if (btnFilterCompleted) btnFilterCompleted.innerText = t('admin_filter_completed');

    const refreshBtnSpan = document.querySelector('button[onclick="manualRefreshKDS()"] span');
    if (refreshBtnSpan) refreshBtnSpan.innerText = t('admin_refresh');

    const resetBtnSpan = document.querySelector('button[onclick="clearAllOrders()"] span');
    if (resetBtnSpan) resetBtnSpan.innerText = t('admin_reset');
}

function checkAuthState() {
    const isAuthed = sessionStorage.getItem('kopiStaffAuth') === 'true';
    if (isAuthed) {
        showKDSView();
    } else {
        showAuthView();
    }
}

function showAuthView() {
    const authView = document.getElementById('admin-auth-view');
    const kdsView = document.getElementById('admin-kds-view');
    if (authView) authView.classList.remove('hidden');
    if (kdsView) kdsView.classList.add('hidden');
    enteredPin = "";
    updatePinDots();
}

function showKDSView() {
    const authView = document.getElementById('admin-auth-view');
    const kdsView = document.getElementById('admin-kds-view');
    if (authView) authView.classList.add('hidden');
    if (kdsView) kdsView.classList.remove('hidden');
    renderAdminKDS();
}

function logoutAdmin() {
    sessionStorage.removeItem('kopiStaffAuth');
    const t = (k) => (typeof KOPI_I18N !== 'undefined' ? KOPI_I18N.t(k) : k);
    showToast(t('admin_lock'), "lock");
    showAuthView();
}

// ==========================================================================
// PIN & PASSWORD HANDLING
// ==========================================================================
function appendPinDigit(digit) {
    if (enteredPin.length < 5) {
        enteredPin += digit;
        updatePinDots();
        if (enteredPin.length === 5) {
            setTimeout(submitCurrentPin, 120);
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
    const t = (k) => (typeof KOPI_I18N !== 'undefined' ? KOPI_I18N.t(k) : k);
    if (enteredPin === ADMIN_PASSWORD) {
        sessionStorage.setItem('kopiStaffAuth', 'true');
        SoundFX.actionSuccess();
        showToast(t('admin_auth_success'), "chef");
        showKDSView();
    } else {
        handleAuthError(t('admin_pin_error'));
    }
}

function handleAuthError(msg) {
    SoundFX.accessDenied();
    const errorEl = document.getElementById('pin-error-msg');
    if (errorEl) errorEl.innerText = msg;
    
    const card = document.querySelector('#admin-auth-view .pin-modal');
    if (card) {
        card.classList.add('shake');
        setTimeout(() => card.classList.remove('shake'), 450);
    }
    enteredPin = "";
    updatePinDots();
}

function setupKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
        const authView = document.getElementById('admin-auth-view');
        if (authView && !authView.classList.contains('hidden')) {
            if (e.key >= '0' && e.key <= '9') {
                appendPinDigit(e.key);
            } else if (e.key === 'Backspace') {
                clearPin();
            } else if (e.key === 'Enter') {
                submitCurrentPin();
            }
        }
    });
}

// ==========================================================================
// LIVE CLOCK & CONTROLS
// ==========================================================================
function startClock() {
    const clockEl = document.getElementById('live-clock');
    function updateClock() {
        if (!clockEl) return;
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        clockEl.innerText = timeStr;
    }
    updateClock();
    setInterval(updateClock, 1000);
}

function setupSoundToggle() {
    const soundToggle = document.getElementById('sound-toggle');
    if (soundToggle) {
        updateSoundButtonUI();
        soundToggle.addEventListener('click', () => {
            soundEnabled = !soundEnabled;
            localStorage.setItem('kopiSoundEnabled', soundEnabled);
            updateSoundButtonUI();
            if (soundEnabled) {
                SoundFX.actionSuccess();
                showToast("Alertes sonores activées", "bell");
            } else {
                showToast("Alertes sonores coupées", "bell-off");
            }
        });
    }
}

function updateSoundButtonUI() {
    const btn = document.getElementById('sound-toggle');
    if (!btn) return;
    const t = (k) => (typeof KOPI_I18N !== 'undefined' ? KOPI_I18N.t(k) : k);
    if (soundEnabled) {
        btn.classList.add('sound-on');
        btn.innerHTML = `${getIcon('bell')} <span>${t('admin_sound_on')}</span>`;
    } else {
        btn.classList.remove('sound-on');
        btn.innerHTML = `${getIcon('bell-off')} <span>${t('admin_sound_off')}</span>`;
    }
}

// Fullscreen Toggle
function toggleFullscreen() {
    const iconEl = document.getElementById('fullscreen-icon');
    const textEl = document.getElementById('fullscreen-text');
    const t = (k) => (typeof KOPI_I18N !== 'undefined' ? KOPI_I18N.t(k) : k);

    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
            if (iconEl) iconEl.outerHTML = getIcon('minimize');
            if (textEl) textEl.innerText = t('admin_minimize');
        }).catch(err => {
            console.warn('Fullscreen error:', err);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen().then(() => {
                if (iconEl) iconEl.outerHTML = getIcon('fullscreen');
                if (textEl) textEl.innerText = t('admin_fullscreen');
            });
        }
    }
}

// Manual Refresh
function manualRefreshKDS() {
    const refreshIcon = document.getElementById('refresh-icon');
    if (refreshIcon) {
        refreshIcon.style.transition = 'transform 0.5s ease';
        refreshIcon.style.transform = 'rotate(360deg)';
        setTimeout(() => {
            refreshIcon.style.transform = 'none';
        }, 500);
    }
    renderAdminKDS();
    const t = (k) => (typeof KOPI_I18N !== 'undefined' ? KOPI_I18N.t(k) : k);
    showToast(t('admin_refresh'), "refresh");
}

// Search handling
function handleAdminSearch(val) {
    searchQuery = (val || '').trim().toLowerCase();
    const clearBtn = document.getElementById('admin-search-clear');
    if (clearBtn) {
        if (searchQuery.length > 0) {
            clearBtn.classList.remove('hidden');
        } else {
            clearBtn.classList.add('hidden');
        }
    }
    renderAdminKDS();
}

function clearAdminSearch() {
    const input = document.getElementById('admin-search-input');
    if (input) input.value = '';
    searchQuery = '';
    const clearBtn = document.getElementById('admin-search-clear');
    if (clearBtn) clearBtn.classList.add('hidden');
    renderAdminKDS();
}

// ==========================================================================
// REAL-TIME SYNC & ORDER CHECKING
// ==========================================================================
function handleIncomingOrdersUpdate() {
    const orders = (typeof KopiSync !== 'undefined') ? KopiSync.getOrders() : JSON.parse(localStorage.getItem('kopiOrders') || '[]');
    const t = (k) => (typeof KOPI_I18N !== 'undefined' ? KOPI_I18N.t(k) : k);
    if (orders.length > lastKnownOrderCount) {
        SoundFX.newOrderAlert();
        showToast(t('admin_order_notif'), "bell");
    }
    lastKnownOrderCount = orders.length;
    renderAdminKDS();
}

function checkOrdersPoll() {
    const orders = (typeof KopiSync !== 'undefined') ? KopiSync.getOrders() : JSON.parse(localStorage.getItem('kopiOrders') || '[]');
    const t = (k) => (typeof KOPI_I18N !== 'undefined' ? KOPI_I18N.t(k) : k);
    if (orders.length > lastKnownOrderCount) {
        SoundFX.newOrderAlert();
        showToast(t('admin_order_notif'), "bell");
        lastKnownOrderCount = orders.length;
        renderAdminKDS();
    }
}

// ==========================================================================
// TIME CALCULATION HELPERS
// ==========================================================================
function computeElapsedTime(createdAtStr) {
    const isAr = (typeof KOPI_I18N !== 'undefined' && KOPI_I18N.currentLang === 'ar');
    const recentText = isAr ? "حديثاً" : "Récemment";
    if (!createdAtStr) return { text: recentText, isUrgent: false };
    const createdTime = new Date(createdAtStr).getTime();
    if (isNaN(createdTime)) return { text: recentText, isUrgent: false };
    
    const now = Date.now();
    const diffMs = now - createdTime;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) {
        return { text: isAr ? "الآن" : "À l'instant", isUrgent: false };
    } else if (diffMins === 1) {
        return { text: isAr ? "منذ دقيقة" : "Il y a 1 min", isUrgent: false };
    } else if (diffMins < 60) {
        return { text: isAr ? `منذ ${diffMins} دقيقة` : `Il y a ${diffMins} min`, isUrgent: diffMins >= 15 };
    } else {
        const hours = Math.floor(diffMins / 60);
        const remMins = diffMins % 60;
        return { text: isAr ? `منذ ${hours}س ${remMins}د` : `Il y a ${hours}h ${remMins}m`, isUrgent: true };
    }
}

function updateElapsedTimesInDOM() {
    document.querySelectorAll('.order-card').forEach(card => {
        const orderId = card.dataset.orderId;
        const createdAt = card.dataset.createdAt;
        const status = card.dataset.status;
        if (createdAt && status !== 'completed') {
            const elapsed = computeElapsedTime(createdAt);
            const badge = card.querySelector('.order-elapsed-badge');
            if (badge) {
                badge.innerHTML = `${getIcon('clock')} <span>${elapsed.text}</span>`;
                if (elapsed.isUrgent) {
                    badge.classList.add('elapsed-urgent');
                } else {
                    badge.classList.remove('elapsed-urgent');
                }
            }
        }
    });
}

// ==========================================================================
// KITCHEN DISPLAY SYSTEM (KDS) RENDERING
// ==========================================================================
function renderAdminKDS() {
    const t = (k) => (typeof KOPI_I18N !== 'undefined' ? KOPI_I18N.t(k) : k);
    const container = document.getElementById('admin-orders-container');
    const metricPending = document.getElementById('metric-pending-orders');
    const metricPreparing = document.getElementById('metric-preparing-orders');
    const metricRevenue = document.getElementById('metric-today-revenue');
    const metricItems = document.getElementById('metric-items-prepared');

    const countAll = document.getElementById('count-all');
    const countPending = document.getElementById('count-pending');
    const countPreparing = document.getElementById('count-preparing');
    const countCompleted = document.getElementById('count-completed');

    const orders = (typeof KopiSync !== 'undefined') ? KopiSync.getOrders() : JSON.parse(localStorage.getItem('kopiOrders') || '[]');

    const pendingOrders = orders.filter(o => o.status === 'pending');
    const preparingOrders = orders.filter(o => o.status === 'preparing');
    const completedOrders = orders.filter(o => o.status === 'completed');

    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalItems = orders.reduce((sum, o) => sum + (o.items || []).reduce((isum, i) => isum + (i.quantity || 1), 0), 0);

    // Update Metrics
    if (metricPending) metricPending.innerText = pendingOrders.length;
    if (metricPreparing) metricPreparing.innerText = preparingOrders.length;
    if (metricRevenue) metricRevenue.innerText = `${totalRevenue.toFixed(1)} ${t('currency')}`;
    if (metricItems) metricItems.innerText = totalItems;

    // Update Filter Badges
    if (countAll) countAll.innerText = orders.length;
    if (countPending) countPending.innerText = pendingOrders.length;
    if (countPreparing) countPreparing.innerText = preparingOrders.length;
    if (countCompleted) countCompleted.innerText = completedOrders.length;

    if (!container) return;

    // Filter by status tab
    let filteredOrders = orders;
    if (adminFilter !== 'all') {
        filteredOrders = orders.filter(o => o.status === adminFilter);
    }

    // Filter by search query (table, order id, or item name)
    if (searchQuery.length > 0) {
        filteredOrders = filteredOrders.filter(o => {
            const tableMatch = String(o.table || '').toLowerCase().includes(searchQuery);
            const idMatch = String(o.id || '').toLowerCase().includes(searchQuery);
            const itemsMatch = (o.items || []).some(item => {
                const name = (typeof KOPI_I18N !== 'undefined') ? KOPI_I18N.getItemName(item).toLowerCase() : (item.name || '').toLowerCase();
                const orig = (item.name || '').toLowerCase();
                return name.includes(searchQuery) || orig.includes(searchQuery);
            });
            return tableMatch || idMatch || itemsMatch;
        });
    }

    const isAr = (typeof KOPI_I18N !== 'undefined' && KOPI_I18N.currentLang === 'ar');
    const currency = t('currency');

    if (filteredOrders.length === 0) {
        let emptyTitle = t('admin_no_orders');
        let emptyDesc = t('admin_no_orders_desc');
        if (searchQuery.length > 0) {
            emptyTitle = isAr ? "لا توجد نتائج لهذا البحث" : "Aucun résultat pour cette recherche";
            emptyDesc = isAr ? `لا توجد طلبات تطابق "${searchQuery}".` : `Aucune commande ne correspond à "${searchQuery}".`;
        }

        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted); background: linear-gradient(145deg, rgba(17, 26, 40, 0.9), rgba(12, 18, 29, 0.95)); border-radius: var(--radius-md); border: 1px dashed var(--gold-border);">
                <div style="margin-bottom: 14px; color: var(--gold-light);">${getIcon('tray', 'icon-svg-xl')}</div>
                <h3 style="color: var(--gold-light); font-size: 1.3rem; margin-bottom: 6px;">${emptyTitle}</h3>
                <p style="font-size: 0.92rem;">${emptyDesc}</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    filteredOrders.forEach(order => {
        const card = document.createElement('div');
        card.className = `order-card status-${order.status}`;
        card.dataset.orderId = order.id;
        card.dataset.createdAt = order.createdAt || order.timestamp || '';
        card.dataset.status = order.status;

        const elapsed = computeElapsedTime(order.createdAt || order.timestamp);
        const urgentClass = (elapsed.isUrgent && order.status !== 'completed') ? 'elapsed-urgent' : '';

        let statusBadgeText = t('admin_filter_pending');
        let statusBadgeClass = "status-badge-pending";
        let statusIconKey = "clock";
        let actionButtons = `
            <button class="kds-btn btn-prep" onclick="updateOrderStatus('${order.id}', 'preparing')">
                ${getIcon('chef')}
                <span>${t('admin_btn_prep')}</span>
            </button>
            <button class="kds-btn btn-print" onclick="printReceipt('${order.id}')">
                ${getIcon('print')}
                <span>${t('admin_btn_print')}</span>
            </button>
        `;

        if (order.status === 'preparing') {
            statusBadgeText = t('admin_filter_prep');
            statusBadgeClass = "status-badge-preparing";
            statusIconKey = "chef";
            actionButtons = `
                <button class="kds-btn btn-ready" onclick="updateOrderStatus('${order.id}', 'completed')">
                    ${getIcon('check')}
                    <span>${t('admin_btn_ready')}</span>
                </button>
                <button class="kds-btn btn-print" onclick="printReceipt('${order.id}')">
                    ${getIcon('print')}
                    <span>${t('admin_btn_print')}</span>
                </button>
            `;
        } else if (order.status === 'completed') {
            statusBadgeText = t('admin_filter_completed');
            statusBadgeClass = "status-badge-completed";
            statusIconKey = "check";
            actionButtons = `
                <button class="kds-btn btn-print" onclick="printReceipt('${order.id}')">
                    ${getIcon('print')}
                    <span>${t('admin_btn_print')}</span>
                </button>
                <button class="kds-btn btn-delete" onclick="deleteOrder('${order.id}')">
                    ${getIcon('trash')}
                    <span>${t('admin_btn_archive')}</span>
                </button>
            `;
        }

        const itemsList = (order.items || []).map(item => {
            const itemName = (typeof KOPI_I18N !== 'undefined') ? KOPI_I18N.getItemName(item) : item.name;
            return `
                <li class="order-card-item">
                    <span>
                        <span class="order-item-qty">${item.quantity}x</span>
                        <strong style="color: #ffffff;">${itemName}</strong>
                    </span>
                    <span style="color: var(--text-secondary); font-weight: 700; font-family: var(--font-body);">
                        ${((item.price || 0) * (item.quantity || 1)).toFixed(1)} ${currency}
                    </span>
                </li>
            `;
        }).join('');

        const noteBlock = order.notes 
            ? `<div class="order-note-box">${getIcon('note')} <div><strong>${t('admin_client_note')}</strong> ${order.notes}</div></div>` 
            : '';

        card.innerHTML = `
            <div class="order-card-header">
                <div>
                    <span class="order-table-badge">${t('admin_order_card_table')} ${order.table}</span>
                    <span class="order-id-badge">#${order.id}</span>
                </div>
                <div style="text-align: right;">
                    <span class="order-status-badge ${statusBadgeClass}">
                        ${getIcon(statusIconKey)}
                        <span>${statusBadgeText}</span>
                    </span>
                    <div>
                        <span class="order-elapsed-badge ${urgentClass}">
                            ${getIcon('clock')}
                            <span>${elapsed.text}</span>
                        </span>
                    </div>
                </div>
            </div>

            <ul class="order-card-items">
                ${itemsList}
            </ul>

            ${noteBlock}

            <div class="order-card-footer">
                <div class="order-total-row">
                    <span style="font-size: 0.92rem; color: var(--text-secondary); font-weight: 600;">${t('admin_order_total')}</span>
                    <span style="font-weight: 800; color: var(--gold-light); font-size: 1.25rem;">${(order.total || 0).toFixed(1)} ${currency}</span>
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
    const t = (k) => (typeof KOPI_I18N !== 'undefined' ? KOPI_I18N.t(k) : k);

    if (typeof KopiSync !== 'undefined') {
        KopiSync.updateOrderStatus(orderId, newStatus);
    } else {
        let orders = JSON.parse(localStorage.getItem('kopiOrders') || '[]');
        const order = orders.find(o => o.id === orderId);
        if (order) {
            order.status = newStatus;
            localStorage.setItem('kopiOrders', JSON.stringify(orders));
        }
    }

    SoundFX.actionSuccess();
    renderAdminKDS();
    const statusLabel = newStatus === 'preparing' ? t('admin_filter_prep') : (newStatus === 'completed' ? t('admin_filter_completed') : newStatus);
    showToast(`${t('receipt_order')} #${orderId} : ${statusLabel}`, "check");
}

function deleteOrder(orderId) {
    const t = (k) => (typeof KOPI_I18N !== 'undefined' ? KOPI_I18N.t(k) : k);
    if (!confirm(t('admin_confirm_archive'))) return;

    if (typeof KopiSync !== 'undefined') {
        KopiSync.deleteOrder(orderId);
    } else {
        let orders = JSON.parse(localStorage.getItem('kopiOrders') || '[]');
        orders = orders.filter(o => o.id !== orderId);
        localStorage.setItem('kopiOrders', JSON.stringify(orders));
    }

    renderAdminKDS();
    showToast(t('admin_btn_archive'), "trash");
}

function setAdminFilter(filter) {
    adminFilter = filter;
    document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    renderAdminKDS();
}

function clearAllOrders() {
    const t = (k) => (typeof KOPI_I18N !== 'undefined' ? KOPI_I18N.t(k) : k);
    if (!confirm(t('admin_confirm_reset'))) return;

    if (typeof KopiSync !== 'undefined') {
        KopiSync.saveLocalOrders([]);
    } else {
        localStorage.setItem('kopiOrders', JSON.stringify([]));
    }

    renderAdminKDS();
    showToast(t('admin_reset'), "broom");
}

// ==========================================================================
// TICKET PRINTING (Thermal 58mm / 80mm format)
// ==========================================================================
function printReceipt(orderId) {
    const orders = (typeof KopiSync !== 'undefined') ? KopiSync.getOrders() : JSON.parse(localStorage.getItem('kopiOrders') || '[]');
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const t = (k) => (typeof KOPI_I18N !== 'undefined' ? KOPI_I18N.t(k) : k);
    const currency = t('currency');
    const isAr = (typeof KOPI_I18N !== 'undefined' && KOPI_I18N.currentLang === 'ar');

    let itemsText = (order.items || []).map(i => {
        const itemName = (typeof KOPI_I18N !== 'undefined') ? KOPI_I18N.getItemName(i) : i.name;
        return `
            <tr>
                <td style="padding: 5px 0;"><strong>${i.quantity}x</strong> ${itemName}</td>
                <td style="text-align: right; padding: 5px 0;">${((i.price || 0) * (i.quantity || 1)).toFixed(1)} ${currency}</td>
            </tr>
        `;
    }).join('');

    const printWindow = window.open('', '_blank', 'width=380,height=600');
    if (!printWindow) {
        alert(isAr ? "يرجى السماح بالنوافذ المنبثقة لطباعة الوصل." : "Veuillez autoriser les fenêtres pop-up dans votre navigateur pour imprimer le ticket.");
        return;
    }

    printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="${isAr ? 'rtl' : 'ltr'}" lang="${isAr ? 'ar' : 'fr'}">
        <head>
            <title>${t('receipt_order')} #${order.id} - Kopi Koffee</title>
            <style>
                body {
                    font-family: ${isAr ? "'Cairo', Tahoma, sans-serif" : "'Courier New', Courier, monospace"};
                    padding: 14px;
                    width: 270px;
                    margin: 0 auto;
                    color: #000;
                    font-size: 13px;
                }
                .text-center { text-align: center; }
                .divider { border-top: 1px dashed #000; margin: 10px 0; }
                table { width: 100%; border-collapse: collapse; }
                h2 { margin: 2px 0; font-size: 18px; letter-spacing: 1px; }
            </style>
        </head>
        <body>
            <div class="text-center">
                <h2>${t('receipt_title')}</h2>
                <p style="margin: 2px 0; font-size: 11px;">${t('receipt_sub')}</p>
                <p style="font-size: 11px; margin: 2px 0;">${t('receipt_type')}</p>
            </div>
            <div class="divider"></div>
            <div>
                <strong>${t('receipt_table')}</strong> <span style="font-size: 17px; font-weight: bold;">${order.table}</span><br>
                <strong>${t('receipt_order')}</strong> #${order.id}<br>
                <strong>${t('receipt_date')}</strong> ${order.timeStr || new Date().toLocaleTimeString()}
            </div>
            <div class="divider"></div>
            <table>
                ${itemsText}
            </table>
            <div class="divider"></div>
            ${order.notes ? `<p><strong>${t('receipt_note')}</strong> ${order.notes}</p><div class="divider"></div>` : ''}
            <div style="font-size: 15px; font-weight: bold; display: flex; justify-content: space-between;">
                <span>${t('receipt_total')}</span>
                <span>${(order.total || 0).toFixed(1)} ${currency}</span>
            </div>
            <div class="divider"></div>
            <div class="text-center" style="font-size: 11px; margin-top: 12px;">
                ${t('receipt_thanks')}
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

