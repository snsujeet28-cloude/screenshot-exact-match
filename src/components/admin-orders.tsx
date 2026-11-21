import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Printer, X, MessageCircle, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { money, shortId, lines, type Order, type Line } from "@/lib/commerce";
import { Brand } from "./shop-shared";
import { useAdminData } from "./admin-data";
export function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={close}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-heading">
          <h2>{title}</h2>
          <Button variant="ghost" size="icon" aria-label="Close" onClick={close}>
            <X />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function AdminOrders({ compact = false }: { compact?: boolean }) {
  const data = useAdminData();
  const query = useQueryClient();
  const [selected, setSelected] = useState<Order | null>(null);
  const [edit, setEdit] = useState<Order | null>(null);
  const [filter, setFilter] = useState("Active");
  const orders = data.orders.filter((o) =>
    compact || filter === "Active"
      ? !["Delivered", "Cancelled"].includes(o.status)
      : filter === "All" || o.status === filter,
  );
  async function update(id: string, patch: { status?: string; rider_id?: string }) {
    const { error } = await supabase.from("orders").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Order updated");
      void query.invalidateQueries({ queryKey: ["admin-orders"] });
    }
  }
  return (
    <section className="admin-section">
      {compact ? (
        <div className="admin-section-heading">
          <h2>
            Live Orders & Rider Dispatch <span className="status">{orders.length}</span>
          </h2>
          <Link to="/admin/orders">View all →</Link>
        </div>
      ) : (
        <div className="admin-heading">
          <div>
            <h1>Orders & dispatch</h1>
            <p>Fresh picks. Seamless deliveries. Happy neighbours.</p>
          </div>
          <select
            className="plain-input max-w-40"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {["Active", "All", "Delivered", "Cancelled"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </div>
      )}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ORDER ID</th>
              <th>CUSTOMER & LOCATION</th>
              <th>BILL & METHOD</th>
              <th>STATUS</th>
              <th>ASSIGNED RIDER</th>
              {!compact && <th>ACTIONS</th>}
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>
                  <strong>{shortId(o.id)}</strong>
                  <small>
                    {new Date(o.created_at).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </small>
                </td>
                <td>
                  <strong>{o.customer_name}</strong>
                  <small>{o.address}</small>
                </td>
                <td>
                  <strong>{money(o.total)}</strong>
                  <small>{o.payment}</small>
                </td>
                <td>
                  <select
                    value={o.status}
                    aria-label={`Status ${shortId(o.id)}`}
                    onChange={(e) => update(o.id, { status: e.target.value })}
                  >
                    {["Placed", "Confirmed", "Picked up", "Delivered", "Cancelled"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    value={o.rider_id ?? ""}
                    aria-label={`Assign rider ${shortId(o.id)}`}
                    onChange={(e) => {
                      if (e.target.value)
                        void update(o.id, {
                          rider_id: e.target.value,
                          status: o.status === "Placed" ? "Confirmed" : o.status,
                        });
                    }}
                  >
                    <option value="">Assign rider</option>
                    {data.riders.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.display_name || r.phone || r.id.slice(0, 8)}
                      </option>
                    ))}
                  </select>
                </td>
                {!compact && (
                  <td>
                    <div className="actions">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Edit active order"
                        disabled={["Delivered", "Cancelled"].includes(o.status)}
                        onClick={() => setEdit(o)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Customer bill"
                        onClick={() => setSelected(o)}
                      >
                        <Printer />
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="admin-empty">
            {data.loading
              ? "Loading orders…"
              : data.error
                ? "Could not load orders. Please refresh."
                : "No orders here yet. New customer orders will appear live."}
          </div>
        )}
      </div>
      {selected && (
        <Modal title="Customer bill" close={() => setSelected(null)}>
          <Receipt order={selected} />
        </Modal>
      )}
      {edit && (
        <Modal title={`Edit ${shortId(edit.id)}`} close={() => setEdit(null)}>
          <EditOrder order={edit} close={() => setEdit(null)} />
        </Modal>
      )}
    </section>
  );
}
function EditOrder({ order, close }: { order: Order; close: () => void }) {
  const [items, setItems] = useState<Line[]>(lines(order.items));
  const [fee, setFee] = useState(order.delivery_fee);
  const [discount, setDiscount] = useState(order.discount);
  const [address, setAddress] = useState(order.address);
  const [busy, setBusy] = useState(false);
  const query = useQueryClient();
  async function save() {
    const subtotal = items.reduce((n, i) => n + i.price * i.quantity, 0);
    if (items.length === 0 || discount > subtotal || fee < 0 || discount < 0) {
      toast.error("Check items, delivery fee and discount");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("orders")
      .update({
        items,
        subtotal,
        delivery_fee: fee,
        discount,
        total: subtotal + fee - discount,
        address,
      })
      .eq("id", order.id)
      .in("status", ["Placed", "Confirmed", "Picked up"]);
    if (error) toast.error(error.message);
    else {
      toast.success("Order and bill updated");
      void query.invalidateQueries({ queryKey: ["admin-orders"] });
      close();
    }
    setBusy(false);
  }
  return (
    <>
      <label className="field">
        Delivery address
        <textarea value={address} onChange={(e) => setAddress(e.target.value)} />
      </label>
      {items.map((item) => (
        <div className="cart-row" key={item.id}>
          <div className="flex-1">
            <h3>{item.name}</h3>
            <p>
              {money(item.price)} / {item.unit}
            </p>
          </div>
          <input
            className="plain-input max-w-20"
            type="number"
            min={0}
            max={99}
            aria-label={`Quantity ${item.name}`}
            value={item.quantity}
            onChange={(e) =>
              setItems(
                items
                  .map((i) =>
                    i.id === item.id
                      ? { ...i, quantity: Math.max(0, Math.min(99, Number(e.target.value))) }
                      : i,
                  )
                  .filter((i) => i.quantity > 0),
              )
            }
          />
        </div>
      ))}
      <div className="grid grid-cols-2 gap-4 mt-5">
        <label className="field">
          Delivery fee
          <input
            type="number"
            min={0}
            value={fee}
            onChange={(e) => setFee(Number(e.target.value))}
          />
        </label>
        <label className="field">
          Discount
          <input
            type="number"
            min={0}
            value={discount}
            onChange={(e) => setDiscount(Number(e.target.value))}
          />
        </label>
      </div>
      <div className="bill-row bill-total">
        <span>Revised total</span>
        <strong>
          {money(items.reduce((n, i) => n + i.price * i.quantity, 0) + fee - discount)}
        </strong>
      </div>
      <Button disabled={busy} className="w-full mt-4" onClick={save}>
        <Save />
        Save changes
      </Button>
    </>
  );
}
function Receipt({ order }: { order: Order }) {
  const text = `Brothers Kart • Hata, Kushinagar 274203\nBill ${shortId(order.id)}\n${order.customer_name}\n${lines(
    order.items,
  )
    .map((i) => `${i.name} x ${i.quantity}: ${money(i.price * i.quantity)}`)
    .join(
      "\n",
    )}\nItems: ${money(order.subtotal)}\nDelivery: ${money(order.delivery_fee)}\nDiscount: ${money(order.discount)}\nTotal: ${money(order.total)} (${order.payment})\nThank you for shopping local!`;
  return (
    <>
      <div className="receipt">
        <Brand />
        <p>Hata, Kushinagar, Uttar Pradesh · 274203</p>
        <h3>CUSTOMER BILL · {shortId(order.id)}</h3>
        <div className="receipt-details">
          <p>
            <strong>{order.customer_name}</strong> · {order.phone}
          </p>
          <p>{order.address}</p>
          <p>{new Date(order.created_at).toLocaleString("en-IN")}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {lines(order.items).map((i) => (
              <tr key={i.id}>
                <td>
                  {i.name}
                  <br />
                  {i.unit}
                </td>
                <td>{i.quantity}</td>
                <td>{money(i.price * i.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="bill-row">
          <span>Subtotal</span>
          <span>{money(order.subtotal)}</span>
        </div>
        <div className="bill-row">
          <span>Delivery</span>
          <span>{money(order.delivery_fee)}</span>
        </div>
        <div className="bill-row">
          <span>Discount</span>
          <span>−{money(order.discount)}</span>
        </div>
        <div className="bill-row bill-total">
          <span>Total · {order.payment}</span>
          <strong>{money(order.total)}</strong>
        </div>
        <p>Thank you for shopping local!</p>
      </div>
      <div className="receipt-actions flex gap-3 mt-5">
        <Button onClick={() => window.print()}>
          <Printer />
          Print bill
        </Button>
        <Button asChild variant="success">
          <a
            href={`https://wa.me/91${order.phone}?text=${encodeURIComponent(text)}`}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle />
            WhatsApp bill
          </a>
        </Button>
      </div>
    </>
  );
}
