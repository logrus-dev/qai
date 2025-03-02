import { FastifyPluginAsync, FastifySchema } from 'fastify';
import { Static, Type } from '@sinclair/typebox';
import { getPromptHash } from '../helpers/hashing.js';
import { checkCacheEntryExists, checkCacheErrorExists, createCacheEntry, deleteCacheError, getAssistant, getCurrentUser } from '../services/directus.js';
import { getJob, shelveJob } from '../services/jobs.js';
import { getCompletion } from '../services/ai.js';
import { v4 as uuidv4 } from 'uuid';

const QueryString = Type.Object({
  q: Type.String({ minLength: 1 }),
  a: Type.String({ minLength: 1 }),
  t: Type.String({ minLength: 10 }),
})

type QueryStringType = Static<typeof QueryString>

const schema: FastifySchema = {
  querystring: QueryString
};

interface IHeaders {
  
}

interface IReply {
  
}

const plugin: FastifyPluginAsync = async (fastify, opts) => {
  fastify.get<{
    Querystring: QueryStringType,
    Headers: IHeaders,
    Reply: IReply
  }>('/', { schema } , async (request, reply) => {
    const { q, a, t } = request.query

    const { id: userId } = await getCurrentUser(t);
    const {
      id: assistantId,
      sys_message,
      name: assistant_name,
      ai_config,
      date_updated: assistantUpdatedAt,
      format,
   } = await getAssistant(t, a);
    const promptHash = getPromptHash(userId, assistantUpdatedAt, q);

    if (!await checkCacheEntryExists(t, promptHash) && !getJob(promptHash)) {
      shelveJob(promptHash, (async () => {
        let content: string;
        try {
          content = await getCompletion(sys_message, q, ai_config);
          await deleteCacheError(t, promptHash);
          await createCacheEntry(t, {
            hash: promptHash,
            prompt: q.trim(),
            content,
            status: 'content',
            title: `${assistant_name} | ${q.trim().substring(0, 20)}`,
            format,
          });
        } catch (er: any) {
          request.log.error(er);
          await deleteCacheError(t, promptHash);
          await createCacheEntry(t, {
            hash: promptHash,
            prompt: q.trim(),
            content: '<mark>Could not get completion from assistant.</mark>',
            status: 'error',
            title: `${assistant_name} | ${q.trim().substring(0, 20)}`,
            format,
          });
        }
      })());
    }

    const expires = new Date();
    expires.setDate(expires.getDate() + 365);
    reply.setCookie('t', t, {
      expires,
     });
    reply.redirect(`/${promptHash}`);
  });

  fastify.post<{ Headers: {}; Reply: {} }>('/', {  }, async (request, reply) => {
    const data = await request.file();
    if (!data) return reply.status(400).send({ error: 'Missing form fields' });

    const { a: { value: a }, t: { value: t }, q: file } = data.fields as any;
    const q = new Blob([await file.toBuffer()], { type: data.mimetype });

    const { id: userId } = await getCurrentUser(t);
    const {
      id: assistantId,
      sys_message,
      name: assistant_name,
      ai_config,
      date_updated: assistantUpdatedAt,
      format,
    } = await getAssistant(t, a);

    const stub = uuidv4();
    const promptHash = getPromptHash(userId, assistantUpdatedAt, stub);

    shelveJob(promptHash, (async () => {
      let content: string;
      try {
        content = await getCompletion(sys_message, q, ai_config, format === 'file' ? 'file' : undefined);
        await deleteCacheError(t, promptHash);
        await createCacheEntry(t, {
          hash: promptHash,
          prompt: stub,
          content,
          status: 'content',
          title: `${assistant_name} | File Request`,
          format,
        });
      } catch (er: any) {
        request.log.error(er);
        await deleteCacheError(t, promptHash);
        await createCacheEntry(t, {
          hash: promptHash,
          prompt: stub,
          content: '<mark>Could not get completion from assistant.</mark>',
          status: 'error',
          title: `${assistant_name} | File Request`,
          format
        });
      }
    })());

    const expires = new Date();
    expires.setDate(expires.getDate() + 365);
    reply.setCookie('t', t, {
      expires,
    });
    reply.redirect(`/${promptHash}`);
  });
}

export default plugin;
