import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const email = "admin@test.com";
  const password = "password123";
  const tenantId = "a0000000-0000-0000-0000-000000000001";
  const branchId = "b0000000-0000-0000-0000-000000000001";

  // Create auth user
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (userError && !userError.message.includes("already been registered")) {
    return new Response(JSON.stringify({ error: userError.message }), { status: 400 });
  }

  const userId = userData?.user?.id;
  if (!userId) {
    // User already exists, look up
    const { data: existing } = await supabase.auth.admin.listUsers();
    const found = existing?.users?.find((u: any) => u.email === email);
    if (!found) return new Response(JSON.stringify({ error: "Cannot find user" }), { status: 400 });
    
    // Update profile and role for existing user
    await supabase.from("profiles").upsert({ id: found.id, tenant_id: tenantId, branch_id: branchId, email, full_name: "Test Admin" });
    await supabase.from("user_roles").upsert({ user_id: found.id, role: "super_admin" }, { onConflict: "user_id,role" });
    return new Response(JSON.stringify({ success: true, user_id: found.id, note: "existing user updated" }));
  }

  // Update profile with tenant
  await supabase.from("profiles").upsert({ id: userId, tenant_id: tenantId, branch_id: branchId, email, full_name: "Test Admin" });

  // Assign super_admin role
  await supabase.from("user_roles").insert({ user_id: userId, role: "super_admin" });

  return new Response(JSON.stringify({ success: true, user_id: userId }));
});
