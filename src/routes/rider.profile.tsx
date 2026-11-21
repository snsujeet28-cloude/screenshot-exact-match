import { createFileRoute } from "@tanstack/react-router";
import { RiderPortal } from "@/components/rider-portal";
export const Route = createFileRoute("/rider/profile")({
  head: () => ({
    meta: [
      { title: "Delivery partner profile | Brothers Kart" },
      { name: "description", content: "Your verified delivery partner profile at Brothers Kart." },
      { property: "og:title", content: "Delivery partner profile | Brothers Kart" },
      {
        property: "og:description",
        content: "Your verified delivery partner profile at Brothers Kart.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
function Page() {
  return <RiderPortal view="profile" />;
}
