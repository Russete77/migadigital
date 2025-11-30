"use client";

import { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { useDailyLogin } from "@/hooks/useDailyLogin";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  // Process daily login reward automatically
  useDailyLogin();

  return (
    <div className="h-screen bg-bg-primary">
      <Sidebar />
      <div className="md:pl-64 flex flex-col h-full">
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
