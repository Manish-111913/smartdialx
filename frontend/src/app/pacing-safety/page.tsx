import type { Metadata } from "next";
import { Suspense } from "react";
import PacingSafetyScreen from "@/screens/pacing-safety/PacingSafetyScreen";

export const metadata: Metadata = { title: "Pacing & Safety" };

export default function PacingSafetyPage() {
  // the screen reads ?campaign= and ?decision= from the URL
  return (
    <Suspense>
      <PacingSafetyScreen />
    </Suspense>
  );
}
