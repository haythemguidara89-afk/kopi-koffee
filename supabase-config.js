// ==============================================================================
// KOPI KOFFEE - SUPABASE DATABASE CONFIGURATION & CLIENT (supabase-config.js)
// ==============================================================================
// Connect to your Supabase project by entering your Project URL and Anon Public Key below,
// OR by entering them in the Admin Settings on the Kitchen Display System (saved in localStorage).

const KOPI_SUPABASE_CONFIG = {
    // Replace with your Project URL, e.g. "https://xyzcompany.supabase.co"
    url: "YOUR_SUPABASE_PROJECT_URL",
    // Replace with your Project Anon Public Key, e.g. "eyJhbGciOiJIUzI1NiIsInR5..."
    anonKey: "YOUR_SUPABASE_ANON_KEY"
};

function getActiveSupabaseConfig() {
    const localUrl = (typeof localStorage !== 'undefined') ? (localStorage.getItem('kopiSupabaseUrl') || '').trim() : '';
    const localKey = (typeof localStorage !== 'undefined') ? (localStorage.getItem('kopiSupabaseAnonKey') || '').trim() : '';

    const url = localUrl || KOPI_SUPABASE_CONFIG.url;
    const anonKey = localKey || KOPI_SUPABASE_CONFIG.anonKey;

    const isConfigured = Boolean(
        url &&
        anonKey &&
        url !== "YOUR_SUPABASE_PROJECT_URL" &&
        anonKey !== "YOUR_SUPABASE_ANON_KEY" &&
        url.startsWith("http")
    );

    return { url, anonKey, isConfigured };
}

let kopiSupabase = null;

function initSupabaseClient() {
    const { url, anonKey, isConfigured } = getActiveSupabaseConfig();

    if (isConfigured && typeof window !== 'undefined' && window.supabase) {
        try {
            kopiSupabase = window.supabase.createClient(url, anonKey, {
                auth: { persistSession: false },
                realtime: { params: { eventsPerSecond: 10 } }
            });
            console.log("Kopi Koffee: Supabase PostgreSQL connected successfully!");
            window.dispatchEvent(new CustomEvent('kopiSupabaseReady', { detail: { url } }));
        } catch (err) {
            console.error("Failed to initialize Supabase client:", err);
            kopiSupabase = null;
        }
    } else {
        kopiSupabase = null;
    }
    return kopiSupabase;
}

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
    initSupabaseClient();
}
