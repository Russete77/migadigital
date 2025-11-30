import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatOptions {
  maxTokens?: number;
  temperature?: number;
  model?: 'gpt-4o' | 'gpt-4o-mini';
}

/**
 * Cria uma conversa com a OpenAI
 */
export const createChatCompletion = async (
  systemPrompt: string,
  messages: Message[],
  options: ChatOptions = {}
): Promise<{ message: string }> => {
  const response = await openai.chat.completions.create({
    model: options.model || 'gpt-4o',
    max_tokens: options.maxTokens || 1024,
    temperature: options.temperature || 0.7,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Unexpected response from OpenAI');
  }

  return { message: content };
};

/**
 * Cria uma analise com vision (imagens)
 */
export const createVisionAnalysis = async (
  systemPrompt: string,
  prompt: string,
  imageBase64: string,
  imageMediaType: string = 'image/jpeg'
): Promise<{ message: string }> => {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 2048,
    temperature: 0.5,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:${imageMediaType};base64,${imageBase64}`,
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Unexpected response from OpenAI');
  }

  return { message: content };
};
