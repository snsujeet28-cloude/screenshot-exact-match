import { useRef, useState } from "react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Upload, Download, Pencil, Trash2, Save } from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { catalogOptions } from "@/lib/catalog.functions";
import { supabase } from "@/integrations/supabase/client";
import { photos, money, categories, type Product } from "@/lib/commerce";
import { Modal } from "./admin-orders";
export function AdminCatalog() {
  const { data } = useSuspenseQuery(catalogOptions);
  const query = useQueryClient();
  const [search, setSearch] = useState("");
  const [edit, setEdit] = useState<Product | null>(null);
  const [create, setCreate] = useState(false);
  const [csv, setCsv] = useState<{ id: string; price: number }[] | null>(null);
  const upload = useRef<HTMLInputElement>(null);
  async function update(id: string, patch: { price?: number; in_stock?: boolean }) {
    const { error } = await supabase.from("products").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Product updated");
      void query.invalidateQueries({ queryKey: ["catalog"] });
    }
  }
  async function parse(file: File) {
    const text = await file.text();
    const result = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
    const rows = result.data.map((r) => ({ id: r["id"] ?? "", price: Number(r["price"]) }));
    if (
      result.errors.length ||
      !rows.length ||
      rows.some(
        (r) =>
          !data.products.some((p) => p.id === r.id) || !Number.isFinite(r.price) || r.price < 0,
      )
    ) {
      toast.error("Use CSV columns id,price with existing product IDs and valid prices");
      return;
    }
    setCsv(rows);
  }
  async function apply() {
    if (!csv) return;
    for (const row of csv) {
      const { error } = await supabase
        .from("products")
        .update({ price: row.price })
        .eq("id", row.id);
      if (error) {
        toast.error(error.message);
        return;
      }
    }
    toast.success(`${csv.length} prices updated`);
    setCsv(null);
    void query.invalidateQueries({ queryKey: ["catalog"] });
  }
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Products & rates</h1>
          <p>Your local catalog, always fresh and up to date.</p>
        </div>
        <div className="admin-heading-actions">
          <input
            ref={upload}
            className="hidden"
            type="file"
            accept=".csv"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void parse(f);
              e.target.value = "";
            }}
          />
          <Button variant="promo" onClick={() => upload.current?.click()}>
            <Upload />
            Bulk CSV price update
          </Button>
          <Button onClick={() => setCreate(true)}>
            <Plus />
            Add product
          </Button>
        </div>
      </div>
      <div className="search-field max-w-sm">
        <Search />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…"
        />
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>PRODUCT</th>
              <th>CATEGORY</th>
              <th>PRICE</th>
              <th>MRP</th>
              <th>STOCK</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {data.products
              .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
              .map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="admin-product">
                      <img src={photos[p.image_index]} alt={p.name} />
                      <div>
                        <strong>{p.name}</strong>
                        <small>
                          {p.id} · {p.unit}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>{p.category}</td>
                  <td>
                    <input
                      key={p.price}
                      aria-label={`Price ${p.name}`}
                      className="plain-input"
                      type="number"
                      min={0}
                      defaultValue={p.price}
                      onBlur={(e) => {
                        const n = Number(e.target.value);
                        if (n !== p.price && n >= 0) void update(p.id, { price: n });
                      }}
                    />
                  </td>
                  <td>{money(p.mrp)}</td>
                  <td>
                    <label className="flex gap-2 items-center">
                      <input
                        type="checkbox"
                        checked={p.in_stock}
                        onChange={(e) => update(p.id, { in_stock: e.target.checked })}
                      />
                      <span className={p.in_stock ? "text-success" : "text-destructive"}>
                        {p.in_stock ? "In stock" : "Out of stock"}
                      </span>
                    </label>
                  </td>
                  <td>
                    <div className="actions">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Edit product"
                        onClick={() => setEdit(p)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Delete product"
                        onClick={async () => {
                          if (!window.confirm(`Delete ${p.name}?`)) return;
                          const { error } = await supabase.from("products").delete().eq("id", p.id);
                          if (error) toast.error(error.message);
                          else void query.invalidateQueries({ queryKey: ["catalog"] });
                        }}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <Button
        variant="link"
        className="mt-3"
        onClick={() => {
          const blob = new Blob(
            [Papa.unparse(data.products.map((p) => ({ id: p.id, price: p.price })))],
            { type: "text/csv" },
          );
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "brothers-kart-prices.csv";
          a.click();
          URL.revokeObjectURL(url);
        }}
      >
        <Download />
        Download CSV template
      </Button>
      {(edit || create) && (
        <Modal
          title={edit ? "Edit product" : "Add product"}
          close={() => {
            setEdit(null);
            setCreate(false);
          }}
        >
          <ProductForm
            product={edit}
            close={() => {
              setEdit(null);
              setCreate(false);
            }}
          />
        </Modal>
      )}
      {csv && (
        <Modal title="Review price updates" close={() => setCsv(null)}>
          {csv.map((r) => (
            <div className="bill-row" key={r.id}>
              <span>{r.id}</span>
              <strong>{money(r.price)}</strong>
            </div>
          ))}
          <Button className="w-full mt-5" onClick={apply}>
            <Save />
            Apply {csv.length} updates
          </Button>
        </Modal>
      )}
    </>
  );
}
function ProductForm({ product, close }: { product: Product | null; close: () => void }) {
  const query = useQueryClient();
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const value = {
      id: product?.id ?? String(f.get("id")),
      name: String(f.get("name")),
      category: String(f.get("category")),
      unit: String(f.get("unit")),
      price: Number(f.get("price")),
      mrp: Number(f.get("mrp")),
      image_index: Number(f.get("image_index")),
      in_stock: true,
    };
    const { error } = await supabase.from("products").upsert(value);
    if (error) toast.error(error.message);
    else {
      toast.success("Product saved");
      void query.invalidateQueries({ queryKey: ["catalog"] });
      close();
    }
    setBusy(false);
  }
  return (
    <form onSubmit={submit}>
      {!product && (
        <label className="field">
          Product ID
          <input name="id" required placeholder="e.g. fresh-tomato" pattern="[a-z0-9-]+" />
        </label>
      )}
      <label className="field">
        Product name
        <input name="name" required defaultValue={product?.name} />
      </label>
      <label className="field">
        Category
        <select name="category" defaultValue={product?.category}>
          {categories.map((c) => (
            <option key={c.slug}>{c.name}</option>
          ))}
        </select>
      </label>
      <label className="field">
        Pack size
        <input name="unit" required defaultValue={product?.unit} placeholder="500 g" />
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="field">
          Price
          <input
            name="price"
            type="number"
            min={0}
            step=".01"
            required
            defaultValue={product?.price}
          />
        </label>
        <label className="field">
          MRP
          <input name="mrp" type="number" min={0} step=".01" required defaultValue={product?.mrp} />
        </label>
      </div>
      <label className="field">
        Product photo
        <select name="image_index" defaultValue={product?.image_index ?? 0}>
          {[
            "Tomatoes",
            "Potatoes",
            "Spinach",
            "Carrots",
            "Banana",
            "Cauliflower",
            "Milk",
            "Bread",
          ].map((p, i) => (
            <option value={i} key={p}>
              {p}
            </option>
          ))}
        </select>
      </label>
      <Button disabled={busy} className="w-full">
        <Save />
        Save product
      </Button>
    </form>
  );
}
