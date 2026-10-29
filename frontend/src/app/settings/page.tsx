import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Settings" };

// There's no Stitch design for this screen yet; the nav item needs somewhere to go.
export default function SettingsPage() {
  return (
    <div className="p-space-xl min-h-[calc(100vh-3.5rem)]">
      <div className="max-w-xl bg-white rounded-xl border border-slate-200/80 shadow-sm p-space-xl flex flex-col gap-space-md">
        <div className="flex items-center gap-space-sm">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </div>
          <h1 className="font-headline-md text-headline-md text-slate-900">Settings</h1>
        </div>
        <p className="font-body-md text-body-md text-slate-500">
          This screen hasn&apos;t been designed yet. Pacing thresholds, safety limits and provider settings live in the
          backend config for now.
        </p>
        <Link
          href="/"
          className="self-start inline-flex items-center gap-space-xs px-4 h-9 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-body-sm text-body-sm font-medium border border-slate-200 transition-colors"
        >
          <span className="material-symbols-outlined text-[17px]">arrow_back</span>
          Back to Overview
        </Link>
      </div>
    </div>
  );
}
