import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/server/supabase-admin';
import { createChatCompletion, Message } from '@/lib/server/ai/openai';
import { EMERGENCY_INTERVENTION_PROMPT } from '@/lib/server/ai/prompts/emergency-intervention';
import { SentimentAnalyzer } from '@/lib/server/nlp/sentiment-analyzer';
import { adaptiveHumanizer } from '@/lib/server/nlp/adaptive-humanizer';
import { ContextEnricher } from '@/lib/server/nlp/context-enricher';
import { promptLibrary } from '@/lib/server/ai/prompt-library';
import { abTestingService } from '@/lib/server/ai/ab-testing';
import { getRelevantContext, logKnowledgeUsage } from '@/lib/server/knowledge/retrieval';

// Initialize NLP components
const sentimentAnalyzer = new SentimentAnalyzer();
const contextEnricher = new ContextEnricher();

/**
 * EMERGENCY CHAT v3.0 - Com RAG + Learning Loop
 *
 * Pipeline completo:
 * 1. BERT Sentiment Analysis (pysentimiento PT-BR)
 * 2. Prompt Library (seleção dinâmica baseada em performance)
 * 3. A/B Testing (quando ativo)
 * 4. Context Enrichment (histórico do usuário)
 * 5. RAG - Retrieval Augmented Generation (busca conhecimento relevante)
 * 6. GPT-4o com prompt otimizado + conhecimento
 * 7. Humanização Adaptativa (aprende com feedback)
 * 8. Logs completos para AI Observatory + Learning Pipeline
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { message, conversationHistory, sessionId } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Mensagem inválida' }, { status: 400 });
    }

    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!profile || !profile.id) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    // Start timing
    const startTime = Date.now();

    // ═══════════════════════════════════════════════════════════════
    // LAYER 1: Análise de Sentimento (BERT PT-BR)
    // ═══════════════════════════════════════════════════════════════
    const bertStartTime = Date.now();
    const sentiment = await sentimentAnalyzer.analyze(message);
    const bertTime = Date.now() - bertStartTime;

    console.log('📊 Sentiment Analysis:', {
      emotion: sentiment.emotion,
      urgency: sentiment.urgency,
      confidence: `${(sentiment.confidence * 100).toFixed(1)}%`,
      model: sentiment.model_used,
      time: `${bertTime}ms`,
    });

    // ═══════════════════════════════════════════════════════════════
    // LAYER 2: Seleção de Prompt (Prompt Library + A/B Testing)
    // ═══════════════════════════════════════════════════════════════
    const promptStartTime = Date.now();

    // Verificar se há experimento A/B ativo
    const abAssignment = await abTestingService.getAssignment(userId, 'prompt');

    // Selecionar prompt da biblioteca
    const selectedPrompt = await promptLibrary.selectPrompt(
      sentiment.emotion,
      sentiment.urgency,
      userId
    );

    const promptTime = Date.now() - promptStartTime;

    console.log('📝 Prompt Selection:', {
      fromLibrary: selectedPrompt.isFromLibrary,
      templateId: selectedPrompt.template?.id || 'default',
      abTest: abAssignment ? abAssignment.variant : 'none',
    });

    // ═══════════════════════════════════════════════════════════════
    // LAYER 3: Context Enrichment
    // ═══════════════════════════════════════════════════════════════
    const enricherStartTime = Date.now();

    // Usar prompt selecionado ou fallback
    const basePrompt = selectedPrompt.systemPrompt || EMERGENCY_INTERVENTION_PROMPT;

    const enrichedPrompt = await contextEnricher.enrichPrompt(
      profile.id,
      userId,
      basePrompt,
      sentiment.emotion,
      sentiment.urgency
    );
    const enricherTime = Date.now() - enricherStartTime;

    console.log('🧠 Context Enrichment:', {
      tone: enrichedPrompt.toneAdjustment,
      temperature: enrichedPrompt.temperature,
      hasContext: enrichedPrompt.contextPrefix.length > 0,
    });

    // ═══════════════════════════════════════════════════════════════
    // LAYER 4: RAG - Retrieval Augmented Generation
    // ═══════════════════════════════════════════════════════════════
    const ragStartTime = Date.now();
    let ragContext = '';
    let ragChunks: { chunkId: string; similarity: number }[] = [];

    try {
      const ragResult = await getRelevantContext(message, {
        maxResults: 3,
        minSimilarity: 0.7,
        maxContextLength: 1500,
        includeSource: false,
      });

      ragContext = ragResult.context;
      ragChunks = ragResult.chunks.map((c) => ({
        chunkId: c.chunkId,
        similarity: c.similarity,
      }));

      if (ragContext) {
        console.log('📚 RAG Context:', {
          chunksFound: ragResult.chunks.length,
          avgSimilarity: (
            ragResult.chunks.reduce((s, c) => s + c.similarity, 0) /
            ragResult.chunks.length
          ).toFixed(2),
          queryTime: `${ragResult.queryTime}ms`,
        });
      }
    } catch (ragError) {
      console.log('📚 RAG: Sem conhecimento relevante encontrado');
    }

    const ragTime = Date.now() - ragStartTime;

    // ═══════════════════════════════════════════════════════════════
    // LAYER 5: GPT-4o Response
    // ═══════════════════════════════════════════════════════════════
    // Construir mensagem com contexto do usuário + conhecimento RAG
    let userMessageWithContext = enrichedPrompt.contextPrefix
      ? `${enrichedPrompt.contextPrefix}---\n\n💬 MENSAGEM ATUAL DA USUÁRIA:\n${message}`
      : message;

    // Adicionar conhecimento RAG ao prompt do sistema se disponível
    let systemPromptWithRAG = enrichedPrompt.systemPrompt;
    if (ragContext) {
      systemPromptWithRAG = `${enrichedPrompt.systemPrompt}

═══════════════════════════════════════════════════════════════
CONHECIMENTO ESPECIALIZADO (Use como referência, não cite diretamente):
═══════════════════════════════════════════════════════════════
${ragContext}
═══════════════════════════════════════════════════════════════

IMPORTANTE: Use esse conhecimento para enriquecer sua resposta, mas não mencione que você tem "base de dados" ou "documentos". Fale naturalmente como se fosse seu próprio conhecimento.`;
    }

    const messages: Message[] = [
      ...(conversationHistory || []),
      { role: 'user' as const, content: userMessageWithContext },
    ];

    const gptStartTime = Date.now();
    const aiResponse = await createChatCompletion(systemPromptWithRAG, messages, {
      maxTokens: 1024,
      temperature: enrichedPrompt.temperature,
    });
    const gptTime = Date.now() - gptStartTime;

    // ═══════════════════════════════════════════════════════════════
    // LAYER 6: Humanização Adaptativa
    // ═══════════════════════════════════════════════════════════════
    const humanizerStartTime = Date.now();
    const roboticnessBefore = adaptiveHumanizer.detectRoboticness(aiResponse.message);

    // Mapear tom do enricher para o humanizer
    const humanizerTone: 'formal' | 'casual' | 'amiga' =
      enrichedPrompt.toneAdjustment === 'terapeutica' ? 'formal' :
      enrichedPrompt.toneAdjustment === 'urgente' ? 'casual' :
      'amiga';

    const humanizedMessage = await adaptiveHumanizer.humanize(
      aiResponse.message,
      sentiment.emotion,
      sentiment.intensity,
      humanizerTone
    );

    const roboticnessAfter = adaptiveHumanizer.detectRoboticness(humanizedMessage);
    const humanizerStats = adaptiveHumanizer.getLastStats();
    const humanizerTime = Date.now() - humanizerStartTime;

    const improvementPercent = roboticnessBefore > 0
      ? ((roboticnessBefore - roboticnessAfter) / roboticnessBefore * 100)
      : 0;

    console.log('🎨 Humanization:', {
      roboticness: `${(roboticnessBefore * 100).toFixed(0)}% → ${(roboticnessAfter * 100).toFixed(0)}%`,
      improvement: `${improvementPercent.toFixed(1)}%`,
      rulesApplied: humanizerStats.rulesApplied.length,
    });

    // ═══════════════════════════════════════════════════════════════
    // LAYER 7: Safety Check
    // ═══════════════════════════════════════════════════════════════
    let finalMessage = humanizedMessage;
    const wasCrisis = sentiment.urgency === 'critica';

    if (wasCrisis) {
      finalMessage += '\n\n🆘 Lembre-se: você não está sozinha. Ligue 188 (CVV) se precisar de ajuda imediata.';
      console.log('🚨 Crisis detected - emergency resources added');
    }

    // ═══════════════════════════════════════════════════════════════
    // LAYER 8: Typing Delay (simular digitação humana)
    // ═══════════════════════════════════════════════════════════════
    const typingDelay = adaptiveHumanizer.calculateTypingDelay(finalMessage);
    await new Promise(resolve => setTimeout(resolve, Math.min(typingDelay, 2000))); // Max 2s

    const totalTime = Date.now() - startTime;

    // ═══════════════════════════════════════════════════════════════
    // LAYER 9: Save Session
    // ═══════════════════════════════════════════════════════════════
    let finalSessionId = sessionId;

    if (!sessionId) {
      const { data: newSession, error: sessionError } = await supabaseAdmin
        .from('emergency_sessions')
        .insert({
          user_id: profile.id,
          messages: [...messages, { role: 'assistant', content: finalMessage }],
        })
        .select('id')
        .single();

      if (sessionError) {
        console.error('Error creating session:', sessionError);
      } else if (newSession) {
        finalSessionId = newSession.id;
      }
    } else {
      await supabaseAdmin
        .from('emergency_sessions')
        .update({
          messages: [...messages, { role: 'assistant', content: finalMessage }],
        })
        .eq('id', sessionId);
    }

    // ═══════════════════════════════════════════════════════════════
    // LAYER 10: Log para AI Observatory + Learning Pipeline
    // ═══════════════════════════════════════════════════════════════
    let responseLogId: string | null = null;

    try {
      const { data: logData } = await supabaseAdmin.from('ai_response_logs').insert({
        session_id: finalSessionId || null,
        user_id: userId,
        ai_type: 'chat',

        // Input
        user_message: message,

        // Sentiment Analysis
        sentiment_emotion: sentiment.emotion,
        sentiment_intensity: sentiment.intensity,
        sentiment_urgency: sentiment.urgency,
        sentiment_keywords: sentiment.keywords,

        // Model info (novo!)
        model_used: sentiment.model_used,
        bert_confidence: sentiment.confidence,

        // Prompt Selection (novo!)
        template_id: selectedPrompt.template?.id || null,
        ab_experiment_id: abAssignment?.experimentId || null,
        ab_variant: abAssignment?.variant || selectedPrompt.abTestGroup || null,

        // Response
        raw_response: aiResponse.message,
        humanized_response: finalMessage,

        // Humanization Metrics
        roboticness_before: roboticnessBefore,
        roboticness_after: roboticnessAfter,
        removed_phrases: humanizerStats.rulesApplied.filter(r => r.startsWith('removal')),
        added_markers: humanizerStats.rulesApplied.filter(r => r.startsWith('marker')),

        // Performance
        processing_time_ms: totalTime,
        bert_time_ms: bertTime,
        gpt_time_ms: gptTime,
        humanizer_time_ms: humanizerTime,

        // Flags
        was_crisis: wasCrisis,
        was_escalated: false,
        was_moderated: false,

        // Learning (novo!)
        learning_processed: false,
      }).select('id').single();

      responseLogId = logData?.id || null;
      console.log('✅ Response logged to AI Observatory');

      // Registrar impressão do A/B test
      if (abAssignment) {
        await abTestingService.logImpression(abAssignment.experimentId, abAssignment.variant);
      }

      // Registrar uso do RAG
      if (ragChunks.length > 0 && responseLogId) {
        await logKnowledgeUsage({
          responseLogId,
          chunkIds: ragChunks.map((c) => c.chunkId),
          queryText: message,
          similarityScores: ragChunks.map((c) => c.similarity),
        });
      }

    } catch (logError) {
      console.error('⚠️ Failed to log response:', logError);
    }

    // ═══════════════════════════════════════════════════════════════
    // RESPONSE
    // ═══════════════════════════════════════════════════════════════
    console.log(`✅ Emergency chat completed in ${totalTime}ms`);

    return NextResponse.json({
      message: finalMessage,
      sessionId: finalSessionId,
      responseLogId, // Para feedback
      metadata: {
        sentiment: {
          emotion: sentiment.emotion,
          urgency: sentiment.urgency,
          intensity: sentiment.intensity,
          confidence: sentiment.confidence,
          model: sentiment.model_used,
        },
        contextEnrichment: {
          tone: enrichedPrompt.toneAdjustment,
          temperature: enrichedPrompt.temperature,
          hasContext: enrichedPrompt.contextPrefix.length > 0,
        },
        promptSelection: {
          fromLibrary: selectedPrompt.isFromLibrary,
          templateName: selectedPrompt.template?.name || 'default',
          abTest: abAssignment?.variant || null,
        },
        humanization: {
          roboticness_before: roboticnessBefore,
          roboticness_after: roboticnessAfter,
          improvement_percent: improvementPercent.toFixed(1),
          rules_applied: humanizerStats.rulesApplied,
        },
        rag: {
          chunksUsed: ragChunks.length,
          avgSimilarity: ragChunks.length > 0
            ? (ragChunks.reduce((s, c) => s + c.similarity, 0) / ragChunks.length).toFixed(2)
            : null,
          hasContext: ragContext.length > 0,
        },
        performance: {
          total_ms: totalTime,
          bert_ms: bertTime,
          prompt_selection_ms: promptTime,
          enricher_ms: enricherTime,
          rag_ms: ragTime,
          gpt_ms: gptTime,
          humanizer_ms: humanizerTime,
        },
      },
    });
  } catch (error) {
    console.error('Emergency chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao processar mensagem' },
      { status: 500 }
    );
  }
}
