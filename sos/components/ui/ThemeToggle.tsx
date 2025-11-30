"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full p-4 bg-bg-elevated rounded-2xl border-2 border-border-default">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bg-active animate-pulse" />
            <div>
              <div className="h-4 w-20 bg-bg-active rounded animate-pulse" />
              <div className="h-3 w-32 bg-bg-active rounded mt-1 animate-pulse" />
            </div>
          </div>
          <div className="w-14 h-7 bg-bg-active rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <div className="w-full p-4 bg-bg-elevated rounded-2xl border-2 border-border-default hover:border-flame-primary/30 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: isDark ? "#3B82F620" : "#F59E0B20" }}
          >
            {isDark ? (
              <Moon className="w-5 h-5 text-blue-400" />
            ) : (
              <Sun className="w-5 h-5 text-amber-500" />
            )}
          </div>
          <div>
            <h4 className="font-bold text-text-primary">
              {isDark ? "Modo Escuro" : "Modo Claro"}
            </h4>
            <p className="text-xs text-text-tertiary">
              {isDark ? "Visual noturno ativado" : "Visual diurno ativado"}
            </p>
          </div>
        </div>

        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
            isDark ? "bg-blue-500/30" : "bg-amber-500/30"
          }`}
          aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
        >
          <div
            className={`absolute top-0.5 w-6 h-6 rounded-full transition-all duration-300 flex items-center justify-center ${
              isDark
                ? "left-0.5 bg-blue-500"
                : "left-[calc(100%-26px)] bg-amber-500"
            }`}
          >
            {isDark ? (
              <Moon className="w-3.5 h-3.5 text-white" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-white" />
            )}
          </div>
        </button>
      </div>
    </div>
  );
}
