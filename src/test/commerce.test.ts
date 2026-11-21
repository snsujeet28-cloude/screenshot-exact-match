import { describe, it, expect } from "vitest";
import { calculateBill, riderEarnings } from "@/lib/commerce";
const settings = {
  free_delivery: 499,
  delivery_fee: 30,
  coupon_code: "HATA50",
  coupon_discount: 50,
  coupon_minimum: 499,
};
describe("Brothers Kart business rules", () => {
  it("unlocks free delivery at exactly ₹499", () => {
    expect(calculateBill([{ price: 499, quantity: 1 }], settings).delivery).toBe(0);
    expect(calculateBill([{ price: 498, quantity: 1 }], settings).delivery).toBe(30);
  });
  it("awards ₹10 only for completed orders", () => {
    expect(
      riderEarnings([
        { status: "Delivered", rider_earning: 10 },
        { status: "Confirmed", rider_earning: 10 },
        { status: "Cancelled", rider_earning: 10 },
        { status: "Delivered", rider_earning: 10 },
      ]),
    ).toBe(20);
  });
  it("applies HATA50 once only for an eligible cart", () => {
    expect(calculateBill([{ price: 500, quantity: 1 }], settings, "HATA50").total).toBe(450);
    expect(calculateBill([{ price: 498, quantity: 1 }], settings, "HATA50").discount).toBe(0);
  });
});
