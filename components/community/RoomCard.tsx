"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Clock, Lock, Trash2, MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Room } from "@/hooks/useRooms";
import { ROOM_TEMPLATES } from "@/lib/constants/room-templates";
import { toast } from "sonner";

interface RoomCardProps {
  room: Room;
  currentUserProfileId?: string;
  onDeleted?: () => void;
}

export function RoomCard({ room, currentUserProfileId, onDeleted }: RoomCardProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const template = ROOM_TEMPLATES[room.template] || ROOM_TEMPLATES.custom;

  const isOwner = currentUserProfileId && room.created_by === currentUserProfileId;
  const isExpired = room.hoursUntilExpiration !== null && room.hoursUntilExpiration <= 0;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Tem certeza que deseja deletar esta sala? Esta ação não pode ser desfeita.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const token = await getToken();
      const response = await fetch(`/api/rooms/${room.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao deletar sala');
      }

      toast.success('Sala deletada com sucesso');
      onDeleted?.();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao deletar sala');
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };

  const getExpirationText = () => {
    if (!room.hoursUntilExpiration) return null;

    const hours = Math.floor(room.hoursUntilExpiration);
    const minutes = Math.floor((room.hoursUntilExpiration - hours) * 60);

    if (hours < 1) {
      return `Expira em ${minutes}min`;
    } else if (hours < 24) {
      return `Expira em ${hours}h`;
    } else {
      const days = Math.floor(hours / 24);
      return `Expira em ${days}d`;
    }
  };

  const isFull = room.member_count >= room.max_members;
  const isExpiringSoon = room.hoursUntilExpiration && room.hoursUntilExpiration < 2;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className={`relative cursor-pointer ${isFull ? 'opacity-60' : ''}`}
      onClick={() => !isFull && router.push(`/dashboard/community/${room.id}`)}
    >
      <div
        className="bg-bg-secondary border-2 border-border-default hover:border-flame-primary/50 rounded-3xl p-6 transition-all shadow-tinder-sm hover:shadow-tinder-md"
        style={{
          borderColor: isExpiringSoon ? '#FF6B6B' : undefined,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md"
              style={{ backgroundColor: template.color + '20' }}
            >
              {template.icon}
            </div>
            <div className="flex-1">
              <h3 className="font-display font-black text-lg text-text-primary line-clamp-1">
                {room.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                {room.is_anonymous && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-xs text-purple-400 font-medium">Anônima</span>
                  </div>
                )}
                {isExpired && (
                  <span className="text-xs text-danger font-medium">Expirada</span>
                )}
              </div>
            </div>
          </div>

          {/* Menu para criador */}
          {isOwner && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-2 rounded-lg hover:bg-bg-active transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-text-tertiary" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-bg-elevated border border-border-default rounded-xl shadow-lg py-1 z-10 min-w-[140px]">
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full px-4 py-2 text-left text-sm text-danger hover:bg-danger/10 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    {isDeleting ? 'Deletando...' : 'Deletar Sala'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-text-secondary line-clamp-2 mb-4 leading-relaxed">
          {room.description || template.description}
        </p>

        {/* Tags */}
        {room.tags && room.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {room.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-bg-elevated text-text-tertiary text-xs rounded-full border border-border-subtle"
              >
                #{tag}
              </span>
            ))}
            {room.tags.length > 3 && (
              <span className="px-2 py-1 bg-bg-elevated text-text-tertiary text-xs rounded-full border border-border-subtle">
                +{room.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
          <div className="flex items-center gap-4">
            {/* Member count */}
            <div className="flex items-center gap-1.5">
              <Users className={`w-4 h-4 ${isFull ? 'text-danger' : 'text-flame-primary'}`} />
              <span className={`text-sm font-bold ${isFull ? 'text-danger' : 'text-text-primary'}`}>
                {room.member_count}/{room.max_members}
              </span>
            </div>

            {/* Expiration */}
            {room.expires_at && (
              <div className="flex items-center gap-1.5">
                <Clock className={`w-4 h-4 ${isExpiringSoon ? 'text-danger' : 'text-text-tertiary'}`} />
                <span className={`text-xs font-medium ${isExpiringSoon ? 'text-danger' : 'text-text-secondary'}`}>
                  {getExpirationText()}
                </span>
              </div>
            )}
          </div>

          {/* Status badge */}
          {isFull ? (
            <div className="px-3 py-1 bg-danger/10 text-danger text-xs font-bold rounded-full flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Cheia
            </div>
          ) : (
            <div className="px-4 py-1.5 bg-gradient-hero text-white text-xs font-bold rounded-full shadow-sm">
              Entrar
            </div>
          )}
        </div>

        {/* Expiring soon indicator */}
        {isExpiringSoon && (
          <div className="absolute top-3 right-3">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-3 h-3 rounded-full bg-danger shadow-red"
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
