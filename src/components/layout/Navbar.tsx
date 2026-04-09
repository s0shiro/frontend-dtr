"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu } from "lucide-react";

const ThemeToggle = dynamic(
  () => import("./ThemeToggle").then((module) => module.ThemeToggle),
  { ssr: false },
);

const NavbarAuthControls = dynamic(
  () => import("./NavbarAuthControls").then((module) => module.NavbarAuthControls),
  { ssr: false },
);

interface NavbarProps {
  breadcrumb?: string[];
  onMobileMenuToggle?: () => void;
}

export function Navbar({
  breadcrumb = ["Home", "Project Overview"],
  onMobileMenuToggle,
}: NavbarProps) {
  const pathname = usePathname();

  const fallbackBreadcrumb = pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()));

  const breadcrumbItems = fallbackBreadcrumb.length > 0 ? fallbackBreadcrumb : breadcrumb;

  return (
    <header className="flex h-10 shrink-0 items-center justify-between border-b border-control bg-surface-100 px-4 print:hidden">
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="h-[28px] w-[28px] rounded-md text-light hover:bg-surface-200 border border-control bg-surface-100 flex items-center justify-center md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <nav className="flex items-center gap-1.5 text-xs text-light" aria-label="Breadcrumb">
        {breadcrumbItems.map((item, index) => (
          <div key={`${item}-${index}`} className="flex items-center gap-1.5">
            {index > 0 ? <ChevronRight className="h-3 w-3 text-lighter" /> : null}
            <span className={index === breadcrumbItems.length - 1 ? "text-foreground" : "text-light"}>
              {item}
            </span>
          </div>
        ))}
        </nav>
      </div>

      <div className="flex flex-1 items-center gap-3 overflow-x-auto no-scrollbar justify-end ml-4">
        <ThemeToggle />

        <NavbarAuthControls />
      </div>
    </header>
  );
}
