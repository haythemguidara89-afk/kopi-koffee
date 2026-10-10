---
name: passkey-management
description: >-
  Manage WebAuthn Passkeys and generate single-use invite setup links for Kopi Koffee admins.
  Use whenever the user asks to generate a new passkey link, list active passkeys,
  revoke/delete a passkey, inspect recovery codes, or manage admin credentials.
---

# Passkey Management Skill (Kopi Koffee)

This skill provides complete management of WebAuthn Passkey biometric authentication and one-time registration links backed by Supabase PostgreSQL for Kopi Koffee.

## CLI Tool: `passkey`

The `passkey` CLI is installed and available in PATH (`~/.gemini/antigravity/bin/passkey` and `scripts/manage_passkeys.py`).

### Commands

1. **List all registered Passkeys and recent invite tokens**:
   ```bash
   passkey list
   ```

2. **Generate a new single-use registration link**:
   ```bash
   passkey generate "<Admin Name>" [--days <N>]
   ```
   *Example*:
   ```bash
   passkey generate "Barista Yassine" --days 7
   ```
   *Output*: Returns the direct setup URL:
   `https://kopi-koffee-admin.vercel.app/?setup_passkey=<token>`

3. **Revoke / Delete a registered Passkey**:
   ```bash
   passkey delete-passkey "<credential_id | recovery_code | admin_name>"
   ```
   *Examples*:
   - By Admin Name: `passkey delete-passkey "Barista Yassine"`
   - By Recovery Code: `passkey delete-passkey "KP-XXXXXX"`
   - By Credential ID: `passkey delete-passkey "BaWFqHNg..."`

4. **Delete / Cancel a pending invite token**:
   ```bash
   passkey delete-token "<token>"
   ```

5. **Clean up redeemed and expired tokens**:
   ```bash
   passkey cleanup
   ```

---

## Database Architecture (Supabase PostgreSQL)

- **`admin_passkeys`**:
  - `credential_id` (PK, text): Base64URL WebAuthn ID.
  - `admin_name` (text): Staff member name or role.
  - `public_key` (text): Cryptographic public key.
  - `raw_id` (text): Raw WebAuthn identifier.
  - `recovery_code` (text, UNIQUE): Emergency backup code (`KP-XXXXXX`).
  - `transports` (jsonb): Authenticator attachment (`["internal"]`).
  - `created_at` & `last_used_at` (timestamptz).

- **`admin_invite_tokens`**:
  - `token` (PK, text): 40-character cryptographic token.
  - `admin_name` (text): Name assigned by the owner.
  - `expires_at` (timestamptz): Token expiry.
  - `used` (boolean): `true` once redeemed (burns immediately upon enrollment).
  - `used_at` (timestamptz): Redemption timestamp.

---

## Admin Portal Integration

Admins can also manage passkeys and generate invite links directly inside the web UI:
1. Open [https://kopi-koffee-admin.vercel.app](https://kopi-koffee-admin.vercel.app).
2. Authenticate using Face ID, Touch ID, or Recovery Code.
3. Click the **"Sécurité & Passkeys"** button in the header nav.
4. Generate invite links or view/revoke active passkeys in real time.
