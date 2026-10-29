import type { Metadata } from "next";
import AgentsScreen from "@/screens/agents/AgentsScreen";

export const metadata: Metadata = { title: "Agents" };

export default function AgentsPage() {
  return <AgentsScreen />;
}
