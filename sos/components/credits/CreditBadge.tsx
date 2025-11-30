"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

// API Routes são locais no Next.js
const API_URL = "";

export function CreditBadge() {
  const { getToken } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/credits/balance`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Erro ao buscar saldo");

      const data = await response.json();
      setBalance(data.balance);
    } catch (error) {
      console.error("Error fetching credit balance:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para atualizar saldo (pode ser chamada por outras páginas)
  const updateBalance = (newBalance: number, showAnim = false) => {
    setBalance(newBalance);
    if (showAnim) {
      setShowAnimation(true);
      setTimeout(() => setShowAnimation(false), 1000);
    }
  };

  // Expor função globalmente para ser chamada de outras páginas
  useEffect(() => {
    (window as any).updateCreditBalance = updateBalance;
    return () => {
      delete (window as any).updateCreditBalance;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="px-4 py-2 bg-bg-secondary border border-border-default rounded-full animate-pulse">
        <div className="w-12 h-4 bg-bg-active rounded" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 1 }}
      animate={{ scale: showAnimation ? [1, 1.2, 1] : 1 }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-bg-secondary to-bg-elevated border-2 border-border-default hover:border-flame-primary/50 rounded-full transition-all cursor-pointer group">
        <div className="relative">
          <Sparkles className="w-4 h-4 text-flame-primary" />
          <AnimatePresence>
            {showAnimation && (
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 border-2 border-flame-primary rounded-full"
              />
            )}
          </AnimatePresence>
        </div>
        <span className="text-sm font-bold font-display text-text-primary">
          {balance !== null ? balance : "..."}
        </span>
        <span className="text-xs text-text-tertiary font-medium hidden sm:inline">
          créditos
        </span>
      </div>

      {/* Tooltip on hover */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-bg-elevated border border-border-default rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        <p className="text-xs text-text-secondary font-medium">
          Ganhe créditos diários fazendo login e escrevendo no diário!
        </p>
      </div>
    </motion.div>
  );
}
