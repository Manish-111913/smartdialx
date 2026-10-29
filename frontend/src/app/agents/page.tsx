import type { Metadata } from "next";
import { Suspense } from "react";
import AgentsScreen from "@/screens/agents/AgentsScreen";

export const metadata: Metadata = { title: "Agents" };

// the screen reads ?id= to open an agent's drawer, which needs a Suspense boundary
export default function AgentsPage() {
  return (
    <Suspense fallback={null}>
      <AgentsScreen />
    </Suspense>
  );
}
