export interface RoomTemplate {
  id: string;
  icon: string;
  name: string;
  description: string;
  tags: string[];
  expiresInHours: number;
  isAnonymous: boolean;
  maxMembers: number;
  color: string;
}

export const ROOM_TEMPLATES: Record<string, RoomTemplate> = {
  vent: {
    id: 'vent',
    icon: '💨',
    name: 'Preciso Desabafar',
    description: 'Solte tudo aqui. Sem julgamentos. Sala anônima que expira em 24h.',
    tags: ['desabafo', 'vent', 'emocional'],
    expiresInHours: 24,
    isAnonymous: true,
    maxMembers: 30,
    color: '#FF6B6B',
  },
  support: {
    id: 'support',
    icon: '🫂',
    name: 'Grupo de Apoio',
    description: 'Vamos nos apoiar juntas! Compartilhe e receba suporte.',
    tags: ['apoio', 'suporte', 'emocional'],
    expiresInHours: 168, // 1 semana
    isAnonymous: false,
    maxMembers: 50,
    color: '#4ECDC4',
  },
  celebration: {
    id: 'celebration',
    icon: '🎉',
    name: 'Celebrando Vitórias',
    description: 'Compartilhe suas conquistas, grandes ou pequenas!',
    tags: ['celebração', 'vitórias', 'positivo'],
    expiresInHours: 72, // 3 dias
    isAnonymous: false,
    maxMembers: 100,
    color: '#FFE66D',
  },
  advice: {
    id: 'advice',
    icon: '💡',
    name: 'Preciso de Conselhos',
    description: 'Está em dúvida? Peça opiniões anônimas e sinceras.',
    tags: ['conselhos', 'dúvidas', 'ajuda'],
    expiresInHours: 48, // 2 dias
    isAnonymous: true,
    maxMembers: 20,
    color: '#A8E6CF',
  },
  breakup: {
    id: 'breakup',
    icon: '💔',
    name: 'Superando Términos',
    description: 'Espaço seguro para falar sobre términos e recomeços.',
    tags: ['término', 'relacionamento', 'superação'],
    expiresInHours: 120, // 5 dias
    isAnonymous: true,
    maxMembers: 40,
    color: '#FF8B94',
  },
  career: {
    id: 'career',
    icon: '💼',
    name: 'Carreira & Trabalho',
    description: 'Dicas, desabafos e networking sobre vida profissional.',
    tags: ['carreira', 'trabalho', 'profissional'],
    expiresInHours: 168, // 1 semana
    isAnonymous: false,
    maxMembers: 50,
    color: '#C7CEEA',
  },
  custom: {
    id: 'custom',
    icon: '✨',
    name: 'Sala Personalizada',
    description: 'Crie sua própria sala do seu jeito!',
    tags: [],
    expiresInHours: 48,
    isAnonymous: false,
    maxMembers: 50,
    color: '#FBE7C6',
  },
};

export const POPULAR_TAGS = [
  'ansiedade',
  'relacionamentos',
  'autoestima',
  'família',
  'amizade',
  'carreira',
  'saúde mental',
  'término',
  'amor próprio',
  'terapia',
];

export const REACTION_EMOJIS = ['❤️', '🫂', '💪', '🔥', '😢', '😊', '🙏', '👏'];
