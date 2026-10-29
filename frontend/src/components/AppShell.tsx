"use client";

import { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

// Fixed sidebar + header from the executive dashboard design, shared by every screen.
export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const toggle = () => setCollapsed((c) => !c);

  return (
    <>
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <div className={`main-transition ${collapsed ? "pl-[72px]" : "pl-64"}`}>
        <Header collapsed={collapsed} onToggle={toggle} />
        <main className="w-full pt-14 bg-[#f8fafc] min-h-screen">{children}</main>
      </div>
    </>
  );
}
