import { createDirectus, rest, withToken, readItems, createItem, readUser, } from '@directus/sdk';

if (!process.env.DIRECTUS_URL) throw new Error('Missing DIRECTUS_URL');

const directus = createDirectus(process.env.DIRECTUS_URL).with(rest());

export const getCurrentUser = (token: string) =>
  directus.request(withToken(token, readUser('me')));

interface Assistant {
  code: string
  name: string
  sys_message: string
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
}
export const getCacheEntry = async (token: string, promptHash: string): Promise<CompletionCache> => {
  const [cacheEntry] = await directus.request<CompletionCache[]>(withToken(token, readItems('qai_completion_cache', {
    filter: { hash: { _eq: promptHash } }
  })));

  return cacheEntry;
};

export const checkCacheEntryExists = async (token: string, promptHash: string) => {
  const result = await directus.request(withToken(token, readItems('qai_completion_cache', {
    filter: { hash: { _eq: promptHash } },
    fields: ['id']
  })));

  return result.length > 0;
};

export const createCacheEntry = async (token: string, data: CompletionCache) => {
  await directus.request(withToken(token, createItem('qai_completion_cache', data)));
};
