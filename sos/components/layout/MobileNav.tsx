"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  AlertCircle,
  Search,
  MessageCircle,
  MoreHorizontal,
  X,
  BookOpen,
  Shield,
  Activity,
  Settings,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Itens principais da nav (4 + botão "mais")
const mainNavItems = [
  { href: "/dashboard", icon: Home, label: "Início" },
  { href: "/dashboard/emergency", icon: AlertCircle, label: "SOS", isEmergency: true },
  { href: "/dashboard/community", icon: MessageCircle, label: "Chat" },
  { href: "/dashboard/analyzer", icon: Search, label: "Análise" },
];

// Todos os itens do menu expandido
const allNavItems = [
  { href: "/dashboard", icon: Home, label: "Início" },
  { href: "/dashboard/emergency", icon: AlertCircle, label: "SOS Emocional", isEmergency: true },
  { href: "/dashboard/analyzer", icon: Search, label: "Analisar Conversa" },
  { href: "/dashboard/journal", icon: BookOpen, label: "Diário Emocional" },
  { href: "/dashboard/community", icon: MessageCircle, label: "Comunidade" },
  { href: "/dashboard/safety", icon: Shield, label: "Segurança" },
  { href: "/dashboard/health-check", icon: Activity, label: "Health Check" },
  { href: "/dashboard/settings", icon: Settings, label: "Configurações" },
];

export function MobileNav() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      {/* Menu Expandido */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99] md:hidden"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[100] bg-bg-primary rounded-t-3xl shadow-2xl md:hidden"
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1.5 bg-bg-active rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-hero rounded-xl flex items-center justify-center shadow-lg shadow-flame-primary/30">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="font-display font-bold text-lg text-text-primary">Menu</span>
                    <p className="text-xs text-text-tertiary">Navegação rápida</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="w-10 h-10 rounded-xl bg-bg-secondary flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Grid */}
              <div className="px-4 pb-4 grid grid-cols-4 gap-2 max-h-[50vh] overflow-y-auto">
                {allNavItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-2xl transition-all",
                        isActive
                          ? "bg-flame-primary/15"
                          : "bg-bg-secondary hover:bg-bg-elevated"
                      )}
                    >
                      <div
                        className={cn(
                          "w-11 h-11 rounded-xl flex items-center justify-center shadow-sm",
                          item.isEmergency
                            ? "bg-gradient-hero shadow-lg shadow-flame-primary/30"
                            : isActive
                            ? "bg-flame-primary shadow-md shadow-flame-primary/20"
                            : "bg-bg-elevated"
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-5 h-5",
                            item.isEmergency || isActive ? "text-white" : "text-text-primary"
                          )}
                        />
                      </div>
                      <span
                        className={cn(
                          "text-[11px] font-semibold text-center line-clamp-1",
                          isActive ? "text-flame-primary" : "text-text-secondary"
                        )}
                      >
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>

              {/* Safe area padding */}
              <div className="h-6" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-[98] bg-bg-secondary/95 backdrop-blur-lg border-t border-border-default h-[72px] flex items-center justify-around px-2 pb-safe md:hidden">
        {mainNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isEmergency) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 transition-all duration-200"
              >
                <div className="w-12 h-12 bg-gradient-hero rounded-full flex items-center justify-center shadow-red -mt-4">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] font-bold text-flame-primary">{item.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 transition-all duration-200 min-w-[60px]"
            >
              <Icon
                className={cn(
                  "w-6 h-6 transition-all",
                  isActive ? "text-flame-primary" : "text-text-tertiary"
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-flame-primary font-semibold" : "text-text-tertiary"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Botão Mais */}
        <button
          onClick={() => setIsMenuOpen(true)}
          className="flex flex-col items-center gap-1 transition-all duration-200 min-w-[60px]"
        >
          <MoreHorizontal className="w-6 h-6 text-text-tertiary" />
          <span className="text-[10px] font-medium text-text-tertiary">Mais</span>
        </button>
      </nav>
    </>
  );
}
