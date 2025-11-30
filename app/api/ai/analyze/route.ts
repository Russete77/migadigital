import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/server/supabase-admin';
import { createChatCompletion, createVisionAnalysis } from '@/lib/server/ai/openai';
import { ANALYZER_SYSTEM_PROMPT } from '@/lib/server/ai/prompts/analyzer-system';
import { SentimentAnalyzer } from '@/lib/server/nlp/sentiment-analyzer';

// Initialize NLP components
const sentimentAnalyzer = new SentimentAnalyzer();

// Types
interface AnalysisResult {
  interesse_nivel: number;
  interesse_analise: string;
  red_flags: Array<{
    tipo: string;
    evidencia: string;
    gravidade: 'baixa' | 'media' | 'alta';
    explicacao: string;
  }>;
  sinais_positivos: string[];
  padrao_comunicacao: string;
  probabilidade_ghosting: number;
  probabilidade_voltar: number;
  traducao_real: string;
  recomendacao: {
    acao: string;
    justificativa: string;
    script_resposta: string | null;
    posicionamento: string;
  };
}

/**
 * ANALYZER COM BERT + VISION
 *
 * Pipeline:
 * 1. BERT Sentiment Analysis (contexto emocional)
 * 2. GPT-4o Vision (se houver imagens)
 * 3. Analise estruturada JSON
 * 4. Logs para AI Observatory
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    // Parse form data (pode conter imagens)
    const formData = await req.formData();
    const conversationText = formData.get('conversationText') as string | null;
    const images = formData.getAll('images') as File[];

    if (!conversationText?.trim() && images.length === 0) {
      return NextResponse.json({ error: 'Forneca texto ou imagens' }, { status: 400 });
    }

    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, credits_remaining, subscription_tier')
      .eq('clerk_id', userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Perfil nao encontrado' }, { status: 404 });
    }

    // Check credits
    if (profile.subscription_tier === 'free' && profile.credits_remaining <= 0) {
      return NextResponse.json(
        { error: 'Creditos esgotados. Faca upgrade para continuar.' },
        { status: 403 }
      );
    }

    // Start timing
    const startTime = Date.now();

    // LAYER 1: BERT Sentiment Analysis (SE TEM TEXTO)
    let sentiment = null;
    let bertTime = 0;
    if (conversationText?.trim()) {
      const bertStartTime = Date.now();
      sentiment = await sentimentAnalyzer.analyze(conversationText);
      bertTime = Date.now() - bertStartTime;
      console.log('📊 Analyzer Sentiment:', sentiment);
    }

    // Process images if provided
    let imageBase64: string | undefined;
    if (images.length > 0) {
      const firstImage = images[0];
      const arrayBuffer = await firstImage.arrayBuffer();
      imageBase64 = Buffer.from(arrayBuffer).toString('base64');
    }

    // Montar prompt COMBINANDO texto + contexto emocional
    let enrichedPrompt = `⚠️ IMPORTANTE: Voce DEVE analisar TANTO o texto da conversa quanto a imagem dos prints (se fornecida).

Analise a seguinte conversa e retorne um JSON valido com a estrutura especificada no system prompt:`;

    if (sentiment) {
      enrichedPrompt += `\n\n📊 CONTEXTO EMOCIONAL DETECTADO (BERT):\n- Emocao predominante: ${sentiment.emotion}\n- Intensidade emocional: ${(sentiment.intensity * 100).toFixed(0)}%\n- Nivel de urgencia: ${sentiment.urgency}\n- Palavras-chave identificadas: ${sentiment.keywords.join(', ')}\n`;
      enrichedPrompt += `\n💡 Use este contexto emocional para enriquecer sua analise.`;
    }

    if (conversationText?.trim()) {
      enrichedPrompt += `\n\n💬 TEXTO DA CONVERSA (analise linha por linha):\n${conversationText}`;
    }

    if (imageBase64) {
      enrichedPrompt += `\n\n📸 PRINT ANEXADO: Veja a imagem e valide se as mensagens batem com o texto acima (se fornecido).`;
    }

    enrichedPrompt += `\n\n🎯 Retorne analise COMPLETA considerando texto + contexto emocional + imagem.\n\nIMPORTANTE: Retorne APENAS o JSON, sem texto adicional antes ou depois.`;

    // Get AI analysis
    const gptStartTime = Date.now();
    const aiResponse = imageBase64
      ? await createVisionAnalysis(ANALYZER_SYSTEM_PROMPT, enrichedPrompt, imageBase64)
      : await createChatCompletion(ANALYZER_SYSTEM_PROMPT, [{ role: 'user', content: enrichedPrompt }], {
          maxTokens: 2048,
          temperature: sentiment ? (sentiment.urgency === 'critica' ? 0.4 : 0.5) : 0.5,
        });
    const gptTime = Date.now() - gptStartTime;

    // Parse JSON response
    let analysisResult: AnalysisResult;
    try {
      let jsonStr = aiResponse.message.trim();
      jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      analysisResult = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse.message);
      return NextResponse.json({ error: 'Falha ao processar analise' }, { status: 500 });
    }

    const totalTime = Date.now() - startTime;

    // Save analysis to database
    const { data: analysis, error: analysisError } = await supabaseAdmin
      .from('conversation_analyses')
      .insert({
        user_id: profile.id,
        conversation_text: conversationText,
        conversation_images: null,
        analysis_result: analysisResult,
      })
      .select('id')
      .single();

    if (analysisError || !analysis) {
      return NextResponse.json({ error: 'Erro ao salvar analise' }, { status: 500 });
    }

    // LAYER 2: Log para AI Observatory
    try {
      await supabaseAdmin.from('ai_response_logs').insert({
        session_id: null,
        user_id: userId,
        ai_type: 'analyzer',

        // Input
        user_message: conversationText || '(apenas imagem)',

        // Sentiment Analysis (se disponivel)
        sentiment_emotion: sentiment?.emotion || null,
        sentiment_intensity: sentiment?.intensity || null,
        sentiment_urgency: sentiment?.urgency || null,
        sentiment_keywords: sentiment?.keywords || [],

        // Response
        raw_response: JSON.stringify(analysisResult),
        humanized_response: null,

        // Humanization Metrics (N/A para analyzer)
        roboticness_before: null,
        roboticness_after: null,
        removed_phrases: [],
        added_markers: [],

        // Performance
        processing_time_ms: totalTime,
        bert_time_ms: bertTime,
        gpt_time_ms: gptTime,
        humanizer_time_ms: 0,

        // Flags
        was_crisis: sentiment?.urgency === 'critica',
        was_escalated: false,
        was_moderated: false,
      });

      console.log('✅ Analyzer logged to AI Observatory');
    } catch (logError) {
      console.error('⚠️ Failed to log analyzer:', logError);
    }

    // Deduct credit for free users
    if (profile.subscription_tier === 'free') {
      await supabaseAdmin
        .from('profiles')
        .update({
          credits_remaining: Math.max(0, profile.credits_remaining - 1),
        })
        .eq('id', profile.id);
    }

    return NextResponse.json({
      analysisId: analysis.id,
      analysis: analysisResult,
      metadata: {
        sentiment,
        performance: {
          total_ms: totalTime,
          bert_ms: bertTime,
          gpt_ms: gptTime,
        },
      },
      creditsRemaining:
        profile.subscription_tier === 'free' ? Math.max(0, profile.credits_remaining - 1) : null,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao analisar conversa' },
      { status: 500 }
    );
  }
}
