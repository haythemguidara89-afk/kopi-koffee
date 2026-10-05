// Kopi Koffee - Dedicated Admin & Kitchen Display System Logic (admin.js)
// Password: 10699 • Real-Time Order Processing & Modern KDS Dashboard (Vector Icons)

const ADMIN_PASSWORD = "10699";

let adminFilter = 'all';
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
    if (enteredPin === ADMIN_PASSWORD) {
        sessionStorage.setItem('kopiStaffAuth', 'true');
        SoundFX.actionSuccess();
        showToast("Accès autorisé • Bienvenue", "chef");
        showKDSView();
    } else {
        handleAuthError("Code PIN incorrect. Veuillez réessayer.");
    }
}

function submitDirectPassword() {
    const input = document.getElementById('admin-password-direct');
    const val = input ? input.value.trim() : '';
    if (val === ADMIN_PASSWORD) {
        sessionStorage.setItem('kopiStaffAuth', 'true');
        if (input) input.value = '';
        SoundFX.actionSuccess();
        showToast("Accès autorisé • Bienvenue", "chef");
        showKDSView();
    } else {
        handleAuthError("Mot de passe incorrect.");
        if (input) input.select();
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
            if (document.activeElement && document.activeElement.id === 'admin-password-direct') {
                return;
            }
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
        clockEl.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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
            if (soundEnabled) SoundFX.actionSuccess();
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
// KITCHEN DISPLAY SYSTEM (KDS) RENDERING
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
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--gold-border);">
                <div style="margin-bottom: 12px; color: var(--gold-light);">${getIcon('tray', 'icon-svg-xl')}</div>
                <h3 style="color: var(--gold-light); font-size: 1.3rem; margin-bottom: 6px;">Aucune commande dans cette section</h3>
                <p>Toutes les commandes ont été traitées ou aucune commande reçue.</p>
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

        const itemsList = order.items.map(item => `
            <li class="order-card-item">
                <span><span class="order-item-qty">${item.quantity}x</span> ${item.name}</span>
                <span style="color: var(--text-secondary); font-weight: 600;">${(item.price * item.quantity).toFixed(1)} DT</span>
            </li>
        `).join('');

        const noteBlock = order.notes 
            ? `<div class="order-note-box"><strong>Instruction client :</strong> ${order.notes}</div>` 
            : '';

        card.innerHTML = `
            <div class="order-card-header">
                <div>
                    <span class="order-table-badge">TABLE ${order.table}</span>
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
                    <span>Total Commande :</span>
                    <span style="font-weight: 800; color: var(--gold-light); font-size: 1.15rem;">${order.total.toFixed(1)} DT</span>
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
        showToast(`Commande ${orderId} : ${newStatus}`, "check");
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
    if (!confirm("Attention : Voulez-vous vraiment effacer l'historique complet des commandes d'aujourd'hui ?")) return;
    localStorage.setItem('kopiOrders', JSON.stringify([]));
    renderAdminKDS();
    showToast("Toutes les commandes ont été effacées", "broom");
}

// ==========================================================================
// TICKET PRINTING (Thermal 58mm / 80mm format)
// ==========================================================================
function printReceipt(orderId) {
    const orders = JSON.parse(localStorage.getItem('kopiOrders') || '[]');
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    let itemsText = order.items.map(i => `
        <tr>
            <td style="padding: 5px 0;"><strong>${i.quantity}x</strong> ${i.name}</td>
            <td style="text-align: right; padding: 5px 0;">${(i.price * i.quantity).toFixed(1)} DT</td>
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
                h2 { margin: 2px 0; font-size: 18px; }
            </style>
        </head>
        <body>
            <div class="text-center">
                <h2>KOPI KOFFEE</h2>
                <p style="margin: 2px 0;">Food & Drink • Café Lounge</p>
                <p style="font-size: 11px;">Ticket de Commande Cuisine</p>
            </div>
            <div class="divider"></div>
            <div>
                <strong>TABLE:</strong> <span style="font-size: 16px; font-weight: bold;">${order.table}</span><br>
                <strong>Commande:</strong> #${order.id}<br>
                <strong>Date/Heure:</strong> ${order.timeStr}
            </div>
            <div class="divider"></div>
            <table>
                ${itemsText}
            </table>
            <div class="divider"></div>
            ${order.notes ? `<p><strong>NOTE:</strong> ${order.notes}</p><div class="divider"></div>` : ''}
            <div style="font-size: 15px; font-weight: bold; display: flex; justify-content: space-between;">
                <span>TOTAL:</span>
                <span>${order.total.toFixed(1)} DT</span>
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
