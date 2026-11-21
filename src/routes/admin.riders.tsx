import { createFileRoute } from "@tanstack/react-router";
import { AdminRiders } from "@/components/admin-management";
import { AdminShell } from "@/components/admin-shell";
export const Route = createFileRoute("/admin/riders")({
  head: () => ({
    meta: [
      { title: "Riders and cash settlement | Brothers Kart" },
      {
        name: "description",
        content: "Approve delivery partners and settle COD cash at Brothers Kart.",
      },
      { property: "og:title", content: "Riders and cash settlement | Brothers Kart" },
      {
        property: "og:description",
        content: "Approve delivery partners and settle COD cash at Brothers Kart.",
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
      <AdminRiders />
    </AdminShell>
  );
}
