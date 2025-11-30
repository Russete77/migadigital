"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { AlertCircle, TrendingUp, Heart, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isPressed, setIsPressed] = useState(false);

  if (!isLoaded) {
    return <DashboardSkeleton />;
  }

  const handleSOSClick = () => {
    setIsPressed(true);
    setTimeout(() => {
      router.push("/dashboard/emergency");
    }, 300);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-bg-base">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-display font-black text-4xl md:text-5xl text-text-primary mb-3">
            Olá, {user?.firstName || "querida"}!
          </h1>
          <p className="text-text-secondary text-xl font-medium">
            Como você está se sentindo hoje?
          </p>
        </motion.div>

        {/* SOS Button - Estilo Tinder */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col items-center justify-center py-12 md:py-16"
        >
          <motion.button
            onClick={handleSOSClick}
            onTapStart={() => setIsPressed(true)}
            onTapCancel={() => setIsPressed(false)}
            className="emergency-button relative w-[280px] h-[280px] rounded-full flex flex-col items-center justify-center text-white cursor-pointer transition-all bg-gradient-hero shadow-2xl shadow-flame-primary/50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.4, 0.7, 0.4],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 rounded-full bg-flame-primary/30"
            />
            <AlertCircle className="w-20 h-20 md:w-24 md:h-24 mb-5 drop-shadow-lg" strokeWidth={2.5} />
            <span className="text-3xl md:text-4xl font-black font-display uppercase tracking-wide drop-shadow-lg">
              SOS
            </span>
            <span className="text-base md:text-lg font-bold mt-2 drop-shadow-md">
              Preciso de ajuda
            </span>
          </motion.button>
          <p className="text-text-secondary text-center mt-8 max-w-lg text-lg font-medium">
            Prestes a enviar aquela mensagem? Clique no botão e vamos conversar antes.
          </p>
        </motion.div>

        {/* Quick Stats - Cards estilo Tinder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          <StatCard
            icon={<Zap className="w-7 h-7" />}
            title="Créditos"
            value="3"
            subtitle="análises disponíveis"
            gradient="from-flame-primary to-flame-dark"
          />
          <StatCard
            icon={<Heart className="w-7 h-7" />}
            title="Sessões SOS"
            value="0"
            subtitle="intervenções realizadas"
            gradient="from-coral to-peach"
          />
          <StatCard
            icon={<TrendingUp className="w-7 h-7" />}
            title="Evolução"
            value="+0%"
            subtitle="humor esta semana"
            gradient="from-sunset to-flame-light"
          />
        </motion.div>

        {/* Quick Actions - Cards estilo Tinder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <h2 className="font-display font-black text-3xl mb-6 text-text-primary">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <QuickActionCard
              title="Analisar Conversa"
              description="Envie prints e descubra o que realmente está acontecendo"
              href="/dashboard/analyzer"
              icon={<AlertCircle className="w-10 h-10" />}
              gradient="from-flame-primary to-flame-dark"
            />
            <QuickActionCard
              title="Diário Emocional"
              description="Registre como você está se sentindo hoje"
              href="/dashboard/journal"
              icon={<Heart className="w-10 h-10" />}
              gradient="from-sunset to-flame-light"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  subtitle,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  gradient: string;
}) {
  return (
    <Card className="rounded-3xl transition-all duration-300 hover:-translate-y-1">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-text-tertiary font-semibold mb-2 uppercase tracking-wide">{title}</p>
            <p className="text-4xl font-black text-text-primary mb-1">{value}</p>
            <p className="text-sm text-text-secondary font-medium">{subtitle}</p>
          </div>
          <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center text-white`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionCard({
  title,
  description,
  href,
  icon,
  gradient,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  gradient: string;
}) {
  const router = useRouter();

  return (
    <Card
      className="cursor-pointer transition-all duration-300 group rounded-3xl hover:-translate-y-1"
      onClick={() => router.push(href)}
    >
      <CardHeader>
        <div className="flex items-start gap-5">
          <div className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center text-white flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg`}>
            {icon}
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl font-black mb-2 text-text-primary">{title}</CardTitle>
            <CardDescription className="text-base font-medium text-text-secondary">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="flex justify-center">
          <Skeleton className="w-[200px] h-[200px] md:w-[280px] md:h-[280px] rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </div>
  );
}
