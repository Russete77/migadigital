import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/supabase-admin';
import { createDocument, processPDFContent } from '@/lib/server/knowledge/pdf-processor';
import { generateDocumentEmbeddings } from '@/lib/server/knowledge/embeddings';

// Para processar PDF no servidor, usamos pdf-parse
// npm install pdf-parse

/**
 * POST: Upload de documento (PDF ou texto)
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // Upload de arquivo
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const title = formData.get('title') as string;
      const description = formData.get('description') as string;
      const categoriesJson = formData.get('categories') as string;

      if (!file) {
        return NextResponse.json(
          { error: 'Arquivo não encontrado' },
          { status: 400 }
        );
      }

      const categories = categoriesJson ? JSON.parse(categoriesJson) : [];

      // Ler conteúdo do arquivo
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      let textContent = '';

      if (file.type === 'application/pdf') {
        // Processar PDF
        try {
          // Importação dinâmica do pdf-parse
          const pdfParse = (await import('pdf-parse')).default;
          const pdfData = await pdfParse(buffer);
          textContent = pdfData.text;
        } catch (pdfError) {
          console.error('Error parsing PDF:', pdfError);
          return NextResponse.json(
            { error: 'Erro ao processar PDF. Verifique se o arquivo é válido.' },
            { status: 400 }
          );
        }
      } else if (file.type === 'text/plain') {
        textContent = buffer.toString('utf-8');
      } else {
        return NextResponse.json(
          { error: 'Tipo de arquivo não suportado. Use PDF ou TXT.' },
          { status: 400 }
        );
      }

      if (!textContent.trim()) {
        return NextResponse.json(
          { error: 'Arquivo vazio ou sem texto extraível' },
          { status: 400 }
        );
      }

      // Criar documento no banco
      const documentId = await createDocument({
        title: title || file.name.replace(/\.[^/.]+$/, ''),
        description,
        sourceType: file.type === 'application/pdf' ? 'pdf' : 'text',
        fileName: file.name,
        fileSize: file.size,
        categoryIds: categories,
      });

      // Processar conteúdo em chunks
      const result = await processPDFContent(documentId, textContent);

      if (result.status === 'failed') {
        return NextResponse.json(
          { error: result.error || 'Erro ao processar documento' },
          { status: 500 }
        );
      }

      // Gerar embeddings em background (não bloqueia resposta)
      generateDocumentEmbeddings(documentId).catch((err) => {
        console.error('Background embedding error:', err);
      });

      return NextResponse.json({
        success: true,
        documentId,
        totalChunks: result.totalChunks,
        message: 'Documento processado. Embeddings sendo gerados...',
      });
    } else {
      // Upload de texto direto (JSON)
      const body = await request.json();
      const { title, description, content, categories, sourceType } = body;

      if (!content || !content.trim()) {
        return NextResponse.json(
          { error: 'Conteúdo vazio' },
          { status: 400 }
        );
      }

      if (!title || !title.trim()) {
        return NextResponse.json(
          { error: 'Título obrigatório' },
          { status: 400 }
        );
      }

      // Criar documento
      const documentId = await createDocument({
        title,
        description,
        sourceType: sourceType || 'text',
        categoryIds: categories || [],
      });

      // Processar conteúdo
      const result = await processPDFContent(documentId, content);

      if (result.status === 'failed') {
        return NextResponse.json(
          { error: result.error || 'Erro ao processar documento' },
          { status: 500 }
        );
      }

      // Gerar embeddings em background
      generateDocumentEmbeddings(documentId).catch((err) => {
        console.error('Background embedding error:', err);
      });

      return NextResponse.json({
        success: true,
        documentId,
        totalChunks: result.totalChunks,
        message: 'Documento processado. Embeddings sendo gerados...',
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao fazer upload' },
      { status: 500 }
    );
  }
}
