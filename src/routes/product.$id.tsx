import { createFileRoute } from "@tanstack/react-router";
import { ProductPage } from "@/components/storefront";
import { catalogOptions } from "@/lib/catalog.functions";
export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "Fresh grocery product | Brothers Kart" },
      {
        name: "description",
        content: "Product details and honest local grocery prices at Brothers Kart.",
      },
      { property: "og:title", content: "Fresh grocery product | Brothers Kart" },
      {
        property: "og:description",
        content: "Product details and honest local grocery prices at Brothers Kart.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogOptions),
  component: Page,
});
function Page() {
  return <ProductPage id={Route.useParams().id} />;
}
