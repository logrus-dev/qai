import { FastifyPluginAsync, FastifySchema } from 'fastify';
import { Static, Type } from '@sinclair/typebox';
import { getCacheEntry } from '../services/directus.js';
import { getJob } from '../services/jobs.js';
import {micromark} from 'micromark';

const Params = Type.Object({
  hash: Type.String({ minLength: 16, maxLength: 16, }),
})

type ParamsType = Static<typeof Params>

const schema: FastifySchema = {
  params: Params
};

interface IHeaders {
  
}

interface IReply {
  
}

const plugin: FastifyPluginAsync = async (fastify, opts) => {
  fastify.get<{
    Params: ParamsType
  }>('/:hash', { schema } , async (request, reply) => {
    const { hash } = request.params;
    const { t } = request.cookies;
    if (!t) {
      reply.code(403);
      return;
    }

    await getJob(hash);
    const cacheEntry = await getCacheEntry(t, hash);
    if (!cacheEntry) {
      reply.code(404);
      return;
    }

    const { content, prompt, title } = cacheEntry;

    return reply.viewAsync("completion.eta", {
      content: micromark(content, { allowDangerousHtml: true }),
      title: title,
      prompt: micromark(prompt),
    });
  })
}

export default plugin;
