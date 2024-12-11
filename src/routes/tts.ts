import { FastifyPluginAsync, FastifySchema } from 'fastify';
import { Static, Type } from '@sinclair/typebox';
import { getCurrentUser } from '../services/directus.js';
import { tts } from '../services/tts.js';

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
  }>('/tts', { schema } , async (request, reply) => {
    const { q, a, t } = request.query

    await getCurrentUser(t);

    const speech = await tts(t, a, q);

    reply.type('audio/mpeg');
    return reply.send(speech);
  })
}

export default plugin;
