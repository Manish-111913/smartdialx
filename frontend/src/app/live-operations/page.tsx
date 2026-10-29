import type { Metadata } from "next";
import LiveOperationsScreen from "@/screens/live-operations/LiveOperationsScreen";

export const metadata: Metadata = { title: "Live Operations" };

export default function LiveOperationsPage() {
  return <LiveOperationsScreen />;
}
