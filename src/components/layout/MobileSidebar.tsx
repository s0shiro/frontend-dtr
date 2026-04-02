"use client";

import Link from "next/link";
import { History, Home } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { href: "/", label: "Overview", icon: Home },
  { href: "/history", label: "History", icon: History },
];

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <SheetContent side="left" className="w-[240px] p-0 md:hidden print:hidden" showCloseButton={false}>
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation menu</SheetTitle>
        </SheetHeader>

        <div className="flex h-10 items-center border-b border-control px-3">
          <span className="text-xs font-medium text-foreground">DTR Project</span>
        </div>

        <nav className="px-2 py-3" aria-label="Main navigation">
          <p className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-light">Navigation</p>
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center rounded-md border border-transparent px-3 py-1.5 text-xs text-light no-underline transition-colors hover:border-control hover:bg-surface-200 hover:text-foreground"
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="ml-2">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}