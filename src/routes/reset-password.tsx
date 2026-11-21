import { createFileRoute } from "@tanstack/react-router";
import { ResetPasswordPage } from "@/components/customer-account";
export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset your password | Brothers Kart" },
      { name: "description", content: "Securely reset your Brothers Kart account password." },
      { property: "og:title", content: "Reset your password | Brothers Kart" },
      {
        property: "og:description",
        content: "Securely reset your Brothers Kart account password.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
function Page() {
  return <ResetPasswordPage />;
}
