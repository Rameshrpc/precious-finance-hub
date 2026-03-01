import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) return new Response(JSON.stringify({ error: "Missing x-api-key header" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Hash the key and look up
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(apiKey));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    const { data: keyRecord } = await supabase
      .from("api_keys")
      .select("*")
      .eq("key_hash", hashHex)
      .eq("is_active", true)
      .single();

    if (!keyRecord) return new Response(JSON.stringify({ error: "Invalid API key" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Update last used
    await supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRecord.id);

    const url = new URL(req.url);
    const resource = url.searchParams.get("resource") || "";
    const tenantId = keyRecord.tenant_id;
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);

    let responseData: any;

    switch (resource) {
      case "loans": {
        const { data } = await supabase.from("loans").select("id, loan_number, product_type, amount, status, rate, created_at").eq("tenant_id", tenantId).limit(limit);
        responseData = data;
        break;
      }
      case "customers": {
        const { data } = await supabase.from("customers").select("id, code, name, phone, city, status, created_at").eq("tenant_id", tenantId).limit(limit);
        responseData = data;
        break;
      }
      case "receipts": {
        const { data } = await supabase.from("interest_records").select("id, loan_id, amount, paid, status, due_date, payment_date").eq("tenant_id", tenantId).eq("status", "paid").order("payment_date", { ascending: false }).limit(limit);
        responseData = data;
        break;
      }
      case "summary": {
        const { data: loans } = await supabase.from("loans").select("amount, status, product_type").eq("tenant_id", tenantId).eq("status", "active");
        const totalAUM = (loans || []).reduce((s, l) => s + Number(l.amount), 0);
        const byProduct: Record<string, number> = {};
        (loans || []).forEach((l) => { byProduct[l.product_type] = (byProduct[l.product_type] || 0) + Number(l.amount); });
        responseData = { total_aum: totalAUM, active_loans: (loans || []).length, by_product: byProduct };
        break;
      }
      default:
        return new Response(JSON.stringify({ error: "Unknown resource. Use: loans, customers, receipts, summary" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ data: responseData }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
