import { getTts, uploadSpeech } from './directus.js';
import { getTtsConfig } from './config.js';

const escape = (str: string) => str.replace(/[<>&'"]/g, c => {
  switch (c) {
    case '<': return '&lt;';
    case '>': return '&gt;';
    case '&': return '&amp;';
    case '\'': return '&apos;';
    case '"': return '&quot;';
  }
  return c;
});

export async function tts(token: string, ttsCode: string, text: string) {
  const tts = await getTts(token, ttsCode);
  const config = await getTtsConfig(tts.config);

  const ssml = tts.ssml.replace('$TEXT', escape(text));
  
  const headers = {
    "Ocp-Apim-Subscription-Key": config.key,
    "Content-Type": "application/ssml+xml",
    "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
    "User-Agent": "Node.js"
  };

  const url = `https://${config.region}.tts.speech.microsoft.com/cognitiveservices/v1`;
  const response = await fetch(url, {
    method: "POST",
    headers: headers,
    body: ssml
  });

  if (!response.ok) {
    console.error(await response.json());
    throw new Error('Failed to synthesize speech');
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  // await uploadSpeech(token, arrayBuffer);

  return buffer;
}
