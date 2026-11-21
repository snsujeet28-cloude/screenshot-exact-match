import { createFileRoute } from "@tanstack/react-router";
import { AccountPage } from "@/components/customer-account";
export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Your account | Brothers Kart" },
      {
        name: "description",
        content: "Manage your Brothers Kart account, saved address and grocery order history.",
      },
      { property: "og:title", content: "Your account | Brothers Kart" },
      {
        property: "og:description",
        content: "Manage your Brothers Kart account, saved address and grocery order history.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
function Page() {
  return <AccountPage />;
}
