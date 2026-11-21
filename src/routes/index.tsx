import { createFileRoute } from "@tanstack/react-router";
import { Storefront } from "@/components/storefront";
import { catalogOptions } from "@/lib/catalog.functions";
import basket from "@/assets/grocery-promo.asset.json";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fresh groceries delivered in Hata | Brothers Kart" },
      {
        name: "description",
        content:
          "Shop farm fresh vegetables, fruits and daily essentials from Brothers Kart in Hata, Kushinagar 274203.",
      },
      { property: "og:title", content: "Fresh groceries delivered in Hata | Brothers Kart" },
      {
        property: "og:description",
        content:
          "Shop farm fresh vegetables, fruits and daily essentials from Brothers Kart in Hata, Kushinagar 274203.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: basket.url },
      { name: "twitter:image", content: basket.url },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogOptions),
  component: Page,
});
function Page() {
  return <Storefront />;
}
