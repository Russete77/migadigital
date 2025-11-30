import { useAuth } from '@clerk/nextjs';

// API Routes são locais no Next.js - não precisa de URL externa
const API_URL = '';

/**
 * Utility para fazer chamadas autenticadas para a API
 */
export const useApiClient = () => {
  const { getToken } = useAuth();

  const fetchApi = async (
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    const token = await getToken();

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    // Adiciona Authorization header se token existe
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Adiciona Content-Type apenas se não for FormData
    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    return response;
  };

  return { fetchApi };
};

/**
 * API Endpoints tipados
 */
export const apiEndpoints = {
  ai: {
    emergencyChat: '/api/ai/emergency-chat',
    analyze: '/api/ai/analyze',
    getAnalysis: (id: string) => `/api/ai/analyze/${id}`,
  },
  stripe: {
    checkout: '/api/stripe/checkout',
  },
} as const;
