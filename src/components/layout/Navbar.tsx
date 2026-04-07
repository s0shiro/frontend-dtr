"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, LogOut, Menu } from "lucide-react";

import { signOut, useSession } from "@/lib/auth-client";
import { AutoClockOutToggle } from "./AutoClockOutToggle";

const ThemeToggle = dynamic(
  () => import("./ThemeToggle").then((module) => module.ThemeToggle),
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
  const router = useRouter();
  const session = useSession();

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  const userInitial = session.data?.user?.email?.[0]?.toUpperCase() || "?";
  const userName = session.data?.user?.name || session.data?.user?.email || "User";

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

        {session.data?.user ? (
          <>
            <div className="flex shrink-0 items-center">
              <AutoClockOutToggle />
            </div>
            <div className="hidden sm:flex shrink-0 items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-surface-300 border border-control flex items-center justify-center text-[10px] text-foreground font-medium">
                {userInitial}
              </div>
              <span className="text-xs text-light max-w-[160px] truncate">{userName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="h-[28px] shrink-0 px-2 flex items-center gap-2 text-xs text-light hover:text-foreground hover:bg-surface-200 rounded-md border border-transparent hover:border-control transition-colors"
              title="Logout"
              type="button"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="h-[28px] px-3 flex items-center rounded-md border border-control bg-surface-100 text-xs text-light hover:text-foreground hover:bg-surface-200 transition-colors"
          >
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
