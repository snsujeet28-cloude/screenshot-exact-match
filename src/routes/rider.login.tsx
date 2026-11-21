import { createFileRoute } from "@tanstack/react-router";
import { RiderPortal } from "@/components/rider-portal";
export const Route = createFileRoute("/rider/login")({
  head: () => ({
    meta: [
      { title: "Partner sign in | Brothers Kart" },
      { name: "description", content: "Sign in to your Brothers Kart delivery partner account." },
      { property: "og:title", content: "Partner sign in | Brothers Kart" },
      {
        property: "og:description",
        content: "Sign in to your Brothers Kart delivery partner account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
function Page() {
  return <RiderPortal view="login" />;
}
