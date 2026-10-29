export type NavItem = {
  label: string;
  href: string;
  icon: string;
  // icon colour on hover, same accents as the dashboard design
  hover: string;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    title: "Workspace",
    items: [
      { label: "Overview", href: "/", icon: "space_dashboard", hover: "group-hover:text-indigo-600" },
      { label: "Campaigns", href: "/campaigns", icon: "campaign", hover: "group-hover:text-indigo-600" },
      { label: "Live Operations", href: "/live-operations", icon: "sensors", hover: "group-hover:text-cyan-600" },
      { label: "Agents", href: "/agents", icon: "support_agent", hover: "group-hover:text-emerald-600" },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { label: "Pacing & Safety", href: "/pacing-safety", icon: "speed", hover: "group-hover:text-amber-600" },
      { label: "Provider Monitoring", href: "/provider-monitoring", icon: "cloud_sync", hover: "group-hover:text-blue-600" },
      { label: "Simulation Lab", href: "/simulation-lab", icon: "science", hover: "group-hover:text-purple-600" },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Event Logs & Recovery", href: "/event-logs", icon: "terminal", hover: "group-hover:text-slate-800" },
      { label: "Settings", href: "/settings", icon: "settings", hover: "group-hover:text-slate-800" },
    ],
  },
];

export function isActive(item: NavItem, pathname: string) {
  return item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(item.href + "/");
}

export function currentPage(pathname: string) {
  for (const group of navGroups) {
    for (const item of group.items) {
      if (isActive(item, pathname)) return { group: group.title, item };
    }
  }
  return { group: navGroups[0].title, item: navGroups[0].items[0] };
}
