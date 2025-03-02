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

    const { content, prompt, title, format } = cacheEntry;

    switch (format) {
      case 'html':
        return reply.viewAsync("completion.eta", {
          content,
          title: title,
          prompt: micromark(prompt),
        });
      case 'markdown':
        return reply.viewAsync("completion.eta", {
          content: micromark(content, { allowDangerousHtml: true }),
          title: title,
          prompt: micromark(prompt),
        });
      case 'file':
        const { file_name_with_extension, file_content } = JSON.parse(content);
        return reply
        .header('Content-Disposition', `attachment; filename="${file_name_with_extension}"`)
        .header('Content-Type', 'text/plain')
        .send(file_content);
      default:
        throw new Error(`Format is not supported: ${format}.`);
    }
  })
}

export default plugin;
