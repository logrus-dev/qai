import OpenAI from 'openai';
import { getAiConfig } from './config.js';
import { ChatCompletionCreateParamsNonStreaming } from 'openai/resources/index.mjs';

const schemas = {
  file: {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "properties": {
      "file_name_with_extension": {
        "type": "string",
        "description": "The name of the file including its extension. Must be a valid filename."
      },
      "file_content": {
        "type": "string",
        "description": "The content of the file as a string."
      }
    },
    "required": ["file_name_with_extension", "file_content"],
    "additionalProperties": false
  }
};

export const getCompletion = async (sysMessage: string, prompt: string | Blob, aiConfig?: string, schema?: keyof typeof schemas): Promise<string> => {
  const config = await getAiConfig(aiConfig);
  const client = new OpenAI({
    apiKey: config.key,
    baseURL: config.endpoint,
    defaultQuery: { "api-version": config.version },
    defaultHeaders: { "api-key": config.key },
  });

  let messages: ChatCompletionCreateParamsNonStreaming["messages"] = [
    { role: 'system', content: sysMessage }
  ];

  if (prompt instanceof Blob) {
    // Convert Blob to base64-encoded string
    const buffer = await prompt.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');
    const mimeType = prompt.type || 'application/octet-stream';

    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: 'Please analyze the following image:' },
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }
      ]
    });
  } else {
    messages.push({ role: 'user', content: prompt });
  }

  const request: ChatCompletionCreateParamsNonStreaming = schema
    ? {
      messages,
      model: config.model,
      max_tokens: 1000,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: schema,
          strict: true,
          schema: schemas[schema],
        }
      },
    }
    : {
      messages,
      model: config.model,
      max_tokens: 1000,
    };

  const chatCompletion = await client.chat.completions.create(request);

  if (chatCompletion.choices.length === 0) throw new Error('No choices');
  const { finish_reason, message } = chatCompletion.choices[0];

  if (finish_reason === 'length') throw new Error('Token limit has been reached');
  if (finish_reason === 'content_filter') throw new Error('Content filtered');
  if (!message.content) throw new Error('No content');

  return message.content;
};
