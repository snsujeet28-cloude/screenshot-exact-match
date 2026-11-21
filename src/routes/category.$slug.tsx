import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/storefront";
import { catalogOptions } from "@/lib/catalog.functions";
export const Route = createFileRoute("/category/$slug")({
  head: () => ({
    meta: [
      { title: "Shop your favourite category | Brothers Kart" },
      {
        name: "description",
        content: "Fresh local grocery categories delivered to your door in Hata.",
      },
      { property: "og:title", content: "Shop your favourite category | Brothers Kart" },
      {
        property: "og:description",
        content: "Fresh local grocery categories delivered to your door in Hata.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogOptions),
  component: Page,
});
function Page() {
  return <CategoryPage slug={Route.useParams().slug} />;
}
