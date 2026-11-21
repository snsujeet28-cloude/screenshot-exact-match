import { createFileRoute } from "@tanstack/react-router";
import { AdminOrders } from "@/components/admin-orders";
import { AdminShell } from "@/components/admin-shell";
export const Route = createFileRoute("/admin/orders")({
  head: () => ({
    meta: [
      { title: "Admin order management | Brothers Kart" },
      {
        name: "description",
        content: "Manage active grocery orders, delivery partners and customer bills.",
      },
      { property: "og:title", content: "Admin order management | Brothers Kart" },
      {
        property: "og:description",
        content: "Manage active grocery orders, delivery partners and customer bills.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
function Page() {
  return (
    <AdminShell>
      <AdminOrders />
    </AdminShell>
  );
}
