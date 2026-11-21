import { Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { ShoppingCart, IndianRupee, Truck, Wallet, Upload, Plus, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { catalogOptions } from "@/lib/catalog.functions";
import { supabase } from "@/integrations/supabase/client";
import { money, photos } from "@/lib/commerce";
import { useAdminData } from "./admin-data";
import { AdminOrders } from "./admin-orders";
export function AdminDashboard() {
  const { data } = useSuspenseQuery(catalogOptions);
  const staff = useAdminData();
  const query = useQueryClient();
  const today = staff.orders.filter(
    (o) => new Date(o.created_at).toDateString() === new Date().toDateString(),
  );
  const cash =
    staff.orders
      .filter((o) => o.status === "Delivered" && o.payment === "COD")
      .reduce((n, o) => n + o.total, 0) - staff.settlements.reduce((n, s) => n + s.amount, 0);
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>A fresh start, every day.</h1>
          <p>Here’s what’s happening in your neighbourhood today.</p>
        </div>
        <div className="admin-heading-actions">
          <Button asChild variant="promo">
            <Link to="/admin/products">
              <Upload />
              Bulk CSV price update
            </Link>
          </Button>
          <Button asChild>
            <Link to="/admin/products">
              <Plus />
              Add product
            </Link>
          </Button>
        </div>
      </div>
      <div className="kpi-grid">
        {[
          {
            label: "Today’s orders",
            value: String(today.length),
            note: `${today.filter((o) => o.status === "Delivered").length} completed today`,
            icon: ShoppingCart,
          },
          {
            label: "Today’s revenue",
            value: money(
              today.filter((o) => o.status === "Delivered").reduce((n, o) => n + o.total, 0),
            ),
            note: "From delivered orders",
            icon: IndianRupee,
          },
          {
            label: "Active riders",
            value: `${staff.riders.filter((r) => r.online).length} / ${staff.riders.length}`,
            note: `${staff.riders.filter((r) => r.online).length} online now`,
            icon: Truck,
          },
          {
            label: "Pending COD cash",
            value: money(Math.max(0, cash)),
            note: "Awaiting settlement",
            icon: Wallet,
          },
        ].map((k) => (
          <div className="kpi" key={k.label}>
            <div className="kpi-top">
              <span>{k.label}</span>
              <k.icon />
            </div>
            <strong>{k.value}</strong>
            <small>{k.note}</small>
          </div>
        ))}
      </div>
      <div className="admin-columns">
        <div>
          <AdminOrders compact />
          <section className="admin-section">
            <div className="admin-section-heading">
              <h2>Quick Daily Rate & Stock Control</h2>
              <Link to="/admin/products">All products →</Link>
            </div>
            <div className="panel">
              {data.products.slice(0, 5).map((p) => (
                <div className="quick-rate" key={p.id}>
                  <span>
                    <img src={photos[p.image_index]} alt={p.name} />
                    {p.name} ({p.unit})
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">Current price</span>
                    <input
                      key={p.price}
                      aria-label={`Quick price ${p.name}`}
                      type="number"
                      min={0}
                      defaultValue={p.price}
                      onBlur={async (e) => {
                        const price = Number(e.target.value);
                        if (price === p.price || price < 0) return;
                        const { error } = await supabase
                          .from("products")
                          .update({ price })
                          .eq("id", p.id);
                        if (error) toast.error(error.message);
                        else {
                          toast.success("Rate saved");
                          void query.invalidateQueries({ queryKey: ["catalog"] });
                        }
                      }}
                    />
                    <span className={p.in_stock ? "text-success" : "text-destructive"}>
                      {p.in_stock ? <CheckCircle size={13} /> : "Out"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
        <div className="admin-right">
          <RiderCash />
          <section className="admin-section">
            <div className="admin-section-heading">
              <h2>Delivery overview</h2>
            </div>
            <div className="panel">
              <div className="delivery-overview">
                <Truck />
                <strong>{staff.orders.filter((o) => o.status === "Picked up").length}</strong>
                <p>Orders out for delivery</p>
                <span>Hata, Kushinagar · 274203</span>
              </div>
              <Link to="/admin/orders" className="text-primary text-xs font-semibold">
                Open live dispatch →
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
export function RiderCash() {
  const staff = useAdminData();
  const query = useQueryClient();
  async function settle(riderId: string, amount: number) {
    if (amount <= 0) {
      toast("No pending COD cash");
      return;
    }
    if (!window.confirm(`Confirm receipt of ${money(amount)} cash?`)) return;
    const { error } = await supabase.from("cod_settlements").insert({ rider_id: riderId, amount });
    if (error) toast.error(error.message);
    else {
      toast.success("Cash settlement recorded");
      void query.invalidateQueries({ queryKey: ["admin-settlements"] });
    }
  }
  return (
    <section className="admin-section">
      <div className="admin-section-heading">
        <h2>Rider COD Cash & Status</h2>
      </div>
      <div className="panel">
        {staff.riders.length === 0 ? (
          <p className="py-5 text-xs text-muted-foreground">No approved delivery partners yet.</p>
        ) : (
          staff.riders.map((r) => {
            const cash =
              staff.orders
                .filter(
                  (o) => o.rider_id === r.id && o.status === "Delivered" && o.payment === "COD",
                )
                .reduce((n, o) => n + o.total, 0) -
              staff.settlements
                .filter((s) => s.rider_id === r.id)
                .reduce((n, s) => n + s.amount, 0);
            return (
              <div className="rider-status-row" key={r.id}>
                <span>{r.display_name.slice(0, 2).toUpperCase() || "BK"}</span>
                <div>
                  <strong>{r.display_name || "Partner"}</strong>
                  <small>
                    <span className={r.online ? "text-success" : "text-muted-foreground"}>
                      ● {r.online ? "Online" : "Offline"}
                    </span>{" "}
                    · COD: {money(Math.max(0, cash))}
                  </small>
                </div>
                <Button
                  size="sm"
                  className="text-[9px] px-2 h-7"
                  onClick={() => settle(r.id, cash)}
                  disabled={cash <= 0}
                >
                  Settle cash
                </Button>
              </div>
            );
          })
        )}
        <Link to="/admin/riders" className="text-primary text-xs font-semibold block mt-4">
          Manage partners →
        </Link>
      </div>
    </section>
  );
}
