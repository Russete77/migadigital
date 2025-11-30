"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// API Routes são locais no Next.js
const API_URL = "";

export default function PricingPage() {
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleCheckout = async (tier: string) => {
    setIsLoading(tier);
    try {
      const token = await getToken();

      const response = await fetch(`${API_URL}/api/stripe/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tier }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-bg-base">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-display font-bold text-4xl gradient-text mb-4">
            Escolha Seu Plano
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Comece grátis e evolua quando precisar de mais
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PricingCard
            tier="free"
            name="Free"
            price="R$ 0"
            description="Para experimentar o SOS Emocional"
            features={[
              "3 análises de conversa/mês",
              "5 usos do botão SOS",
              "Áudios básicos",
              "Diário emocional ilimitado",
            ]}
            cta="Plano Atual"
            onCTA={() => {}}
            highlighted={false}
            isLoading={false}
            disabled={true}
          />

          <PricingCard
            tier="premium"
            name="Premium"
            price="R$ 39,90"
            description="Para quem quer suporte contínuo"
            features={[
              "15 análises/mês",
              "SOS ilimitado",
              "Todos os áudios",
              "Acesso à comunidade",
              "Suporte prioritário",
            ]}
            cta="Assinar Premium"
            onCTA={() => handleCheckout("premium")}
            highlighted={true}
            isLoading={isLoading === "premium"}
          />

          <PricingCard
            tier="pro"
            name="Pro"
            price="R$ 69,90"
            description="Tudo ilimitado + exclusividades"
            features={[
              "Análises ilimitadas",
              "SOS ilimitado",
              "Conteúdos exclusivos",
              "Lives mensais com Thiago",
              "Suporte VIP",
              "Badge de membro Pro",
            ]}
            cta="Assinar Pro"
            onCTA={() => handleCheckout("pro")}
            highlighted={false}
            isLoading={isLoading === "pro"}
          />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <div className="bg-gradient-hero text-text-primary rounded-2xl p-8 max-w-3xl mx-auto">
            <Zap className="w-12 h-12 mx-auto mb-4" />
            <h3 className="font-display font-bold text-2xl mb-3">
              Garantia de 7 Dias
            </h3>
            <p className="text-lg opacity-90">
              Não gostou? Devolvemos 100% do seu dinheiro, sem perguntas.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function PricingCard({
  tier,
  name,
  price,
  description,
  features,
  cta,
  onCTA,
  highlighted,
  isLoading,
  disabled = false,
}: {
  tier: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
  onCTA: () => void;
  highlighted: boolean;
  isLoading: boolean;
  disabled?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card
        className={`h-full flex flex-col ${
          highlighted
            ? "border-4 border-primary-600 shadow-2xl scale-105 relative"
            : "border-2"
        }`}
      >
        {highlighted && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-hero text-text-primary px-6 py-1 rounded-full text-sm font-bold">
            Mais Popular
          </div>
        )}
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{name}</CardTitle>
          <div className="mt-4 mb-2">
            <span className="text-5xl font-black font-accent gradient-text">
              {price}
            </span>
            {price !== "R$ 0" && (
              <span className="text-text-secondary">/mês</span>
            )}
          </div>
          <CardDescription className="text-base">{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <ul className="space-y-3 mb-6 flex-1">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
          <Button
            onClick={onCTA}
            disabled={disabled || isLoading}
            variant={highlighted ? "default" : "outline"}
            size="lg"
            className="w-full"
          >
            {isLoading ? "Processando..." : cta}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
