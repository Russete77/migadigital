import Anthropic from "@anthropic-ai/sdk";
import { Message } from "@/types/database.types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface ClaudeResponse {
  message: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export async function createChatCompletion(
  systemPrompt: string,
  messages: Message[],
  options?: {
    maxTokens?: number;
    temperature?: number;
  }
): Promise<ClaudeResponse> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: options?.maxTokens || 1024,
      temperature: options?.temperature || 0.7,
      system: systemPrompt,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    const textContent = response.content.find((block) => block.type === "text");

    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from Claude");
    }

    return {
      message: textContent.text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  } catch (error) {
    console.error("Claude API error:", error);
    throw new Error("Falha ao processar mensagem com Claude");
  }
}

export async function createVisionAnalysis(
  systemPrompt: string,
  textPrompt: string,
  imageBase64?: string
): Promise<ClaudeResponse> {
  try {
    const content: Anthropic.MessageParam["content"] = imageBase64
      ? [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: textPrompt,
          },
        ]
      : textPrompt;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      temperature: 0.5,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content,
        },
      ],
    });

    const textContent = response.content.find((block) => block.type === "text");

    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from Claude Vision");
    }

    return {
      message: textContent.text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  } catch (error) {
    console.error("Claude Vision API error:", error);
    throw new Error("Falha ao analisar imagem com Claude");
  }
}
