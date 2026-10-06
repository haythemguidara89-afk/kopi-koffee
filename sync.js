// Kopi Koffee - Real-Time Cloud & Cross-Device Synchronization Engine (sync.js)
// Enables instant order transmission from customer phones to the kitchen display system (KDS)
// Layered: ntfy.sh SSE + poll=1 (Cloud) • BroadcastChannel (Local Tabs) • localStorage (Offline Cache)

const KOPI_SYNC_ENDPOINT = "https://ntfy.sh/kopi_koffee_live_sync_2026";

const KopiSync = {
    channel: (typeof window !== 'undefined' && window.BroadcastChannel) ? new BroadcastChannel('kopi_live_sync') : null,
    eventSource: null,
    listeners: [],

    getOrders() {
        try {
            return JSON.parse(localStorage.getItem('kopiOrders') || '[]');
        } catch (e) {
            return [];
        }
    },

    saveLocalOrders(orders) {
        try {
            localStorage.setItem('kopiOrders', JSON.stringify(orders));
        } catch (e) {
            console.error('Failed to save orders to localStorage', e);
        }
    },

    addListener(fn) {
        if (typeof fn === 'function' && !this.listeners.includes(fn)) {
            this.listeners.push(fn);
        }
    },

    notifyListeners(eventData) {
        this.listeners.forEach(fn => {
            try { fn(eventData); } catch (e) { console.error('Error in listener', e); }
        });
        window.dispatchEvent(new CustomEvent('kopiOrdersChanged', { detail: eventData }));
    },

    // Submit a new customer order to cloud + local
    async sendNewOrder(order) {
        let orders = this.getOrders();
        // Add if not already present
        if (!orders.some(o => o.id === order.id)) {
            orders.unshift(order);
            this.saveLocalOrders(orders);
        }

        const payload = {
            event: "new_order",
            order: order,
            sentAt: Date.now()
        };

        // 1. Broadcast locally across tabs
        if (this.channel) {
            try { this.channel.postMessage(payload); } catch (e) {}
        }
        this.notifyListeners(payload);

        // 2. Publish to cloud for cross-device reception
        try {
            await fetch(KOPI_SYNC_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } catch (err) {
            console.warn("Could not publish order to cloud, saved locally", err);
        }

        return order;
    },

    // Update order status (pending -> preparing -> completed)
    async updateOrderStatus(orderId, newStatus) {
        let orders = this.getOrders();
        const order = orders.find(o => o.id === orderId);
        if (order) {
            order.status = newStatus;
            this.saveLocalOrders(orders);
        }

        const payload = {
            event: "update_status",
            orderId: orderId,
            status: newStatus,
            sentAt: Date.now()
        };

        if (this.channel) {
            try { this.channel.postMessage(payload); } catch (e) {}
        }
        this.notifyListeners(payload);

        try {
            await fetch(KOPI_SYNC_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } catch (err) {
            console.warn("Could not publish status to cloud", err);
        }
    },

    // Delete or archive order
    async deleteOrder(orderId) {
        let orders = this.getOrders().filter(o => o.id !== orderId);
        this.saveLocalOrders(orders);

        const payload = {
            event: "delete_order",
            orderId: orderId,
            sentAt: Date.now()
        };

        if (this.channel) {
            try { this.channel.postMessage(payload); } catch (e) {}
        }
        this.notifyListeners(payload);

        try {
            await fetch(KOPI_SYNC_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } catch (err) {}
    },

    // Pull historical/recent orders from cloud
    async fetchRemoteOrders() {
        try {
            const res = await fetch(`${KOPI_SYNC_ENDPOINT}/json?poll=1`, { cache: 'no-store' });
            if (!res.ok) return;
            const text = await res.text();
            if (!text) return;

            const lines = text.trim().split("\n");
            let orders = this.getOrders();
            let changed = false;

            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const data = JSON.parse(line);
                    if (data.event === "message" && data.message) {
                        const payload = JSON.parse(data.message);
                        if (payload.event === "new_order" && payload.order) {
                            const existing = orders.find(o => o.id === payload.order.id);
                            if (!existing) {
                                orders.unshift(payload.order);
                                changed = true;
                            }
                        } else if (payload.event === "update_status" && payload.orderId) {
                            const existing = orders.find(o => o.id === payload.orderId);
                            if (existing && existing.status !== payload.status) {
                                existing.status = payload.status;
                                changed = true;
                            }
                        } else if (payload.event === "delete_order" && payload.orderId) {
                            const prevLen = orders.length;
                            orders = orders.filter(o => o.id !== payload.orderId);
                            if (orders.length !== prevLen) changed = true;
                        }
                    }
                } catch (e) {}
            }

            if (changed) {
                this.saveLocalOrders(orders);
                this.notifyListeners({ event: "remote_sync", orders });
            }
        } catch (e) {
            console.warn("Could not fetch remote orders", e);
        }
    },

    // Connect to live SSE and BroadcastChannel
    initRealtime() {
        // 1. Listen on BroadcastChannel for same-device cross-tab
        if (this.channel) {
            this.channel.onmessage = (event) => {
                const payload = event.data;
                if (!payload) return;
                this.applyIncomingPayload(payload);
            };
        }

        // 2. Initial cloud fetch
        this.fetchRemoteOrders();

        // 3. Connect SSE for real-time push from other devices
        try {
            if (this.eventSource) {
                this.eventSource.close();
            }
            this.eventSource = new EventSource(`${KOPI_SYNC_ENDPOINT}/sse`);
            this.eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.event === "message" && data.message) {
                        const payload = JSON.parse(data.message);
                        this.applyIncomingPayload(payload);
                    }
                } catch (e) {}
            };
            this.eventSource.onerror = () => {
                // Browser auto-reconnects SSE
            };
        } catch (e) {
            console.warn("EventSource not supported or failed", e);
        }

        // 4. Fallback interval polling every 3 seconds to guarantee 100% sync
        setInterval(() => {
            this.fetchRemoteOrders();
        }, 3000);
    },

    applyIncomingPayload(payload) {
        let orders = this.getOrders();
        let changed = false;

        if (payload.event === "new_order" && payload.order) {
            if (!orders.some(o => o.id === payload.order.id)) {
                orders.unshift(payload.order);
                changed = true;
            }
        } else if (payload.event === "update_status" && payload.orderId) {
            const order = orders.find(o => o.id === payload.orderId);
            if (order && order.status !== payload.status) {
                order.status = payload.status;
                changed = true;
            }
        } else if (payload.event === "delete_order" && payload.orderId) {
            const prevLen = orders.length;
            orders = orders.filter(o => o.id !== payload.orderId);
            if (orders.length !== prevLen) changed = true;
        }

        if (changed) {
            this.saveLocalOrders(orders);
            this.notifyListeners(payload);
        }
    }
};

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
    KopiSync.initRealtime();
}
