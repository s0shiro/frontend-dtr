"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, Home } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Overview", icon: Home },
  { href: "/history", label: "History", icon: History },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-[240px] shrink-0 border-r border-control bg-surface-100 md:flex md:flex-col print:hidden">
      <div className="flex h-10 items-center border-b border-control px-3">
        <span className="text-xs font-medium text-foreground">DTR Project</span>
      </div>

      <nav className="px-2 py-3">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-md px-3 py-1.5 text-xs no-underline transition-colors",
                    pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`))
                      ? "bg-surface-200 text-foreground"
                      : "text-light hover:bg-surface-200 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="ml-2">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
