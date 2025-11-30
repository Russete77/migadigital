"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, AlertCircle, Search, BookOpen, Settings, Heart, Shield, MessageCircle, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreditBadge } from "@/components/credits/CreditBadge";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Início" },
  { href: "/dashboard/emergency", icon: AlertCircle, label: "SOS Emocional" },
  { href: "/dashboard/analyzer", icon: Search, label: "Analisar Conversa" },
  { href: "/dashboard/journal", icon: BookOpen, label: "Diário Emocional" },
  { href: "/dashboard/community", icon: MessageCircle, label: "Comunidade" },
  { href: "/dashboard/safety", icon: Shield, label: "Segurança" },
  { href: "/dashboard/health-check", icon: Activity, label: "Health Check" },
  { href: "/dashboard/settings", icon: Settings, label: "Configurações" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-bg-secondary border-r border-border-default">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Logo */}
        <div className="flex flex-col gap-3 px-6 py-4 border-b border-border-default">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-hero rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg gradient-text">
              SOS Emocional
            </span>
          </Link>
          <CreditBadge />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                  isActive
                    ? "bg-flame-primary text-white"
                    : "text-text-secondary hover:bg-flame-primary/10 hover:text-flame-primary"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border-default">
          <p className="text-xs text-text-tertiary text-center">
            © 2024 SOS Emocional 24h
          </p>
        </div>
      </div>
    </aside>
  );
}
