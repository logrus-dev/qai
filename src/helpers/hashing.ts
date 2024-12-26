import xxhashjs from 'xxhashjs';
const { h64 } = xxhashjs;

const hashFn = h64(0xABCD);
const hash = (source: string) => hashFn.update(source).digest().toString(16);

const prepareHashSource = (src: string) => src.replace(/\s/g, '').toLowerCase();

export const getPromptHash = (userId: string, assistantTimestamp: string, prompt: string) => {
  const hashSource = `${userId}_${assistantTimestamp}_${prepareHashSource(prompt)}`;
  return hash(hashSource).padStart(16, '0');
};
