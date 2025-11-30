"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Calendar, Heart, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// API Routes são locais no Next.js
const API_URL = "";

interface JournalEntry {
  id: string;
  content: string;
  mood: number | null;
  emotions: string[];
  created_at: string;
}

export default function JournalPage() {
  const { getToken } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newEntry, setNewEntry] = useState("");
  const [mood, setMood] = useState(5);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const emotions = [
    "Ansiosa",
    "Triste",
    "Feliz",
    "Raiva",
    "Confusa",
    "Esperançosa",
    "Frustrada",
    "Aliviada",
  ];

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/journal`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Erro ao carregar entradas");

      const data = await response.json();
      setEntries(data);
    } catch (error) {
      console.error("Error fetching entries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions((prev) =>
      prev.includes(emotion)
        ? prev.filter((e) => e !== emotion)
        : [...prev, emotion]
    );
  };

  const handleSave = async () => {
    if (!newEntry.trim() || isSaving) return;

    setIsSaving(true);

    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/journal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newEntry,
          mood,
          emotions: selectedEmotions,
        }),
      });

      if (!response.ok) throw new Error("Erro ao salvar entrada");

      const newEntryData = await response.json();
      setEntries([newEntryData, ...entries]);
      setNewEntry("");
      setMood(5);
      setSelectedEmotions([]);
      setIsCreating(false);
      toast.success("Entrada salva com sucesso! +5 créditos 💎", {
        description: "Volte amanhã para ganhar mais créditos",
      });
    } catch (error) {
      console.error("Error saving entry:", error);
      toast.error("Erro ao salvar entrada", {
        description: "Tente novamente em alguns instantes",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar esta entrada?")) return;

    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/journal/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Erro ao deletar entrada");

      setEntries(entries.filter((entry) => entry.id !== id));
      toast.success("Entrada deletada com sucesso");
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast.error("Erro ao deletar entrada", {
        description: "Tente novamente em alguns instantes",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-bg-base flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-flame-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-bg-base pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="font-display font-black text-4xl gradient-text mb-2">
              Diário Emocional
            </h1>
            <p className="text-text-secondary font-medium">
              Registre e acompanhe sua jornada de autoconhecimento
            </p>
          </div>
          {!isCreating && (
            <Button
              onClick={() => setIsCreating(true)}
              className="gap-2 bg-gradient-hero text-white font-bold shadow-red hover:scale-105 transition-transform rounded-2xl"
            >
              <Plus className="w-5 h-5" />
              Nova Entrada
            </Button>
          )}
        </motion.div>

        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-bg-secondary border-2 border-border-default shadow-tinder-lg rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-text-primary font-display font-black text-2xl">
                    Como você está se sentindo?
                  </CardTitle>
                  <CardDescription className="text-text-secondary font-medium">
                    Tire um momento para se conectar com suas emoções
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold mb-3 text-text-primary">
                      Humor (1-10)
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={mood}
                        onChange={(e) => setMood(Number(e.target.value))}
                        className="flex-1 accent-flame-primary"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-black font-display text-flame-primary w-12 text-center">
                          {mood}
                        </span>
                        <Heart className="w-6 h-6 fill-flame-primary text-flame-primary" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-3 text-text-primary">
                      Como está se sentindo?
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {emotions.map((emotion) => (
                        <Badge
                          key={emotion}
                          className={`cursor-pointer px-4 py-2 rounded-full font-medium transition-all ${
                            selectedEmotions.includes(emotion)
                              ? "bg-gradient-hero text-white border-none shadow-red"
                              : "bg-bg-elevated text-text-secondary border-2 border-border-default hover:border-flame-primary/50"
                          }`}
                          onClick={() => toggleEmotion(emotion)}
                        >
                          {emotion}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-3 text-text-primary">
                      Escreva sobre seu dia
                    </label>
                    <Textarea
                      value={newEntry}
                      onChange={(e) => setNewEntry(e.target.value)}
                      placeholder="O que aconteceu hoje? Como você está se sentindo? O que está te preocupando?"
                      className="min-h-[200px] bg-bg-elevated text-text-primary border-2 border-border-default focus:border-flame-primary/50 placeholder:text-text-tertiary rounded-2xl font-medium resize-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleSave}
                      disabled={!newEntry.trim() || isSaving}
                      className="bg-gradient-hero text-white font-bold shadow-red hover:scale-105 transition-transform rounded-2xl flex-1"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        "Salvar Entrada"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCreating(false);
                        setNewEntry("");
                        setSelectedEmotions([]);
                        setMood(5);
                      }}
                      disabled={isSaving}
                      className="border-2 border-flame-primary/30 text-text-secondary hover:bg-bg-elevated font-bold rounded-2xl"
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          <AnimatePresence>
            {entries.map((entry, idx) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="bg-bg-secondary border-2 border-border-default hover:border-flame-primary/30 transition-all shadow-tinder-sm hover:shadow-tinder-md rounded-3xl group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2 text-text-primary font-display font-bold">
                          <Calendar className="w-5 h-5 text-flame-primary" />
                          {new Date(entry.created_at).toLocaleDateString("pt-BR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}
                        </CardTitle>
                        {entry.mood && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm text-text-secondary font-medium">
                              Humor:
                            </span>
                            <div className="flex gap-1">
                              {Array.from({ length: entry.mood }).map((_, i) => (
                                <Heart
                                  key={i}
                                  className="w-4 h-4 fill-flame-primary text-flame-primary"
                                />
                              ))}
                            </div>
                            <span className="text-sm font-bold text-flame-primary">
                              {entry.mood}/10
                            </span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(entry.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {entry.emotions && entry.emotions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {entry.emotions.map((emotion) => (
                          <Badge
                            key={emotion}
                            className="bg-bg-elevated text-text-secondary border border-border-default font-medium"
                          >
                            {emotion}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-text-secondary leading-relaxed whitespace-pre-wrap font-medium">
                      {entry.content}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {entries.length === 0 && !isCreating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 bg-gradient-hero rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <h3 className="font-display font-black text-2xl mb-3 gradient-text">
              Seu diário está vazio
            </h3>
            <p className="text-text-secondary mb-6 font-medium max-w-md mx-auto">
              Comece sua jornada de autoconhecimento hoje. Registre seus sentimentos,
              acompanhe sua evolução e fortaleça sua inteligência emocional.
            </p>
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-gradient-hero text-white font-bold shadow-red hover:scale-105 transition-transform rounded-2xl px-8"
            >
              <Plus className="w-5 h-5 mr-2" />
              Criar Primeira Entrada
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
