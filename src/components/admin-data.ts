import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
export function useAdminData() {
  const query = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel(`admin-orders-${Math.random()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        void query.invalidateQueries({ queryKey: ["admin-orders"] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [query]);
  const orders = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });
  const profiles = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data;
    },
  });
  const roles = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data;
    },
  });
  const settlements = useQuery({
    queryKey: ["admin-settlements"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cod_settlements").select("*");
      if (error) throw error;
      return data;
    },
  });
  return {
    orders: orders.data ?? [],
    riders: (profiles.data ?? []).filter((p) =>
      (roles.data ?? []).some((r) => r.user_id === p.id && r.role === "rider"),
    ),
    profiles: profiles.data ?? [],
    settlements: settlements.data ?? [],
    loading: orders.isLoading,
    error: orders.error,
  };
}
