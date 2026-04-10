"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, Home, Notebook } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Overview", icon: Home },
  { href: "/history", label: "History", icon: History },
  { href: "/notes", label: "Daily Notes", icon: Notebook },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-[240px] shrink-0 border-r border-control bg-surface-100 md:flex md:flex-col print:hidden">
      <div className="flex h-10 items-center border-b border-control px-3">
        <span className="text-xs font-medium text-foreground">DTR Project</span>
      </div>

      <nav className="flex-1 px-2 py-3">
        <p className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-light">Navigation</p>
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));

            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-md px-3 py-1.5 text-xs no-underline transition-colors",
                    isActive
                      ? "bg-surface-200 text-foreground"
                      : "text-light hover:bg-surface-200 hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-brand")} />
                  <span className="ml-2">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-control px-3 py-3">
        <p className="text-[10px] text-lighter">DTR Tracker v1.0</p>
      </div>
    </aside>
  );
}
