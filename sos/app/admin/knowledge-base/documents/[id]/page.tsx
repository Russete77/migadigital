'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  Save,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  Edit3,
  Eye,
  Trash2,
  Copy,
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
  updated_at: string;
}

interface Chunk {
  id: string;
  chunk_index: number;
  content: string;
  content_length: number;
  metadata: any;
}

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedChunks, setEditedChunks] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [deletingChunks, setDeletingChunks] = useState<Set<string>>(new Set());
  const [regenerating, setRegenerating] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchDocument = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/knowledge-base/documents/${documentId}`);
      if (!response.ok) throw new Error('Documento não encontrado');
      const data = await response.json();
      setDocument(data.document);
      setChunks(data.chunks || []);
    } catch (error) {
      console.error('Erro ao buscar documento:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (documentId) {
      fetchDocument();
    }
  }, [documentId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/knowledge-base/documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chunks: editedChunks }),
      });

      if (!response.ok) throw new Error('Erro ao salvar');

      await fetchDocument();
      setIsEditing(false);
      setEditedChunks({});

      setNotification({
        type: 'success',
        message: `Documento salvo! ${Object.keys(editedChunks).length} chunk(s) atualizado(s). Lembre-se de regenerar os embeddings.`
      });
      setTimeout(() => setNotification(null), 5000);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setNotification({
        type: 'error',
        message: 'Erro ao salvar documento. Tente novamente.'
      });
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await fetch(`/api/admin/knowledge-base/documents/${documentId}`, {
        method: 'DELETE',
      });
      router.push('/admin/knowledge-base/documents');
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir documento');
    }
  };

  const handleRegenerate = async () => {
    if (!confirm('Regenerar embeddings? Isso pode demorar alguns segundos.')) {
      return;
    }

    setRegenerating(true);
    setNotification(null);

    try {
      const response = await fetch(`/api/admin/knowledge-base/documents/${documentId}/reprocess`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao regenerar');
      }

      setNotification({
        type: 'success',
        message: `Embeddings regenerados com sucesso! ${data.processedChunks || chunks.length} chunks processados.`
      });

      await fetchDocument();
    } catch (error) {
      console.error('Erro ao regenerar:', error);
      setNotification({
        type: 'error',
        message: 'Erro ao regenerar embeddings. Tente novamente.'
      });
    } finally {
      setRegenerating(false);
      // Auto-hide notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const copyAllText = () => {
    const allText = chunks.map(c => c.content).join('\n\n---\n\n');
    navigator.clipboard.writeText(allText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteChunk = async (chunkId: string) => {
    if (!confirm('Excluir este chunk? Esta acao nao pode ser desfeita.')) {
      return;
    }

    setDeletingChunks(prev => new Set(prev).add(chunkId));

    try {
      const response = await fetch(`/api/admin/knowledge-base/chunks/${chunkId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erro ao excluir chunk');

      // Remove chunk da lista local
      setChunks(prev => prev.filter(c => c.id !== chunkId));

      setNotification({
        type: 'success',
        message: 'Chunk excluido com sucesso!'
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Erro ao excluir chunk:', error);
      setNotification({
        type: 'error',
        message: 'Erro ao excluir chunk. Tente novamente.'
      });
    } finally {
      setDeletingChunks(prev => {
        const newSet = new Set(prev);
        newSet.delete(chunkId);
        return newSet;
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1 px-3 py-1 text-sm font-medium bg-green-100 text-green-700 rounded-full">
            <CheckCircle className="w-4 h-4" />
            Pronto
          </span>
        );
      case 'processing':
        return (
          <span className="flex items-center gap-1 px-3 py-1 text-sm font-medium bg-blue-100 text-blue-700 rounded-full">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Processando
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-700 rounded-full">
            <Clock className="w-4 h-4" />
            Pendente
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1 px-3 py-1 text-sm font-medium bg-red-100 text-red-700 rounded-full">
            <XCircle className="w-4 h-4" />
            Erro
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-flame-primary" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="text-center py-12">
        <p className="text-text-tertiary">Documento não encontrado</p>
        <Link href="/admin/knowledge-base/documents" className="text-flame-primary hover:underline mt-4 inline-block">
          Voltar para documentos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link
            href="/admin/knowledge-base/documents"
            className="p-2 rounded-lg hover:bg-bg-elevated mt-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
              <FileText className="w-7 h-7 text-flame-primary" />
              {document.title}
            </h1>
            <p className="mt-1 text-text-secondary">
              {document.file_name} • {chunks.length} chunks
            </p>
            <div className="mt-2">
              {getStatusBadge(document.status)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedChunks({});
                }}
                className="px-4 py-2 rounded-lg border border-border-default hover:bg-bg-elevated"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-flame-primary text-white hover:bg-flame-primary/90 disabled:opacity-50"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={copyAllText}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border-default hover:bg-bg-elevated"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Copiado!' : 'Copiar Texto'}
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border-default hover:bg-bg-elevated"
              >
                <Edit3 className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border-default hover:bg-bg-elevated disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
                {regenerating ? 'Regenerando...' : 'Regenerar Embeddings'}
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </button>
            </>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            notification.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="flex-1">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="p-1 hover:bg-black/5 rounded"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {document.error_message && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <strong>Erro:</strong> {document.error_message}
        </div>
      )}

      {/* Chunks / Content */}
      <div className="bg-bg-secondary rounded-xl border border-border-default">
        <div className="p-4 border-b border-border-default flex items-center justify-between">
          <h2 className="font-semibold text-text-primary flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Texto Extraído
          </h2>
          <span className="text-sm text-text-tertiary">
            {chunks.reduce((acc, c) => acc + c.content_length, 0).toLocaleString()} caracteres
          </span>
        </div>

        <div className="divide-y divide-border-default max-h-[70vh] overflow-y-auto">
          {chunks.length === 0 ? (
            <div className="p-8 text-center text-text-tertiary">
              Nenhum conteúdo extraído ainda
            </div>
          ) : (
            chunks.map((chunk, index) => (
              <div key={chunk.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-text-tertiary bg-bg-elevated px-2 py-1 rounded">
                    Chunk {index + 1} • {chunk.content_length} chars
                  </span>
                  <div className="flex items-center gap-2">
                    {chunk.metadata?.page && (
                      <span className="text-xs text-text-tertiary">
                        Pagina {chunk.metadata.page}
                      </span>
                    )}
                    <button
                      onClick={() => handleDeleteChunk(chunk.id)}
                      disabled={deletingChunks.has(chunk.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Excluir chunk"
                    >
                      {deletingChunks.has(chunk.id) ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                {isEditing ? (
                  <textarea
                    value={editedChunks[chunk.id] ?? chunk.content}
                    onChange={(e) =>
                      setEditedChunks((prev) => ({
                        ...prev,
                        [chunk.id]: e.target.value,
                      }))
                    }
                    className="w-full p-3 rounded-lg border border-border-default bg-bg-primary text-text-primary font-mono text-sm resize-none"
                    rows={Math.min(15, Math.max(5, chunk.content.split('\n').length))}
                  />
                ) : (
                  <div className="p-3 bg-bg-elevated rounded-lg text-text-primary whitespace-pre-wrap font-mono text-sm leading-relaxed">
                    {chunk.content}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
