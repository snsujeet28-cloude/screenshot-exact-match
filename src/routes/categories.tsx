import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/storefront";
import { catalogOptions } from "@/lib/catalog.functions";
export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Grocery categories | Brothers Kart" },
      {
        name: "description",
        content: "Browse fresh vegetables, fruits, dairy and bakery at Brothers Kart.",
      },
      { property: "og:title", content: "Grocery categories | Brothers Kart" },
      {
        property: "og:description",
        content: "Browse fresh vegetables, fruits, dairy and bakery at Brothers Kart.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogOptions),
  component: Page,
});
function Page() {
  return <CategoryPage />;
}
