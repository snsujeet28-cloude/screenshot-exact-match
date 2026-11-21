import { createFileRoute } from "@tanstack/react-router";
import { AdminCatalog } from "@/components/admin-catalog";
import { AdminShell } from "@/components/admin-shell";
import { catalogOptions } from "@/lib/catalog.functions";
export const Route = createFileRoute("/admin/products")({
  head: () => ({
    meta: [
      { title: "Products and rates | Brothers Kart" },
      {
        name: "description",
        content: "Manage Brothers Kart product prices, stock and bulk CSV updates.",
      },
      { property: "og:title", content: "Products and rates | Brothers Kart" },
      {
        property: "og:description",
        content: "Manage Brothers Kart product prices, stock and bulk CSV updates.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogOptions),
  component: Page,
});
function Page() {
  return (
    <AdminShell>
      <AdminCatalog />
    </AdminShell>
  );
}
