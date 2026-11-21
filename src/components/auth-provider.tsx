import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
type Auth = { user: User | null; ready: boolean };
const AuthContext = createContext<Auth>({ user: null, ready: false });
export const useAuth = () => useContext(AuthContext);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const query = useQueryClient();
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (alive) {
        setUser(data.user);
        setReady(true);
      }
    };
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "INITIAL_SESSION") {
        void load();
        return;
      }
      if (!["SIGNED_IN", "SIGNED_OUT", "USER_UPDATED"].includes(event)) return;
      if (event === "SIGNED_OUT") {
        setUser(null);
        query.removeQueries({ predicate: (q) => q.queryKey[0] !== "catalog" });
        setReady(true);
      } else {
        setTimeout(() => {
          void load();
          void query.invalidateQueries();
        }, 0);
      }
      void router.invalidate();
    });
    void load();
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, [query, router]);
  return <AuthContext.Provider value={{ user, ready }}>{children}</AuthContext.Provider>;
}
