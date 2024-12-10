import OpenAI from 'openai';
import { getAiConfig } from './config.js';

type GetCompletionResult = ['filtered' | 'limited' | 'error', undefined?] | ['content', string];
export const getCompletion = async (sysMessage: string, prompt: string, aiConfig?: string): Promise<GetCompletionResult> => {
  const config = await getAiConfig();
  const client = new OpenAI({
    apiKey: config.key,
    baseURL: config.endpoint,
    defaultQuery: { "api-version": config.version },
    defaultHeaders: { "api-key": config.key },
  });

  const chatCompletion = await client.chat.completions.create({
    messages: [
      { role: 'system', content: sysMessage },
      { role: 'user', content: prompt },
    ],
    model: config.model,
    max_tokens: 1000,
  });
  if (chatCompletion.choices.length === 0) return ['error'];
  const { finish_reason, message } = chatCompletion.choices[0];
  if (finish_reason === 'length') return ['limited'];
  if (finish_reason === 'content_filter') return ['filtered'];
  if (!message.content) return ['error'];

  return ['content', message.content];
};
