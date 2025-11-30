"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, ExternalLink, AlertTriangle, Phone, FileText, Scale, Heart } from "lucide-react";
import { BackgroundCheckModal } from "@/components/safety/BackgroundCheckModal";

interface SafetyLink {
  title: string;
  description: string;
  url: string;
  icon: React.ReactNode;
  category: "prevention" | "emergency" | "research";
}

const safetyTools: SafetyLink[] = [
  {
    title: "Consultar Antecedentes Criminais",
    description: "Guia passo a passo para consultar antecedentes no GOV.BR (sem sair do app!)",
    url: "#background-check", // Será interceptado pelo onClick
    icon: <FileText className="w-8 h-8 text-[#E94057]" />,
    category: "research",
  },
  {
    title: "Disque 180 - Central de Atendimento",
    description: "Atendimento 24h para denúncias de violência contra mulher",
    url: "tel:180",
    icon: <Phone className="w-8 h-8 text-[#E94057]" />,
    category: "emergency",
  },
  {
    title: "Delegacia da Mulher Online (SP)",
    description: "Registre boletim de ocorrência online",
    url: "https://www.delegaciaeletronica.policiacivil.sp.gov.br",
    icon: <Shield className="w-8 h-8 text-[#E94057]" />,
    category: "emergency",
  },
  {
    title: "Medida Protetiva de Urgência",
    description: "Saiba como solicitar medida protetiva pela Lei Maria da Penha",
    url: "https://www.cnj.jus.br/programas-e-acoes/lei-maria-da-penha/",
    icon: <Scale className="w-8 h-8 text-[#E94057]" />,
    category: "prevention",
  },
];

const safetyTips = [
  "Conheça a pessoa em locais públicos nas primeiras vezes",
  "Compartilhe sua localização com amigos/família de confiança",
  "Confie nos seus instintos - se algo parecer errado, afaste-se",
  "Pesquise sobre a pessoa nas redes sociais (procure por red flags)",
  "Não compartilhe informações pessoais demais no início",
  "Evite consumir álcool em excesso em primeiros encontros",
  "Mantenha seu celular carregado e com créditos",
  "Tenha sempre um plano de saída (transporte, dinheiro)",
];

export default function SafetyPage() {
  const [showBackgroundCheckModal, setShowBackgroundCheckModal] = useState(false);

  return (
    <div className="min-h-screen p-4 md:p-8 bg-bg-base space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-hero flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display font-black text-3xl md:text-4xl gradient-text">
              Ferramentas de Segurança
            </h1>
            <p className="text-text-secondary">
              Recursos oficiais para sua proteção
            </p>
          </div>
        </div>
      </motion.div>

      {/* Aviso Importante */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-6"
      >
        <div className="flex gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
          <div className="space-y-2">
            <h3 className="font-bold text-amber-500">Importante</h3>
            <div className="text-sm text-text-secondary space-y-2">
              <p>
                A consulta de antecedentes criminais é um serviço oficial do governo brasileiro.
              </p>
              <p>
                <strong className="text-amber-400">Use com responsabilidade:</strong> A consulta só pode ser feita com
                autorização da pessoa ou em situações permitidas por lei. O uso indevido pode configurar crime.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Grid de Ferramentas */}
      <div className="space-y-4">
        <h2 className="font-display font-bold text-2xl text-text-primary">
          📞 Recursos Oficiais
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {safetyTools.map((tool, index) => {
            const isBackgroundCheck = tool.url === "#background-check";
            const Component = isBackgroundCheck ? "button" : "a";

            return (
              <motion.div
                key={tool.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Component
                  {...(isBackgroundCheck ? {
                    onClick: () => setShowBackgroundCheckModal(true),
                    type: "button"
                  } : {
                    href: tool.url,
                    target: "_blank",
                    rel: "noopener noreferrer"
                  })}
                  className="group w-full text-left rounded-2xl bg-gradient-to-br from-bg-elevated to-bg-secondary border border-border-default hover:border-[#E94057]/50 p-6 transition-all hover:scale-105 block"
                >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-bg-primary">
                  {tool.icon}
                </div>
                <ExternalLink className="w-5 h-5 text-text-tertiary group-hover:text-[#E94057] transition-colors" />
              </div>

              <h3 className="font-display font-bold text-xl text-text-primary mb-2">
                {tool.title}
              </h3>

              <p className="text-sm text-text-secondary mb-4">
                {tool.description}
              </p>

              <div className="inline-flex items-center gap-2 text-sm text-[#E94057] font-medium">
                {isBackgroundCheck ? "Abrir guia passo a passo" : "Acessar ferramenta"}
                <ExternalLink className="w-4 h-4" />
              </div>
                </Component>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Background Check Modal */}
      <BackgroundCheckModal
        isOpen={showBackgroundCheckModal}
        onClose={() => setShowBackgroundCheckModal(false)}
      />

      {/* Dicas de Segurança */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl bg-gradient-to-br from-bg-elevated to-bg-secondary border border-border-default p-6 md:p-8 space-y-6"
      >
        <h2 className="font-display font-bold text-2xl text-text-primary flex items-center gap-2">
          <Heart className="w-6 h-6 text-[#E94057]" />
          Dicas de Segurança em Relacionamentos
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          {safetyTips.map((tip, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.05 }}
              className="flex gap-3 items-start"
            >
              <div className="w-6 h-6 rounded-full bg-[#E94057]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[#E94057] text-sm font-bold">✓</span>
              </div>
              <span className="text-text-secondary text-sm">{tip}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Red Flags Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-2xl bg-gradient-to-br from-red-500/10 to-bg-secondary border border-red-500/30 p-6 md:p-8 space-y-6"
      >
        <h2 className="font-display font-bold text-2xl text-text-primary flex items-center gap-2">
          🚩 Red Flags em Relacionamentos
        </h2>

        <div className="space-y-3 text-text-secondary">
          <p className="text-sm">
            <strong className="text-red-400">Controle excessivo:</strong> Quer saber onde você está o tempo todo, com quem fala
          </p>
          <p className="text-sm">
            <strong className="text-red-400">Isolamento:</strong> Afasta você de amigos e família
          </p>
          <p className="text-sm">
            <strong className="text-red-400">Ciúmes extremos:</strong> Se irrita com qualquer interação sua com outras pessoas
          </p>
          <p className="text-sm">
            <strong className="text-red-400">Desrespeito:</strong> Menospreza, humilha ou faz piadas ofensivas
          </p>
          <p className="text-sm">
            <strong className="text-red-400">Promessas vazias:</strong> Sempre promete mudar mas nunca muda
          </p>
          <p className="text-sm">
            <strong className="text-red-400">Violência (qualquer tipo):</strong> Física, verbal, psicológica, sexual ou patrimonial
          </p>
        </div>

        <div className="rounded-xl bg-red-500/20 border border-red-500/30 p-4">
          <p className="text-sm text-red-400 font-medium">
            ⚠️ Se você identificou algum desses sinais, busque ajuda. Você não está sozinha.
            Ligue 180 ou procure uma Delegacia da Mulher.
          </p>
        </div>
      </motion.div>

      {/* Números de Emergência */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="rounded-2xl bg-gradient-hero/10 border border-[#E94057]/30 p-6 text-center space-y-4"
      >
        <h3 className="font-display font-bold text-xl text-text-primary">
          📞 Em caso de emergência
        </h3>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="tel:180"
            className="px-6 py-3 rounded-xl bg-gradient-hero text-white font-bold hover:opacity-90 transition-all"
          >
            Disque 180
          </a>
          <a
            href="tel:190"
            className="px-6 py-3 rounded-xl bg-bg-elevated border border-white/20 text-text-primary font-bold hover:bg-bg-primary transition-all"
          >
            Polícia Militar: 190
          </a>
          <a
            href="tel:192"
            className="px-6 py-3 rounded-xl bg-bg-elevated border border-white/20 text-text-primary font-bold hover:bg-bg-primary transition-all"
          >
            SAMU: 192
          </a>
        </div>
      </motion.div>
    </div>
  );
}
