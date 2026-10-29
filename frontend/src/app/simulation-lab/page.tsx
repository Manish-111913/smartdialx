import type { Metadata } from "next";
import SimulationLabScreen from "@/screens/simulation-lab/SimulationLabScreen";

export const metadata: Metadata = { title: "Simulation Lab" };

export default function SimulationLabPage() {
  return <SimulationLabScreen />;
}
