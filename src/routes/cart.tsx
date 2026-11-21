import { createFileRoute } from "@tanstack/react-router";
import { CartPage } from "@/components/customer-orders";
import { catalogOptions } from "@/lib/catalog.functions";
export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your grocery cart | Brothers Kart" },
      {
        name: "description",
        content: "Review your fresh picks, coupons and delivery savings at Brothers Kart.",
      },
      { property: "og:title", content: "Your grocery cart | Brothers Kart" },
      {
        property: "og:description",
        content: "Review your fresh picks, coupons and delivery savings at Brothers Kart.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogOptions),
  component: Page,
});
function Page() {
  return <CartPage />;
}
