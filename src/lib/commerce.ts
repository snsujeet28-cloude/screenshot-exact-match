import type { Database } from "@/integrations/supabase/types";
import p0 from "@/assets/product-0.asset.json";
import p1 from "@/assets/product-1.asset.json";
import p2 from "@/assets/product-2.asset.json";
import p3 from "@/assets/product-3.asset.json";
import p4 from "@/assets/product-4.asset.json";
import p5 from "@/assets/product-5.asset.json";
import p6 from "@/assets/product-6.asset.json";
import p7 from "@/assets/product-7.asset.json";
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type Settings = Database["public"]["Tables"]["settings"]["Row"];
export type Line = {
  id: string;
  name: string;
  unit: string;
  price: number;
  quantity: number;
  image_index: number;
};
export const photos = [p0.url, p1.url, p2.url, p3.url, p4.url, p5.url, p6.url, p7.url];
export const categories = [
  { name: "Vegetables", image: 2, slug: "vegetables" },
  { name: "Fruits", image: 4, slug: "fruits" },
  { name: "Dairy & Eggs", image: 6, slug: "dairy" },
  { name: "Bakery", image: 7, slug: "bakery" },
];
export const money = (value: number) =>
  "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value);
export const shortId = (id: string) => "BK-" + id.slice(0, 6).toUpperCase();
export const lines = (value: unknown): Line[] =>
  Array.isArray(value)
    ? value.filter((v): v is Line => v && typeof v === "object" && "id" in v && "quantity" in v)
    : [];
export function calculateBill(
  items: Pick<Line, "price" | "quantity">[],
  settings: Pick<
    Settings,
    "free_delivery" | "delivery_fee" | "coupon_code" | "coupon_discount" | "coupon_minimum"
  >,
  coupon = "",
) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const delivery = subtotal >= settings.free_delivery || subtotal === 0 ? 0 : settings.delivery_fee;
  const discount =
    coupon.toUpperCase() === settings.coupon_code && subtotal >= settings.coupon_minimum
      ? Math.min(subtotal, settings.coupon_discount)
      : 0;
  return {
    subtotal,
    delivery,
    discount,
    total: subtotal + delivery - discount,
    remaining: Math.max(0, settings.free_delivery - subtotal),
  };
}
export const defaultSettings: Settings = {
  id: 1,
  free_delivery: 499,
  delivery_fee: 30,
  coupon_code: "HATA50",
  coupon_discount: 50,
  coupon_minimum: 499,
  banner_title: "Fresh from the mandi.",
  banner_subtitle: "Your daily essentials, delivered with care.",
};

export function riderEarnings(orders: { status: string; rider_earning: number }[]) {
  return orders.filter((o) => o.status === "Delivered").reduce((n, o) => n + o.rider_earning, 0);
}
