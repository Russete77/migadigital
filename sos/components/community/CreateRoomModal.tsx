"use client";

import { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, Lock, Clock, Users, Sparkles } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ROOM_TEMPLATES, POPULAR_TAGS, RoomTemplate } from "@/lib/constants/room-templates";

// API Routes são locais no Next.js
const API_URL = "";

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated?: () => void;
}

export function CreateRoomModal({ isOpen, onClose, onRoomCreated }: CreateRoomModalProps) {
  const { getToken } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<RoomTemplate | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [expiresInHours, setExpiresInHours] = useState(24);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const templates = Object.values(ROOM_TEMPLATES).filter(t => t.id !== 'custom');

  const handleTemplateSelect = (template: RoomTemplate) => {
    setSelectedTemplate(template);
    setName(template.name);
    setDescription(template.description);
    setSelectedTags(template.tags);
    setIsAnonymous(template.isAnonymous);
    setExpiresInHours(template.expiresInHours);
    setStep(2);
  };

  const handleCustom = () => {
    setSelectedTemplate(ROOM_TEMPLATES.custom);
    setName("");
    setDescription("");
    setSelectedTags([]);
    setIsAnonymous(false);
    setExpiresInHours(48);
    setStep(2);
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || name.length < 3) {
      toast.error("Nome deve ter pelo menos 3 caracteres");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await getToken();

      const response = await fetch(`${API_URL}/api/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          template: selectedTemplate?.id || "custom",
          tags: selectedTags,
          isAnonymous,
          password: password || undefined,
          expiresInHours,
          maxMembers: selectedTemplate?.maxMembers || 50,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao criar sala");
      }

      const data = await response.json();

      toast.success("Sala criada com sucesso! 🎉");

      // Reset
      setStep(1);
      setSelectedTemplate(null);
      setName("");
      setDescription("");
      setSelectedTags([]);
      setPassword("");

      onClose();
      if (onRoomCreated) onRoomCreated();
    } catch (error: any) {
      console.error("Error creating room:", error);
      toast.error(error.message || "Erro ao criar sala");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-bg-secondary border-2 border-border-default p-6 text-left align-middle shadow-tinder-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="font-display font-black text-2xl gradient-text">
                    {step === 1 ? "Criar Círculo Secreto" : "Personalizar Sala"}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-text-tertiary hover:text-text-primary transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Step 1: Template Selection */}
                {step === 1 && (
                  <div className="space-y-4">
                    <p className="text-text-secondary text-sm mb-4">
                      Escolha um template ou crie uma sala personalizada
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      {templates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleTemplateSelect(template)}
                          className="p-4 bg-bg-elevated border-2 border-border-default hover:border-flame-primary/50 rounded-2xl text-left transition-all group"
                        >
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3"
                            style={{ backgroundColor: template.color + "20" }}
                          >
                            {template.icon}
                          </div>
                          <h4 className="font-display font-bold text-text-primary mb-1 group-hover:text-flame-primary transition-colors">
                            {template.name}
                          </h4>
                          <p className="text-xs text-text-tertiary line-clamp-2">
                            {template.description}
                          </p>
                          <div className="flex items-center gap-2 mt-3 text-xs text-text-tertiary">
                            <Clock className="w-3 h-3" />
                            {template.expiresInHours < 24
                              ? `${template.expiresInHours}h`
                              : `${template.expiresInHours / 24}d`}
                          </div>
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={handleCustom}
                      className="w-full p-4 bg-gradient-hero text-white rounded-2xl font-bold shadow-red hover:scale-105 transition-transform flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-5 h-5" />
                      Criar Sala Personalizada
                    </button>
                  </div>
                )}

                {/* Step 2: Customization */}
                {step === 2 && (
                  <div className="space-y-4">
                    {/* Nome */}
                    <div>
                      <label className="block text-sm font-bold text-text-primary mb-2">
                        Nome da Sala *
                      </label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Desabafos sobre ansiedade"
                        maxLength={50}
                        className="bg-bg-elevated border-2 border-border-default focus:border-flame-primary"
                      />
                      <p className="text-xs text-text-tertiary mt-1">{name.length}/50</p>
                    </div>

                    {/* Descrição */}
                    <div>
                      <label className="block text-sm font-bold text-text-primary mb-2">
                        Descrição (opcional)
                      </label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Descreva o propósito da sala..."
                        maxLength={200}
                        className="bg-bg-elevated border-2 border-border-default focus:border-flame-primary resize-none"
                        rows={3}
                      />
                      <p className="text-xs text-text-tertiary mt-1">{description.length}/200</p>
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-bold text-text-primary mb-2">
                        Tags
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {POPULAR_TAGS.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                              selectedTags.includes(tag)
                                ? "bg-gradient-hero text-white shadow-red"
                                : "bg-bg-elevated text-text-secondary border border-border-default hover:border-flame-primary/50"
                            }`}
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Configurações */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Anônimo */}
                      <div className="p-4 bg-bg-elevated rounded-2xl border-2 border-border-default">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500" />
                            <span className="text-sm font-bold text-text-primary">Anônima</span>
                          </div>
                          <button
                            onClick={() => setIsAnonymous(!isAnonymous)}
                            className={`w-12 h-6 rounded-full transition-colors ${
                              isAnonymous ? "bg-flame-primary" : "bg-bg-elevated border border-border-default"
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full bg-bg-primary shadow-md border border-border-default transition-transform ${
                                isAnonymous ? "translate-x-6" : "translate-x-0.5"
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Expiração */}
                      <div className="p-4 bg-bg-elevated rounded-2xl border-2 border-border-default">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-flame-primary" />
                          <span className="text-sm font-bold text-text-primary">Expira em</span>
                        </div>
                        <select
                          value={expiresInHours}
                          onChange={(e) => setExpiresInHours(Number(e.target.value))}
                          className="w-full bg-bg-secondary text-text-primary text-sm rounded-lg px-2 py-1 border border-border-default"
                        >
                          <option value={1}>1 hora</option>
                          <option value={6}>6 horas</option>
                          <option value={24}>1 dia</option>
                          <option value={48}>2 dias</option>
                          <option value={72}>3 dias</option>
                          <option value={168}>1 semana</option>
                        </select>
                      </div>
                    </div>

                    {/* Senha (opcional) */}
                    <div>
                      <label className="block text-sm font-bold text-text-primary mb-2">
                        Senha (opcional)
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                        <Input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Deixe em branco para sala pública"
                          className="bg-bg-elevated border-2 border-border-default focus:border-flame-primary pl-10"
                        />
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={() => setStep(1)}
                        variant="outline"
                        className="flex-1 border-2"
                        disabled={isSubmitting}
                      >
                        Voltar
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !name.trim() || name.length < 3}
                        className="flex-1 bg-gradient-hero text-white font-bold shadow-red hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                      >
                        {isSubmitting ? "Criando..." : "Criar Sala"}
                      </Button>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
