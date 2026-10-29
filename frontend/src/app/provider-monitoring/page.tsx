import type { Metadata } from "next";
import { Suspense } from "react";
import ProviderMonitoringScreen from "@/screens/provider-monitoring/ProviderMonitoringScreen";

export const metadata: Metadata = { title: "Provider Monitoring" };

export default function ProviderMonitoringPage() {
  // the screen reads ?provider= from the URL to open a provider's details
  return (
    <Suspense>
      <ProviderMonitoringScreen />
    </Suspense>
  );
}
