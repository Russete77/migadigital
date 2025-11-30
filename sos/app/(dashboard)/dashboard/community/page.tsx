"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Flame, Clock, Folder, Sparkles, Filter } from "lucide-react";
import { useRooms } from "@/hooks/useRooms";
import { RoomCard } from "@/components/community/RoomCard";
import { CreateRoomModal } from "@/components/community/CreateRoomModal";
import { POPULAR_TAGS } from "@/lib/constants/room-templates";
import { Button } from "@/components/ui/button";

export default function CommunityPage() {
  const [filter, setFilter] = useState<'all' | 'expiring' | 'my_rooms'>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { rooms, currentUserProfileId, isLoading, refresh } = useRooms({
    filter,
    tags: selectedTags.length > 0 ? selectedTags : undefined
  });

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const activeRooms = rooms.filter(r => r.status === 'active');
  const expiringRooms = rooms.filter(r => r.hoursUntilExpiration && r.hoursUntilExpiration < 24);

  return (
    <div className="min-h-screen bg-bg-base p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-display font-black text-4xl md:text-5xl gradient-text mb-2">
                Círculos Secretos
              </h1>
              <p className="text-text-secondary text-lg font-medium">
                Espaços temporários e anônimos para compartilhar sem julgamentos
              </p>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="hidden md:flex items-center gap-2 bg-gradient-hero text-white font-bold px-6 py-3 rounded-2xl shadow-red hover:scale-105 transition-transform"
            >
              <Plus className="w-5 h-5" />
              Criar Sala
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            <div className="bg-bg-secondary border-2 border-border-default rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-4 h-4 text-flame-primary" />
                <span className="text-xs font-bold text-text-tertiary uppercase">Ativas</span>
              </div>
              <p className="font-display font-black text-3xl text-text-primary">
                {activeRooms.length}
              </p>
            </div>

            <div className="bg-bg-secondary border-2 border-border-default rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-danger" />
                <span className="text-xs font-bold text-text-tertiary uppercase">Expirando</span>
              </div>
              <p className="font-display font-black text-3xl text-text-primary">
                {expiringRooms.length}
              </p>
            </div>

            <div className="bg-bg-secondary border-2 border-border-default rounded-2xl p-4 col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-text-tertiary uppercase">Total</span>
              </div>
              <p className="font-display font-black text-3xl text-text-primary">
                {rooms.length}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-text-tertiary" />
              <span className="text-sm font-bold text-text-secondary">Filtrar por:</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
                  filter === 'all'
                    ? 'bg-gradient-hero text-white shadow-red'
                    : 'bg-bg-secondary text-text-secondary border border-border-default hover:border-flame-primary/50'
                }`}
              >
                <Flame className="w-4 h-4" />
                Todas as Salas
              </button>
              <button
                onClick={() => setFilter('expiring')}
                className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
                  filter === 'expiring'
                    ? 'bg-gradient-hero text-white shadow-red'
                    : 'bg-bg-secondary text-text-secondary border border-border-default hover:border-flame-primary/50'
                }`}
              >
                <Clock className="w-4 h-4" />
                Expirando Hoje
              </button>
              <button
                onClick={() => setFilter('my_rooms')}
                className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
                  filter === 'my_rooms'
                    ? 'bg-gradient-hero text-white shadow-red'
                    : 'bg-bg-secondary text-text-secondary border border-border-default hover:border-flame-primary/50'
                }`}
              >
                <Folder className="w-4 h-4" />
                Minhas Salas
              </button>
            </div>
          </div>

          {/* Tag Filters */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-bold text-text-secondary">Tags populares:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {POPULAR_TAGS.slice(0, 8).map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedTags.includes(tag)
                      ? 'bg-gradient-hero text-white shadow-sm'
                      : 'bg-bg-elevated text-text-secondary border border-border-default hover:border-flame-primary/50'
                  }`}
                >
                  #{tag}
                </button>
              ))}
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 transition-colors"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-bg-secondary border-2 border-border-default rounded-3xl p-6 animate-pulse"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-bg-elevated" />
                  <div className="flex-1">
                    <div className="h-5 bg-bg-elevated rounded-lg w-3/4 mb-2" />
                    <div className="h-3 bg-bg-elevated rounded w-1/2" />
                  </div>
                </div>
                <div className="h-16 bg-bg-elevated rounded-lg mb-4" />
                <div className="flex gap-2 mb-4">
                  <div className="h-6 bg-bg-elevated rounded-full w-16" />
                  <div className="h-6 bg-bg-elevated rounded-full w-20" />
                </div>
                <div className="h-10 bg-bg-elevated rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Rooms Grid */}
        {!isLoading && rooms.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {rooms.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <RoomCard
                  room={room}
                  currentUserProfileId={currentUserProfileId || undefined}
                  onDeleted={refresh}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && rooms.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 bg-gradient-hero rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <h3 className="font-display font-black text-2xl text-text-primary mb-3">
              {selectedTags.length > 0 || filter !== 'all'
                ? 'Nenhuma sala encontrada'
                : 'Seja a primeira!'}
            </h3>
            <p className="text-text-secondary text-lg font-medium mb-6 max-w-md mx-auto">
              {selectedTags.length > 0 || filter !== 'all'
                ? 'Tente remover alguns filtros ou criar uma nova sala'
                : 'Crie o primeiro Círculo Secreto e comece uma conversa'}
            </p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-hero text-white font-bold px-8 py-4 rounded-2xl shadow-red hover:scale-105 transition-transform"
            >
              <Plus className="w-5 h-5 mr-2" />
              Criar Primeira Sala
            </Button>
          </motion.div>
        )}

        {/* Floating Action Button (Mobile) - acima do MobileNav (72px + margem) */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCreateModalOpen(true)}
          className="md:hidden fixed bottom-24 right-4 w-14 h-14 bg-gradient-hero text-white rounded-full flex items-center justify-center z-50 shadow-lg shadow-flame-primary/30"
        >
          <Plus className="w-7 h-7" />
        </motion.button>

        {/* Create Room Modal */}
        <CreateRoomModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onRoomCreated={refresh}
        />
      </div>
    </div>
  );
}
