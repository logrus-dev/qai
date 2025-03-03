import { FastifyPluginAsync } from 'fastify';
import { getPromptHash } from '../helpers/hashing.js';
import { checkCacheEntryExists, createCacheEntry, deleteCacheError, getAssistant, getCurrentUser } from '../services/directus.js';
import { getJob, shelveJob } from '../services/jobs.js';
import { getCompletion } from '../services/ai.js';
import { v4 as uuidv4 } from 'uuid';
import { FileInfo } from '../helpers/file-info.js';

interface FieldInfo {
   type: 'field' | 'file'
   mimetype: string
}

interface FileFieldInfo extends FieldInfo {
  toBuffer: () => Promise<Buffer>
}

interface TextFieldInfo extends FieldInfo {
  value: string
}

// Fastify schema does not work well with file uploads, so downgrading to pure TS, compile-time-only typing
interface RequestBody {
  type: 'field' | 'file'
  value?: string
  toBuffer?: () => Promise<Buffer>
}

function isFile(request: FieldInfo): request is FileFieldInfo {
  return  typeof request === 'string' ? false : request.type === 'file';
}

function isField(request: FieldInfo | string): request is TextFieldInfo {
  return typeof request === 'string' ? false : request.type === 'field';
}

function isString(request: FieldInfo | string): request is string {
  return typeof request === 'string';
}

interface Body {
  a: FieldInfo | string
  t: FieldInfo | string
  q: FieldInfo | string
  f: FieldInfo
}

const getString = (field: FieldInfo | string) => {
  if (isString(field)) {
    return field;
  }
  if (!isField(field)) {
    return undefined;
  }

  return field.value
};

const getFile = async (field: FieldInfo): Promise<FileInfo | undefined> => {
  if (!isFile(field)) {
    return undefined;
  }

  const buffer = await field.toBuffer();
  return {
    contentBase64: buffer.toString('base64'),
    mimeType: field.mimetype,
  };
};

const plugin: FastifyPluginAsync = async (fastify, opts) => {
  fastify.post<{ Body: Body }>('/', {  }, async (request, reply) => {
    const t = getString(request.body.t);
    if (!t) return reply.status(403);

    const a = getString(request.body.a);
    if (!a) return reply.status(400);

    const prompt = getString(request.body.q);
    const file = await getFile(request.body.f);

    const { id: userId } = await getCurrentUser(t);
    const {
      id: assistantId,
      sys_message,
      name: assistant_name,
      ai_config,
      date_updated: assistantUpdatedAt,
      format,
    } = await getAssistant(t, a);

    const title = `${assistant_name} | ${prompt?.trim().substring(0, 20)}`;
    const promptHash = await getPromptHash(userId, assistantUpdatedAt, file?.contentBase64 ?? prompt ?? uuidv4());

    if (!await checkCacheEntryExists(promptHash) && !getJob(promptHash)) {
      shelveJob(promptHash, (async () => {
        let content: string;
        try {
          content = await getCompletion(sys_message, prompt, file, ai_config, format === 'file' ? 'file' : undefined);
          await deleteCacheError(t, promptHash);
          await createCacheEntry(t, {
            hash: promptHash,
            prompt: prompt ?? '(no textual prompt were provided)',
            content,
            status: 'content',
            title,
            format,
          });
        } catch (er: any) {
          request.log.error(er);
          await deleteCacheError(t, promptHash);
          await createCacheEntry(t, {
            hash: promptHash,
            prompt: prompt ?? '(no textual prompt were provided)',
            content: '<mark>Could not get completion from assistant.</mark>',
            status: 'error',
            title,
            format: 'markdown',
          });
        }
      })());
    }

    reply.code(201).send({ id: promptHash });
  });
}

export default plugin;
