'use client';

import { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Filter,
  Eye,
  MessageSquare,
  User,
  Flag,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';

interface FlaggedItem {
  id: string;
  type: 'message' | 'crisis' | 'report';
  content: string;
  user_email: string;
  user_name: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reason: string;
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

interface Stats {
  pendingItems: number;
  reviewedToday: number;
  criticalAlerts: number;
  resolvedThisWeek: number;
}

export default function ModerationPage() {
  const [items, setItems] = useState<FlaggedItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/moderation');
      const data = await response.json();
      setItems(data.items || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Erro ao buscar itens:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAction = async (itemId: string, action: 'approve' | 'dismiss') => {
    try {
      await fetch(`/api/admin/moderation/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      fetchItems();
    } catch (error) {
      console.error('Erro ao processar acao:', error);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || item.severity === severityFilter;
    return matchesStatus && matchesSeverity;
  });

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
      low: 'Baixa',
      medium: 'Media',
      high: 'Alta',
      critical: 'Critica',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[severity]}`}>
        {labels[severity]}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
            <Clock className="w-3 h-3" />
            Pendente
          </span>
        );
      case 'reviewed':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
            <Eye className="w-3 h-3" />
            Revisado
          </span>
        );
      case 'resolved':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
            <CheckCircle className="w-3 h-3" />
            Resolvido
          </span>
        );
      case 'dismissed':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
            <XCircle className="w-3 h-3" />
            Descartado
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'crisis':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'report':
        return <Flag className="w-5 h-5 text-orange-500" />;
      default:
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
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
          <Shield className="w-8 h-8 text-flame-primary" />
          Moderacao
        </h1>
        <p className="mt-2 text-text-secondary">
          Revise alertas de crise, denuncias e conteudo sinalizado
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-bg-secondary rounded-xl p-4 border border-border-default">
            <p className="text-sm text-text-secondary">Pendentes</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pendingItems}</p>
          </div>
          <div className="bg-bg-secondary rounded-xl p-4 border border-border-default">
            <p className="text-sm text-text-secondary">Revisados Hoje</p>
            <p className="text-2xl font-bold text-blue-600">{stats.reviewedToday}</p>
          </div>
          <div className="bg-bg-secondary rounded-xl p-4 border border-border-default">
            <p className="text-sm text-text-secondary">Alertas Criticos</p>
            <p className="text-2xl font-bold text-red-600">{stats.criticalAlerts}</p>
          </div>
          <div className="bg-bg-secondary rounded-xl p-4 border border-border-default">
            <p className="text-sm text-text-secondary">Resolvidos (7 dias)</p>
            <p className="text-2xl font-bold text-green-600">{stats.resolvedThisWeek}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-tertiary" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-border-default bg-bg-secondary text-text-primary"
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendentes</option>
            <option value="reviewed">Revisados</option>
            <option value="resolved">Resolvidos</option>
            <option value="dismissed">Descartados</option>
          </select>
        </div>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-border-default bg-bg-secondary text-text-primary"
        >
          <option value="all">Todas as Severidades</option>
          <option value="critical">Critica</option>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baixa</option>
        </select>
        <button
          onClick={fetchItems}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border-default hover:bg-bg-elevated"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Items List */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="bg-bg-secondary rounded-xl border border-border-default p-8 text-center text-text-tertiary">
            <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum item para moderar</p>
            <p className="text-sm mt-2">Todos os alertas foram revisados!</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-bg-secondary rounded-xl border border-border-default p-4 hover:border-flame-primary/30 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="p-2 bg-bg-elevated rounded-lg">
                  {getTypeIcon(item.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs text-text-tertiary uppercase font-medium">
                      {item.type === 'crisis' ? 'Alerta de Crise' : item.type === 'report' ? 'Denuncia' : 'Mensagem'}
                    </span>
                    {getSeverityBadge(item.severity)}
                    {getStatusBadge(item.status)}
                  </div>

                  <p className="text-text-primary mb-2 line-clamp-2">
                    {item.content}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-text-tertiary">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {item.user_name || item.user_email}
                    </span>
                    <span>{formatDate(item.created_at)}</span>
                    {item.reason && (
                      <span className="text-orange-600">
                        Motivo: {item.reason}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {item.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAction(item.id, 'approve')}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                      title="Aprovar/Resolver"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      Resolver
                    </button>
                    <button
                      onClick={() => handleAction(item.id, 'dismiss')}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                      title="Descartar"
                    >
                      <ThumbsDown className="w-4 h-4" />
                      Descartar
                    </button>
                    <button
                      className="p-2 rounded-lg hover:bg-bg-elevated text-flame-primary"
                      title="Ver detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
