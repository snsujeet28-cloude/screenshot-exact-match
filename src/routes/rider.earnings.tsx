import { createFileRoute } from "@tanstack/react-router";
import { RiderPortal } from "@/components/rider-portal";
export const Route = createFileRoute("/rider/earnings")({
  head: () => ({
    meta: [
      { title: "Partner earnings and history | Brothers Kart" },
      {
        name: "description",
        content: "Delivery history and cash settlement records for Brothers Kart partners.",
      },
      { property: "og:title", content: "Partner earnings and history | Brothers Kart" },
      {
        property: "og:description",
        content: "Delivery history and cash settlement records for Brothers Kart partners.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
function Page() {
  return <RiderPortal view="earnings" />;
}
