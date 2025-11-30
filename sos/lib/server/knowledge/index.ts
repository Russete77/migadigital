/**
 * Knowledge Base Module
 * Sistema de RAG (Retrieval-Augmented Generation)
 */

export { pdfProcessor, createDocument, processPDFContent, deleteDocument, listDocuments } from './pdf-processor';
export { embeddingsService, generateEmbedding, generateDocumentEmbeddings } from './embeddings';
export { knowledgeRetrieval, searchKnowledge, getRelevantContext, logKnowledgeUsage } from './retrieval';
export type { RetrievedChunk, RetrievalResult, RetrievalOptions } from './retrieval';
