import type { Metadata } from "next";
import ProviderMonitoringScreen from "@/screens/provider-monitoring/ProviderMonitoringScreen";

export const metadata: Metadata = { title: "Provider Monitoring" };

export default function ProviderMonitoringPage() {
  return <ProviderMonitoringScreen />;
}
