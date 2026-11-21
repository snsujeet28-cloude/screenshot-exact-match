import { createFileRoute } from "@tanstack/react-router";
import { CheckoutPage } from "@/components/customer-orders";
import { catalogOptions } from "@/lib/catalog.functions";
export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Grocery checkout | Brothers Kart" },
      {
        name: "description",
        content: "Choose your Hata delivery address and pay on delivery with Brothers Kart.",
      },
      { property: "og:title", content: "Grocery checkout | Brothers Kart" },
      {
        property: "og:description",
        content: "Choose your Hata delivery address and pay on delivery with Brothers Kart.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogOptions),
  component: Page,
});
function Page() {
  return <CheckoutPage />;
}
