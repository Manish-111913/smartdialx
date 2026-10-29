// Shapes of the API responses used by the TypeScript parts of the app (the shell).
// The screens are plain JSX; docs/api.md describes every endpoint.

export type Health = {
  ok: boolean;
  now: number;
  warming_up: boolean;
  running_campaigns: number;
  agents_online: number;
  providers: Record<string, "operational" | "degraded" | "outage">;
};

export type CampaignItem = {
  id: number;
  code: string;
  name: string;
  status: string;
  display_status: string;
};

export type Alert = {
  level: "error" | "warning" | "info";
  kind: string;
  title: string;
  detail: string;
  at: number | null;
};

export type CampaignList = { now: number; campaigns: CampaignItem[] };
export type LiveSummary = { now: number; alerts: Alert[] };
