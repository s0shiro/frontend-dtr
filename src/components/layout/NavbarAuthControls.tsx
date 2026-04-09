"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { signOut, useSession } from "@/lib/auth-client";
import { AutoClockOutToggle } from "./AutoClockOutToggle";

export function NavbarAuthControls() {
  const router = useRouter();
  const session = useSession();

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  const userInitial = session.data?.user?.email?.[0]?.toUpperCase() || "?";
  const userName = session.data?.user?.name || session.data?.user?.email || "User";

  if (!session.data?.user) {
    return (
      <Link
        href="/login"
        className="h-[28px] px-3 flex items-center rounded-md border border-control bg-surface-100 text-xs text-light hover:text-foreground hover:bg-surface-200 transition-colors"
      >
        Login
      </Link>
    );
  }

  return (
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
        onClick={() => void handleLogout()}
        className="h-[28px] shrink-0 px-2 flex items-center gap-2 text-xs text-light hover:text-foreground hover:bg-surface-200 rounded-md border border-transparent hover:border-control transition-colors"
        title="Logout"
        type="button"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden md:inline">Logout</span>
      </button>
    </>
  );
}
