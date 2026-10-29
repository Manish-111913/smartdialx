import type { Metadata } from "next";
import { Suspense } from "react";
import EventLogsScreen from "@/screens/event-logs/EventLogsScreen";

export const metadata: Metadata = { title: "Event Logs & Recovery" };

export default function EventLogsPage() {
  return (
    <Suspense>
      <EventLogsScreen />
    </Suspense>
  );
}
