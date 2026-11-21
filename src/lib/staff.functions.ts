import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
export const getRiderWork = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: role, error: roleError } = await context.supabase.rpc("has_role", {
      uid: context.userId,
      wanted: "rider",
    });
    if (roleError || !role) throw new Error("A delivery partner account is required");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select(
        "id,customer_name,phone,address,landmark,slot,payment,items,total,status,rider_id,created_at,picked_shops,rider_earning",
      )
      .eq("rider_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error("Unable to load assigned deliveries");
    return data;
  });
export const assignRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ email: z.string().email(), role: z.enum(["rider", "admin"]) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { data: allowed } = await context.supabase.rpc("has_role", {
      uid: context.userId,
      wanted: "admin",
    });
    if (!allowed) throw new Error("Administrator access required");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let found: string | undefined;
    for (let page = 1; page <= 10; page++) {
      const result = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 100 });
      if (result.error) throw result.error;
      found = result.data.users.find(
        (u) => u.email?.toLowerCase() === data.email.toLowerCase(),
      )?.id;
      if (found || result.data.users.length < 100) break;
    }
    if (!found) throw new Error("This person needs to create an account first");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: found, role: data.role });
    if (error) throw error;
    return { success: true };
  });
