import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

// API Routes são locais no Next.js
const API_URL = '';

export interface Room {
  id: string;
  name: string;
  description: string;
  type: string;
  template: string;
  tags: string[];
  is_anonymous: boolean;
  expires_at: string | null;
  member_count: number;
  max_members: number;
  status: string;
  created_at: string;
  created_by: string | null;
  creator?: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
  hoursUntilExpiration?: number | null;
  isExpiringSoon?: boolean;
}

interface UseRoomsOptions {
  filter?: 'expiring' | 'my_rooms' | 'all';
  tags?: string[];
}

export function useRooms(options: UseRoomsOptions = {}) {
  const { getToken } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentUserProfileId, setCurrentUserProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await getToken();
      const params = new URLSearchParams();

      if (options.filter) {
        params.append('filter', options.filter);
      }

      if (options.tags && options.tags.length > 0) {
        params.append('tags', options.tags.join(','));
      }

      const response = await fetch(`${API_URL}/api/rooms?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar salas');
      }

      const data = await response.json();
      setRooms(data.rooms || []);
      setCurrentUserProfileId(data.currentUserProfileId || null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching rooms:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [options.filter, options.tags?.join(',')]);

  const refresh = () => {
    fetchRooms();
  };

  return { rooms, currentUserProfileId, isLoading, error, refresh };
}
