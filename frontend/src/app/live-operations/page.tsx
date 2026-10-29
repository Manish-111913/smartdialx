import type { Metadata } from "next";
import { Suspense } from "react";
import LiveOperationsScreen from "@/screens/live-operations/LiveOperationsScreen";

export const metadata: Metadata = { title: "Live Operations" };

// the screen reads ?call= to open a call straight away, which needs a Suspense boundary
export default function LiveOperationsPage() {
  return (
    <Suspense>
      <LiveOperationsScreen />
    </Suspense>
  );
}
