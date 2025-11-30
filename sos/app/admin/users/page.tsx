'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  Mail,
  Calendar,
  MessageSquare,
  Shield,
  MoreVertical,
  Eye,
  Ban,
  CheckCircle,
} from 'lucide-react';

interface User {
  id: string;
  clerk_id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: string;
  subscription_tier: string;
  subscription_status: string;
  credits_remaining: number;
  created_at: string;
  last_seen_at: string | null;
  total_conversations: number;
  total_messages: number;
  is_banned: boolean;
}

interface Stats {
  totalUsers: number;
  activeToday: number;
  newThisWeek: number;
  bannedUsers: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      setUsers(data.users || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Erro ao buscar usuarios:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = tierFilter === 'all' || user.subscription_tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-flame-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
          <Users className="w-8 h-8 text-flame-primary" />
          Usuarias
        </h1>
        <p className="mt-2 text-text-secondary">
          Gerencie as usuarias da plataforma SOS Emocional
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-bg-secondary rounded-xl p-4 border border-border-default">
            <p className="text-sm text-text-secondary">Total de Usuarias</p>
            <p className="text-2xl font-bold text-text-primary">{stats.totalUsers}</p>
          </div>
          <div className="bg-bg-secondary rounded-xl p-4 border border-border-default">
            <p className="text-sm text-text-secondary">Ativas Hoje</p>
            <p className="text-2xl font-bold text-green-600">{stats.activeToday}</p>
          </div>
          <div className="bg-bg-secondary rounded-xl p-4 border border-border-default">
            <p className="text-sm text-text-secondary">Novas (7 dias)</p>
            <p className="text-2xl font-bold text-blue-600">{stats.newThisWeek}</p>
          </div>
          <div className="bg-bg-secondary rounded-xl p-4 border border-border-default">
            <p className="text-sm text-text-secondary">Banidas</p>
            <p className="text-2xl font-bold text-red-600">{stats.bannedUsers}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border-default bg-bg-secondary text-text-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-tertiary" />
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-border-default bg-bg-secondary text-text-primary"
          >
            <option value="all">Todos os Planos</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="premium">Premium</option>
          </select>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border-default hover:bg-bg-elevated"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Users List */}
      <div className="bg-bg-secondary rounded-xl border border-border-default overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-text-tertiary">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma usuaria encontrada</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-bg-elevated">
              <tr>
                <th className="text-left py-3 px-4 text-text-secondary font-medium">Usuaria</th>
                <th className="text-left py-3 px-4 text-text-secondary font-medium">Plano</th>
                <th className="text-center py-3 px-4 text-text-secondary font-medium">Creditos</th>
                <th className="text-center py-3 px-4 text-text-secondary font-medium">Conversas</th>
                <th className="text-center py-3 px-4 text-text-secondary font-medium">Cadastro</th>
                <th className="text-center py-3 px-4 text-text-secondary font-medium">Ultimo Acesso</th>
                <th className="text-right py-3 px-4 text-text-secondary font-medium">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-t border-border-default/50 hover:bg-bg-elevated/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.name || 'Avatar'}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-flame-primary/20 flex items-center justify-center text-flame-primary font-medium">
                          {getInitials(user.name, user.email)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-text-primary">
                          {user.name || 'Sem nome'}
                        </p>
                        <p className="text-xs text-text-tertiary flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.subscription_tier === 'premium'
                        ? 'bg-purple-100 text-purple-700'
                        : user.subscription_tier === 'pro'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {user.subscription_tier === 'premium' ? 'Premium' : user.subscription_tier === 'pro' ? 'Pro' : 'Free'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`font-medium ${user.credits_remaining > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {user.credits_remaining}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-text-primary">
                    {user.total_conversations || 0}
                  </td>
                  <td className="py-3 px-4 text-center text-text-secondary text-sm">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="py-3 px-4 text-center text-text-secondary text-sm">
                    {formatDate(user.last_seen_at)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="p-2 text-flame-primary hover:bg-flame-primary/10 rounded-lg"
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-text-tertiary hover:bg-bg-elevated rounded-lg"
                        title="Mais opcoes"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
