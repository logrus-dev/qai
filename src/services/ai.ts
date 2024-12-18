import OpenAI from 'openai';
import { getAiConfig } from './config.js';

export const getCompletion = async (sysMessage: string, prompt: string, aiConfig?: string): Promise<string> => {
  const config = await getAiConfig(aiConfig);
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
  if (chatCompletion.choices.length === 0) throw new Error('No choices');
  const { finish_reason, message } = chatCompletion.choices[0];
  if (finish_reason === 'length') throw new Error('Token limit has reached');
  if (finish_reason === 'content_filter') throw new Error('Content filtered');;
  if (!message.content) throw new Error('No content');;

  return message.content;
};
