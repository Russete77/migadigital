"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, FileText, AlertCircle, CheckCircle2, ChevronRight, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface BackgroundCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BackgroundCheckModal({ isOpen, onClose }: BackgroundCheckModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [copiedCPF, setCopiedCPF] = useState(false);

  const steps = [
    {
      title: "Prepare as Informações",
      description: "Você vai precisar dos seguintes dados da pessoa:",
      icon: <FileText className="w-8 h-8 text-[#E94057]" />,
      content: (
        <div className="space-y-4">
          <div className="rounded-xl bg-bg-primary p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#E94057]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[#E94057] text-sm font-bold">1</span>
              </div>
              <div>
                <p className="font-medium text-text-primary">Nome completo</p>
                <p className="text-sm text-text-tertiary">Exatamente como está no documento</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#E94057]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[#E94057] text-sm font-bold">2</span>
              </div>
              <div>
                <p className="font-medium text-text-primary">CPF</p>
                <p className="text-sm text-text-tertiary">Somente números</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#E94057]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[#E94057] text-sm font-bold">3</span>
              </div>
              <div>
                <p className="font-medium text-text-primary">Data de nascimento</p>
                <p className="text-sm text-text-tertiary">Dia, mês e ano</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-400">
              <strong>Importante:</strong> Certifique-se de ter autorização da pessoa
              para fazer essa consulta. O uso indevido pode ser crime.
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Acesse o Portal GOV.BR",
      description: "Vamos abrir o site oficial do governo em uma nova aba",
      icon: <ExternalLink className="w-8 h-8 text-[#E94057]" />,
      content: (
        <div className="space-y-4">
          <p className="text-text-secondary">
            Clique no botão abaixo para abrir o portal de antecedentes criminais
            do governo em uma nova aba do seu navegador.
          </p>

          <div className="rounded-xl bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/30 p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <p className="font-bold text-text-primary mb-2">Site Oficial do Governo</p>
              <p className="text-sm text-text-tertiary">
                https://www.gov.br
              </p>
            </div>

            <a
              href="https://www.gov.br/pt-br/servicos/obter-certidao-de-antecedentes-criminais"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-hero text-white font-bold hover:opacity-90 transition-all"
              onClick={() => setCurrentStep(2)}
            >
              Abrir Portal GOV.BR
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>

          <div className="rounded-xl bg-bg-primary p-4">
            <p className="text-sm text-text-secondary">
              💡 <strong className="text-text-primary">Dica:</strong> Organize as duas
              janelas lado a lado na tela para facilitar.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Preencha o Formulário",
      description: "Siga os passos no site do governo",
      icon: <FileText className="w-8 h-8 text-[#E94057]" />,
      content: (
        <div className="space-y-4">
          <p className="text-text-secondary">
            No site do GOV.BR, você verá um formulário. Preencha com os dados:
          </p>

          <div className="space-y-3">
            <div className="rounded-xl bg-bg-primary p-4 border-l-4 border-[#E94057]">
              <p className="font-medium text-text-primary mb-2">1. Selecione o tipo de certidão</p>
              <p className="text-sm text-text-tertiary">
                Escolha "Pessoa Física"
              </p>
            </div>

            <div className="rounded-xl bg-bg-primary p-4 border-l-4 border-[#E94057]">
              <p className="font-medium text-text-primary mb-2">2. Informe os dados pessoais</p>
              <p className="text-sm text-text-tertiary">
                Nome completo, CPF e data de nascimento
              </p>
            </div>

            <div className="rounded-xl bg-bg-primary p-4 border-l-4 border-[#E94057]">
              <p className="font-medium text-text-primary mb-2">3. Resolva o captcha</p>
              <p className="text-sm text-text-tertiary">
                Digite os caracteres mostrados na imagem
              </p>
            </div>

            <div className="rounded-xl bg-bg-primary p-4 border-l-4 border-emerald-500">
              <p className="font-medium text-text-primary mb-2">4. Clique em "Consultar"</p>
              <p className="text-sm text-text-tertiary">
                O resultado aparecerá em alguns segundos
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-blue-500/10 border border-blue-500/30 p-4">
            <p className="text-sm text-blue-400">
              ℹ️ <strong>Atenção:</strong> A certidão pode levar alguns minutos
              para ser gerada. Aguarde pacientemente.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Interprete o Resultado",
      description: "Entenda o que significa cada tipo de resultado",
      icon: <CheckCircle2 className="w-8 h-8 text-emerald-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-text-secondary mb-4">
            A certidão mostrará um dos seguintes resultados:
          </p>

          <div className="space-y-3">
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4">
              <div className="flex items-start gap-3 mb-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="font-bold text-emerald-500">NADA CONSTA</p>
                  <p className="text-sm text-text-secondary mt-1">
                    A pessoa não possui antecedentes criminais na Justiça Federal.
                    Isso é um bom sinal! ✅
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4">
              <div className="flex items-start gap-3 mb-2">
                <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0" />
                <div>
                  <p className="font-bold text-amber-500">CONSTA PROCESSO</p>
                  <p className="text-sm text-text-secondary mt-1">
                    A pessoa tem ou teve processos. Leia atentamente os detalhes
                    para entender a natureza e status.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-blue-500/10 border border-blue-500/30 p-4">
              <div className="flex items-start gap-3 mb-2">
                <FileText className="w-6 h-6 text-blue-500 flex-shrink-0" />
                <div>
                  <p className="font-bold text-blue-500">IMPORTANTE SABER:</p>
                  <ul className="text-sm text-text-secondary mt-2 space-y-1">
                    <li>• Essa certidão é apenas da Justiça Federal</li>
                    <li>• Não inclui Justiça Estadual (crimes comuns)</li>
                    <li>• Para informação completa, consulte também estadual</li>
                    <li>• Antecedentes não definem a pessoa hoje</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/30 p-4">
            <p className="text-sm text-text-secondary">
              💜 <strong className="text-text-primary">Lembre-se:</strong> Use essa
              informação com sabedoria e empatia. Todos merecem uma segunda chance.
            </p>
          </div>
        </div>
      ),
    },
  ];

  const handleCopyURL = () => {
    navigator.clipboard.writeText("https://www.gov.br/pt-br/servicos/obter-certidao-de-antecedentes-criminais");
    setCopiedCPF(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedCPF(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-gradient-to-br from-bg-secondary to-bg-elevated rounded-3xl p-6 md:p-8 max-w-3xl w-full border border-border-default shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-bg-primary/50 hover:bg-bg-primary transition-colors z-10"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="font-display font-black text-3xl gradient-text mb-2">
              Consulta de Antecedentes
            </h2>
            <p className="text-text-secondary">
              Guia passo a passo para consultar no GOV.BR
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? "w-12 bg-gradient-hero"
                    : index < currentStep
                    ? "w-8 bg-emerald-500"
                    : "w-8 bg-bg-primary"
                }`}
              />
            ))}
          </div>

          {/* Current Step */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Step Icon */}
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-gradient-hero/10 border border-[#E94057]/30">
                {steps[currentStep].icon}
              </div>
              <div>
                <p className="text-sm text-text-tertiary">
                  Passo {currentStep + 1} de {steps.length}
                </p>
                <h3 className="font-display font-bold text-2xl text-text-primary">
                  {steps[currentStep].title}
                </h3>
                <p className="text-text-secondary text-sm">
                  {steps[currentStep].description}
                </p>
              </div>
            </div>

            {/* Step Content */}
            {steps[currentStep].content}
          </motion.div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border-default">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="px-6 py-3 rounded-xl bg-bg-elevated border border-border-default hover:border-flame-primary/30 disabled:opacity-50 disabled:cursor-not-allowed text-text-primary font-medium transition-all"
            >
              Voltar
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={handleCopyURL}
                className="p-3 rounded-xl bg-bg-elevated border border-border-default hover:border-flame-primary/30 transition-all"
                title="Copiar link do GOV.BR"
              >
                {copiedCPF ? (
                  <Check className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Copy className="w-5 h-5 text-text-secondary" />
                )}
              </button>

              {currentStep < steps.length - 1 ? (
                <button
                  onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                  className="px-6 py-3 rounded-xl bg-gradient-hero text-white font-bold hover:opacity-90 transition-all flex items-center gap-2"
                >
                  Próximo
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all"
                >
                  Concluir
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
