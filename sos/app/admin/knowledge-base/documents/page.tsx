'use client';

import { useState, useEffect } from 'react';
import {
  BookOpen,
  FileText,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
} from 'lucide-react';
import Link from 'next/link';

interface Document {
  id: string;
  title: string;
  description: string;
  source_type: string;
  file_name: string;
  file_size: number;
  total_chunks: number;
  status: string;
  error_message: string | null;
  created_at: string;
}

interface Stats {
  totalDocuments: number;
  totalChunks: number;
  pendingDocuments: number;
  failedDocuments: number;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/knowledge-base/documents');
      const data = await response.json();
      setDocuments(data.documents || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Erro ao buscar documentos:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return;

    try {
      await fetch(`/api/admin/knowledge-base/documents/${id}`, {
        method: 'DELETE',
      });
      fetchDocuments();
    } catch (error) {
      console.error('Erro ao excluir documento:', error);
    }
  };

  const handleReprocess = async (id: string) => {
    try {
      await fetch(`/api/admin/knowledge-base/documents/${id}/reprocess`, {
        method: 'POST',
      });
      fetchDocuments();
    } catch (error) {
      console.error('Erro ao reprocessar documento:', error);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.file_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
            <CheckCircle className="w-3 h-3" />
            Pronto
          </span>
        );
      case 'processing':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Processando
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
            <Clock className="w-3 h-3" />
            Pendente
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
            <XCircle className="w-3 h-3" />
            Erro
          </span>
        );
      default:
        return null;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '-';
    const mb = bytes / (1024 * 1024);
    return mb > 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-flame-primary" />
            Base de Conhecimento
          </h1>
          <p className="mt-2 text-text-secondary">
            Gerencie os documentos que alimentam a IA com conhecimento especializado
          </p>
        </div>
        <Link
          href="/admin/knowledge-base/upload"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-flame-primary text-white hover:bg-flame-primary/90"
        >
          <FileText className="w-4 h-4" />
          Upload Novo
        </Link>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-bg-secondary rounded-xl p-4 border border-border-default">
            <p className="text-sm text-text-secondary">Total Documentos</p>
            <p className="text-2xl font-bold text-text-primary">{stats.totalDocuments}</p>
          </div>
          <div className="bg-bg-secondary rounded-xl p-4 border border-border-default">
            <p className="text-sm text-text-secondary">Total Chunks</p>
            <p className="text-2xl font-bold text-text-primary">{stats.totalChunks}</p>
          </div>
          <div className="bg-bg-secondary rounded-xl p-4 border border-border-default">
            <p className="text-sm text-text-secondary">Pendentes</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pendingDocuments}</p>
          </div>
          <div className="bg-bg-secondary rounded-xl p-4 border border-border-default">
            <p className="text-sm text-text-secondary">Com Erro</p>
            <p className="text-2xl font-bold text-red-600">{stats.failedDocuments}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Buscar por título ou arquivo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border-default bg-bg-secondary text-text-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-tertiary" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-border-default bg-bg-secondary text-text-primary"
          >
            <option value="all">Todos</option>
            <option value="completed">Prontos</option>
            <option value="processing">Processando</option>
            <option value="pending">Pendentes</option>
            <option value="failed">Com Erro</option>
          </select>
        </div>
        <button
          onClick={fetchDocuments}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border-default hover:bg-bg-elevated"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Documents List */}
      <div className="bg-bg-secondary rounded-xl border border-border-default overflow-hidden">
        {filteredDocuments.length === 0 ? (
          <div className="p-8 text-center text-text-tertiary">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum documento encontrado</p>
            <Link
              href="/admin/knowledge-base/upload"
              className="inline-block mt-4 text-flame-primary hover:underline"
            >
              Fazer upload do primeiro documento
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-bg-elevated">
              <tr>
                <th className="text-left py-3 px-4 text-text-secondary font-medium">Documento</th>
                <th className="text-left py-3 px-4 text-text-secondary font-medium">Tipo</th>
                <th className="text-center py-3 px-4 text-text-secondary font-medium">Chunks</th>
                <th className="text-center py-3 px-4 text-text-secondary font-medium">Tamanho</th>
                <th className="text-center py-3 px-4 text-text-secondary font-medium">Status</th>
                <th className="text-right py-3 px-4 text-text-secondary font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map((doc) => (
                <tr key={doc.id} className="border-t border-border-default/50">
                  <td className="py-3 px-4">
                    <p className="font-medium text-text-primary">{doc.title}</p>
                    {doc.file_name && (
                      <p className="text-xs text-text-tertiary">{doc.file_name}</p>
                    )}
                    {doc.error_message && (
                      <p className="text-xs text-red-500 mt-1">{doc.error_message}</p>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 text-xs font-medium bg-bg-elevated rounded">
                      {doc.source_type?.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-text-primary">
                    {doc.total_chunks || '-'}
                  </td>
                  <td className="py-3 px-4 text-center text-text-secondary">
                    {formatFileSize(doc.file_size)}
                  </td>
                  <td className="py-3 px-4 text-center">{getStatusBadge(doc.status)}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {doc.status === 'failed' && (
                        <button
                          onClick={() => handleReprocess(doc.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Reprocessar"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
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
