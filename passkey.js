// ==============================================================================
// KOPI KOFFEE - WEBAUTHN PASSKEY AUTHENTICATION & ONE-TIME INVITES (passkey.js)
// ==============================================================================
// Enables biometric logins (Face ID, Touch ID, Windows Hello) & one-time setup links.
// Backed permanently by Supabase PostgreSQL tables: admin_passkeys & admin_invite_tokens.

const KopiPasskey = {
    // --------------------------------------------------------------------------
    // Encoding & Utility Helpers
    // --------------------------------------------------------------------------
    bufferToBase64Url(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    },

    base64UrlToBuffer(base64url) {
        let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
            base64 += '=';
        }
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    },

    generateRandomToken(length = 32) {
        const bytes = new Uint8Array(length);
        window.crypto.getRandomValues(bytes);
        return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    },

    generateRecoveryCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = 'KP-';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    },

    // --------------------------------------------------------------------------
    // Platform Capability Check
    // --------------------------------------------------------------------------
    isSupported() {
        return Boolean(
            typeof window !== 'undefined' &&
            window.PublicKeyCredential &&
            navigator.credentials &&
            navigator.credentials.create &&
            navigator.credentials.get
        );
    },

    async isPlatformAuthenticatorAvailable() {
        if (!this.isSupported()) return false;
        try {
            if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
                return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            }
            return true;
        } catch (e) {
            return false;
        }
    },

    // --------------------------------------------------------------------------
    // 1. One-Time Setup Link Generation
    // --------------------------------------------------------------------------
    async createOneTimeInvite(adminName = 'Staff Barista', hoursValid = 48) {
        if (typeof kopiSupabase === 'undefined' || !kopiSupabase) {
            throw new Error("Base Supabase non disponible");
        }

        const token = this.generateRandomToken(24);
        const expiresAt = new Date(Date.now() + hoursValid * 3600 * 1000).toISOString();

        const { error } = await kopiSupabase
            .from('admin_invite_tokens')
            .insert({
                token: token,
                admin_name: adminName.trim(),
                created_by: 'Owner',
                expires_at: expiresAt,
                used: false
            });

        if (error) {
            console.error("Failed to insert invite token in Supabase:", error);
            throw error;
        }

        const path = window.location.pathname.endsWith('.html') ? window.location.pathname : (window.location.pathname.length > 1 ? window.location.pathname : '');
        const inviteUrl = `${window.location.origin}${path}?setup_passkey=${token}`;

        return {
            token,
            inviteUrl,
            adminName,
            expiresAt
        };
    },

    // --------------------------------------------------------------------------
    // 2. Validate One-Time Setup Token
    // --------------------------------------------------------------------------
    async validateInviteToken(token) {
        if (!token) return { valid: false, reason: 'missing' };
        if (typeof kopiSupabase === 'undefined' || !kopiSupabase) {
            return { valid: false, reason: 'offline' };
        }

        try {
            const { data, error } = await kopiSupabase
                .from('admin_invite_tokens')
                .select('*')
                .eq('token', token)
                .maybeSingle();

            if (error || !data) {
                return { valid: false, reason: 'invalid' };
            }

            if (data.used) {
                return { valid: false, reason: 'used', usedAt: data.used_at, adminName: data.admin_name };
            }

            if (new Date(data.expires_at).getTime() < Date.now()) {
                return { valid: false, reason: 'expired', adminName: data.admin_name };
            }

            return {
                valid: true,
                adminName: data.admin_name,
                token: data.token,
                expiresAt: data.expires_at
            };
        } catch (e) {
            console.error("Error validating invite token:", e);
            return { valid: false, reason: 'error' };
        }
    },

    // --------------------------------------------------------------------------
    // 3. Register Passkey (Enrollment via One-Time Link)
    // --------------------------------------------------------------------------
    async registerPasskeyWithToken(token, adminName) {
        if (!this.isSupported()) {
            throw new Error("Votre appareil ou navigateur ne supporte pas les Passkeys.");
        }

        const validation = await this.validateInviteToken(token);
        if (!validation.valid) {
            if (validation.reason === 'used') throw new Error("Ce lien d'invitation a déjà été utilisé.");
            if (validation.reason === 'expired') throw new Error("Ce lien d'invitation a expiré.");
            throw new Error("Lien d'invitation invalide ou introuvable.");
        }

        const effectiveName = adminName || validation.adminName || 'Admin Staff';
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const userId = new TextEncoder().encode(`${effectiveName}_${Date.now()}`);

        const createOptions = {
            publicKey: {
                rp: {
                    name: "Kopi Koffee • Administration Cuisine",
                    id: window.location.hostname
                },
                user: {
                    id: userId,
                    name: effectiveName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                    displayName: effectiveName
                },
                challenge: challenge,
                pubKeyCredParams: [
                    { type: "public-key", alg: -7 },   // ES256
                    { type: "public-key", alg: -257 }  // RS256
                ],
                authenticatorSelection: {
                    authenticatorAttachment: "platform", // Face ID, Touch ID, Windows Hello
                    userVerification: "preferred",
                    residentKey: "preferred"
                },
                timeout: 60000,
                attestation: "none"
            }
        };

        const credential = await navigator.credentials.create(createOptions);
        if (!credential) {
            throw new Error("Enregistrement annulé par l'utilisateur.");
        }

        const credentialId = this.bufferToBase64Url(credential.rawId);
        const rawId = credential.id || credentialId;
        const recoveryCode = this.generateRecoveryCode();

        let publicKeyStr = '';
        if (credential.response && credential.response.getPublicKey) {
            const pk = credential.response.getPublicKey();
            if (pk) publicKeyStr = this.bufferToBase64Url(pk);
        } else if (credential.response && credential.response.attestationObject) {
            publicKeyStr = this.bufferToBase64Url(credential.response.attestationObject);
        }

        const transports = (credential.response && credential.response.getTransports) ? 
            credential.response.getTransports() : ['internal'];

        // 1. Commit to admin_passkeys table
        const { error: insertErr } = await kopiSupabase
            .from('admin_passkeys')
            .insert({
                credential_id: credentialId,
                admin_name: effectiveName,
                public_key: publicKeyStr,
                raw_id: rawId,
                recovery_code: recoveryCode,
                transports: transports,
                created_at: new Date().toISOString(),
                last_used_at: new Date().toISOString()
            });

        if (insertErr) {
            console.error("Failed to store passkey in Supabase:", insertErr);
            throw new Error("Impossible d'enregistrer le Passkey dans la base de données.");
        }

        // 2. Burn the one-time invite token
        await kopiSupabase
            .from('admin_invite_tokens')
            .update({
                used: true,
                used_at: new Date().toISOString()
            })
            .eq('token', token);

        return {
            success: true,
            credentialId,
            recoveryCode,
            adminName: effectiveName
        };
    },

    // --------------------------------------------------------------------------
    // 4. Authenticate With Passkey (Biometric Sign-In)
    // --------------------------------------------------------------------------
    async authenticateWithPasskey() {
        if (!this.isSupported()) {
            throw new Error("Votre appareil ou navigateur ne supporte pas les Passkeys.");
        }
        if (typeof kopiSupabase === 'undefined' || !kopiSupabase) {
            throw new Error("Base de données Supabase non connectée.");
        }

        // Pull registered credentials from Supabase
        const { data: registered, error } = await kopiSupabase
            .from('admin_passkeys')
            .select('*');

        if (error) {
            console.error("Could not fetch passkeys:", error);
            throw new Error("Erreur de communication avec la base de données.");
        }

        if (!registered || registered.length === 0) {
            throw new Error("NO_PASSKEYS_REGISTERED");
        }

        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const allowCredentials = registered.map(item => ({
            id: this.base64UrlToBuffer(item.credential_id),
            type: "public-key",
            transports: Array.isArray(item.transports) ? item.transports : ['internal']
        }));

        const getOptions = {
            publicKey: {
                challenge: challenge,
                rpId: window.location.hostname,
                userVerification: "preferred",
                timeout: 60000,
                allowCredentials: allowCredentials
            }
        };

        const assertion = await navigator.credentials.get(getOptions);
        if (!assertion) {
            throw new Error("Authentification annulée.");
        }

        const assertedId = this.bufferToBase64Url(assertion.rawId);
        const match = registered.find(r => r.credential_id === assertedId || r.raw_id === assertion.id);

        if (!match) {
            throw new Error("Passkey non reconnu par le système.");
        }

        // Update last used timestamp in Supabase
        await kopiSupabase
            .from('admin_passkeys')
            .update({ last_used_at: new Date().toISOString() })
            .eq('credential_id', match.credential_id);

        return {
            success: true,
            adminName: match.admin_name,
            credentialId: match.credential_id
        };
    },

    // --------------------------------------------------------------------------
    // 5. Authenticate with Recovery Code
    // --------------------------------------------------------------------------
    async authenticateWithRecoveryCode(rawCode) {
        if (!rawCode) throw new Error("Veuillez saisir votre code de secours.");
        if (typeof kopiSupabase === 'undefined' || !kopiSupabase) {
            throw new Error("Base de données Supabase non connectée.");
        }

        const cleanCode = rawCode.trim().toUpperCase();

        const { data, error } = await kopiSupabase
            .from('admin_passkeys')
            .select('*')
            .eq('recovery_code', cleanCode)
            .maybeSingle();

        if (error || !data) {
            throw new Error("Code de secours invalide ou introuvable.");
        }

        // Update last used timestamp
        await kopiSupabase
            .from('admin_passkeys')
            .update({ last_used_at: new Date().toISOString() })
            .eq('credential_id', data.credential_id);

        return {
            success: true,
            adminName: data.admin_name
        };
    },

    // --------------------------------------------------------------------------
    // 6. Management: List & Revoke Passkeys
    // --------------------------------------------------------------------------
    async listPasskeys() {
        if (typeof kopiSupabase === 'undefined' || !kopiSupabase) return [];
        const { data } = await kopiSupabase
            .from('admin_passkeys')
            .select('*')
            .order('created_at', { ascending: false });
        return data || [];
    },

    async revokePasskey(credentialId) {
        if (typeof kopiSupabase === 'undefined' || !kopiSupabase) return false;
        const { error } = await kopiSupabase
            .from('admin_passkeys')
            .delete()
            .eq('credential_id', credentialId);
        return !error;
    },

    async listRecentInvites() {
        if (typeof kopiSupabase === 'undefined' || !kopiSupabase) return [];
        const { data } = await kopiSupabase
            .from('admin_invite_tokens')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
        return data || [];
    }
};

if (typeof window !== 'undefined') {
    window.KopiPasskey = KopiPasskey;
}
