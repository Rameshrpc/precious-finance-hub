import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    // Parse optional tenant_id from body (for manual trigger)
    let targetTenantId: string | null = null;
    let triggeredBy = "system";
    try {
      const body = await req.json();
      targetTenantId = body?.tenant_id || null;
      triggeredBy = body?.triggered_by || "system";
    } catch {
      // No body = system cron
    }

    // Get tenants to process
    const tenantsQuery = supabase.from("tenants").select("id").eq("is_active", true);
    if (targetTenantId) tenantsQuery.eq("id", targetTenantId);
    const { data: tenants, error: tenErr } = await tenantsQuery;
    if (tenErr) throw tenErr;

    const results = [];

    for (const tenant of tenants || []) {
      const result = await processTenant(supabase, tenant.id, triggeredBy);
      results.push(result);
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Cron error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function processTenant(supabase: any, tenantId: string, triggeredBy: string) {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  let chargesAccrued = 0;
  let loansUpdated = 0;
  let overdueMarked = 0;
  let errors = 0;
  const errorDetails: any[] = [];

  // Insert cron run record
  const { data: cronRun } = await supabase
    .from("cron_runs")
    .insert({
      tenant_id: tenantId,
      run_type: "daily",
      triggered_by: triggeredBy,
      status: "running",
    })
    .select("id")
    .single();

  try {
    // Get holidays for today
    const { data: holidays } = await supabase
      .from("holidays")
      .select("holiday_date")
      .eq("tenant_id", tenantId)
      .eq("holiday_date", todayStr);

    const isHoliday = (holidays || []).length > 0;

    // --- 1. ACCRUE CHARGES (skip on holidays) ---
    if (!isHoliday) {
      const BATCH_SIZE = 100;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const { data: loans, error: loansErr } = await supabase
          .from("loans")
          .select("id, amount, rate, product_type, scheme_id, created_at, maturity_date, tenure_months")
          .eq("tenant_id", tenantId)
          .in("status", ["active", "imported"])
          .range(offset, offset + BATCH_SIZE - 1)
          .order("created_at");

        if (loansErr) {
          errors++;
          errorDetails.push({ step: "fetch_loans", error: loansErr.message });
          break;
        }

        if (!loans || loans.length === 0) {
          hasMore = false;
          break;
        }

        for (const loan of loans) {
          try {
            const result = await accrueCharge(supabase, tenantId, loan, todayStr);
            if (result.accrued) chargesAccrued++;
          } catch (err: any) {
            errors++;
            errorDetails.push({ step: "accrue", loan_id: loan.id, error: err.message });
          }
        }

        offset += BATCH_SIZE;
        if (loans.length < BATCH_SIZE) hasMore = false;
      }
    }

    // --- 2. MARK OVERDUE ---
    const { data: dueRecords } = await supabase
      .from("interest_records")
      .select("id, due_date, amount, penalty, loan_id")
      .eq("tenant_id", tenantId)
      .in("status", ["pending", "due"])
      .lt("due_date", todayStr);

    for (const rec of dueRecords || []) {
      try {
        // Get scheme overdue rate
        const { data: loan } = await supabase
          .from("loans")
          .select("scheme_id")
          .eq("id", rec.loan_id)
          .single();

        let overdueRate = 0;
        if (loan?.scheme_id) {
          const { data: scheme } = await supabase
            .from("loan_schemes")
            .select("overdue_rate")
            .eq("id", loan.scheme_id)
            .single();
          overdueRate = scheme?.overdue_rate || 0;
        }

        const penaltyAmount = overdueRate > 0
          ? Number(rec.amount) * overdueRate / 100
          : 0;

        await supabase
          .from("interest_records")
          .update({
            status: "overdue",
            penalty: Math.max(Number(rec.penalty), penaltyAmount),
          })
          .eq("id", rec.id);

        overdueMarked++;
      } catch (err: any) {
        errors++;
        errorDetails.push({ step: "mark_overdue", record_id: rec.id, error: err.message });
      }
    }

    // --- 3. UPDATE LOAN STATUS ---
    {
      const { data: activeLoans } = await supabase
        .from("loans")
        .select("id, created_at, maturity_date, status, product_type")
        .eq("tenant_id", tenantId)
        .in("status", ["active", "imported", "fresh", "old", "matured"]);

      for (const loan of activeLoans || []) {
        try {
          const createdDate = new Date(loan.created_at);
          const daysSinceCreation = Math.floor(
            (today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          let newStatus = loan.status;
          if (loan.maturity_date && new Date(loan.maturity_date) < today) {
            newStatus = "matured";
          } else if (daysSinceCreation > 30) {
            newStatus = "active"; // keep active but could use sub-status
          }

          if (newStatus !== loan.status) {
            await supabase
              .from("loans")
              .update({ status: newStatus })
              .eq("id", loan.id);
            loansUpdated++;
          }
        } catch (err: any) {
          errors++;
          errorDetails.push({ step: "update_status", loan_id: loan.id, error: err.message });
        }
      }
    }

    // --- 4. CALCULATE DPD (stored in summary) ---
    const { data: overdueLoans } = await supabase
      .from("interest_records")
      .select("loan_id, due_date")
      .eq("tenant_id", tenantId)
      .eq("status", "overdue")
      .order("due_date", { ascending: true });

    const dpdMap: Record<string, number> = {};
    for (const rec of overdueLoans || []) {
      if (!dpdMap[rec.loan_id]) {
        const dpd = Math.floor(
          (today.getTime() - new Date(rec.due_date).getTime()) / (1000 * 60 * 60 * 24)
        );
        dpdMap[rec.loan_id] = dpd;
      }
    }

    // Update cron run
    await supabase
      .from("cron_runs")
      .update({
        status: errors > 0 ? "completed_with_errors" : "completed",
        completed_at: new Date().toISOString(),
        charges_accrued: chargesAccrued,
        loans_updated: loansUpdated,
        overdue_marked: overdueMarked,
        errors,
        error_details: errorDetails,
        summary: {
          is_holiday: isHoliday,
          dpd_count: Object.keys(dpdMap).length,
          max_dpd: Math.max(0, ...Object.values(dpdMap)),
        },
      })
      .eq("id", cronRun.id);

    // Audit log
    await supabase.from("audit_logs").insert({
      tenant_id: tenantId,
      entity_type: "system",
      entity_id: cronRun.id,
      action: "daily_cron_completed",
      details: {
        charges_accrued: chargesAccrued,
        overdue_marked: overdueMarked,
        loans_updated: loansUpdated,
        errors,
        triggered_by: triggeredBy,
      },
    });

    return {
      tenant_id: tenantId,
      charges_accrued: chargesAccrued,
      overdue_marked: overdueMarked,
      loans_updated: loansUpdated,
      errors,
    };
  } catch (err: any) {
    // Mark cron run as failed
    if (cronRun?.id) {
      await supabase
        .from("cron_runs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          errors: errors + 1,
          error_details: [...errorDetails, { step: "global", error: err.message }],
        })
        .eq("id", cronRun.id);
    }
    throw err;
  }
}

async function accrueCharge(
  supabase: any,
  tenantId: string,
  loan: any,
  todayStr: string,
) {
  // Get scheme details
  let interestType = "monthly";
  let rate = loan.rate;

  if (loan.scheme_id) {
    const { data: scheme } = await supabase
      .from("loan_schemes")
      .select("interest_type, rate, charge_label")
      .eq("id", loan.scheme_id)
      .single();
    if (scheme) {
      interestType = scheme.interest_type;
      rate = scheme.rate;
    }
  }

  // Calculate period
  const createdDate = new Date(loan.created_at);
  const today = new Date(todayStr);

  // For monthly: check if we need to accrue for this month
  if (interestType === "monthly") {
    // Calculate which month period we're in
    const monthsDiff = (today.getFullYear() - createdDate.getFullYear()) * 12 +
      (today.getMonth() - createdDate.getMonth());

    const periodStart = new Date(createdDate);
    periodStart.setMonth(periodStart.getMonth() + monthsDiff);
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    periodEnd.setDate(periodEnd.getDate() - 1);

    const periodStartStr = periodStart.toISOString().split("T")[0];
    const periodEndStr = periodEnd.toISOString().split("T")[0];

    // Check duplicate
    const { data: existing } = await supabase
      .from("interest_records")
      .select("id")
      .eq("loan_id", loan.id)
      .eq("period_start", periodStartStr)
      .maybeSingle();

    if (existing) return { accrued: false };

    // Only accrue on the period start day
    if (periodStartStr !== todayStr) return { accrued: false };

    const chargeAmount = Number(loan.amount) * rate / 100;
    const dueDate = new Date(periodEnd);
    dueDate.setDate(dueDate.getDate() + 1);

    await supabase.from("interest_records").insert({
      tenant_id: tenantId,
      loan_id: loan.id,
      principal: loan.amount,
      rate,
      amount: chargeAmount,
      days: 30,
      period_start: periodStartStr,
      period_end: periodEndStr,
      due_date: dueDate.toISOString().split("T")[0],
      status: "pending",
    });

    return { accrued: true };
  }

  // Daily accrual
  const dailyCharge = (Number(loan.amount) * rate / 100) / 30;

  // Check duplicate for today
  const { data: existing } = await supabase
    .from("interest_records")
    .select("id")
    .eq("loan_id", loan.id)
    .eq("period_start", todayStr)
    .maybeSingle();

  if (existing) return { accrued: false };

  await supabase.from("interest_records").insert({
    tenant_id: tenantId,
    loan_id: loan.id,
    principal: loan.amount,
    rate,
    amount: dailyCharge,
    days: 1,
    period_start: todayStr,
    period_end: todayStr,
    due_date: todayStr,
    status: "pending",
  });

  return { accrued: true };
}
