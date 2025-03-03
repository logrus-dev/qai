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

interface TtsConfig {
  region: string
  key: string
}
export const getTtsConfig = async (configName: string = 'default'): Promise<TtsConfig> => {
  if (vc) {
    const { data } = await vc.kv2.read({ mountPath: 'kv', path: `azure_tts/${configName}` });
    const config = data?.data.data as any;
    if (!config) throw new Error(`Missing TTS config: ${configName}`);
    return config;
  }

  if (!process.env.SPEECH_REGION || !process.env.SPEECH_KEY) {
    throw new Error('Missing Azure TTS configuration');
  }
  return {
    region: process.env.SPEECH_REGION,
    key: process.env.SPEECH_KEY
  };
};

interface QaiConfig {
  sign_key: string
}
export const getQaiConfig = async (): Promise<QaiConfig> => {
  if (vc) {
    const { data } = await vc.kv2.read({ mountPath: 'kv', path: 'qai' });
    const config = data?.data.data as any;
    if (!config) throw new Error('Missing QAI config');

    return config;
  }

  if (!process.env.QAI_SIGN_KEY) {
    throw new Error('Missing QAI configuration');
  }

  return {
    sign_key: process.env.QAI_SIGN_KEY,
  };
};
