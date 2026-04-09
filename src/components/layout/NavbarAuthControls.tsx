"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { signOut, useSession } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./ThemeToggle";

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
    <div className="flex shrink-0 items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex shrink-0 items-center gap-2 hover:bg-surface-200 px-2 py-1 rounded-md transition-colors border border-transparent hover:border-control">
            <div className="w-6 h-6 rounded-full bg-surface-300 border border-control flex items-center justify-center text-[10px] text-foreground font-medium">
              {userInitial}
            </div>
            <span className="hidden sm:inline text-xs text-light max-w-[160px] truncate">{userName}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-xs font-medium leading-none text-foreground">{userName}</p>
              <p className="text-[10px] leading-none text-light">
                {session.data.user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="px-1.5 py-1.5">
            <ThemeToggle />
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => void handleLogout()} className="text-destructive focus:text-destructive cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
