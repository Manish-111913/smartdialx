import type { Metadata } from "next";
import CampaignsScreen from "@/screens/campaigns/CampaignsScreen";

export const metadata: Metadata = { title: "Campaigns" };

export default function CampaignsPage() {
  return <CampaignsScreen />;
}
