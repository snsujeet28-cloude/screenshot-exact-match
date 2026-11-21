import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboard } from "@/components/admin-dashboard";
import { AdminShell } from "@/components/admin-shell";
import { catalogOptions } from "@/lib/catalog.functions";
export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin dashboard | Brothers Kart" },
      {
        name: "description",
        content: "Brothers Kart live orders, rider dispatch, cash status and local grocery rates.",
      },
      { property: "og:title", content: "Admin dashboard | Brothers Kart" },
      {
        property: "og:description",
        content: "Brothers Kart live orders, rider dispatch, cash status and local grocery rates.",
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
      <AdminDashboard />
    </AdminShell>
  );
}
