import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const { action, tenantId, branchId, phone, sessionName, wahaUrl } = body;

    // Default WAHA URL - user must configure via secret or pass in
    const baseUrl = wahaUrl || Deno.env.get("WAHA_API_URL") || "http://localhost:3000";

    if (action === "start") {
      // Start WAHA session
      const res = await fetch(`${baseUrl}/api/sessions/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: sessionName || `session-${tenantId}-${branchId}` }),
      });
      const data = await res.json();

      // Save session
      await supabase.from("wa_sessions").upsert({
        tenant_id: tenantId,
        branch_id: branchId,
        phone: phone || "",
        session_name: sessionName || `session-${tenantId}-${branchId}`,
        status: "connecting",
        qr_code: data.qr || null,
      }, { onConflict: "session_name" });

      return new Response(JSON.stringify({ success: true, qr: data.qr, session: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "status") {
      const res = await fetch(`${baseUrl}/api/sessions/${sessionName}/status`);
      const data = await res.json();
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "stop") {
      await fetch(`${baseUrl}/api/sessions/${sessionName}/stop`, { method: "POST" });
      await supabase.from("wa_sessions").update({ status: "disconnected" }).eq("session_name", sessionName);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "send") {
      const { chatId, text, mediaUrl } = body;
      const payload: any = { chatId, session: sessionName };
      if (mediaUrl) {
        payload.file = { url: mediaUrl };
        payload.caption = text;
      } else {
        payload.text = text;
      }
      const endpoint = mediaUrl ? "sendFile" : "sendText";
      const res = await fetch(`${baseUrl}/api/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
