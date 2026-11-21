import { useState } from "react";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Save, Store, Wallet, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { catalogOptions } from "@/lib/catalog.functions";
import { assignRole } from "@/lib/staff.functions";
import { money } from "@/lib/commerce";
import { Modal } from "./admin-orders";
import { RiderCash } from "./admin-dashboard";
import { useAdminData } from "./admin-data";
export function AdminSettings() {
  const { data } = useSuspenseQuery(catalogOptions);
  const query = useQueryClient();
  const [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const values = {
      banner_title: String(f.get("banner_title")),
      banner_subtitle: String(f.get("banner_subtitle")),
      free_delivery: Number(f.get("free_delivery")),
      delivery_fee: Number(f.get("delivery_fee")),
      coupon_code: String(f.get("coupon_code")).toUpperCase(),
      coupon_discount: Number(f.get("coupon_discount")),
      coupon_minimum: Number(f.get("coupon_minimum")),
    };
    if (
      Object.values(values).some((v) => typeof v === "number" && (!Number.isFinite(v) || v < 0))
    ) {
      toast.error("Enter valid non-negative amounts");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("settings").update(values).eq("id", 1);
    if (error) toast.error(error.message);
    else {
      toast.success("Store settings saved");
      void query.invalidateQueries({ queryKey: ["catalog"] });
    }
    setBusy(false);
  }
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Store settings</h1>
          <p>Offers, delivery charges and your storefront banner.</p>
        </div>
      </div>
      <form onSubmit={save}>
        <div className="settings-grid">
          <section>
            <div className="panel">
              <h2>Home banner</h2>
              <label className="field">
                Headline
                <input name="banner_title" required defaultValue={data.settings.banner_title} />
              </label>
              <label className="field">
                Supporting text
                <textarea name="banner_subtitle" defaultValue={data.settings.banner_subtitle} />
              </label>
            </div>
            <div className="panel">
              <h2>Delivery control</h2>
              <label className="field">
                Free delivery above (₹)
                <input
                  name="free_delivery"
                  type="number"
                  min={0}
                  defaultValue={data.settings.free_delivery}
                />
              </label>
              <label className="field">
                Delivery fee (₹)
                <input
                  name="delivery_fee"
                  type="number"
                  min={0}
                  defaultValue={data.settings.delivery_fee}
                />
              </label>
            </div>
          </section>
          <div className="panel">
            <h2>Coupon manager</h2>
            <label className="field">
              Coupon code
              <input name="coupon_code" defaultValue={data.settings.coupon_code} />
            </label>
            <label className="field">
              Discount (₹)
              <input
                name="coupon_discount"
                type="number"
                min={0}
                defaultValue={data.settings.coupon_discount}
              />
            </label>
            <label className="field">
              Minimum order (₹)
              <input
                name="coupon_minimum"
                type="number"
                min={0}
                defaultValue={data.settings.coupon_minimum}
              />
            </label>
            <p className="text-xs text-muted-foreground">
              Coupon and delivery charges are checked again when an order is placed.
            </p>
          </div>
        </div>
        <Button disabled={busy} size="lg">
          <Save />
          {busy ? "Saving…" : "Save store settings"}
        </Button>
      </form>
    </>
  );
}
export function AdminVendors() {
  const query = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const { data: vendors = [] } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vendors").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
  const { data: ledger = [] } = useQuery({
    queryKey: ["ledger"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_ledger")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const due = (id: string) =>
    ledger
      .filter((l) => l.vendor_id === id)
      .reduce((n, l) => n + (l.kind === "Purchase" ? l.amount : -l.amount), 0);
  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const { error } = await supabase
      .from("vendors")
      .insert({
        name: String(f.get("name")),
        phone: String(f.get("phone")),
        category: String(f.get("category")),
      });
    if (error) toast.error(error.message);
    else {
      setAdding(false);
      toast.success("Local shop added");
      void query.invalidateQueries({ queryKey: ["vendors"] });
    }
  }
  async function record(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    const f = new FormData(e.currentTarget);
    const { error } = await supabase
      .from("vendor_ledger")
      .insert({
        vendor_id: selected,
        kind: String(f.get("kind")),
        amount: Number(f.get("amount")),
        note: String(f.get("note")),
      });
    if (error) toast.error(error.message);
    else {
      toast.success("Hisaab recorded");
      void query.invalidateQueries({ queryKey: ["ledger"] });
    }
  }
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Local shop / vendor hisaab</h1>
          <p>Clear accounts. Strong neighbourhood partnerships.</p>
        </div>
        <Button onClick={() => setAdding(true)}>
          <Plus />
          Add local shop
        </Button>
      </div>
      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-top">
            <span>Partner shops</span>
            <Store />
          </div>
          <strong>{vendors.length}</strong>
        </div>
        <div className="kpi">
          <div className="kpi-top">
            <span>Pending shop dues</span>
            <Wallet />
          </div>
          <strong>{money(vendors.reduce((n, v) => n + Math.max(0, due(v.id)), 0))}</strong>
        </div>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>LOCAL SHOP</th>
              <th>PHONE</th>
              <th>CATEGORY</th>
              <th>PENDING DUES</th>
              <th>HISAAB</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => (
              <tr key={v.id}>
                <td>
                  <strong>{v.name}</strong>
                </td>
                <td>{v.phone || "—"}</td>
                <td>{v.category}</td>
                <td>
                  <strong>{money(due(v.id))}</strong>
                </td>
                <td>
                  <Button size="sm" variant="outline" onClick={() => setSelected(v.id)}>
                    View ledger
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {adding && (
        <Modal title="Add a local shop" close={() => setAdding(false)}>
          <form onSubmit={add}>
            <label className="field">
              Shop name
              <input name="name" required />
            </label>
            <label className="field">
              Phone
              <input name="phone" pattern="[0-9]{10}" />
            </label>
            <label className="field">
              Category
              <input name="category" required defaultValue="Groceries" />
            </label>
            <Button className="w-full">Add shop</Button>
          </form>
        </Modal>
      )}
      {selected && (
        <Modal
          title={vendors.find((v) => v.id === selected)?.name ?? "Shop ledger"}
          close={() => setSelected(null)}
        >
          <h3 className="text-lg font-bold mb-4">Pending: {money(due(selected))}</h3>
          <form onSubmit={record}>
            <div className="grid grid-cols-2 gap-3">
              <label className="field">
                Entry
                <select name="kind">
                  <option>Purchase</option>
                  <option>Settlement</option>
                </select>
              </label>
              <label className="field">
                Amount (₹)
                <input name="amount" type="number" min=".01" step=".01" required />
              </label>
            </div>
            <label className="field">
              Note
              <input name="note" placeholder="Purchase or payment reference" />
            </label>
            <Button className="w-full mb-5">
              <Save />
              Record entry
            </Button>
          </form>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>ENTRY</th>
                  <th>AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {ledger
                  .filter((l) => l.vendor_id === selected)
                  .map((l) => (
                    <tr key={l.id}>
                      <td>
                        {new Date(l.created_at).toLocaleDateString("en-IN")}
                        <small>{l.note}</small>
                      </td>
                      <td>{l.kind}</td>
                      <td>{money(l.amount)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </>
  );
}
export function AdminRiders() {
  const staff = useAdminData();
  const query = useQueryClient();
  const grant = useServerFn(assignRole);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await grant({ data: { email: String(f.get("email")), role: "rider" } });
      toast.success("Partner approved");
      setAdding(false);
      void query.invalidateQueries({ queryKey: ["admin-roles"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to approve partner");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Riders & dispatch</h1>
          <p>Your local delivery team, all in one place.</p>
        </div>
        <Button onClick={() => setAdding(true)}>
          <UserPlus />
          Approve partner
        </Button>
      </div>
      <div className="settings-grid">
        <div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>PARTNER</th>
                  <th>PHONE</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {staff.riders.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.display_name || "Partner"}</strong>
                      <small>{r.id.slice(0, 8).toUpperCase()}</small>
                    </td>
                    <td>{r.phone || "—"}</td>
                    <td>
                      <span className={`status ${r.online ? "Delivered" : ""}`}>
                        {r.online ? "Online" : "Offline"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {staff.riders.length === 0 && (
              <div className="admin-empty">No approved partners yet.</div>
            )}
          </div>
        </div>
        <RiderCash />
      </div>
      {adding && (
        <Modal title="Approve delivery partner" close={() => setAdding(false)}>
          <form onSubmit={submit}>
            <p className="text-xs text-muted-foreground mb-5">
              The partner must create a Brothers Kart account first.
            </p>
            <label className="field">
              Partner account email
              <input type="email" name="email" required />
            </label>
            <Button disabled={busy} className="w-full">
              {busy ? "Approving…" : "Approve as delivery partner"}
            </Button>
          </form>
        </Modal>
      )}
    </>
  );
}
