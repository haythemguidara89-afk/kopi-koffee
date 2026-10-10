#!/usr/bin/env python3
"""
Kopi Koffee - Admin Passkey & Invite Management CLI
Allows managing WebAuthn Passkeys and one-time registration links backed by Supabase PostgreSQL.
"""

import sys
import json
import urllib.request
import urllib.parse
import secrets
import datetime
import argparse

SUPABASE_URL = "https://pmaslgwawmbpeoahwxfv.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtYXNsZ3dhd21icGVvYWh3eGZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyODY4MTMsImV4cCI6MjEwNjg2MjgxM30.oqWVU5Qp3Th0Velnqhb4YkLF1KtiVyOas2Igk501Vow"
ADMIN_BASE_URL = "https://kopi-koffee-admin.vercel.app"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

def api_request(endpoint, method="GET", data=None):
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    payload = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=payload, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return json.loads(content) if content else []
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8")
        print(f"Database error ({e.code}): {err_msg}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Network error: {e}", file=sys.stderr)
        sys.exit(1)

def list_all():
    print("\n=== REGISTERED WEBAUTHN PASSKEYS ===")
    passkeys = api_request("admin_passkeys?select=*&order=created_at.desc")
    if not passkeys:
        print("No passkeys registered yet.\n")
    else:
        print(f"{'#':<3} {'ADMIN NAME':<28} {'RECOVERY CODE':<15} {'CREATED':<20} {'LAST USED':<20} {'CREDENTIAL ID'}")
        print("-" * 110)
        for i, pk in enumerate(passkeys, 1):
            created = pk.get("created_at", "")[:19].replace("T", " ")
            last_used = (pk.get("last_used_at") or "")[:19].replace("T", " ") or "Never"
            cred_preview = pk.get("credential_id", "")[:16] + "..."
            print(f"{i:<3} {pk.get('admin_name', 'Admin'):<28} {pk.get('recovery_code', '-'):<15} {created:<20} {last_used:<20} {cred_preview}")
        print()

    print("=== RECENT ONE-TIME INVITE TOKENS ===")
    invites = api_request("admin_invite_tokens?select=*&order=created_at.desc&limit=10")
    if not invites:
        print("No invite tokens found.\n")
    else:
        print(f"{'#':<3} {'ADMIN NAME':<28} {'STATUS':<12} {'EXPIRES':<20} {'TOKEN'}")
        print("-" * 110)
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        for i, inv in enumerate(invites, 1):
            expires = inv.get("expires_at", "")[:19].replace("T", " ")
            if inv.get("used"):
                status = "REDEEMED"
            elif inv.get("expires_at", "") < now_iso:
                status = "EXPIRED"
            else:
                status = "ACTIVE"
            tok = inv.get("token", "")
            print(f"{i:<3} {inv.get('admin_name', '-'):<28} {status:<12} {expires:<20} {tok}")
        print()

def generate_invite(admin_name, days=7):
    token = secrets.token_hex(20)
    expires_at = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=days)).isoformat()
    
    data = {
        "token": token,
        "admin_name": admin_name.strip(),
        "created_by": "Passkey Manager CLI",
        "expires_at": expires_at,
        "used": False
    }
    
    result = api_request("admin_invite_tokens", method="POST", data=data)
    invite_url = f"{ADMIN_BASE_URL}/?setup_passkey={token}"
    
    print("\nSUCCESS: One-Time Passkey Invite Link Generated!")
    print("--------------------------------------------------------------------------------")
    print(f"Admin / Staff: {admin_name}")
    print(f"Validity:      {days} days (Expires {expires_at[:19].replace('T', ' ')} UTC)")
    print(f"Token:         {token}")
    print("--------------------------------------------------------------------------------")
    print(f"Registration Link:\n{invite_url}\n")
    print("Send this single-use link to the admin. Once registered, it burns automatically.")
    return invite_url

def delete_passkey(identifier):
    # Match either credential_id or partial, or by recovery_code or admin_name
    passkeys = api_request(f"admin_passkeys?select=*")
    target = None
    for pk in passkeys:
        if pk.get("credential_id") == identifier or pk.get("credential_id", "").startswith(identifier):
            target = pk
            break
        if pk.get("recovery_code", "").upper() == identifier.upper():
            target = pk
            break
        if pk.get("admin_name", "").lower() == identifier.lower():
            target = pk
            break
            
    if not target:
        print(f"Error: Passkey matching '{identifier}' not found in database.", file=sys.stderr)
        sys.exit(1)
        
    cred_id = target["credential_id"]
    encoded_id = urllib.parse.quote(cred_id)
    api_request(f"admin_passkeys?credential_id=eq.{encoded_id}", method="DELETE")
    print(f"SUCCESS: Revoked passkey for '{target.get('admin_name')}' (Code: {target.get('recovery_code')}).")

def delete_token(token_str):
    encoded_tok = urllib.parse.quote(token_str)
    api_request(f"admin_invite_tokens?token=eq.{encoded_tok}", method="DELETE")
    print(f"SUCCESS: Deleted invite token '{token_str}'.")

def cleanup():
    # Delete consumed/used tokens
    api_request(f"admin_invite_tokens?used=eq.true", method="DELETE")
    print("SUCCESS: Cleaned up consumed/used invite tokens.")

def main():
    parser = argparse.ArgumentParser(description="Kopi Koffee Passkey Management CLI")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # list
    subparsers.add_parser("list", help="List all registered passkeys and invite tokens")

    # generate
    gen_parser = subparsers.add_parser("generate", help="Generate a one-time passkey invite link")
    gen_parser.add_argument("name", help="Name or role of the admin/staff member")
    gen_parser.add_argument("--days", type=int, default=7, help="Days before expiration (default: 7)")

    # delete-passkey
    del_pk_parser = subparsers.add_parser("delete-passkey", help="Revoke a registered passkey")
    del_pk_parser.add_argument("identifier", help="Credential ID, Recovery Code (KP-XXXXXX), or Admin Name")

    # delete-token
    del_tok_parser = subparsers.add_parser("delete-token", help="Delete a pending invite token")
    del_tok_parser.add_argument("token", help="The 40-character invite token")

    # cleanup
    subparsers.add_parser("cleanup", help="Remove redeemed and expired invite tokens")

    args = parser.parse_args()

    if args.command == "list" or not args.command:
        list_all()
    elif args.command == "generate":
        generate_invite(args.name, args.days)
    elif args.command == "delete-passkey":
        delete_passkey(args.identifier)
    elif args.command == "delete-token":
        delete_token(args.token)
    elif args.command == "cleanup":
        cleanup()
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
