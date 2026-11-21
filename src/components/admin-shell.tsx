import { useState, type ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Store,
  Truck,
  Settings,
  Menu,
  Bell,
  LogOut,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "./auth-provider";
import { useStaffRole } from "./rider-portal";
import { AuthForm } from "./customer-account";
import { Brand } from "./shop-shared";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
// Temporary: sign-in screens hidden so the owner can preview panels. Data still requires a staff login (RLS).
export const PREVIEW_OPEN = true;
export const adminNav = [
  { to: "/admin" as const, label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/orders" as const, label: "Live orders", icon: ShoppingCart },
  { to: "/admin/products" as const, label: "Products & rates", icon: Package },
  { to: "/admin/vendors" as const, label: "Vendor hisaab", icon: Store },
  { to: "/admin/riders" as const, label: "Riders & dispatch", icon: Truck },
  { to: "/admin/settings" as const, label: "Settings", icon: Settings },
];
export function AdminShell({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const role = useStaffRole("admin");
  const path = useLocation().pathname;
  const [open, setOpen] = useState(false);
  return (
    <div className="admin-app">
      <aside className={`admin-sidebar ${open ? "open" : ""}`}>
        <Brand />
        <p>HATA’S HYPERLOCAL DELIVERY</p>
        <nav className="admin-nav">
          {adminNav.map((n) => (
            <Link
              to={n.to}
              key={n.to}
              className={path === n.to ? "active" : ""}
              onClick={() => setOpen(false)}
            >
              <n.icon />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link to="/">
            <ArrowLeft />
            Back to storefront
          </Link>
          <p className="mt-5 opacity-60">Brothers Kart · Hata, Kushinagar</p>
        </div>
      </aside>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="admin-body">
        <header className="admin-topbar">
          <Button
            variant="ghost"
            size="icon"
            className="admin-menu-button"
            aria-label="Open admin navigation"
            onClick={() => setOpen(!open)}
          >
            <Menu />
          </Button>
          <div>
            <h2>Admin Dashboard — Hata, Kushinagar</h2>
            <p className="text-success">
              <span className="status-dot inline-block mr-1" />
              Live
            </p>
          </div>
          <div className="admin-user">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              onClick={() => setOpen(false)}
            >
              <Bell />
            </Button>
            <div className="admin-avatar">{user?.email?.slice(0, 2).toUpperCase() ?? "BK"}</div>
            <span>
              Administrator<small>Brothers Kart</small>
            </span>
            {user && (
              <Button
                variant="ghost"
                size="icon"
                title="Sign out"
                onClick={() => supabase.auth.signOut()}
              >
                <LogOut />
              </Button>
            )}
          </div>
        </header>
        <main className="admin-content">
          {!PREVIEW_OPEN && (!ready || role.isLoading) ? (
            <div className="access-panel">
              <p>Checking account access…</p>
            </div>
          ) : !PREVIEW_OPEN && !user ? (
            <div className="access-panel">
              <Brand />
              <AuthForm />
            </div>
          ) : !PREVIEW_OPEN && !role.data ? (
            <div className="access-panel">
              <ShieldCheck />
              <h1>Administrator access required</h1>
              <p>
                This account is not an administrator. Only approved administrators can view orders,
                prices and shop accounts.
              </p>
              <Button asChild>
                <Link to="/account">Back to my account</Link>
              </Button>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
