import { createFileRoute } from "@tanstack/react-router";
import { AdminSettings } from "@/components/admin-management";
import { AdminShell } from "@/components/admin-shell";
import { catalogOptions } from "@/lib/catalog.functions";
export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Store delivery and offers | Brothers Kart" },
      {
        name: "description",
        content: "Manage home banners, coupons and delivery fees at Brothers Kart.",
      },
      { property: "og:title", content: "Store delivery and offers | Brothers Kart" },
      {
        property: "og:description",
        content: "Manage home banners, coupons and delivery fees at Brothers Kart.",
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
      <AdminSettings />
    </AdminShell>
  );
}
