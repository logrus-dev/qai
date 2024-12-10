import { Client } from '@litehex/node-vault';

const vaultEndpoint = process.env.VAULT_ADDR;
const vaultToken = process.env.VAULT_TOKEN;
const useVault = !!(vaultEndpoint && vaultToken);

// Get a new instance of the client
const vc = useVault ? new Client() : null;

interface AiConfig {
  endpoint: string
  model: string
  version: string
  key: string
}
export const getAiConfig = async (configName: string = 'default'): Promise<AiConfig> => {
  if (vc) {
    const { data } = await vc.kv2.read({ mountPath: 'kv', path: `open_ai/${configName}` });
    const config = data?.data.data as any;
    if (!config) throw new Error(`Missing AI config: ${configName}`);
    return config;
  }

  if (!process.env.OPENAI_ENDPOINT || !process.env.OPENAI_MODEL || !process.env.OPENAI_API_VERSION || !process.env.OPENAI_API_KEY) {
    throw new Error('Missing OpenAI configuration');
  }
  return {
    endpoint: process.env.OPENAI_ENDPOINT,
    model: process.env.OPENAI_MODEL,
    version: process.env.OPENAI_API_VERSION,
    key: process.env.OPENAI_API_KEY,
  };
};
