import { createDirectus, rest, withToken, readItems, createItem, readUser, uploadFiles, deleteItems } from '@directus/sdk';

if (!process.env.DIRECTUS_URL) throw new Error('Missing DIRECTUS_URL');

const directus = createDirectus(process.env.DIRECTUS_URL).with(rest());
const file = createDirectus(process.env.DIRECTUS_URL).with(rest());

export const getCurrentUser = (token: string) =>
  directus.request(withToken(token, readUser('me')));

interface Assistant {
  id: number
  code: string
  name: string
  sys_message: string
  ai_config: string
  date_updated: string
}
export const getAssistant = async (token: string, code: string): Promise<Assistant> => {
  const [assistant] = await directus.request<Assistant[]>(withToken(token, readItems('qai_assistant', {
    filter: { code: { _eq: code } }
  })));
  if (!assistant) throw new Error(`Assistant not found: ${code}`);

  return assistant;
};

interface CompletionCache {
  hash: string
  prompt: string
  content: string
  title: string
  status: 'content' | 'error'
}
export const getCacheEntry = async (token: string, promptHash: string): Promise<CompletionCache> => {
  const [cacheEntry] = await directus.request<CompletionCache[]>(withToken(token, readItems('qai_completion_cache', {
    filter: { hash: { _eq: promptHash } }
  })));

  return cacheEntry;
};

export const checkCacheEntryExists = async (token: string, promptHash: string) => {
  const result = await directus.request(withToken(token, readItems('qai_completion_cache', {
    filter: { hash: { _eq: promptHash }, status: { _eq: 'content' } },
    fields: ['id']
  })));

  return result.length > 0;
};

export const checkCacheErrorExists = async (token: string, promptHash: string) => {
  const result = await directus.request(withToken(token, readItems('qai_completion_cache', {
    filter: { hash: { _eq: promptHash }, status: { _eq: 'error' } },
    fields: ['id']
  })));

  return result.length > 0;
};

export const createCacheEntry = async (token: string, data: CompletionCache) => {
  await directus.request(withToken(token, createItem('qai_completion_cache', data)));
};

export const deleteCacheError = async (token: string, promptHash: string) => {
  await directus.request(withToken(token, deleteItems('qai_completion_cache', {
    filter: { hash: { _eq: promptHash }, status: { _eq: 'error' } },
  })));
};

export const uploadSpeech = async (token: string, speech: ArrayBuffer) => {
  const formData = new FormData();
  formData.append('file', new Blob([speech], { type: 'audio/mpeg' }), 'speech.mp3');
  await directus.request(withToken(token, uploadFiles(formData)));
};

interface Tts {
  code: string
  ssml: string
  config: string
}
export const getTts = async (token: string, code: string): Promise<Tts> => {
  const [tts] = await directus.request<Tts[]>(withToken(token, readItems('qai_tts', {
    filter: { code: { _eq: code } }
  })));
  if (!tts) throw new Error(`TTS not found: ${code}`);

  return tts;
};
