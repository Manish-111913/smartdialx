import type { Metadata } from "next";
import PacingSafetyScreen from "@/screens/pacing-safety/PacingSafetyScreen";

export const metadata: Metadata = { title: "Pacing & Safety" };

export default function PacingSafetyPage() {
  return <PacingSafetyScreen />;
}
