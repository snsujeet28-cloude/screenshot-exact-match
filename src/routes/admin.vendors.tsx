import { createFileRoute } from "@tanstack/react-router";
import { AdminVendors } from "@/components/admin-management";
import { AdminShell } from "@/components/admin-shell";
export const Route = createFileRoute("/admin/vendors")({
  head: () => ({
    meta: [
      { title: "Local vendor hisaab | Brothers Kart" },
      {
        name: "description",
        content: "Manage local shop purchases, settlements and pending dues at Brothers Kart.",
      },
      { property: "og:title", content: "Local vendor hisaab | Brothers Kart" },
      {
        property: "og:description",
        content: "Manage local shop purchases, settlements and pending dues at Brothers Kart.",
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
      <AdminVendors />
    </AdminShell>
  );
}
