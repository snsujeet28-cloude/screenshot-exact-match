import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Line, Product } from "@/lib/commerce";
type Cart = {
  items: Line[];
  coupon: string;
  change: (product: Product | Line, delta: number) => void;
  setCoupon: (code: string) => void;
  clear: () => void;
};
export const useCart = create<Cart>()(
  persist(
    (set) => ({
      items: [],
      coupon: "",
      change: (product, delta) =>
        set((state) => {
          const old = state.items.find((i) => i.id === product.id);
          const quantity = Math.min(99, Math.max(0, (old?.quantity ?? 0) + delta));
          return {
            items:
              quantity === 0
                ? state.items.filter((i) => i.id !== product.id)
                : old
                  ? state.items.map((i) => (i.id === product.id ? { ...i, quantity } : i))
                  : [
                      ...state.items,
                      {
                        id: product.id,
                        name: product.name,
                        unit: product.unit,
                        price: product.price,
                        image_index: product.image_index,
                        quantity,
                      },
                    ],
          };
        }),
      setCoupon: (coupon) => set({ coupon }),
      clear: () => set({ items: [], coupon: "" }),
    }),
    { name: "brothers-kart-cart", skipHydration: true },
  ),
);
