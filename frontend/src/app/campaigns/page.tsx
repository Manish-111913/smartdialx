import type { Metadata } from "next";
import { Suspense } from "react";
import CampaignsScreen from "@/screens/campaigns/CampaignsScreen";

export const metadata: Metadata = { title: "Campaigns" };

// the screen reads ?id= to open a campaign's drawer, which needs a Suspense boundary
export default function CampaignsPage() {
  return (
    <Suspense fallback={null}>
      <CampaignsScreen />
    </Suspense>
  );
}
