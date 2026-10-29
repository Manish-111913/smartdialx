import type { Metadata } from "next";
import EventLogsScreen from "@/screens/event-logs/EventLogsScreen";

export const metadata: Metadata = { title: "Event Logs & Recovery" };

export default function EventLogsPage() {
  return <EventLogsScreen />;
}
