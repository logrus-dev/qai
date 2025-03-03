import fastify from 'fastify';
import sendAiRequest from './routes/send-ai-request.js';
import retrieveAiResponse from './routes/retrieve-ai-response.js';
import type { FastifyCookieOptions } from '@fastify/cookie';
import fastifyCookie from '@fastify/cookie';
import fastifyView from '@fastify/view';
import fastifyStatic from '@fastify/static';
import { Eta } from "eta"
import multipart from '@fastify/multipart';
import tts from './routes/tts.js';

if (!process.env.STATIC_CONTENT) throw new Error('Missing STATIC_CONTENT');

const server = fastify({
  logger: {
    transport: {
      targets: [
        {
          target: 'pino/file',
          options: { destination: 1 }, // this writes to STDOUT
        },
        {
          target: './helpers/log-ntfy.js',
          level: 'error',
          options: { },
        }
      ]
    }
  }
});

server.setErrorHandler(function (error, request, reply) {
  this.log.error(error);
  reply.status(500).send({ ok: false });
});

server.register(fastifyView, {
  engine: {
    eta: new Eta(),
  },
  templates: process.env.TEMPLATES,
});

server.register(fastifyStatic, {
  root: process.env.STATIC_CONTENT,
  prefix: '/static/',
});

server.register(multipart, { attachFieldsToBody: true });

server.register(tts);
server.register(sendAiRequest);
server.register(retrieveAiResponse);

server.listen({ port: 8080, host: '0.0.0.0' });
