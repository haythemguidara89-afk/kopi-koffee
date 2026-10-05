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
    checkAuthState();
    startClock();
    setupSoundToggle();
    setupKeyboardListeners();

    // Initialize order count tracking
    const initialOrders = JSON.parse(localStorage.getItem('kopiOrders') || '[]');
    lastKnownOrderCount = initialOrders.length;

    // Cross-Tab Real-time synchronization
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
    showToast("Session cuisine verrouillée", "lock");
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
    if (enteredPin === ADMIN_PASSWORD) {
        sessionStorage.setItem('kopiStaffAuth', 'true');
        SoundFX.actionSuccess();
        showToast("Accès autorisé • Bienvenue en cuisine", "chef");
        showKDSView();
    } else {
        handleAuthError("Code PIN incorrect. Veuillez réessayer.");
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
    if (soundEnabled) {
        btn.classList.add('sound-on');
        btn.innerHTML = `${getIcon('bell')} <span>Son Activé</span>`;
    } else {
        btn.classList.remove('sound-on');
        btn.innerHTML = `${getIcon('bell-off')} <span>Son Coupé</span>`;
    }
}

// Fullscreen Toggle
function toggleFullscreen() {
    const iconEl = document.getElementById('fullscreen-icon');
    const textEl = document.getElementById('fullscreen-text');

    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
            if (iconEl) iconEl.outerHTML = getIcon('minimize');
            if (textEl) textEl.innerText = 'Réduire';
        }).catch(err => {
            console.warn('Fullscreen error:', err);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen().then(() => {
                if (iconEl) iconEl.outerHTML = getIcon('fullscreen');
                if (textEl) textEl.innerText = 'Plein Écran';
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
    showToast("Affichage KDS actualisé", "refresh");
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
    const orders = JSON.parse(localStorage.getItem('kopiOrders') || '[]');
    if (orders.length > lastKnownOrderCount) {
        SoundFX.newOrderAlert();
        showToast("Nouvelle commande reçue en cuisine !", "bell");
    }
    lastKnownOrderCount = orders.length;
    renderAdminKDS();
}

function checkOrdersPoll() {
    const orders = JSON.parse(localStorage.getItem('kopiOrders') || '[]');
    if (orders.length > lastKnownOrderCount) {
        SoundFX.newOrderAlert();
        showToast("Nouvelle commande reçue en cuisine !", "bell");
        lastKnownOrderCount = orders.length;
        renderAdminKDS();
    }
}

// ==========================================================================
// TIME CALCULATION HELPERS
// ==========================================================================
function computeElapsedTime(createdAtStr) {
    if (!createdAtStr) return { text: "Récemment", isUrgent: false };
    const createdTime = new Date(createdAtStr).getTime();
    if (isNaN(createdTime)) return { text: "Récemment", isUrgent: false };
    
    const now = Date.now();
    const diffMs = now - createdTime;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) {
        return { text: "À l'instant", isUrgent: false };
    } else if (diffMins === 1) {
        return { text: "Il y a 1 min", isUrgent: false };
    } else if (diffMins < 60) {
        return { text: `Il y a ${diffMins} min`, isUrgent: diffMins >= 15 };
    } else {
        const hours = Math.floor(diffMins / 60);
        const remMins = diffMins % 60;
        return { text: `Il y a ${hours}h ${remMins}m`, isUrgent: true };
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
    const container = document.getElementById('admin-orders-container');
    const metricPending = document.getElementById('metric-pending-orders');
    const metricPreparing = document.getElementById('metric-preparing-orders');
    const metricRevenue = document.getElementById('metric-today-revenue');
    const metricItems = document.getElementById('metric-items-prepared');

    const countAll = document.getElementById('count-all');
    const countPending = document.getElementById('count-pending');
    const countPreparing = document.getElementById('count-preparing');
    const countCompleted = document.getElementById('count-completed');

    const orders = JSON.parse(localStorage.getItem('kopiOrders') || '[]');

    const pendingOrders = orders.filter(o => o.status === 'pending');
    const preparingOrders = orders.filter(o => o.status === 'preparing');
    const completedOrders = orders.filter(o => o.status === 'completed');

    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalItems = orders.reduce((sum, o) => sum + (o.items || []).reduce((isum, i) => isum + (i.quantity || 1), 0), 0);

    // Update Metrics
    if (metricPending) metricPending.innerText = pendingOrders.length;
    if (metricPreparing) metricPreparing.innerText = preparingOrders.length;
    if (metricRevenue) metricRevenue.innerText = `${totalRevenue.toFixed(1)} DT`;
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
            const itemsMatch = (o.items || []).some(item => (item.name || '').toLowerCase().includes(searchQuery));
            return tableMatch || idMatch || itemsMatch;
        });
    }

    if (filteredOrders.length === 0) {
        let emptyTitle = "Aucune commande dans cette section";
        let emptyDesc = "Toutes les commandes ont été préparées ou la file est vide.";
        if (searchQuery.length > 0) {
            emptyTitle = "Aucun résultat pour cette recherche";
            emptyDesc = `Aucune commande ne correspond à "${searchQuery}".`;
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

        let statusBadgeText = "En attente";
        let statusBadgeClass = "status-badge-pending";
        let statusIconKey = "clock";
        let actionButtons = `
            <button class="kds-btn btn-prep" onclick="updateOrderStatus('${order.id}', 'preparing')">
                ${getIcon('chef')}
                <span>Préparer</span>
            </button>
            <button class="kds-btn btn-print" onclick="printReceipt('${order.id}')">
                ${getIcon('print')}
                <span>Ticket</span>
            </button>
        `;

        if (order.status === 'preparing') {
            statusBadgeText = "En préparation";
            statusBadgeClass = "status-badge-preparing";
            statusIconKey = "chef";
            actionButtons = `
                <button class="kds-btn btn-ready" onclick="updateOrderStatus('${order.id}', 'completed')">
                    ${getIcon('check')}
                    <span>Marquer Servi</span>
                </button>
                <button class="kds-btn btn-print" onclick="printReceipt('${order.id}')">
                    ${getIcon('print')}
                    <span>Ticket</span>
                </button>
            `;
        } else if (order.status === 'completed') {
            statusBadgeText = "Prête / Servie";
            statusBadgeClass = "status-badge-completed";
            statusIconKey = "check";
            actionButtons = `
                <button class="kds-btn btn-print" onclick="printReceipt('${order.id}')">
                    ${getIcon('print')}
                    <span>Ticket</span>
                </button>
                <button class="kds-btn btn-delete" onclick="deleteOrder('${order.id}')">
                    ${getIcon('trash')}
                    <span>Archiver</span>
                </button>
            `;
        }

        const itemsList = (order.items || []).map(item => `
            <li class="order-card-item">
                <span>
                    <span class="order-item-qty">${item.quantity}x</span>
                    <strong style="color: #ffffff;">${item.name}</strong>
                </span>
                <span style="color: var(--text-secondary); font-weight: 700; font-family: var(--font-body);">
                    ${((item.price || 0) * (item.quantity || 1)).toFixed(1)} DT
                </span>
            </li>
        `).join('');

        const noteBlock = order.notes 
            ? `<div class="order-note-box">${getIcon('note')} <div><strong>Instruction client :</strong> ${order.notes}</div></div>` 
            : '';

        card.innerHTML = `
            <div class="order-card-header">
                <div>
                    <span class="order-table-badge">TABLE ${order.table}</span>
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
                    <span style="font-size: 0.92rem; color: var(--text-secondary); font-weight: 600;">Total Commande :</span>
                    <span style="font-weight: 800; color: var(--gold-light); font-size: 1.25rem;">${(order.total || 0).toFixed(1)} DT</span>
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
        SoundFX.actionSuccess();
        renderAdminKDS();
        const statusLabel = newStatus === 'preparing' ? 'En préparation' : (newStatus === 'completed' ? 'Servie' : newStatus);
        showToast(`Commande #${orderId} : ${statusLabel}`, "check");
    }
}

function deleteOrder(orderId) {
    if (!confirm("Voulez-vous archiver cette commande de la liste ?")) return;
    let orders = JSON.parse(localStorage.getItem('kopiOrders') || '[]');
    orders = orders.filter(o => o.id !== orderId);
    localStorage.setItem('kopiOrders', JSON.stringify(orders));
    renderAdminKDS();
    showToast("Commande archivée", "trash");
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
    if (!confirm("Attention : Voulez-vous vraiment effacer l'historique complet des commandes d'aujourd'hui ?")) return;
    localStorage.setItem('kopiOrders', JSON.stringify([]));
    renderAdminKDS();
    showToast("Historique des commandes réinitialisé", "broom");
}

// ==========================================================================
// TICKET PRINTING (Thermal 58mm / 80mm format)
// ==========================================================================
function printReceipt(orderId) {
    const orders = JSON.parse(localStorage.getItem('kopiOrders') || '[]');
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    let itemsText = (order.items || []).map(i => `
        <tr>
            <td style="padding: 5px 0;"><strong>${i.quantity}x</strong> ${i.name}</td>
            <td style="text-align: right; padding: 5px 0;">${((i.price || 0) * (i.quantity || 1)).toFixed(1)} DT</td>
        </tr>
    `).join('');

    const printWindow = window.open('', '_blank', 'width=380,height=600');
    if (!printWindow) {
        alert("Veuillez autoriser les fenêtres pop-up dans votre navigateur pour imprimer le ticket.");
        return;
    }

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Ticket #${order.id} - Kopi Koffee</title>
            <style>
                body {
                    font-family: 'Courier New', Courier, monospace;
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
                <h2>KOPI KOFFEE</h2>
                <p style="margin: 2px 0; font-size: 11px;">Food & Drink • Café Lounge</p>
                <p style="font-size: 11px; margin: 2px 0;">Ticket de Commande Cuisine</p>
            </div>
            <div class="divider"></div>
            <div>
                <strong>TABLE:</strong> <span style="font-size: 17px; font-weight: bold;">${order.table}</span><br>
                <strong>Commande:</strong> #${order.id}<br>
                <strong>Date/Heure:</strong> ${order.timeStr || new Date().toLocaleTimeString()}
            </div>
            <div class="divider"></div>
            <table>
                ${itemsText}
            </table>
            <div class="divider"></div>
            ${order.notes ? `<p><strong>NOTE:</strong> ${order.notes}</p><div class="divider"></div>` : ''}
            <div style="font-size: 15px; font-weight: bold; display: flex; justify-content: space-between;">
                <span>TOTAL:</span>
                <span>${(order.total || 0).toFixed(1)} DT</span>
            </div>
            <div class="divider"></div>
            <div class="text-center" style="font-size: 11px; margin-top: 12px;">
                Merci de votre fidélité !
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

