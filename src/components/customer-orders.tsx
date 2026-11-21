import { useEffect, useState } from "react";
import { useQuery, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Truck, Tag, ShieldCheck, Check, Package, MapPin, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/store/cart";
import { catalogOptions } from "@/lib/catalog.functions";
import { calculateBill, money, photos, shortId, lines } from "@/lib/commerce";
import { Button } from "@/components/ui/button";
import { ShopShell, Stepper, Empty } from "./shop-shared";
import { useAuth } from "./auth-provider";
export function CartPage() {
  const { data } = useSuspenseQuery(catalogOptions);
  const cart = useCart();
  const [ready, setReady] = useState(false);
  const [code, setCode] = useState(cart.coupon);
  useEffect(() => setReady(true), []);
  const bill = calculateBill(cart.items, data.settings, cart.coupon);
  return (
    <ShopShell title="Your cart">
      <div className="store-content">
        {!ready ? (
          <p className="py-10 text-center text-sm">Loading cart…</p>
        ) : cart.items.length === 0 ? (
          <Empty title="Your cart feels a little lonely">
            <p>Fill it with something fresh from your neighbourhood.</p>
            <Button asChild>
              <Link to="/">
                Start shopping <ShoppingBag />
              </Link>
            </Button>
          </Empty>
        ) : (
          <>
            <div className="delivery-progress">
              <span>
                <Truck />
                {bill.remaining > 0 ? (
                  <>Add {money(bill.remaining)} more for FREE delivery</>
                ) : (
                  "Yay! You’ve unlocked FREE delivery"
                )}
              </span>
              <progress
                max={data.settings.free_delivery}
                value={Math.min(bill.subtotal, data.settings.free_delivery)}
              />
            </div>
            <div className="panel">
              <h2>Fresh picks ({cart.items.reduce((n, i) => n + i.quantity, 0)} items)</h2>
              {cart.items.map((i) => (
                <div className="cart-row" key={i.id}>
                  <img src={photos[i.image_index]} alt={i.name} />
                  <div>
                    <h3>{i.name}</h3>
                    <p>{i.unit}</p>
                    <strong>{money(i.price * i.quantity)}</strong>
                  </div>
                  <Stepper product={i} />
                </div>
              ))}
            </div>
            <div className="panel">
              <h2 className="flex items-center gap-2">
                <Tag size={15} />
                Have a coupon?
              </h2>
              <div className="coupon-field">
                <input
                  className="plain-input"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter coupon code"
                />
                <Button
                  onClick={() => {
                    if (code.toUpperCase() !== data.settings.coupon_code) {
                      toast.error("This coupon is not valid");
                      return;
                    }
                    if (bill.subtotal < data.settings.coupon_minimum) {
                      toast.error(`Minimum order ${money(data.settings.coupon_minimum)}`);
                      return;
                    }
                    cart.setCoupon(code.toUpperCase());
                    toast.success("Coupon applied");
                  }}
                >
                  Apply
                </Button>
              </div>
              {cart.coupon && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    cart.setCoupon("");
                    setCode("");
                  }}
                >
                  Remove {cart.coupon}
                </Button>
              )}
            </div>
            <div className="panel">
              <h2>Bill details</h2>
              <Bill bill={bill} />
            </div>
            <Button asChild size="lg" className="w-full">
              <Link to="/checkout">
                Proceed to checkout <span className="ml-auto">{money(bill.total)} →</span>
              </Link>
            </Button>
            <p className="cart-footer">
              <ShieldCheck size={11} className="inline mr-1" />
              No hidden charges. Just honest local prices.
            </p>
          </>
        )}
      </div>
    </ShopShell>
  );
}
export function Bill({ bill }: { bill: ReturnType<typeof calculateBill> }) {
  return (
    <>
      <div className="bill-row">
        <span>Items total</span>
        <span>{money(bill.subtotal)}</span>
      </div>
      <div className="bill-row">
        <span>Delivery charge</span>
        <span className={bill.delivery === 0 ? "text-success" : ""}>
          {bill.delivery === 0 ? "FREE" : money(bill.delivery)}
        </span>
      </div>
      {bill.discount > 0 && (
        <div className="bill-row text-success">
          <span>Coupon savings</span>
          <span>−{money(bill.discount)}</span>
        </div>
      )}
      <div className="bill-row bill-total">
        <span>To pay</span>
        <span>{money(bill.total)}</span>
      </div>
    </>
  );
}
const checkoutSchema = z.object({
  name: z.string().min(2),
  phone: z.string().regex(/^\d{10}$/, "Enter a 10-digit mobile number"),
  address: z.string().min(5),
  landmark: z.string(),
  slot: z.string(),
  payment: z.enum(["COD", "UPI"]),
});
export function CheckoutPage() {
  const { user } = useAuth();
  const cart = useCart();
  const { data } = useSuspenseQuery(catalogOptions);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
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
      return data;
    },
  });
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const form = new FormData(e.currentTarget);
    const details = checkoutSchema.safeParse(Object.fromEntries(form));
    if (!details.success) {
      toast.error(details.error.errors[0]?.message ?? "Check your details");
      return;
    }
    setBusy(true);
    const { data: id, error } = await supabase.rpc("place_order", {
      details: details.data,
      cart: cart.items.map((i) => ({ id: i.id, quantity: i.quantity })),
      coupon: cart.coupon,
    });
    if (error) {
      toast.error(error.message);
      setBusy(false);
      return;
    }
    cart.clear();
    toast.success("Your order is placed!");
    await navigate({ to: "/track/$orderId", params: { orderId: id } });
  }
  return (
    <ShopShell title="Checkout">
      <div className="store-content">
        {!user ? (
          <Empty title="Sign in to place your order">
            <p>Your cart will be waiting right here.</p>
            <Button asChild>
              <Link to="/account">Sign in</Link>
            </Button>
          </Empty>
        ) : cart.items.length === 0 ? (
          <Empty title="Your cart is empty">
            <Button asChild>
              <Link to="/">Shop fresh</Link>
            </Button>
          </Empty>
        ) : (
          <form onSubmit={submit}>
            <div className="panel" key={profile?.id}>
              <h2 className="flex gap-2">
                <MapPin size={16} />
                Delivery address
              </h2>
              <label className="field">
                Full name
                <input required name="name" defaultValue={profile?.display_name} />
              </label>
              <label className="field">
                Mobile number
                <input
                  required
                  name="phone"
                  pattern="[0-9]{10}"
                  inputMode="numeric"
                  defaultValue={profile?.phone}
                />
              </label>
              <label className="field">
                House, street & locality
                <textarea required name="address" minLength={5} defaultValue={profile?.address} />
              </label>
              <label className="field">
                Nearby landmark
                <input
                  name="landmark"
                  defaultValue={profile?.landmark}
                  placeholder="Near temple, school or shop"
                />
              </label>
              <p className="text-xs text-muted-foreground">
                Hata, Kushinagar, Uttar Pradesh · 274203
              </p>
            </div>
            <div className="panel">
              <h2>Delivery time</h2>
              <label className="field">
                <select name="slot">
                  <option>As soon as possible</option>
                  <option>Today, 6–8 PM</option>
                  <option>Tomorrow, 8–10 AM</option>
                </select>
              </label>
            </div>
            <div className="panel">
              <h2>Payment on delivery</h2>
              <label className="check-row">
                <input type="radio" name="payment" value="COD" defaultChecked />
                Cash on delivery
              </label>
              <label className="check-row">
                <input type="radio" name="payment" value="UPI" />
                UPI on delivery
              </label>
            </div>
            <div className="panel">
              <h2>Order summary</h2>
              <Bill bill={calculateBill(cart.items, data.settings, cart.coupon)} />
            </div>
            <Button size="lg" disabled={busy} className="w-full">
              {busy ? "Placing order…" : "Place order"}
              <Truck />
            </Button>
            <p className="cart-footer">Pay only when your groceries arrive.</p>
          </form>
        )}
      </div>
    </ShopShell>
  );
}
export function TrackingPage({ orderId }: { orderId: string }) {
  const { user } = useAuth();
  const query = useQueryClient();
  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["order", orderId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").eq("id", orderId).single();
      if (error) throw error;
      return data;
    },
  });
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`track-${orderId}-${Math.random()}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        () => {
          void query.invalidateQueries({ queryKey: ["order", orderId] });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [orderId, query, user]);
  const steps = ["Placed", "Confirmed", "Picked up", "Delivered"];
  const active = steps.indexOf(order?.status ?? "");
  return (
    <ShopShell title="Track order">
      <div className="store-content">
        {!user ? (
          <Empty title="Sign in to view your order">
            <Button asChild>
              <Link to="/account">Sign in</Link>
            </Button>
          </Empty>
        ) : isLoading ? (
          <p className="py-10 text-center text-sm">Finding your order…</p>
        ) : error || !order ? (
          <Empty title="Order unavailable" />
        ) : (
          <>
            <div className="auth-heading">
              <Truck />
              <h2>
                {order.status === "Delivered"
                  ? "Delivered with love"
                  : order.status === "Cancelled"
                    ? "Order cancelled"
                    : "Freshness is on its way"}
              </h2>
              <p>
                {shortId(order.id)} · {order.slot}
              </p>
            </div>
            <div className="panel">
              <h2>
                Order updates <span className="status ml-2">Live</span>
              </h2>
              <div className="tracking-steps">
                {steps.map((step, i) => (
                  <div key={step} className={`tracking-step ${i <= active ? "complete" : ""}`}>
                    <span>{i <= active ? <Check /> : <Package />}</span>
                    <div>
                      <h3>{step}</h3>
                      <p>
                        {
                          [
                            "Your order reached our local team",
                            "Your fresh picks are being packed",
                            "Your partner is on the way",
                            "Enjoy your neighbourhood essentials",
                          ][i]
                        }
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {order.status !== "Delivered" && order.status !== "Cancelled" && (
              <div className="panel">
                <h2>Your delivery OTP</h2>
                <div className="otp-display">
                  {order.otp.split("").map((n, i) => (
                    <span key={i}>{n}</span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Share only when you receive your order.
                </p>
              </div>
            )}
            <div className="panel">
              <h2>Delivering to</h2>
              <p className="text-sm font-semibold">{order.customer_name}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {order.address}
                <br />
                {order.landmark}
                <br />
                Hata · 274203
              </p>
            </div>
            <div className="panel">
              <h2>Your fresh picks</h2>
              {lines(order.items).map((i) => (
                <div className="bill-row" key={i.id}>
                  <span>
                    {i.name} × {i.quantity}
                  </span>
                  <span>{money(i.price * i.quantity)}</span>
                </div>
              ))}
              <Bill
                bill={{
                  subtotal: order.subtotal,
                  delivery: order.delivery_fee,
                  discount: order.discount,
                  total: order.total,
                  remaining: 0,
                }}
              />
              <p className="text-xs text-muted-foreground mt-3">
                {order.payment === "COD" ? "Cash" : "UPI"} on delivery
              </p>
            </div>
          </>
        )}
      </div>
    </ShopShell>
  );
}
