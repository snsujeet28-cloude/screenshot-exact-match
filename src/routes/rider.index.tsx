import { createFileRoute } from "@tanstack/react-router";
import { RiderPortal } from "@/components/rider-portal";
export const Route = createFileRoute("/rider/")({
  head: () => ({
    meta: [
      { title: "Delivery partner home | Brothers Kart" },
      {
        name: "description",
        content: "Brothers Kart delivery partner dashboard for assigned deliveries in Hata.",
      },
      { property: "og:title", content: "Delivery partner home | Brothers Kart" },
      {
        property: "og:description",
        content: "Brothers Kart delivery partner dashboard for assigned deliveries in Hata.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
function Page() {
  return <RiderPortal />;
}
