// Kopi Koffee - Real-Time Cloud & Cross-Device Synchronization Engine (sync.js)
// Enables instant order transmission from customer phones to the kitchen display system (KDS)
// Layered: Supabase PostgreSQL (Primary DB & Realtime) • ntfy.sh (Fallback Relay) • BroadcastChannel (Tabs) • localStorage (Offline)

const KOPI_SYNC_ENDPOINT = "https://ntfy.sh/kopi_koffee_live_sync_2026";

// Monotonic order status ranks: pending (1) -> preparing (2) -> completed (3)
const STATUS_RANK = {
    'pending': 1,
    'preparing': 2,
    'completed': 3
};

const KopiSync = {
    channel: (typeof window !== 'undefined' && window.BroadcastChannel) ? new BroadcastChannel('kopi_live_sync') : null,
    eventSource: null,
    supabaseChannel: null,
    listeners: [],

    getOrders() {
        try {
            const parsed = JSON.parse(localStorage.getItem('kopiOrders') || '[]');
            return parsed.map(o => {
                if (!o.updatedAt) {
                    o.updatedAt = o.createdAt ? new Date(o.createdAt).getTime() : Date.now();
                }
                if (!o.status) o.status = 'pending';
                return o;
            });
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

    getArchivedOrders() {
        try {
            return JSON.parse(localStorage.getItem('kopiArchivedOrders') || '[]');
        } catch (e) {
            return [];
        }
    },

    saveLocalArchivedOrders(archived) {
        try {
            localStorage.setItem('kopiArchivedOrders', JSON.stringify(archived));
        } catch (e) {
            console.error('Failed to save archived orders to localStorage', e);
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

    // Submit a new customer order to Supabase + Cloud Relay + Local Cache
    async sendNewOrder(order) {
        const now = Date.now();
        order.status = order.status || 'pending';
        order.updatedAt = now;

        let orders = this.getOrders();
        // Add if not already present
        if (!orders.some(o => o.id === order.id)) {
            orders.unshift(order);
            this.saveLocalOrders(orders);
        }

        const payload = {
            event: "new_order",
            order: order,
            sentAt: now
        };

        // 1. Broadcast locally across tabs
        if (this.channel) {
            try { this.channel.postMessage(payload); } catch (e) {}
        }
        this.notifyListeners(payload);

        // 2. Primary: Save directly to Supabase PostgreSQL Database if configured
        if (typeof kopiSupabase !== 'undefined' && kopiSupabase) {
            try {
                await kopiSupabase.from('orders').insert({
                    id: order.id,
                    table_number: String(order.table || '1'),
                    status: 'pending',
                    items: order.items || [],
                    total: Number(order.total || 0),
                    notes: order.notes || '',
                    created_at: order.createdAt || new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            } catch (err) {
                console.warn("Could not insert order into Supabase:", err);
            }
        }

        // 3. Fallback: Publish to cloud pub/sub for cross-device reception
        try {
            await fetch(KOPI_SYNC_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } catch (err) {
            console.warn("Could not publish order to fallback relay", err);
        }

        return order;
    },

    // Update order status (pending -> preparing -> completed)
    async updateOrderStatus(orderId, newStatus) {
        const now = Date.now();
        let orders = this.getOrders();
        const order = orders.find(o => o.id === orderId);
        if (order) {
            const currentRank = STATUS_RANK[order.status] || 0;
            const newRank = STATUS_RANK[newStatus] || 0;

            // Status monotonicity: Never allow backward status regression
            if (newRank >= currentRank) {
                order.status = newStatus;
                order.updatedAt = now;
                this.saveLocalOrders(orders);
            }
        }

        const payload = {
            event: "update_status",
            orderId: orderId,
            status: newStatus,
            sentAt: now
        };

        if (this.channel) {
            try { this.channel.postMessage(payload); } catch (e) {}
        }
        this.notifyListeners(payload);

        // 1. Update in Supabase PostgreSQL
        if (typeof kopiSupabase !== 'undefined' && kopiSupabase) {
            try {
                await kopiSupabase.from('orders').update({
                    status: newStatus,
                    updated_at: new Date().toISOString()
                }).eq('id', orderId);
            } catch (err) {
                console.warn("Could not update status in Supabase:", err);
            }
        }

        // 2. Fallback relay
        try {
            await fetch(KOPI_SYNC_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } catch (err) {
            console.warn("Could not publish status to fallback relay", err);
        }
    },

    // Archive an order safely with timestamps
    async archiveOrder(orderId) {
        const now = Date.now();
        let orders = this.getOrders();
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        order.archivedAt = new Date().toISOString();
        order.updatedAt = now;

        orders = orders.filter(o => o.id !== orderId);
        this.saveLocalOrders(orders);

        let archived = this.getArchivedOrders();
        if (!archived.some(a => a.id === orderId)) {
            archived.unshift(order);
            this.saveLocalArchivedOrders(archived);
        }

        const payload = {
            event: "archive_order",
            orderId: orderId,
            order: order,
            sentAt: now
        };

        if (this.channel) {
            try { this.channel.postMessage(payload); } catch (e) {}
        }
        this.notifyListeners(payload);

        // 1. Update archive status in Supabase
        if (typeof kopiSupabase !== 'undefined' && kopiSupabase) {
            try {
                await kopiSupabase.from('orders').update({
                    archived_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }).eq('id', orderId);
            } catch (err) {}
        }

        // 2. Fallback relay
        try {
            await fetch(KOPI_SYNC_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } catch (err) {}
    },

    // Restore an archived order back to active kitchen display
    async restoreOrder(orderId) {
        const now = Date.now();
        let archived = this.getArchivedOrders();
        const order = archived.find(a => a.id === orderId);
        if (!order) return;

        archived = archived.filter(a => a.id !== orderId);
        this.saveLocalArchivedOrders(archived);

        let restoredOrder = { ...order };
        delete restoredOrder.archivedAt;
        restoredOrder.updatedAt = now;

        let orders = this.getOrders();
        if (!orders.some(o => o.id === orderId)) {
            orders.unshift(restoredOrder);
            this.saveLocalOrders(orders);
        }

        const payload = {
            event: "restore_order",
            orderId: orderId,
            order: restoredOrder,
            sentAt: now
        };

        if (this.channel) {
            try { this.channel.postMessage(payload); } catch (e) {}
        }
        this.notifyListeners(payload);

        // 1. Reset archive status in Supabase
        if (typeof kopiSupabase !== 'undefined' && kopiSupabase) {
            try {
                await kopiSupabase.from('orders').update({
                    archived_at: null,
                    updated_at: new Date().toISOString()
                }).eq('id', orderId);
            } catch (err) {}
        }

        // 2. Fallback relay
        try {
            await fetch(KOPI_SYNC_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } catch (err) {}
    },

    // Delete or archive order (routes to archiveOrder so past orders are never lost)
    async deleteOrder(orderId) {
        return this.archiveOrder(orderId);
    },

    // Pull historical/recent orders: Supabase first, fallback to ntfy
    async fetchRemoteOrders() {
        // 1. Try Supabase PostgreSQL first
        if (typeof kopiSupabase !== 'undefined' && kopiSupabase) {
            try {
                const { data: activeRows, error: errActive } = await kopiSupabase
                    .from('orders')
                    .select('*')
                    .is('archived_at', null)
                    .order('created_at', { ascending: false });

                const { data: archRows, error: errArch } = await kopiSupabase
                    .from('orders')
                    .select('*')
                    .not('archived_at', 'is', null)
                    .order('archived_at', { ascending: false });

                if (!errActive && activeRows) {
                    const mappedActive = activeRows.map(r => ({
                        id: r.id,
                        table: r.table_number,
                        status: r.status,
                        items: r.items || [],
                        total: Number(r.total || 0),
                        notes: r.notes || '',
                        createdAt: r.created_at,
                        updatedAt: new Date(r.updated_at || r.created_at).getTime(),
                        timeStr: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }));
                    this.saveLocalOrders(mappedActive);
                }

                if (!errArch && archRows) {
                    const mappedArch = archRows.map(r => ({
                        id: r.id,
                        table: r.table_number,
                        status: r.status,
                        items: r.items || [],
                        total: Number(r.total || 0),
                        notes: r.notes || '',
                        createdAt: r.created_at,
                        updatedAt: new Date(r.updated_at || r.created_at).getTime(),
                        archivedAt: r.archived_at,
                        timeStr: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }));
                    this.saveLocalArchivedOrders(mappedArch);
                }

                this.notifyListeners({ event: "remote_sync" });
                return;
            } catch (e) {
                console.warn("Supabase query failed, using fallback:", e);
            }
        }

        // 2. Fallback: ntfy.sh polling
        try {
            const res = await fetch(KOPI_SYNC_ENDPOINT + "/json?poll=1&since=all", { cache: 'no-store' });
            if (!res.ok) return;
            const text = await res.text();
            if (!text) return;

            const lines = text.trim().split("\n");
            const payloads = [];

            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const data = JSON.parse(line);
                    if (data.event === "message" && data.message) {
                        const payload = JSON.parse(data.message);
                        if (payload && payload.event) {
                            payloads.push(payload);
                        }
                    }
                } catch (e) {}
            }

            // Sort incoming payloads chronologically by sentAt
            payloads.sort((a, b) => (a.sentAt || 0) - (b.sentAt || 0));

            let orders = this.getOrders();
            let archived = this.getArchivedOrders();
            let changed = false;

            for (const payload of payloads) {
                if (payload.event === "new_order" && payload.order) {
                    const orderId = payload.order.id;
                    const inOrders = orders.some(o => o.id === orderId);
                    const inArchived = archived.some(a => a.id === orderId);
                    if (!inOrders && !inArchived) {
                        const newO = { ...payload.order };
                        newO.status = newO.status || 'pending';
                        newO.updatedAt = payload.sentAt || (newO.createdAt ? new Date(newO.createdAt).getTime() : Date.now());
                        orders.unshift(newO);
                        changed = true;
                    }
                } else if (payload.event === "update_status" && payload.orderId) {
                    const existing = orders.find(o => o.id === payload.orderId);
                    if (existing) {
                        const currentRank = STATUS_RANK[existing.status] || 0;
                        const incomingRank = STATUS_RANK[payload.status] || 0;
                        const incomingTime = payload.sentAt || 0;
                        const existingTime = existing.updatedAt || 0;

                        // Ignore stale messages older than local state
                        if (incomingTime && existingTime && incomingTime < existingTime) {
                            continue;
                        }

                        // Strictly reject backward status regression (e.g., completed -> preparing)
                        if (incomingRank < currentRank) {
                            continue;
                        }

                        if (existing.status !== payload.status) {
                            existing.status = payload.status;
                            existing.updatedAt = Math.max(existingTime, incomingTime || Date.now());
                            changed = true;
                        }
                    }
                } else if (payload.event === "delete_order" && payload.orderId) {
                    const prevLen = orders.length;
                    orders = orders.filter(o => o.id !== payload.orderId);
                    if (orders.length !== prevLen) changed = true;
                } else if (payload.event === "archive_order" && payload.orderId) {
                    const prevLen = orders.length;
                    orders = orders.filter(o => o.id !== payload.orderId);
                    if (orders.length !== prevLen) changed = true;

                    if (payload.order && !archived.some(a => a.id === payload.orderId)) {
                        archived.unshift(payload.order);
                        this.saveLocalArchivedOrders(archived);
                    }
                } else if (payload.event === "restore_order" && payload.orderId) {
                    const prevArchLen = archived.length;
                    archived = archived.filter(a => a.id !== payload.orderId);
                    if (archived.length !== prevArchLen) this.saveLocalArchivedOrders(archived);

                    if (payload.order && !orders.some(o => o.id === payload.orderId)) {
                        orders.unshift(payload.order);
                        changed = true;
                    }
                }
            }

            if (changed) {
                this.saveLocalOrders(orders);
                this.notifyListeners({ event: "remote_sync", orders });
            }
        } catch (e) {
            console.warn("Could not fetch remote orders from fallback relay", e);
        }
    },

    // Handle incoming change pushed from Supabase Realtime WebSocket
    handleSupabaseRealtime(payload) {
        if (!payload) return;
        const { eventType, new: newRow, old: oldRow } = payload;

        if (eventType === 'INSERT' && newRow) {
            const order = {
                id: newRow.id,
                table: newRow.table_number,
                status: newRow.status,
                items: newRow.items || [],
                total: Number(newRow.total || 0),
                notes: newRow.notes || '',
                createdAt: newRow.created_at,
                updatedAt: new Date(newRow.updated_at || newRow.created_at).getTime(),
                timeStr: new Date(newRow.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            this.applyIncomingPayload({ event: "new_order", order });
        } else if (eventType === 'UPDATE' && newRow) {
            if (newRow.archived_at) {
                this.applyIncomingPayload({
                    event: "archive_order",
                    orderId: newRow.id,
                    order: {
                        id: newRow.id,
                        table: newRow.table_number,
                        status: newRow.status,
                        items: newRow.items || [],
                        total: Number(newRow.total || 0),
                        notes: newRow.notes || '',
                        createdAt: newRow.created_at,
                        updatedAt: new Date(newRow.updated_at || newRow.created_at).getTime(),
                        archivedAt: newRow.archived_at
                    }
                });
            } else if (oldRow && oldRow.archived_at && !newRow.archived_at) {
                this.applyIncomingPayload({
                    event: "restore_order",
                    orderId: newRow.id,
                    order: {
                        id: newRow.id,
                        table: newRow.table_number,
                        status: newRow.status,
                        items: newRow.items || [],
                        total: Number(newRow.total || 0),
                        notes: newRow.notes || '',
                        createdAt: newRow.created_at,
                        updatedAt: new Date(newRow.updated_at || newRow.created_at).getTime()
                    }
                });
            } else {
                this.applyIncomingPayload({
                    event: "update_status",
                    orderId: newRow.id,
                    status: newRow.status,
                    sentAt: new Date(newRow.updated_at || newRow.created_at).getTime()
                });
            }
        } else if (eventType === 'DELETE' && oldRow) {
            this.applyIncomingPayload({ event: "delete_order", orderId: oldRow.id });
        }
    },

    // Connect to Supabase Realtime, BroadcastChannel, and fallback SSE
    initRealtime() {
        // 1. Listen on BroadcastChannel for same-device cross-tab
        if (this.channel) {
            this.channel.onmessage = (event) => {
                const payload = event.data;
                if (!payload) return;
                this.applyIncomingPayload(payload);
            };
        }

        // 2. Initial data fetch
        this.fetchRemoteOrders();

        // 3. Connect Supabase Realtime if client is available
        if (typeof kopiSupabase !== 'undefined' && kopiSupabase) {
            try {
                if (this.supabaseChannel) {
                    kopiSupabase.removeChannel(this.supabaseChannel);
                }
                this.supabaseChannel = kopiSupabase
                    .channel('kopi_orders_realtime_stream')
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                        this.handleSupabaseRealtime(payload);
                    })
                    .subscribe((status) => {
                        if (status === 'SUBSCRIBED') {
                            console.log('Kopi Koffee: Supabase Realtime stream active!');
                        }
                    });
            } catch (err) {
                console.warn('Could not connect Supabase Realtime channel', err);
            }
        }

        // 4. Fallback SSE connection for cross-device push
        try {
            if (this.eventSource) {
                this.eventSource.close();
            }
            this.eventSource = new EventSource(KOPI_SYNC_ENDPOINT + "/sse");
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

        // 5. Fallback polling backup every 3.5 seconds
        setInterval(() => {
            this.fetchRemoteOrders();
        }, 3500);

        // Listen for Supabase ready event if initialized asynchronously
        window.addEventListener('kopiSupabaseReady', () => {
            this.fetchRemoteOrders();
            if (kopiSupabase && !this.supabaseChannel) {
                try {
                    this.supabaseChannel = kopiSupabase
                        .channel('kopi_orders_realtime_stream')
                        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                            this.handleSupabaseRealtime(payload);
                        })
                        .subscribe();
                } catch (e) {}
            }
        });
    },

    applyIncomingPayload(payload) {
        if (!payload || !payload.event) return;
        let orders = this.getOrders();
        let archived = this.getArchivedOrders();
        let changed = false;

        if (payload.event === "new_order" && payload.order) {
            const orderId = payload.order.id;
            const inOrders = orders.some(o => o.id === orderId);
            const inArchived = archived.some(a => a.id === orderId);
            if (!inOrders && !inArchived) {
                const newO = { ...payload.order };
                newO.status = newO.status || 'pending';
                newO.updatedAt = payload.sentAt || (newO.createdAt ? new Date(newO.createdAt).getTime() : Date.now());
                orders.unshift(newO);
                changed = true;
            }
        } else if (payload.event === "update_status" && payload.orderId) {
            const order = orders.find(o => o.id === payload.orderId);
            if (order) {
                const currentRank = STATUS_RANK[order.status] || 0;
                const incomingRank = STATUS_RANK[payload.status] || 0;
                const incomingTime = payload.sentAt || 0;
                const existingTime = order.updatedAt || 0;

                // Ignore stale messages
                if (incomingTime && existingTime && incomingTime < existingTime) {
                    return;
                }

                // Strictly reject backward status regression (completed -> preparing/pending)
                if (incomingRank < currentRank) {
                    return;
                }

                if (order.status !== payload.status) {
                    order.status = payload.status;
                    order.updatedAt = Math.max(existingTime, incomingTime || Date.now());
                    changed = true;
                }
            }
        } else if (payload.event === "delete_order" && payload.orderId) {
            const prevLen = orders.length;
            orders = orders.filter(o => o.id !== payload.orderId);
            if (orders.length !== prevLen) changed = true;
        } else if (payload.event === "archive_order" && payload.orderId) {
            const prevLen = orders.length;
            orders = orders.filter(o => o.id !== payload.orderId);
            if (orders.length !== prevLen) changed = true;

            if (payload.order && !archived.some(a => a.id === payload.orderId)) {
                archived.unshift(payload.order);
                this.saveLocalArchivedOrders(archived);
            }
        } else if (payload.event === "restore_order" && payload.orderId) {
            const prevArchLen = archived.length;
            archived = archived.filter(a => a.id !== payload.orderId);
            if (archived.length !== prevArchLen) this.saveLocalArchivedOrders(archived);

            if (payload.order && !orders.some(o => o.id === payload.orderId)) {
                orders.unshift(payload.order);
                changed = true;
            }
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
