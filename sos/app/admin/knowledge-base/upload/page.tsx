'use client';

import { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface UploadFile {
  file: File;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  documentId?: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
}

const defaultCategories: Category[] = [
  { id: 'relacionamentos', name: 'Relacionamentos', description: 'Conteúdo sobre relacionamentos' },
  { id: 'autoestima', name: 'Autoestima', description: 'Autoconhecimento e amor próprio' },
  { id: 'violencia', name: 'Violência', description: 'Identificação e prevenção' },
  { id: 'recuperacao', name: 'Recuperação', description: 'Processo de cura' },
  { id: 'limites', name: 'Limites', description: 'Como estabelecer limites' },
  { id: 'geral', name: 'Geral', description: 'Conteúdo geral' },
];

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['geral']);
  const [textContent, setTextContent] = useState('');
  const [uploadMode, setUploadMode] = useState<'file' | 'text'>('file');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (file) => file.type === 'application/pdf' || file.type === 'text/plain'
    );
    addFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    const uploadFiles: UploadFile[] = newFiles.map((file) => ({
      file,
      status: 'pending',
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...uploadFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((c) => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleUpload = async () => {
    if (uploadMode === 'file' && files.length === 0) return;
    if (uploadMode === 'text' && !textContent.trim()) return;
    if (!title.trim()) {
      alert('Por favor, insira um título');
      return;
    }

    setIsUploading(true);

    try {
      if (uploadMode === 'text') {
        // Upload de texto direto
        const response = await fetch('/api/admin/knowledge-base/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            description,
            content: textContent,
            categories: selectedCategories,
            sourceType: 'text',
          }),
        });

        if (!response.ok) throw new Error('Erro ao fazer upload');

        router.push('/admin/knowledge-base/documents');
      } else {
        // Upload de arquivos
        for (let i = 0; i < files.length; i++) {
          const uploadFile = files[i];
          setFiles((prev) =>
            prev.map((f, idx) =>
              idx === i ? { ...f, status: 'uploading', progress: 0 } : f
            )
          );

          const formData = new FormData();
          formData.append('file', uploadFile.file);
          formData.append('title', title || uploadFile.file.name.replace(/\.[^/.]+$/, ''));
          formData.append('description', description);
          formData.append('categories', JSON.stringify(selectedCategories));

          try {
            console.log('Uploading file:', uploadFile.file.name);
            const response = await fetch('/api/admin/knowledge-base/upload', {
              method: 'POST',
              body: formData,
            });

            const result = await response.json();
            console.log('Upload response:', result);

            if (!response.ok) {
              throw new Error(result.error || 'Erro ao fazer upload');
            }

            setFiles((prev) =>
              prev.map((f, idx) =>
                idx === i
                  ? { ...f, status: 'completed', progress: 100, documentId: result.documentId }
                  : f
              )
            );
          } catch (error) {
            console.error('Upload error:', error);
            setFiles((prev) =>
              prev.map((f, idx) =>
                idx === i
                  ? {
                      ...f,
                      status: 'error',
                      error: error instanceof Error ? error.message : 'Erro desconhecido',
                    }
                  : f
              )
            );
          }
        }

        setIsUploading(false);

        // Redirecionar após upload completo
        const hasErrors = files.some(f => f.status === 'error');
        if (!hasErrors) {
          setTimeout(() => {
            router.push('/admin/knowledge-base/documents');
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao fazer upload. Tente novamente.');
      setIsUploading(false);
    }
  };

  const allCompleted = files.every((f) => f.status === 'completed');

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/knowledge-base/documents"
          className="p-2 rounded-lg hover:bg-bg-elevated"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <Upload className="w-8 h-8 text-flame-primary" />
            Upload de Documentos
          </h1>
          <p className="mt-1 text-text-secondary">
            Adicione PDFs ou textos para enriquecer a base de conhecimento da IA
          </p>
        </div>
      </div>

      {/* Upload Mode Toggle */}
      <div className="flex gap-2 p-1 bg-bg-elevated rounded-lg w-fit">
        <button
          onClick={() => setUploadMode('file')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            uploadMode === 'file'
              ? 'bg-flame-primary text-white'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Arquivo PDF
        </button>
        <button
          onClick={() => setUploadMode('text')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            uploadMode === 'text'
              ? 'bg-flame-primary text-white'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Texto Direto
        </button>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Title & Description */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Título *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Manual de Relacionamentos Saudáveis"
              className="w-full px-4 py-2 rounded-lg border border-border-default bg-bg-secondary text-text-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Descrição (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descrição do conteúdo..."
              rows={2}
              className="w-full px-4 py-2 rounded-lg border border-border-default bg-bg-secondary text-text-primary resize-none"
            />
          </div>
        </div>

        {/* Categories */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Categorias
          </label>
          <div className="flex flex-wrap gap-2">
            {defaultCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategories.includes(cat.id)
                    ? 'bg-flame-primary text-white'
                    : 'bg-bg-elevated text-text-secondary hover:bg-bg-secondary'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Upload Area */}
        {uploadMode === 'file' ? (
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Arquivos
            </label>
            <div
              onDrop={handleFileDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border-default rounded-xl p-8 text-center cursor-pointer hover:border-flame-primary/50 transition-colors"
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-text-tertiary" />
              <p className="text-text-primary font-medium">
                Arraste arquivos aqui ou clique para selecionar
              </p>
              <p className="text-sm text-text-tertiary mt-1">
                Suporta PDF e TXT (máximo 10MB por arquivo)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-bg-elevated rounded-lg"
                  >
                    <FileText className="w-5 h-5 text-flame-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {file.file.name}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {(file.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    {file.status === 'pending' && (
                      <button
                        onClick={() => removeFile(index)}
                        className="p-1 hover:bg-bg-secondary rounded"
                      >
                        <X className="w-4 h-4 text-text-tertiary" />
                      </button>
                    )}
                    {file.status === 'uploading' && (
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    )}
                    {file.status === 'completed' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {file.status === 'error' && (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <span className="text-xs text-red-500">{file.error}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Conteúdo de Texto
            </label>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Cole ou digite o conteúdo aqui..."
              rows={12}
              className="w-full px-4 py-3 rounded-lg border border-border-default bg-bg-secondary text-text-primary resize-none font-mono text-sm"
            />
            <p className="text-xs text-text-tertiary mt-1">
              {textContent.length} caracteres
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleUpload}
          disabled={
            isUploading ||
            (uploadMode === 'file' && files.length === 0) ||
            (uploadMode === 'text' && !textContent.trim()) ||
            !title.trim()
          }
          className="w-full py-3 rounded-lg bg-flame-primary text-white font-medium hover:bg-flame-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processando...
            </>
          ) : allCompleted && files.length > 0 ? (
            <>
              <CheckCircle className="w-5 h-5" />
              Upload Completo!
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Fazer Upload
            </>
          )}
        </button>
      </div>
    </div>
  );
}
