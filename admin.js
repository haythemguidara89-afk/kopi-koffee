// Kopi Koffee - Dedicated Admin & Kitchen Display System Logic (admin.js)
// WebAuthn Biometric Passkeys (Face ID, Touch ID) • Real-Time Order Processing & Modern KDS Dashboard

let adminFilter = 'all';
let searchQuery = '';
let soundEnabled = localStorage.getItem('kopiSoundEnabled') !== 'false';
let lastKnownOrderCount = 0;
let archivesSearchQuery = "";
let currentInviteToken = null;
let currentInviteAdminName = null;
let lastGeneratedInviteUrl = "";

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
    checkInviteTokenParam();
    startClock();
    setupSoundToggle();

    // Listen to global language change (FR / AR)
    window.addEventListener('kopiLangChanged', () => {
        updateAdminStaticTranslations();
        updateSupabaseStatusBadge();
        renderAdminKDS();
    });

    // Supabase DB status tracking
    updateSupabaseStatusBadge();
    window.addEventListener('kopiSupabaseReady', () => {
        updateSupabaseStatusBadge();
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

    const hintMetricRev = document.getElementById('hint-metric-revenue');
    if (hintMetricRev) hintMetricRev.innerText = t('admin_click_to_extract');

    const labelReportBtn = document.getElementById('label-report-btn');
    if (labelReportBtn) labelReportBtn.innerText = t('admin_daily_title');

    const labelArchivesBtn = document.getElementById('label-archives-btn');
    if (labelArchivesBtn) labelArchivesBtn.innerText = t('admin_btn_archives');

    const dailyModalTitle = document.getElementById('daily-modal-title');
    if (dailyModalTitle) dailyModalTitle.innerText = t('admin_daily_title');

    const dailyModalSub = document.getElementById('daily-modal-subtitle');
    if (dailyModalSub) dailyModalSub.innerText = t('admin_daily_subtitle');

    const kpiLabelRev = document.getElementById('kpi-label-revenue');
    if (kpiLabelRev) kpiLabelRev.innerText = t('admin_metric_revenue');

    const kpiLabelServed = document.getElementById('kpi-label-served');
    if (kpiLabelServed) kpiLabelServed.innerText = t('admin_metric_served_count');

    const kpiLabelItems = document.getElementById('kpi-label-items');
    if (kpiLabelItems) kpiLabelItems.innerText = t('admin_metric_items');

    const kpiLabelBasket = document.getElementById('kpi-label-basket');
    if (kpiLabelBasket) kpiLabelBasket.innerText = t('admin_metric_avg_basket');

    const labelExportCsv = document.getElementById('label-export-csv');
    if (labelExportCsv) labelExportCsv.innerText = t('admin_btn_extract_csv');

    const labelPrintZ = document.getElementById('label-print-zreport');
    if (labelPrintZ) labelPrintZ.innerText = t('admin_btn_print_zreport');

    const labelCopySum = document.getElementById('label-copy-summary');
    if (labelCopySum) labelCopySum.innerText = t('admin_btn_copy_summary');

    const dailyServedTitle = document.getElementById('daily-served-title');
    if (dailyServedTitle) dailyServedTitle.innerText = t('admin_served_orders_title');

    const archivesModalTitle = document.getElementById('archives-modal-title');
    if (archivesModalTitle) archivesModalTitle.innerText = t('admin_archives_title');

    const archivesModalSub = document.getElementById('archives-modal-subtitle');
    if (archivesModalSub) archivesModalSub.innerText = t('admin_archives_subtitle');

    const archivesInput = document.getElementById('archives-search-input');
    if (archivesInput) archivesInput.placeholder = t('admin_search_archives');

    const labelExportArch = document.getElementById('label-export-archives-csv');
    if (labelExportArch) labelExportArch.innerText = t('admin_btn_extract_csv');

    // Passkey Biometrics & Security translations
    const passkeyBtn = document.getElementById('label-passkey-btn');
    if (passkeyBtn) passkeyBtn.innerText = t('passkey_login_btn');

    const recToggle = document.getElementById('label-recovery-toggle');
    if (recToggle) recToggle.innerText = t('passkey_recovery_toggle');

    const recInput = document.getElementById('passkey-recovery-input');
    if (recInput) recInput.placeholder = t('passkey_recovery_placeholder');

    const recSubmit = document.getElementById('label-recovery-submit');
    if (recSubmit) recSubmit.innerText = t('passkey_recovery_btn');

    const secNav = document.getElementById('label-security-nav');
    if (secNav) secNav.innerText = t('passkey_manage_nav_btn');

    const invModalTitle = document.getElementById('invite-modal-title');
    if (invModalTitle) invModalTitle.innerText = t('passkey_modal_invite_title');

    const invModalSub = document.getElementById('invite-modal-subtitle');
    if (invModalSub) invModalSub.innerText = t('passkey_modal_invite_desc');

    const invWelcome = document.getElementById('label-invite-welcome');
    if (invWelcome) invWelcome.innerText = t('passkey_welcome_team');

    const invPrompt = document.getElementById('label-invite-prompt');
    if (invPrompt) invPrompt.innerText = t('passkey_invite_prompt');

    const invEnrollBtn = document.getElementById('label-invite-enroll-btn');
    if (invEnrollBtn) invEnrollBtn.innerText = t('passkey_register_now');

    const invSuccessTitle = document.getElementById('label-invite-success-title');
    if (invSuccessTitle) invSuccessTitle.innerText = t('passkey_success_title');

    const invSuccessDesc = document.getElementById('label-invite-success-desc');
    if (invSuccessDesc) invSuccessDesc.innerText = t('passkey_success_desc');

    const invEnterBtn = document.getElementById('label-invite-enter-btn');
    if (invEnterBtn) invEnterBtn.innerText = t('passkey_enter_kds');

    const secModalTitle = document.getElementById('security-modal-title');
    if (secModalTitle) secModalTitle.innerText = t('passkey_manage_modal_title');

    const secModalSub = document.getElementById('security-modal-subtitle');
    if (secModalSub) secModalSub.innerText = t('passkey_manage_modal_desc');

    const invSecTitle = document.querySelector('#label-invite-sec-title span');
    if (invSecTitle) invSecTitle.innerText = t('passkey_create_invite_title');

    const invSecDesc = document.getElementById('label-invite-sec-desc');
    if (invSecDesc) invSecDesc.innerText = t('passkey_create_invite_desc');

    const invNameInput = document.getElementById('invite-admin-name-input');
    if (invNameInput) invNameInput.placeholder = t('passkey_staff_name_placeholder');

    const btnGenInvite = document.getElementById('label-btn-generate-invite');
    if (btnGenInvite) btnGenInvite.innerText = t('passkey_btn_generate');

    const btnCopyInvite = document.getElementById('label-btn-copy-invite');
    if (btnCopyInvite) btnCopyInvite.innerText = t('passkey_copy_link_short');

    const invNotice = document.getElementById('label-invite-notice');
    if (invNotice) invNotice.innerText = t('passkey_invite_notice');

    const passkeysListTitle = document.querySelector('#label-passkeys-list-title span');
    if (passkeysListTitle) passkeysListTitle.innerText = t('passkey_active_list_title');
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

    // Update Archived Orders Badge
    const countArchived = document.getElementById('count-archived');
    const archivedOrders = (typeof KopiSync !== 'undefined') ? KopiSync.getArchivedOrders() : JSON.parse(localStorage.getItem('kopiArchivedOrders') || '[]');
    if (countArchived) countArchived.innerText = archivedOrders.length;

    // Refresh open report modals if currently open
    const dailyModal = document.getElementById('daily-summary-modal-overlay');
    if (dailyModal && dailyModal.classList.contains('open')) {
        renderDailySummary();
    }
    const archivesModal = document.getElementById('archived-orders-modal-overlay');
    if (archivesModal && archivesModal.classList.contains('open')) {
        renderArchivedOrders();
    }

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
            order.updatedAt = Date.now();
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
        KopiSync.archiveOrder(orderId);
    } else {
        let orders = JSON.parse(localStorage.getItem('kopiOrders') || '[]');
        const order = orders.find(o => o.id === orderId);
        if (order) {
            order.archivedAt = new Date().toISOString();
            let archived = JSON.parse(localStorage.getItem('kopiArchivedOrders') || '[]');
            archived.unshift(order);
            localStorage.setItem('kopiArchivedOrders', JSON.stringify(archived));
        }
        orders = orders.filter(o => o.id !== orderId);
        localStorage.setItem('kopiOrders', JSON.stringify(orders));
    }

    renderAdminKDS();
    showToast(t('admin_btn_archive'), "archive");
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
    let order = orders.find(o => o.id === orderId);
    if (!order) {
        const archived = (typeof KopiSync !== 'undefined') ? KopiSync.getArchivedOrders() : JSON.parse(localStorage.getItem('kopiArchivedOrders') || '[]');
        order = archived.find(o => o.id === orderId);
    }
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

// ==========================================================================
// DAILY SUMMARY & SERVED ORDERS REPORT (KDS EXTENSION)
// ==========================================================================
function getDailyServedOrders() {
    const activeOrders = (typeof KopiSync !== 'undefined') ? KopiSync.getOrders() : JSON.parse(localStorage.getItem('kopiOrders') || '[]');
    const archivedOrders = (typeof KopiSync !== 'undefined') ? KopiSync.getArchivedOrders() : JSON.parse(localStorage.getItem('kopiArchivedOrders') || '[]');
    
    // Combine and deduplicate by id
    const combined = [...activeOrders, ...archivedOrders];
    const uniqueOrders = [];
    const seen = new Set();
    
    for (const o of combined) {
        if (!seen.has(o.id)) {
            seen.add(o.id);
            uniqueOrders.push(o);
        }
    }
    
    // Return all orders that have been served / completed
    return uniqueOrders.filter(o => o.status === 'completed');
}

function openDailySummaryModal() {
    const overlay = document.getElementById('daily-summary-modal-overlay');
    if (overlay) {
        overlay.classList.add('open');
        renderDailySummary();
    }
}

function closeDailySummaryModal(e) {
    if (e && e.target && e.target.id !== 'daily-summary-modal-overlay') return;
    const overlay = document.getElementById('daily-summary-modal-overlay');
    if (overlay) overlay.classList.remove('open');
}

function renderDailySummary() {
    const container = document.getElementById('daily-served-list-container');
    const t = (k) => (typeof KOPI_I18N !== 'undefined' ? KOPI_I18N.t(k) : k);
    const currency = t('currency');

    const servedOrders = getDailyServedOrders();
    const totalRevenue = servedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalItems = servedOrders.reduce((sum, o) => sum + (o.items || []).reduce((isum, i) => isum + (i.quantity || 1), 0), 0);
    const avgBasket = servedOrders.length > 0 ? (totalRevenue / servedOrders.length) : 0;

    // Update KPI Elements in Modal
    const valRev = document.getElementById('kpi-val-revenue');
    const valServed = document.getElementById('kpi-val-served');
    const valItems = document.getElementById('kpi-val-items');
    const valBasket = document.getElementById('kpi-val-basket');
    const badgeServed = document.getElementById('daily-served-count-badge');

    if (valRev) valRev.innerText = `${totalRevenue.toFixed(1)} ${currency}`;
    if (valServed) valServed.innerText = servedOrders.length;
    if (valItems) valItems.innerText = totalItems;
    if (valBasket) valBasket.innerText = `${avgBasket.toFixed(1)} ${currency}`;
    if (badgeServed) badgeServed.innerText = servedOrders.length;

    if (!container) return;

    if (servedOrders.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 45px 20px; color: var(--text-muted); background: linear-gradient(145deg, rgba(17, 26, 40, 0.9), rgba(12, 18, 29, 0.95)); border-radius: var(--radius-md); border: 1px dashed var(--gold-border);">
                <div style="margin-bottom: 12px; color: var(--gold-light);">${getIcon('tray', 'icon-svg-xl')}</div>
                <h3 style="color: var(--gold-light); font-size: 1.15rem; margin-bottom: 6px;">${t('admin_no_served_orders')}</h3>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    servedOrders.forEach(order => {
        const card = document.createElement('div');
        card.className = 'report-order-card';

        const orderDate = order.timestamp || order.createdAt;
        const formattedTime = orderDate ? new Date(orderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (order.timeStr || '');
        const formattedDate = orderDate ? new Date(orderDate).toLocaleDateString() : '';

        const itemsText = (order.items || []).map(i => {
            const name = (typeof KOPI_I18N !== 'undefined') ? KOPI_I18N.getItemName(i) : i.name;
            return `<strong>${i.quantity || 1}x</strong> ${name}`;
        }).join(' • ');

        card.innerHTML = `
            <div class="report-order-left">
                <div class="report-order-badge-row">
                    <span class="report-table-tag">${t('admin_order_card_table')} ${order.table}</span>
                    <span class="report-order-id">#${order.id}</span>
                    <span class="report-order-time">
                        ${getIcon('clock')} <span>${formattedDate ? formattedDate + ' ' : ''}${formattedTime}</span>
                    </span>
                    <span class="status-badge status-badge-completed">
                        ${getIcon('check')} <span>${t('admin_filter_completed')}</span>
                    </span>
                </div>
                <div class="report-order-items-summary">${itemsText}</div>
                ${order.notes ? `<div class="report-order-note-snippet">${getIcon('note')} ${order.notes}</div>` : ''}
            </div>
            <div class="report-order-right">
                <span class="report-order-total-val">${(order.total || 0).toFixed(1)} ${currency}</span>
                <button type="button" class="btn-ticket-mini" onclick="printReceipt('${order.id}')" title="${t('admin_btn_print')}">
                    ${getIcon('print')} <span>${t('admin_btn_print')}</span>
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function exportDailyOrdersCSV() {
    const servedOrders = getDailyServedOrders();
    const isAr = (typeof KOPI_I18N !== 'undefined' && KOPI_I18N.currentLang === 'ar');
    const currency = (typeof KOPI_I18N !== 'undefined') ? KOPI_I18N.t('currency') : 'DT';

    if (servedOrders.length === 0) {
        showToast(isAr ? "لا توجد طلبات مقدمة لتصديرها" : "Aucune commande servie à exporter", "tray");
        return;
    }

    const headers = isAr ? 
        ["معرف الطلب", "التاريخ", "الوقت", "رقم الطاولة", "المحتويات", "الملاحظات", `المجموع (${currency})`, "الحالة"] :
        ["ID Commande", "Date", "Heure", "Table", "Articles", "Instructions", `Total (${currency})`, "Statut"];

    const rows = servedOrders.map(o => {
        const orderDate = o.timestamp || o.createdAt;
        const dateStr = orderDate ? new Date(orderDate).toLocaleDateString() : (new Date().toLocaleDateString());
        const timeStr = o.timeStr || (orderDate ? new Date(orderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');
        const itemsStr = (o.items || []).map(i => {
            const name = (typeof KOPI_I18N !== 'undefined') ? KOPI_I18N.getItemName(i) : i.name;
            return `${i.quantity || 1}x ${name}`;
        }).join(" | ");
        const notesStr = (o.notes || "").split('"').join('""');

        return [
            o.id,
            dateStr,
            timeStr,
            o.table,
            `"${itemsStr.split('"').join('""')}"`,
            `"${notesStr}"`,
            (o.total || 0).toFixed(1),
            o.status
        ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const todayStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `kopi-koffee-cloture-${todayStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(isAr ? "تم تصدير ملف CSV بنجاح !" : "Fichier CSV exporté avec succès !", "download");
}

function printDailyClosureReport() {
    const servedOrders = getDailyServedOrders();
    const t = (k) => (typeof KOPI_I18N !== 'undefined' ? KOPI_I18N.t(k) : k);
    const currency = t('currency');
    const isAr = (typeof KOPI_I18N !== 'undefined' && KOPI_I18N.currentLang === 'ar');

    const totalRevenue = servedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalItems = servedOrders.reduce((sum, o) => sum + (o.items || []).reduce((isum, i) => isum + (i.quantity || 1), 0), 0);
    const avgBasket = servedOrders.length > 0 ? (totalRevenue / servedOrders.length) : 0;

    // Aggregate sold items frequency
    const itemMap = {};
    servedOrders.forEach(o => {
        (o.items || []).forEach(i => {
            const name = (typeof KOPI_I18N !== 'undefined') ? KOPI_I18N.getItemName(i) : i.name;
            if (!itemMap[name]) {
                itemMap[name] = { qty: 0, revenue: 0 };
            }
            const q = i.quantity || 1;
            itemMap[name].qty += q;
            itemMap[name].revenue += (i.price || 0) * q;
        });
    });

    const itemRows = Object.keys(itemMap).sort((a, b) => itemMap[b].qty - itemMap[a].qty).map(name => `
        <tr>
            <td style="padding: 4px 0;"><strong>${itemMap[name].qty}x</strong> ${name}</td>
            <td style="text-align: right; padding: 4px 0;">${itemMap[name].revenue.toFixed(1)} ${currency}</td>
        </tr>
    `).join('');

    const ordersRows = servedOrders.map(o => {
        const timeStr = o.timeStr || (o.timestamp ? new Date(o.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');
        return `
            <tr>
                <td style="padding: 4px 0;">#${o.id} • ${t('admin_order_card_table')} ${o.table} (${timeStr})</td>
                <td style="text-align: right; padding: 4px 0; font-weight: bold;">${(o.total || 0).toFixed(1)} ${currency}</td>
            </tr>
        `;
    }).join('');

    const printWindow = window.open('', '_blank', 'width=420,height=700');
    if (!printWindow) {
        alert(isAr ? "يرجى السماح بالنوافذ المنبثقة لطباعة التقرير." : "Veuillez autoriser les fenêtres pop-up pour imprimer le rapport.");
        return;
    }

    const nowStr = new Date().toLocaleString(isAr ? 'ar-TN' : 'fr-FR');

    printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="${isAr ? 'rtl' : 'ltr'}" lang="${isAr ? 'ar' : 'fr'}">
        <head>
            <title>${t('admin_daily_title')} - Kopi Koffee</title>
            <style>
                body {
                    font-family: ${isAr ? "'Cairo', Tahoma, sans-serif" : "'Courier New', Courier, monospace"};
                    padding: 14px;
                    width: 300px;
                    margin: 0 auto;
                    color: #000;
                    font-size: 13px;
                }
                .text-center { text-align: center; }
                .divider { border-top: 1px dashed #000; margin: 10px 0; }
                table { width: 100%; border-collapse: collapse; }
                h2 { margin: 2px 0; font-size: 18px; }
                .kpi-row { display: flex; justify-content: space-between; margin: 3px 0; }
            </style>
        </head>
        <body>
            <div class="text-center">
                <h2>${t('receipt_title')}</h2>
                <p style="margin: 2px 0; font-size: 11px;">Food & Drink • Café Lounge</p>
                <h3 style="margin: 6px 0; font-size: 14px; text-transform: uppercase;">${t('admin_daily_title')}</h3>
                <p style="font-size: 11px; margin: 2px 0;">${nowStr}</p>
            </div>
            <div class="divider"></div>
            <div>
                <div class="kpi-row"><strong>${t('admin_metric_revenue')} :</strong> <span style="font-size: 16px; font-weight: bold;">${totalRevenue.toFixed(1)} ${currency}</span></div>
                <div class="kpi-row"><span>${t('admin_metric_served_count')} :</span> <span>${servedOrders.length}</span></div>
                <div class="kpi-row"><span>${t('admin_metric_items')} :</span> <span>${totalItems}</span></div>
                <div class="kpi-row"><span>${t('admin_metric_avg_basket')} :</span> <span>${avgBasket.toFixed(1)} ${currency}</span></div>
            </div>
            <div class="divider"></div>
            <div style="font-weight: bold; margin-bottom: 6px; text-transform: uppercase;">${t('admin_articles_sold')}</div>
            <table>
                ${itemRows || `<tr><td>-</td></tr>`}
            </table>
            <div class="divider"></div>
            <div style="font-weight: bold; margin-bottom: 6px; text-transform: uppercase;">${t('admin_served_orders_title')}</div>
            <table>
                ${ordersRows || `<tr><td>-</td></tr>`}
            </table>
            <div class="divider"></div>
            <div class="text-center" style="font-size: 11px; margin-top: 10px;">
                *** CLÔTURE DU JOUR VALIDÉE ***
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

function copyDailySummaryText() {
    const servedOrders = getDailyServedOrders();
    const t = (k) => (typeof KOPI_I18N !== 'undefined' ? KOPI_I18N.t(k) : k);
    const currency = t('currency');
    const totalRev = servedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalIt = servedOrders.reduce((sum, o) => sum + (o.items || []).reduce((isum, i) => isum + (i.quantity || 1), 0), 0);
    const dateStr = new Date().toLocaleDateString();

    const summaryText = `*KOPI KOFFEE - ${t('admin_daily_title')}*
Date: ${dateStr}
------------------------
• ${t('admin_metric_revenue')}: ${totalRev.toFixed(1)} ${currency}
• ${t('admin_metric_served_count')}: ${servedOrders.length}
• ${t('admin_metric_items')}: ${totalIt}
• ${t('admin_metric_avg_basket')}: ${(servedOrders.length ? (totalRev / servedOrders.length) : 0).toFixed(1)} ${currency}
------------------------`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(summaryText).then(() => {
            showToast(t('admin_toast_summary_copied'), "copy");
        }).catch(() => {
            showToast(t('admin_toast_summary_copied'), "check");
        });
    } else {
        showToast(t('admin_toast_summary_copied'), "check");
    }
}

// ==========================================================================
// ARCHIVED ORDERS MANAGEMENT (WITH TIMESTAMPS & RESTORATION)
// ==========================================================================
function openArchivedOrdersModal() {
    const overlay = document.getElementById('archived-orders-modal-overlay');
    if (overlay) {
        overlay.classList.add('open');
        renderArchivedOrders();
    }
}

function closeArchivedOrdersModal(e) {
    if (e && e.target && e.target.id !== 'archived-orders-modal-overlay') return;
    const overlay = document.getElementById('archived-orders-modal-overlay');
    if (overlay) overlay.classList.remove('open');
}

function handleArchivesSearch(query) {
    archivesSearchQuery = (query || '').toLowerCase().trim();
    renderArchivedOrders();
}

function renderArchivedOrders() {
    const container = document.getElementById('archives-list-container');
    if (!container) return;
    const t = (k) => (typeof KOPI_I18N !== 'undefined' ? KOPI_I18N.t(k) : k);
    const isAr = (typeof KOPI_I18N !== 'undefined' && KOPI_I18N.currentLang === 'ar');
    const currency = t('currency');

    let archived = (typeof KopiSync !== 'undefined') ? KopiSync.getArchivedOrders() : JSON.parse(localStorage.getItem('kopiArchivedOrders') || '[]');

    const countArchived = document.getElementById('count-archived');
    if (countArchived) countArchived.innerText = archived.length;

    if (archivesSearchQuery.length > 0) {
        archived = archived.filter(o => {
            const tableMatch = String(o.table || '').toLowerCase().includes(archivesSearchQuery);
            const idMatch = String(o.id || '').toLowerCase().includes(archivesSearchQuery);
            const itemsMatch = (o.items || []).some(item => {
                const name = (typeof KOPI_I18N !== 'undefined') ? KOPI_I18N.getItemName(item).toLowerCase() : (item.name || '').toLowerCase();
                return name.includes(archivesSearchQuery);
            });
            return tableMatch || idMatch || itemsMatch;
        });
    }

    if (archived.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 45px 20px; color: var(--text-muted); background: linear-gradient(145deg, rgba(17, 26, 40, 0.9), rgba(12, 18, 29, 0.95)); border-radius: var(--radius-md); border: 1px dashed var(--gold-border);">
                <div style="margin-bottom: 12px; color: var(--gold-light);">${getIcon('archive', 'icon-svg-xl')}</div>
                <h3 style="color: var(--gold-light); font-size: 1.15rem; margin-bottom: 6px;">${t('admin_no_archives')}</h3>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    archived.forEach(order => {
        const card = document.createElement('div');
        card.className = 'report-order-card';

        const createdDate = order.timestamp || order.createdAt;
        const createdFormatted = createdDate ? new Date(createdDate).toLocaleString(isAr ? 'ar-TN' : 'fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }) : (order.timeStr || '');

        const archivedDate = order.archivedAt ? new Date(order.archivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

        const itemsText = (order.items || []).map(i => {
            const name = (typeof KOPI_I18N !== 'undefined') ? KOPI_I18N.getItemName(i) : i.name;
            return `<strong>${i.quantity || 1}x</strong> ${name}`;
        }).join(' • ');

        card.innerHTML = `
            <div class="report-order-left">
                <div class="report-order-badge-row">
                    <span class="report-table-tag">${t('admin_order_card_table')} ${order.table}</span>
                    <span class="report-order-id">#${order.id}</span>
                    <span class="report-order-time" title="${t('admin_created_at')}">
                        ${getIcon('clock')} <span>${t('admin_created_at')} ${createdFormatted}</span>
                    </span>
                    ${archivedDate ? `<span class="report-archived-time">${getIcon('archive')} <span>${t('admin_archived_at')} ${archivedDate}</span></span>` : ''}
                </div>
                <div class="report-order-items-summary">${itemsText}</div>
                ${order.notes ? `<div class="report-order-note-snippet">${getIcon('note')} ${order.notes}</div>` : ''}
            </div>
            <div class="report-order-right">
                <span class="report-order-total-val">${(order.total || 0).toFixed(1)} ${currency}</span>
                <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                    <button type="button" class="btn-ticket-mini" onclick="restoreArchivedOrder('${order.id}')" title="${t('admin_btn_restore')}">
                        ${getIcon('restore')} <span>${t('admin_btn_restore')}</span>
                    </button>
                    <button type="button" class="btn-ticket-mini" onclick="printReceipt('${order.id}')" title="${t('admin_btn_print')}">
                        ${getIcon('print')} <span>${t('admin_btn_print')}</span>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function restoreArchivedOrder(orderId) {
    const t = (k) => (typeof KOPI_I18N !== 'undefined' ? KOPI_I18N.t(k) : k);
    if (!confirm(t('admin_confirm_restore'))) return;

    if (typeof KopiSync !== 'undefined') {
        KopiSync.restoreOrder(orderId);
    } else {
        let archived = JSON.parse(localStorage.getItem('kopiArchivedOrders') || '[]');
        const order = archived.find(o => o.id === orderId);
        if (order) {
            delete order.archivedAt;
            archived = archived.filter(o => o.id !== orderId);
            localStorage.setItem('kopiArchivedOrders', JSON.stringify(archived));

            let orders = JSON.parse(localStorage.getItem('kopiOrders') || '[]');
            orders.unshift(order);
            localStorage.setItem('kopiOrders', JSON.stringify(orders));
        }
    }

    SoundFX.actionSuccess();
    renderArchivedOrders();
    renderAdminKDS();
    showToast(t('admin_toast_restored'), "check");
}

function exportArchivedOrdersCSV() {
    const t = (k) => (typeof KOPI_I18N !== 'undefined' ? KOPI_I18N.t(k) : k);
    const isAr = (typeof KOPI_I18N !== 'undefined' && KOPI_I18N.currentLang === 'ar');
    const currency = t('currency');

    const archived = (typeof KopiSync !== 'undefined') ? KopiSync.getArchivedOrders() : JSON.parse(localStorage.getItem('kopiArchivedOrders') || '[]');

    if (archived.length === 0) {
        showToast(t('admin_no_archives'), "archive");
        return;
    }

    const headers = isAr ? 
        ["معرف الطلب", "تاريخ الإنشاء", "تاريخ الأرشفة", "رقم الطاولة", "المحتويات", "الملاحظات", `المجموع (${currency})`, "الحالة"] :
        ["ID Commande", "Date Création", "Date Archivage", "Table", "Articles", "Instructions", `Total (${currency})`, "Statut"];

    const rows = archived.map(o => {
        const createdDate = o.timestamp || o.createdAt;
        const createdStr = createdDate ? new Date(createdDate).toLocaleString() : (o.timeStr || '');
        const archivedStr = o.archivedAt ? new Date(o.archivedAt).toLocaleString() : '';
        const itemsStr = (o.items || []).map(i => {
            const name = (typeof KOPI_I18N !== 'undefined') ? KOPI_I18N.getItemName(i) : i.name;
            return `${i.quantity || 1}x ${name}`;
        }).join(" | ");
        const notesStr = (o.notes || "").split('"').join('""');

        return [
            o.id,
            `"${createdStr}"`,
            `"${archivedStr}"`,
            o.table,
            `"${itemsStr.split('"').join('""')}"`,
            `"${notesStr}"`,
            (o.total || 0).toFixed(1),
            o.status || 'archived'
        ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const todayStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `kopi-koffee-archives-${todayStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(isAr ? "تم تصدير أرشيف CSV بنجاح !" : "Archives CSV exportées avec succès !", "download");
}

// ==========================================================================
// SUPABASE MODAL & DATABASE SETTINGS
// ==========================================================================
function updateSupabaseStatusBadge() {
    const dot = document.getElementById('supabase-status-dot');
    const text = document.getElementById('supabase-status-text');
    const indDot = document.getElementById('supabase-status-indicator-dot');
    const bannerTitle = document.getElementById('supabase-banner-title');
    const bannerDesc = document.getElementById('supabase-banner-desc');
    const isAr = (typeof KOPI_I18N !== 'undefined') && KOPI_I18N.currentLang === 'ar';

    const cfg = (typeof getActiveSupabaseConfig === 'function') ? getActiveSupabaseConfig() : { isConfigured: false };

    if (cfg.isConfigured && typeof kopiSupabase !== 'undefined' && kopiSupabase) {
        if (dot) dot.style.background = 'var(--success)';
        if (text) text.innerText = isAr ? 'PostgreSQL متصل' : 'Postgres Connecté';
        if (indDot) indDot.style.background = 'var(--success)';
        if (bannerTitle) bannerTitle.innerText = isAr ? 'متصل بقاعدة البيانات Supabase PostgreSQL' : 'Connecté à Supabase PostgreSQL';
        if (bannerDesc) bannerDesc.innerText = isAr ? 'البيانات تُحفظ وتتزامن بشكل دائم وفوري عبر خوادم Supabase.' : 'Vos commandes sont enregistrées et synchronisées en temps réel dans votre base PostgreSQL.';
    } else {
        if (dot) dot.style.background = 'var(--warning)';
        if (text) text.innerText = isAr ? 'خادم الترحيل' : 'Relais Actif';
        if (indDot) indDot.style.background = 'var(--warning)';
        if (bannerTitle) bannerTitle.innerText = isAr ? 'خادم الترحيل الفوري نشط (Supabase غير مهيأ)' : 'Relais Instantané Actif (Supabase non configuré)';
        if (bannerDesc) bannerDesc.innerText = isAr ? 'أدخل رابط ومفتاح مشروع Supabase للربط بقاعدة بيانات PostgreSQL الدائمة.' : 'Renseignez l\'URL et la clé publique de votre projet Supabase pour activer la persistance PostgreSQL.';
    }
}

function openSupabaseModal() {
    const modal = document.getElementById('supabase-modal-overlay');
    if (!modal) return;

    const urlInput = document.getElementById('supabase-url-input');
    const keyInput = document.getElementById('supabase-key-input');
    const cfg = (typeof getActiveSupabaseConfig === 'function') ? getActiveSupabaseConfig() : { url: '', anonKey: '' };

    if (urlInput) {
        const storedUrl = localStorage.getItem('kopiSupabaseUrl') || (cfg.url !== 'YOUR_SUPABASE_PROJECT_URL' ? cfg.url : '');
        urlInput.value = storedUrl;
    }
    if (keyInput) {
        const storedKey = localStorage.getItem('kopiSupabaseAnonKey') || (cfg.anonKey !== 'YOUR_SUPABASE_ANON_KEY' ? cfg.anonKey : '');
        keyInput.value = storedKey;
    }

    updateSupabaseStatusBadge();
    modal.classList.add('active');
}

function closeSupabaseModal(e) {
    if (e && e.target && e.target !== e.currentTarget && !e.target.classList.contains('report-modal-close')) return;
    const modal = document.getElementById('supabase-modal-overlay');
    if (modal) modal.classList.remove('active');
}

async function testSupabaseConnection() {
    const urlInput = document.getElementById('supabase-url-input');
    const keyInput = document.getElementById('supabase-key-input');
    const url = (urlInput ? urlInput.value : '').trim();
    const key = (keyInput ? keyInput.value : '').trim();
    const isAr = (typeof KOPI_I18N !== 'undefined') && KOPI_I18N.currentLang === 'ar';

    if (!url || !key) {
        showToast(isAr ? 'يرجى إدخال الرابط والمفتاح' : 'Veuillez saisir l\'URL et la clé Supabase', 'alert-circle');
        return;
    }

    if (typeof window.supabase === 'undefined') {
        showToast(isAr ? 'مكتبة Supabase غير متوفرة' : 'SDK Supabase introuvable', 'alert-circle');
        return;
    }

    showToast(isAr ? 'جاري اختبار الاتصال...' : 'Test de connexion en cours...', 'refresh');

    try {
        const client = window.supabase.createClient(url, key, { auth: { persistSession: false } });
        const { data, error } = await client.from('orders').select('id').limit(1);
        if (error) {
            console.warn('Supabase test error:', error);
            showToast(isAr ? `خطأ: ${error.message}` : `Erreur de connexion : ${error.message}`, 'alert-circle');
        } else {
            showToast(isAr ? 'الاتصال بقاعدة البيانات ناجح 100% !' : 'Connexion Supabase réussie à 100% !', 'check');
            const indDot = document.getElementById('supabase-status-indicator-dot');
            if (indDot) indDot.style.background = 'var(--success)';
        }
    } catch (err) {
        showToast(isAr ? 'فشل الاتصال بـ Supabase' : 'Échec du test de connexion', 'alert-circle');
    }
}

function saveSupabaseSettings() {
    const urlInput = document.getElementById('supabase-url-input');
    const keyInput = document.getElementById('supabase-key-input');
    const url = (urlInput ? urlInput.value : '').trim();
    const key = (keyInput ? keyInput.value : '').trim();
    const isAr = (typeof KOPI_I18N !== 'undefined') && KOPI_I18N.currentLang === 'ar';

    if (url && key) {
        localStorage.setItem('kopiSupabaseUrl', url);
        localStorage.setItem('kopiSupabaseAnonKey', key);
    } else {
        localStorage.removeItem('kopiSupabaseUrl');
        localStorage.removeItem('kopiSupabaseAnonKey');
    }

    if (typeof initSupabaseClient === 'function') {
        initSupabaseClient();
    }
    if (typeof KopiSync !== 'undefined' && typeof KopiSync.initRealtime === 'function') {
        KopiSync.initRealtime();
    }

    updateSupabaseStatusBadge();
    showToast(isAr ? 'تم حفظ إعدادات قاعدة البيانات !' : 'Paramètres Supabase enregistrés !', 'check');
    setTimeout(() => {
        closeSupabaseModal();
    }, 600);
}

// ==========================================================================
// PASSKEY BIOMETRIC & WEBAUTHN AUTHENTICATION HANDLERS
// ==========================================================================
async function handlePasskeyLogin() {
    const t = (k) => (typeof KOPI_I18N !== 'undefined' ? KOPI_I18N.t(k) : k);
    if (typeof KopiPasskey === 'undefined' || !KopiPasskey.isSupported()) {
        showToast(t('passkey_no_biometrics'), 'alert-circle');
        return;
    }

    try {
        const res = await KopiPasskey.authenticateWithPasskey();
        if (res && res.success) {
            sessionStorage.setItem('kopiStaffAuth', 'true');
            SoundFX.actionSuccess();
            showToast(`${t('passkey_success_login')} (${res.adminName})`, 'shield-check');
            showKDSView();
        }
    } catch (err) {
        if (err.message === 'NO_PASSKEYS_REGISTERED') {
            const isAr = (typeof KOPI_I18N !== 'undefined') && KOPI_I18N.currentLang === 'ar';
            const msg = isAr ?
                'لا توجد مفاتيح مرور مسجلة بعد. استخدم الرمز السري (10699) أو اطلب رابط تفعيل.' :
                'Aucun Passkey enregistré. Utilisez le code PIN (10699) ou demandez un lien d\'activation.';
            showToast(msg, 'alert-circle');
            return;
        }
        if (err.name === 'NotAllowedError' || (err.message && err.message.includes('annul'))) {
            return;
        }
        SoundFX.accessDenied();
        showToast(err.message || 'Échec de la connexion biométrique', 'alert-circle');
    }
}

function toggleRecoveryCodePane() {
    const pane = document.getElementById('passkey-recovery-pane');
    if (!pane) return;
    const isHidden = (pane.style.display === 'none' || !pane.style.display);
    pane.style.display = isHidden ? 'block' : 'none';
    if (isHidden) {
        const input = document.getElementById('passkey-recovery-input');
        if (input) input.focus();
    }
}

async function submitRecoveryCode() {
    const input = document.getElementById('passkey-recovery-input');
    const code = input ? input.value.trim() : '';
    const t = (k) => (typeof KOPI_I18N !== 'undefined' ? KOPI_I18N.t(k) : k);

    if (!code) {
        showToast(t('passkey_recovery_placeholder'), 'alert-circle');
        return;
    }

    try {
        const res = await KopiPasskey.authenticateWithRecoveryCode(code);
        if (res && res.success) {
            sessionStorage.setItem('kopiStaffAuth', 'true');
            SoundFX.actionSuccess();
            showToast(`${t('passkey_success_login')} (${res.adminName})`, 'shield-check');
            showKDSView();
        }
    } catch (err) {
        SoundFX.accessDenied();
        showToast(err.message || 'Code de secours invalide', 'alert-circle');
    }
}

// --------------------------------------------------------------------------
// ONE-TIME INVITE URL PROCESSING
// --------------------------------------------------------------------------
async function checkInviteTokenParam() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('setup_passkey');
    if (!token) return;

    if (typeof KopiPasskey === 'undefined') {
        setTimeout(checkInviteTokenParam, 200);
        return;
    }

    const t = (k) => (typeof KOPI_I18N !== 'undefined' ? KOPI_I18N.t(k) : k);
    const validation = await KopiPasskey.validateInviteToken(token);

    if (!validation.valid) {
        let msg = "Lien d'invitation invalide.";
        if (validation.reason === 'used') msg = "Ce lien d'invitation a déjà été utilisé.";
        if (validation.reason === 'expired') msg = "Ce lien d'invitation a expiré.";
        showToast(msg, 'alert-circle');
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
    }

    currentInviteToken = token;
    currentInviteAdminName = validation.adminName;

    const modal = document.getElementById('passkey-invite-modal-overlay');
    const nameDisplay = document.getElementById('invite-admin-name-display');
    const stepSetup = document.getElementById('invite-step-setup');
    const stepSuccess = document.getElementById('invite-step-success');

    if (nameDisplay) nameDisplay.innerText = validation.adminName;
    if (stepSetup) stepSetup.style.display = 'block';
    if (stepSuccess) stepSuccess.style.display = 'none';

    if (modal) modal.classList.add('open');
}

async function confirmPasskeyRegistration() {
    if (!currentInviteToken) return;
    const t = (k) => (typeof KOPI_I18N !== 'undefined' ? KOPI_I18N.t(k) : k);

    try {
        const res = await KopiPasskey.registerPasskeyWithToken(currentInviteToken, currentInviteAdminName);
        if (res && res.success) {
            SoundFX.actionSuccess();
            showToast(t('passkey_registered_success'), 'shield-check');

            const stepSetup = document.getElementById('invite-step-setup');
            const stepSuccess = document.getElementById('invite-step-success');
            const codeDisplay = document.getElementById('invite-recovery-code-display');

            if (stepSetup) stepSetup.style.display = 'none';
            if (stepSuccess) stepSuccess.style.display = 'block';
            if (codeDisplay) codeDisplay.innerText = res.recoveryCode;

            // Clean query parameter from browser address bar
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    } catch (err) {
        if (err.name === 'NotAllowedError' || (err.message && err.message.includes('annul'))) {
            return;
        }
        SoundFX.accessDenied();
        showToast(err.message || "Erreur d'enregistrement", 'alert-circle');
    }
}

function finishInviteAndEnterKDS() {
    closeInviteModal();
    sessionStorage.setItem('kopiStaffAuth', 'true');
    showKDSView();
}

function closeInviteModal() {
    const modal = document.getElementById('passkey-invite-modal-overlay');
    if (modal) modal.classList.remove('open');
    currentInviteToken = null;
    currentInviteAdminName = null;
}

// --------------------------------------------------------------------------
// SECURITY & PASSKEY MANAGEMENT MODAL
// --------------------------------------------------------------------------
function openSecurityModal() {
    const modal = document.getElementById('security-modal-overlay');
    if (!modal) return;

    const resultBox = document.getElementById('invite-link-result-box');
    if (resultBox) resultBox.style.display = 'none';

    const input = document.getElementById('invite-admin-name-input');
    if (input) input.value = '';

    renderPasskeysList();
    modal.classList.add('open');
}

function closeSecurityModal(e) {
    if (e && e.target && e.target !== e.currentTarget && !e.target.classList.contains('report-modal-close')) return;
    const modal = document.getElementById('security-modal-overlay');
    if (modal) modal.classList.remove('open');
}

async function generateInviteLink() {
    const input = document.getElementById('invite-admin-name-input');
    const name = (input ? input.value : '').trim() || 'Staff Barista';
    const t = (k) => (typeof KOPI_I18N !== 'undefined' ? KOPI_I18N.t(k) : k);

    try {
        const invite = await KopiPasskey.createOneTimeInvite(name);
        lastGeneratedInviteUrl = invite.inviteUrl;

        const resultBox = document.getElementById('invite-link-result-box');
        const urlDisplay = document.getElementById('invite-link-display-url');

        if (urlDisplay) urlDisplay.innerText = invite.inviteUrl;
        if (resultBox) resultBox.style.display = 'block';

        showToast(t('passkey_link_copied'), 'check');
    } catch (err) {
        showToast(err.message || "Erreur lors de la création de l'invitation", 'alert-circle');
    }
}

async function copyInviteUrl() {
    if (!lastGeneratedInviteUrl) return;
    const t = (k) => (typeof KOPI_I18N !== 'undefined' ? KOPI_I18N.t(k) : k);
    try {
        await navigator.clipboard.writeText(lastGeneratedInviteUrl);
        showToast(t('passkey_link_copied'), 'check');
    } catch (e) {
        window.prompt("Copiez ce lien d'activation :", lastGeneratedInviteUrl);
    }
}

async function renderPasskeysList() {
    const container = document.getElementById('passkeys-list-container');
    if (!container) return;
    const t = (k) => (typeof KOPI_I18N !== 'undefined' ? KOPI_I18N.t(k) : k);

    container.innerHTML = `<div style="text-align: center; padding: 18px; color: var(--text-muted);">${getIcon('refresh')} Chargement...</div>`;

    try {
        const passkeys = await KopiPasskey.listPasskeys();
        if (!passkeys || passkeys.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 24px; color: var(--text-muted); background: rgba(0,0,0,0.25); border-radius: 10px;">
                    <div style="margin-bottom: 8px;">${getIcon('key')}</div>
                    <div>${t('passkey_no_passkeys')}</div>
                </div>
            `;
            return;
        }

        let html = `
            <table class="passkey-table">
                <thead>
                    <tr>
                        <th>${t('passkey_col_admin')}</th>
                        <th>${t('passkey_col_created')}</th>
                        <th>${t('passkey_col_last_used')}</th>
                        <th>${t('passkey_col_recovery')}</th>
                        <th style="text-align: center;">${t('passkey_col_actions')}</th>
                    </tr>
                </thead>
                <tbody>
        `;

        passkeys.forEach(pk => {
            const created = new Date(pk.created_at).toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            const lastUsed = pk.last_used_at ? new Date(pk.last_used_at).toLocaleDateString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';

            html += `
                <tr>
                    <td>
                        <strong style="color: var(--gold-light); display: block;">${pk.admin_name || 'Admin'}</strong>
                        <span class="passkey-badge-active">
                            ${getIcon('check')} Biométrique
                        </span>
                    </td>
                    <td style="color: var(--text-secondary);">${created}</td>
                    <td style="color: var(--text-secondary);">${lastUsed}</td>
                    <td>
                        <code style="background: rgba(0,0,0,0.4); padding: 2px 6px; border-radius: 4px; color: var(--gold-primary); font-family: monospace;">${pk.recovery_code || '---'}</code>
                    </td>
                    <td style="text-align: center;">
                        <button type="button" class="btn-export-secondary" style="padding: 4px 10px; font-size: 0.78rem; border-color: rgba(231,76,60,0.5); color: #e74c3c;" onclick="handleRevokePasskey('${pk.credential_id}', '${(pk.admin_name || '').replace(/'/g, "\\'")}')">
                            ${getIcon('alert-circle')}
                            <span>${t('passkey_revoke')}</span>
                        </button>
                    </td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;
    } catch (err) {
        console.error("Error rendering passkeys list:", err);
        container.innerHTML = `<div style="text-align: center; padding: 18px; color: #e74c3c;">Erreur lors du chargement des Passkeys.</div>`;
    }
}

async function handleRevokePasskey(credentialId, adminName) {
    const t = (k) => (typeof KOPI_I18N !== 'undefined' ? KOPI_I18N.t(k) : k);
    const confirmMsg = `${t('passkey_confirm_revoke')} (${adminName})`;
    if (!window.confirm(confirmMsg)) return;

    try {
        const success = await KopiPasskey.revokePasskey(credentialId);
        if (success) {
            SoundFX.actionSuccess();
            showToast(t('passkey_revoked_success'), 'check');
            renderPasskeysList();
        } else {
            showToast("Impossible de révoquer ce Passkey", 'alert-circle');
        }
    } catch (e) {
        showToast(e.message, 'alert-circle');
    }
}



