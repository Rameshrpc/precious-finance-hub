

# WAHA Plus Integration Plan

## Current State

You already have the scaffolding in place:
- **Edge Functions**: `waha-session` (session management + send) and `waha-webhook` (incoming message handling)
- **UI**: `WhatsAppInboxPage` with conversation list, chat view, bot toggle, template picker
- **DB Tables**: `wa_sessions`, `wa_conversations`, `wa_messages`, `wa_templates` exist

**What's missing**: WAHA Plus API key authentication, secrets configuration, actual message sending from the UI wired through the edge function, and the webhook URL isn't configured to point back to Supabase.

---

## Plan

### 1. Add Supabase Secrets for WAHA Plus

Store two secrets:
- `WAHA_API_URL` — your WAHA Plus instance URL (e.g. `https://waha.yourdomain.com`)
- `WAHA_API_KEY` — the API key you set in `WHATSAPP_API_KEY` when starting the Docker container

These will be requested via the secrets tool so you can paste the values securely.

### 2. Update `waha-session` Edge Function for Plus API

- Add `X-Api-Key` header to **all** WAHA API calls (required by WAHA Plus)
- Read key from `Deno.env.get("WAHA_API_KEY")`
- Update session start payload to include WAHA Plus config (engine, webhook URL pointing to `waha-webhook`)
- Add a `qr` action to fetch QR code image for pairing
- When starting a session, auto-configure the webhook URL to `https://oqyehjqduvnrvuckzqer.supabase.co/functions/v1/waha-webhook`

### 3. Update `waha-webhook` Edge Function for Plus API

- Add `X-Api-Key` header when sending bot replies via WAHA
- Handle WAHA Plus webhook event format (may differ slightly from core)
- Add `message.ack` event handling for delivery status tracking

### 4. Wire UI to Edge Functions

Update `WhatsAppInboxPage` to:
- Call `waha-session` edge function with `action: "send"` when user sends a message (currently only saves to DB, doesn't actually send via WhatsApp)
- Add a **Session Management** section/page where admins can start/stop WAHA sessions and scan QR codes
- Show connection status indicator in the chat header

### 5. Session Management UI

Add a settings panel (accessible from WhatsApp Inbox or Settings) to:
- Start a new WAHA session (shows QR code for WhatsApp Web pairing)
- View session status (connected/disconnected)
- Stop/restart sessions
- Display the linked phone number

---

## Technical Details

**WAHA Plus API Key Header** — Every request to the WAHA Plus API must include:
```
X-Api-Key: <your-api-key>
```

**Webhook auto-configuration** — When starting a session, the edge function will configure the webhook URL so WAHA pushes incoming messages to:
```
https://oqyehjqduvnrvuckzqer.supabase.co/functions/v1/waha-webhook
```

**Message send flow**:
```text
User types message → UI calls waha-session (action: send)
  → Edge fn saves to wa_messages
  → Edge fn calls WAHA Plus /api/sendText with X-Api-Key
  → WhatsApp delivers message
```

**Incoming message flow**:
```text
WhatsApp message → WAHA Plus → POST to waha-webhook
  → Edge fn saves to wa_messages + wa_conversations
  → Bot auto-reply if enabled
  → UI polls/refreshes via react-query
```

