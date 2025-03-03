import {
  createHmac,
} from 'node:crypto';
import { getQaiConfig } from '../services/config.js';

const getHmac = async () => {
  const qaiConfig = await getQaiConfig();
  return createHmac('sha256', qaiConfig.sign_key);
};

const prepareHashSource = (src: string) => src.replace(/\s/g, '').toLowerCase();

export const getPromptHash = async (userId: string, assistantTimestamp: string, prompt: string) => {
  const hmac = await getHmac();

  hmac.update(`${userId}_${assistantTimestamp}_${prepareHashSource(prompt)}`);

  return hmac.digest('hex');
};
