"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { LogOut, Crown, Zap, Calendar, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = () => {
    signOut(() => router.push("/"));
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-bg-base">
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display font-bold text-3xl gradient-text mb-2">
            Configurações
          </h1>
          <p className="text-text-secondary">
            Gerencie sua conta e assinatura
          </p>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-bg-secondary border border-border-default">
            <CardHeader>
              <CardTitle className="text-text-primary">Perfil</CardTitle>
              <CardDescription className="text-text-secondary">Suas informações pessoais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                {user?.imageUrl && (
                  <img
                    src={user.imageUrl}
                    alt={user.fullName || "Avatar"}
                    className="w-16 h-16 rounded-full border-2 border-border-default"
                  />
                )}
                <div>
                  <h3 className="font-semibold text-lg text-text-primary">
                    {user?.fullName || "Usuária"}
                  </h3>
                  <p className="text-sm text-text-tertiary">
                    {user?.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Appearance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="bg-bg-secondary border border-border-default">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-text-primary">
                <Palette className="w-5 h-5 text-flame-primary" />
                Aparência
              </CardTitle>
              <CardDescription className="text-text-secondary">Personalize a interface do app</CardDescription>
            </CardHeader>
            <CardContent>
              <ThemeToggle />
            </CardContent>
          </Card>
        </motion.div>

        {/* Subscription Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="bg-bg-secondary border border-border-default">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-text-primary">
                <Crown className="w-5 h-5 text-flame-primary" />
                Assinatura
              </CardTitle>
              <CardDescription className="text-text-secondary">Seu plano atual e uso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg text-text-primary">Plano Free</p>
                  <p className="text-sm text-text-tertiary">
                    Experimente todas as funcionalidades básicas
                  </p>
                </div>
                <Badge variant="secondary">Free</Badge>
              </div>

              <div className="border-t border-border-default pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium flex items-center gap-2 text-text-secondary">
                    <Zap className="w-4 h-4 text-flame-primary" />
                    Créditos de Análise
                  </span>
                  <span className="font-bold text-flame-primary">3 / 3</span>
                </div>
                <div className="w-full bg-bg-elevated rounded-full h-2">
                  <div
                    className="bg-gradient-hero h-2 rounded-full"
                    style={{ width: "100%" }}
                  />
                </div>
                <p className="text-xs text-text-tertiary mt-1">
                  Redefine todo mês
                </p>
              </div>

              <div className="border-t border-border-default pt-4">
                <Button
                  onClick={() => router.push("/dashboard/pricing")}
                  className="w-full bg-gradient-hero text-white"
                  size="lg"
                >
                  <Crown className="w-5 h-5 mr-2" />
                  Fazer Upgrade
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Usage Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="bg-bg-secondary border border-border-default">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-text-primary">
                <Calendar className="w-5 h-5" />
                Estatísticas de Uso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatItem label="Sessões SOS" value="0" />
                <StatItem label="Análises" value="0" />
                <StatItem label="Entradas no Diário" value="0" />
                <StatItem label="Áudios Ouvidos" value="0" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Card className="bg-bg-secondary border border-danger/30">
            <CardHeader>
              <CardTitle className="text-danger">Conta</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="gap-2 border-danger/30 text-danger hover:bg-danger/10"
              >
                <LogOut className="w-4 h-4" />
                Sair da Conta
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold font-accent text-flame-primary">{value}</p>
      <p className="text-xs text-text-tertiary mt-1">{label}</p>
    </div>
  );
}
