"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import confetti from "canvas-confetti";

// API Routes são locais no Next.js
const API_URL = "";

export function useDailyLogin() {
  const { getToken, isLoaded } = useAuth();
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    if (!isLoaded || hasProcessed) return;

    const processDailyLogin = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const response = await fetch(`${API_URL}/api/credits/daily-login`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          console.error("Error processing daily login");
          return;
        }

        const data = await response.json();

        // Se ganhou créditos hoje (primeiro login do dia)
        if (!data.already_logged_today && data.credits_earned > 0) {
          // Confetti celebration!
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#E94057", "#FF6B6B", "#FF8E53"],
          });

          // Toast com streak info
          toast.success(
            data.is_new_streak
              ? `Bem-vinda de volta! +${data.credits_earned} créditos 🔥`
              : `${data.streak_count} dias de streak! +${data.credits_earned} créditos 🔥`,
            {
              description: data.is_new_streak
                ? "Continue logando para construir seu streak!"
                : "Continue assim para ganhar ainda mais recompensas!",
              duration: 5000,
            }
          );

          // Atualizar badge de créditos (se existir)
          if (typeof window !== "undefined" && (window as any).updateCreditBalance) {
            (window as any).updateCreditBalance(data.balance, true);
          }
        }

        setHasProcessed(true);
      } catch (error) {
        console.error("Error in useDailyLogin:", error);
      }
    };

    processDailyLogin();
  }, [isLoaded, hasProcessed, getToken]);

  return { hasProcessed };
}
