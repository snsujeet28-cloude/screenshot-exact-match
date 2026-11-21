import { createFileRoute } from "@tanstack/react-router";
import { TrackingPage } from "@/components/customer-orders";
export const Route = createFileRoute("/track/$orderId")({
  head: () => ({
    meta: [
      { title: "Track your order | Brothers Kart" },
      {
        name: "description",
        content: "Live order updates and delivery details for your Brothers Kart groceries.",
      },
      { property: "og:title", content: "Track your order | Brothers Kart" },
      {
        property: "og:description",
        content: "Live order updates and delivery details for your Brothers Kart groceries.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
function Page() {
  return <TrackingPage orderId={Route.useParams().orderId} />;
}
