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
    const { event, payload } = body;

    // WAHA webhook payload: event=message, payload={from, body, ...}
    if (event === "message" || event === "message.any") {
      const phone = payload?.from?.replace("@c.us", "") || payload?.chatId?.replace("@c.us", "");
      const messageBody = payload?.body || payload?.text || "";
      const sessionName = payload?.session || "default";

      if (!phone) {
        return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Find tenant from session
      const { data: session } = await supabase.from("wa_sessions").select("tenant_id, branch_id")
        .eq("session_name", sessionName).single();
      const tenantId = session?.tenant_id;
      if (!tenantId) {
        return new Response(JSON.stringify({ error: "No tenant for session" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Find or create conversation
      let { data: convo } = await supabase.from("wa_conversations").select("*")
        .eq("tenant_id", tenantId).eq("phone", phone).single();

      if (!convo) {
        // Try to link to customer
        const { data: customer } = await supabase.from("customers").select("id, name")
          .eq("tenant_id", tenantId).eq("phone", phone).single();

        const { data: newConvo } = await supabase.from("wa_conversations").insert({
          tenant_id: tenantId,
          phone,
          name: customer?.name || phone,
          customer_id: customer?.id || null,
          branch_id: session?.branch_id,
        }).select().single();
        convo = newConvo;
      }

      if (!convo) {
        return new Response(JSON.stringify({ error: "Failed to create conversation" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Save message
      await supabase.from("wa_messages").insert({
        tenant_id: tenantId,
        conversation_id: convo.id,
        direction: "incoming",
        sender: phone,
        body: messageBody,
        message_type: payload?.hasMedia ? "media" : "text",
        wa_message_id: payload?.id || null,
      });

      // Update conversation
      await supabase.from("wa_conversations").update({
        last_message: messageBody,
        last_message_at: new Date().toISOString(),
        unread_count: (convo.unread_count || 0) + 1,
      }).eq("id", convo.id);

      // Bot auto-reply if enabled
      if (convo.bot_enabled) {
        const lower = messageBody.toLowerCase().trim();
        let botReply = "";

        if (lower.includes("status") || lower.includes("loan")) {
          // Fetch active loans for this customer
          if (convo.customer_id) {
            const { data: loans } = await supabase.from("loans").select("loan_number, amount, status, product_type")
              .eq("customer_id", convo.customer_id).eq("status", "active").limit(5);
            if (loans && loans.length > 0) {
              botReply = "📋 Your active loans:\n" + loans.map((l: any) =>
                `• ${l.loan_number} (${l.product_type}) - ₹${l.amount} [${l.status}]`
              ).join("\n");
            } else {
              botReply = "No active loans found for your account.";
            }
          } else {
            botReply = "We couldn't find your account. Please contact our branch for assistance.";
          }
        } else if (lower.includes("balance") || lower.includes("outstanding")) {
          if (convo.customer_id) {
            const { data: loans } = await supabase.from("loans").select("loan_number, amount")
              .eq("customer_id", convo.customer_id).eq("status", "active");
            const total = (loans || []).reduce((s: number, l: any) => s + Number(l.amount), 0);
            botReply = `💰 Your total outstanding balance is ₹${total.toLocaleString("en-IN")}`;
          } else {
            botReply = "Please visit our branch to check your balance.";
          }
        } else if (lower.includes("receipt") || lower.includes("download")) {
          botReply = "📄 Please visit our customer portal to download your receipts.";
        } else {
          botReply = "👋 Welcome! How can we help you?\n\nType:\n• *status* - Check loan status\n• *balance* - Check outstanding\n• *receipt* - Download receipts\n\nOr wait for an agent to assist you.";
        }

        if (botReply) {
          await supabase.from("wa_messages").insert({
            tenant_id: tenantId,
            conversation_id: convo.id,
            direction: "outgoing",
            body: botReply,
            is_bot: true,
            message_type: "text",
          });

          // Send via WAHA
          const wahaUrl = Deno.env.get("WAHA_API_URL");
          if (wahaUrl) {
            await fetch(`${wahaUrl}/api/sendText`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chatId: `${phone}@c.us`, text: botReply, session: sessionName }),
            });
          }
        }
      }

      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
