import { useState, type ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Home,
  Clock,
  Wallet,
  UserRound,
  Bell,
  ArrowLeft,
  Truck,
  IndianRupee,
  Star,
  ClipboardList,
  Headphones,
  MoreHorizontal,
  MapPin,
  Phone,
  Navigation,
  CheckCircle,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "./auth-provider";
import { AuthForm } from "./customer-account";
import { Brand, Empty } from "./shop-shared";
import { getRiderWork } from "@/lib/staff.functions";
import riderArt from "@/assets/delivery-rider.asset.json";
import { money, shortId, lines, riderEarnings } from "@/lib/commerce";
export function useStaffRole(role: "admin" | "rider") {
  const { user, ready } = useAuth();
  return useQuery({
    queryKey: ["role", role, user?.id],
    enabled: ready && !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_role", { uid: user?.id ?? "", wanted: role });
      if (error) throw error;
      return data;
    },
  });
}
function RiderShell({ children, title }: { children: ReactNode; title?: string }) {
  const path = useLocation().pathname;
  return (
    <div className="shop-app rider-app">
      <header className="shop-header">
        <div className="page-title">
          {title ? (
            <>
              <Button asChild variant="ghost" size="icon">
                <Link to="/rider">
                  <ArrowLeft />
                </Link>
              </Button>
              <h1>{title}</h1>
            </>
          ) : (
            <Brand small />
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delivery updates"
            onClick={() => toast("Your assigned deliveries appear on the home screen.")}
          >
            <Bell />
          </Button>
        </div>
      </header>
      <main className="store-content">{children}</main>
      <nav className="bottom-nav">
        {[
          { to: "/rider" as const, label: "Home", icon: Home },
          { to: "/rider/earnings" as const, label: "History", icon: Clock },
          { to: "/rider/earnings" as const, label: "Wallet", icon: Wallet },
          { to: "/rider/profile" as const, label: "Profile", icon: UserRound },
        ].map((n) => (
          <Link key={n.label} to={n.to} className={path === n.to ? "active" : ""}>
            <n.icon />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
export function RiderPortal({
  view = "home",
  id,
}: {
  view?: "home" | "earnings" | "profile" | "order" | "login";
  id?: string;
}) {
  const { user, ready } = useAuth();
  const role = useStaffRole("rider");
  const work = useServerFn(getRiderWork);
  const query = useQueryClient();
  const [online, setOnline] = useState(false);
  const [period, setPeriod] = useState("Today");
  const [checks, setChecks] = useState<string[]>([]);
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id ?? "")
        .single();
      if (error) throw error;
      setOnline(data.online);
      return data;
    },
  });
  const {
    data: orders = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["rider-work", user?.id],
    enabled: !!role.data,
    queryFn: () => work(),
    refetchInterval: 15000,
  });
  const { data: settlements = [] } = useQuery({
    queryKey: ["rider-settlements", user?.id],
    enabled: !!role.data,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cod_settlements")
        .select("*")
        .eq("rider_id", user?.id ?? "")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const delivered = orders.filter((o) => o.status === "Delivered");
  const cash =
    delivered.filter((o) => o.payment === "COD").reduce((n, o) => n + o.total, 0) -
    settlements.reduce((n, s) => n + s.amount, 0);
  const active = orders.filter((o) => !["Delivered", "Cancelled"].includes(o.status));
  const order = orders.find((o) => o.id === id);
  async function duty() {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ online: !online }).eq("id", user.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setOnline(!online);
    toast.success(online ? "You are now offline" : "You are on duty");
  }
  async function update() {
    if (!order) return;
    setBusy(true);
    const next = order.status === "Confirmed" ? "Picked up" : "Delivered";
    const { error } = await supabase.rpc("rider_update", {
      order_id: order.id,
      next_status: next,
      code: otp,
      shops: checks,
    });
    if (error) toast.error(error.message);
    else {
      toast.success(
        next === "Delivered"
          ? "Delivery completed! Great job!"
          : "Pickup confirmed. Start your delivery",
      );
      void query.invalidateQueries({ queryKey: ["rider-work"] });
    }
    setBusy(false);
  }
  const title =
    view === "earnings"
      ? "Earnings"
      : view === "profile"
        ? "Profile"
        : view === "order"
          ? "Order details"
          : undefined;
  return (
    <RiderShell {...(title ? { title } : {})}>
      {!ready || role.isLoading ? (
        <p className="py-12 text-center text-sm">Loading partner account…</p>
      ) : !user ? (
        <>
          <div className="rider-login-brand">
            <Brand />
            <h1>Delivery Partner</h1>
            <p>Deliver faster. Earn more.</p>
            <img src={riderArt.url} alt="Brothers Kart delivery partner on a purple scooter" />
          </div>
          <AuthForm />
        </>
      ) : !role.data ? (
        <Empty icon={ShieldCheck} title="Delivery partner access">
          <p>
            Your account needs approval from the Brothers Kart administrator before you can receive
            deliveries.
          </p>
          <Button asChild variant="outline">
            <Link to="/account">My account</Link>
          </Button>
        </Empty>
      ) : view === "profile" ? (
        <>
          <div className="auth-heading">
            <UserRound />
            <h2>{profile?.display_name || "Delivery partner"}</h2>
            <p>Partner ID: {user.id.slice(0, 8).toUpperCase()}</p>
            <span className="status Delivered mt-3">
              <ShieldCheck size={12} />
              Verified partner
            </span>
          </div>
          <div className="panel">
            <h2>My performance</h2>
            <div className="bill-row">
              <span>Completed deliveries</span>
              <strong>{delivered.length}</strong>
            </div>
            <div className="bill-row">
              <span>Cash in hand</span>
              <strong>{money(Math.max(0, cash))}</strong>
            </div>
          </div>
          <Button asChild variant="outline" className="w-full mb-4">
            <Link to="/account">Edit personal details</Link>
          </Button>
          <Button variant="outline" className="w-full" onClick={() => supabase.auth.signOut()}>
            <LogOut />
            Logout
          </Button>
        </>
      ) : view === "earnings" ? (
        <>
          <div className="filter-row">
            {["Today", "This Week", "This Month"].map((p) => (
              <Button
                key={p}
                variant={p === period ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod(p)}
              >
                {p}
              </Button>
            ))}
          </div>
          <div className="panel">
            <h2>Total earnings</h2>
            <strong className="text-4xl font-extrabold">
              {money(
                delivered
                  .filter((o) => {
                    const days = (Date.now() - new Date(o.created_at).getTime()) / 86400000;
                    return period === "Today"
                      ? new Date(o.created_at).toDateString() === new Date().toDateString()
                      : days < (period === "This Week" ? 7 : 31);
                  })
                  .reduce((n, o) => n + o.rider_earning, 0),
              )}
            </strong>
            <p className="text-xs text-muted-foreground mt-4">₹10 for every completed delivery.</p>
          </div>
          <div className="panel">
            <h2>COD settlement history</h2>
            {settlements.length ? (
              settlements.map((s) => (
                <div key={s.id} className="bill-row">
                  <span>{new Date(s.created_at).toLocaleDateString("en-IN")}</span>
                  <strong>{money(s.amount)}</strong>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No settlements yet.</p>
            )}
          </div>
          <div className="section-heading">
            <h2>Completed deliveries</h2>
          </div>
          {delivered.map((o) => (
            <Link to="/rider/order/$id" params={{ id: o.id }} className="order-card" key={o.id}>
              <div className="order-card-header">
                <h3>{shortId(o.id)}</h3>
                <span className="status Delivered">Completed</span>
              </div>
              <p>
                {o.customer_name} · {money(o.total)}
              </p>
            </Link>
          ))}
        </>
      ) : view === "order" ? (
        order ? (
          <>
            <span className="order-number">Order #{shortId(order.id)}</span>
            {order.status === "Delivered" ? (
              <div className="auth-heading">
                <CheckCircle className="text-success" />
                <h2>Delivery Completed!</h2>
                <p>Great job! Another happy neighbour.</p>
                <div className="earned-reward">
                  <span>You earned</span>
                  <strong>{money(order.rider_earning)}</strong>
                </div>
                <Button asChild variant="promo" className="mt-6">
                  <Link to="/rider">Go to Home</Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="panel">
                  <h2>
                    <MapPin size={15} className="inline text-success mr-2" />
                    Pick up
                  </h2>
                  <p className="text-sm font-semibold">Brothers Kart · Local shops</p>
                  <p className="text-xs text-muted-foreground mt-1">Hata, Kushinagar</p>
                  <div className="mt-4">
                    {[
                      ...new Set(
                        lines(order.items).map((i) =>
                          ["tomato", "potato", "carrot", "spinach", "cauliflower"].includes(i.id)
                            ? "Gupta Vegetable Store"
                            : "Sharma General Store",
                        ),
                      ),
                    ].map((shop) => (
                      <label className="check-row" key={shop}>
                        <input
                          type="checkbox"
                          checked={checks.includes(shop)}
                          onChange={(e) =>
                            setChecks(
                              e.target.checked
                                ? [...checks, shop]
                                : checks.filter((s) => s !== shop),
                            )
                          }
                        />
                        {shop}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="panel">
                  <h2>
                    <MapPin size={15} className="inline text-destructive mr-2" />
                    Drop location
                  </h2>
                  <p className="font-semibold text-sm">{order.customer_name}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {order.address}
                    <br />
                    {order.landmark}
                  </p>
                  <div className="flex gap-2 mt-4">
                    <Button asChild variant="outline" size="sm">
                      <a href={`tel:${order.phone}`}>
                        <Phone />
                        Call customer
                      </a>
                    </Button>
                    <Button asChild size="sm">
                      <a
                        target="_blank"
                        rel="noreferrer"
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.address + ", Hata Kushinagar 274203")}`}
                      >
                        <Navigation />
                        Navigate
                      </a>
                    </Button>
                  </div>
                </div>
                <div className="panel">
                  <h2>Order items</h2>
                  {lines(order.items).map((i) => (
                    <div key={i.id} className="bill-row">
                      <span>
                        {i.name} × {i.quantity}
                      </span>
                      <strong>{money(i.price * i.quantity)}</strong>
                    </div>
                  ))}
                  <div className="bill-row bill-total">
                    <span>Collect {order.payment === "COD" ? "cash" : "UPI"}</span>
                    <strong>{money(order.total)}</strong>
                  </div>
                </div>
                {order.status === "Picked up" && (
                  <label className="field">
                    Customer delivery OTP
                    <input
                      placeholder="4-digit OTP"
                      inputMode="numeric"
                      maxLength={4}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                  </label>
                )}
                <Button
                  className="w-full"
                  size="lg"
                  disabled={
                    busy ||
                    (order.status === "Confirmed" &&
                      checks.length <
                        new Set(
                          lines(order.items).map((i) =>
                            ["tomato", "potato", "carrot", "spinach", "cauliflower"].includes(i.id)
                              ? "Gupta Vegetable Store"
                              : "Sharma General Store",
                          ),
                        ).size) ||
                    !["Confirmed", "Picked up"].includes(order.status)
                  }
                  onClick={update}
                >
                  {order.status === "Picked up" ? "Complete delivery" : "Start delivery"}
                </Button>
              </>
            )}
          </>
        ) : (
          <Empty title={isLoading ? "Loading delivery…" : "Delivery not found"} />
        )
      ) : (
        <>
          <div className="rider-greeting">
            <h1>Hello {profile?.display_name?.split(" ")[0] || "Partner"} 👋</h1>
            <p className="mt-1 font-semibold text-foreground">Keep going!</p>
          </div>
          <div className={`online-bar ${online ? "is-online" : ""}`}>
            <span>
              <span />
              {online ? "You are Online" : "You are Offline"}
            </span>
            <Button variant="ghost" size="sm" aria-label="Toggle online status" onClick={duty}>
              <span className="duty-switch">
                <span />
              </span>
            </Button>
          </div>
          <div className="rider-earnings panel">
            <h2>Today’s earnings</h2>
            <strong>
              {money(
                riderEarnings(
                  orders.filter(
                    (o) => new Date(o.created_at).toDateString() === new Date().toDateString(),
                  ),
                ),
              )}
            </strong>
            <div className="mini-bars">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className="rider-stat-row">
            <span>
              <ClipboardList />
              <strong>{orders.length}</strong>
              <small>Orders</small>
            </span>
            <span>
              <Wallet />
              <strong>{money(Math.max(0, cash))}</strong>
              <small>COD cash</small>
            </span>
            <span>
              <ShieldCheck />
              <strong>Verified</strong>
              <small>Partner</small>
            </span>
          </div>
          <Button variant="promo" className="w-full mt-4" onClick={duty}>
            {online ? "Go Off Duty" : "Go On Duty"}
          </Button>
          <div className="section-heading">
            <h2>Quick access</h2>
          </div>
          <div className="quick-access">
            <Button asChild variant="ghost">
              <Link to="/rider">
                <ClipboardList />
                Orders
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/rider/earnings">
                <IndianRupee />
                Earnings
              </Link>
            </Button>
            <Button
              variant="ghost"
              onClick={() => toast("For delivery support, contact your dispatcher.")}
            >
              <Headphones />
              Support
            </Button>
            <Button asChild variant="ghost">
              <Link to="/rider/profile">
                <MoreHorizontal />
                More
              </Link>
            </Button>
          </div>
          <div className="section-heading">
            <h2>Assigned deliveries</h2>
            <span className="status">{active.length} active</span>
          </div>
          {error ? (
            <p className="text-xs text-destructive">Unable to load deliveries. Please try again.</p>
          ) : active.length === 0 ? (
            <Empty icon={Truck} title="Ready for your next delivery">
              <p>
                {online
                  ? "Your dispatcher will assign new orders here."
                  : "Go on duty to let your dispatcher know you’re ready."}
              </p>
            </Empty>
          ) : (
            active.map((o) => (
              <Link to="/rider/order/$id" params={{ id: o.id }} className="order-card" key={o.id}>
                <div className="order-card-header">
                  <h3>{shortId(o.id)}</h3>
                  <span className="status">{o.status}</span>
                </div>
                <p>
                  <MapPin size={12} className="inline" /> {o.customer_name} · {o.address}
                </p>
                <p className="font-semibold text-foreground mt-3">
                  {money(o.total)} · {o.payment} →
                </p>
              </Link>
            ))
          )}
        </>
      )}
    </RiderShell>
  );
}
