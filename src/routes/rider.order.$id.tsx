import { createFileRoute } from "@tanstack/react-router";
import { RiderPortal } from "@/components/rider-portal";
export const Route = createFileRoute("/rider/order/$id")({
  head: () => ({
    meta: [
      { title: "Partner delivery details | Brothers Kart" },
      {
        name: "description",
        content: "Pickup checklist, customer navigation and secure delivery completion.",
      },
      { property: "og:title", content: "Partner delivery details | Brothers Kart" },
      {
        property: "og:description",
        content: "Pickup checklist, customer navigation and secure delivery completion.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
function Page() {
  return <RiderPortal view="order" id={Route.useParams().id} />;
}
