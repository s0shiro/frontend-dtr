"use client";

import { useState } from "react";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";

interface ShellProps {
  children: React.ReactNode;
  breadcrumb?: string[];
}

export function Shell({ children, breadcrumb }: ShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MobileSidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      <main className="flex flex-1 flex-col overflow-hidden">
        <Navbar
          breadcrumb={breadcrumb}
          onMobileMenuToggle={() => setMobileSidebarOpen((current) => !current)}
        />
        <section className="flex-1 overflow-y-auto bg-200">{children}</section>
      </main>
    </div>
  );
}
