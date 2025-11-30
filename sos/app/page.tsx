"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Shield, MessageCircle, TrendingUp, Zap, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Navigation - Estilo Tinder */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-secondary/95 backdrop-blur-md shadow-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-hero rounded-2xl flex items-center justify-center shadow-red">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span className="font-display font-black text-xl gradient-text">
                SOS Emocional 24h
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/sign-in">
                <Button variant="ghost" size="sm" className="font-semibold">
                  Entrar
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm" className="bg-gradient-hero text-white font-bold shadow-red hover:scale-105 transition-transform">
                  Começar Agora
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Estilo Tinder */}
      <section className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-bg-primary">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-hero opacity-5"></div>

        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="font-display font-black text-5xl sm:text-6xl lg:text-7xl mb-6 leading-tight text-text-primary">
              Seu escudo contra decisões que{" "}
              <span className="gradient-text">você vai se arrepender</span>
            </h1>
            <p className="text-xl sm:text-2xl text-text-secondary max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
              Intervenção emocional com IA 24h. Evite mensagens impulsivas,
              analise conversas e identifique red flags antes de se machucar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link href="/sign-up">
                <Button size="lg" className="bg-gradient-hero text-white font-black text-lg px-10 py-7 rounded-3xl shadow-red hover:scale-105 transition-all">
                  <Zap className="w-6 h-6 mr-2" />
                  Começar Grátis Agora
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="font-bold text-lg px-10 py-7 rounded-3xl border-2 border-primary hover:bg-primary-50 transition-all">
                Ver Como Funciona
              </Button>
            </div>
            <p className="text-sm text-text-tertiary font-medium">
              3 análises grátis • Sem cartão de crédito • Cancele quando quiser
            </p>
          </motion.div>

          {/* Hero Image - Card estilo Tinder */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-20 rounded-3xl bg-bg-secondary border border-white/10 shadow-xl p-4 sm:p-8 max-w-5xl mx-auto"
          >
            <div className="aspect-video bg-gradient-hero rounded-2xl flex items-center justify-center overflow-hidden">
              <div className="text-center text-white">
                <MessageCircle className="w-20 h-20 mx-auto mb-6 opacity-90" />
                <p className="text-2xl font-black">App Screenshot Preview</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section - Cards estilo Tinder */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-bg-primary">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-display font-black text-4xl sm:text-5xl mb-5 text-text-primary">
              Como o SOS Emocional te protege
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto font-medium">
              Ferramentas práticas para você retomar o controle emocional
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Shield className="w-10 h-10" />}
              title="Botão SOS de Emergência"
              description="Prestes a enviar aquela mensagem? Acione o SOS e converse com a IA antes de fazer algo que vai se arrepender."
              color="red"
            />
            <FeatureCard
              icon={<MessageCircle className="w-10 h-10" />}
              title="Análise de Conversas"
              description="Envie prints das conversas e receba análise detalhada: nível de interesse, red flags, manipulação e o que fazer."
              color="orange"
            />
            <FeatureCard
              icon={<TrendingUp className="w-10 h-10" />}
              title="Diário Emocional"
              description="Registre seus sentimentos, identifique padrões e acompanhe sua evolução emocional ao longo do tempo."
              color="pink"
            />
            <FeatureCard
              icon={<Heart className="w-10 h-10" />}
              title="Biblioteca de Áudios"
              description="Áudios exclusivos do Thiago Lins para emergências, autoestima, estratégia e superação."
              color="red"
            />
            <FeatureCard
              icon={<Users className="w-10 h-10" />}
              title="Comunidade 24h"
              description="Converse anonimamente com outras mulheres que estão passando pela mesma situação agora."
              color="orange"
            />
            <FeatureCard
              icon={<Zap className="w-10 h-10" />}
              title="IA com Personalidade"
              description="Não é um robô genérico. É o método e a voz do Thiago Lins disponível 24h no seu bolso."
              color="pink"
            />
          </div>
        </div>
      </section>

      {/* Social Proof Section - Gradiente Tinder */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-hero text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl mb-8">
              Baseado no método de +1M de seguidores
            </h2>
            <p className="text-xl sm:text-2xl mb-12 opacity-95 font-medium">
              Thiago Lins (@tl.marques) ajudou milhões de mulheres a retomarem
              seu poder pessoal. Agora, esse conhecimento está disponível 24h para você.
            </p>
            <div className="grid grid-cols-3 gap-8 sm:gap-12 mt-16">
              <Stat value="1M+" label="Seguidores" />
              <Stat value="10 anos" label="de Experiência" />
              <Stat value="24/7" label="Disponível" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-bg-primary">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-display font-bold text-4xl sm:text-5xl mb-4">
            Comece grátis, evolua quando quiser
          </h2>
          <p className="text-xl text-text-secondary mb-12">
            3 análises grátis para você testar. Depois, escolha o plano ideal.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <PricingCard
              tier="Free"
              price="R$ 0"
              features={["3 análises/mês", "5 usos do SOS", "Áudios básicos"]}
              cta="Começar Grátis"
              highlighted={false}
            />
            <PricingCard
              tier="Premium"
              price="R$ 39,90"
              features={["15 análises/mês", "SOS ilimitado", "Todos os áudios", "Comunidade"]}
              cta="Assinar Premium"
              highlighted={true}
            />
            <PricingCard
              tier="Pro"
              price="R$ 69,90"
              features={["Tudo ilimitado", "Lives mensais", "Conteúdo exclusivo", "Suporte VIP"]}
              cta="Assinar Pro"
              highlighted={false}
            />
          </div>
        </div>
      </section>

      {/* CTA Final - Estilo Tinder */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-black/5"></div>
        <div className="max-w-4xl mx-auto text-center text-white relative z-10">
          <h2 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl mb-8">
            Pare de se diminuir. Comece a se valorizar.
          </h2>
          <p className="text-xl sm:text-2xl mb-10 opacity-95 font-medium">
            Você merece mais do que migalhas emocionais.
            Dê o primeiro passo agora.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="bg-white text-primary font-black text-lg px-12 py-7 rounded-3xl shadow-tinder-xl hover:scale-105 transition-all">
              Começar Minha Jornada Agora
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-bg-secondary border-t border-white/10 text-text-primary">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-hero rounded-full flex items-center justify-center">
                  <Heart className="w-4 h-4 text-text-primary" />
                </div>
                <span className="font-display font-bold">SOS Emocional</span>
              </div>
              <p className="text-sm opacity-75">
                Seu escudo contra decisões que você vai se arrepender.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm opacity-75">
                <li><Link href="#">Funcionalidades</Link></li>
                <li><Link href="#">Preços</Link></li>
                <li><Link href="#">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm opacity-75">
                <li><Link href="#">Termos de Uso</Link></li>
                <li><Link href="#">Privacidade</Link></li>
                <li><Link href="#">Contato</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Redes Sociais</h4>
              <ul className="space-y-2 text-sm opacity-75">
                <li><a href="https://instagram.com/tl.marques" target="_blank" rel="noopener noreferrer">Instagram</a></li>
                <li><a href="#" target="_blank" rel="noopener noreferrer">TikTok</a></li>
                <li><a href="#" target="_blank" rel="noopener noreferrer">YouTube</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-sm opacity-75">
            <p>&copy; 2024 SOS Emocional 24h. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: "red" | "orange" | "pink";
}) {
  const gradients = {
    red: "bg-gradient-to-br from-tinder-red to-primary-600",
    orange: "bg-gradient-to-br from-tinder-orange to-secondary-600",
    pink: "bg-gradient-to-br from-tinder-pink to-accent-600",
  };

  const shadows = {
    red: "shadow-red",
    orange: "shadow-orange",
    pink: "shadow-pink",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
    >
      <Card className="h-full hover:shadow-lg transition-all duration-300 rounded-3xl shadow-md bg-bg-secondary border border-white/10">
        <CardHeader className="space-y-4">
          <div className={`w-16 h-16 ${gradients[color]} rounded-2xl flex items-center justify-center text-white ${shadows[color]}`}>
            {icon}
          </div>
          <CardTitle className="text-xl font-black text-text-primary">{title}</CardTitle>
          <CardDescription className="text-base text-text-secondary font-medium leading-relaxed">
            {description}
          </CardDescription>
        </CardHeader>
      </Card>
    </motion.div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display font-black text-5xl sm:text-6xl mb-3 drop-shadow-lg">{value}</div>
      <div className="text-lg sm:text-xl font-medium opacity-95">{label}</div>
    </div>
  );
}

function PricingCard({
  tier,
  price,
  features,
  cta,
  highlighted,
}: {
  tier: string;
  price: string;
  features: string[];
  cta: string;
  highlighted: boolean;
}) {
  return (
    <Card className={`rounded-3xl shadow-md transition-all duration-300 hover:shadow-lg bg-bg-secondary border border-white/10 ${
      highlighted
        ? "ring-4 ring-flame-primary scale-105 shadow-glow"
        : "hover:scale-105"
    }`}>
      <CardHeader className="space-y-4">
        <CardTitle className="text-2xl font-black text-text-primary">{tier}</CardTitle>
        <div className="mt-4">
          <span className="text-5xl font-black gradient-text">{price}</span>
          <span className="text-text-secondary font-semibold text-lg">/mês</span>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4 mb-8">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3">
              <Heart className="w-5 h-5 text-flame-primary flex-shrink-0 mt-1" />
              <span className="text-sm font-medium text-text-secondary">{feature}</span>
            </li>
          ))}
        </ul>
        <Button
          variant={highlighted ? "default" : "outline"}
          className={`w-full rounded-2xl font-bold text-base py-6 transition-all ${
            highlighted
              ? "bg-gradient-hero text-white shadow-glow hover:scale-105"
              : "border-2 border-flame-primary text-flame-primary hover:bg-bg-elevated"
          }`}
          size="lg"
        >
          {cta}
        </Button>
      </CardContent>
    </Card>
  );
}
