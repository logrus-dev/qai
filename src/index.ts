import fastify from 'fastify';
import sendAiRequest from './routes/send-ai-request.js';
import retrieveAiResponse from './routes/retrieve-ai-response.js';
import type { FastifyCookieOptions } from '@fastify/cookie';
import fastifyCookie from '@fastify/cookie';
import fastifyView from '@fastify/view';
import fastifyStatic from '@fastify/static';
import { Eta } from "eta"
import multipart from '@fastify/multipart';
import formbody from '@fastify/formbody';
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

server.register(multipart, {
  attachFieldsToBody: true,
  limits: {
    fieldNameSize: 100, // Max field name size in bytes
    fieldSize: 1000,     // Max field value size in bytes
    fields: 10,         // Max number of non-file fields
    fileSize: 5000000,  // For multipart forms, the max file size in bytes
    files: 1,           // Max number of file fields
    headerPairs: 5000,  // Max number of header key=>value pairs
    parts: 5000         // For multipart forms, the max number of parts (fields + files)
  }
});
server.register(formbody);

server.register(tts);
server.register(sendAiRequest);
server.register(retrieveAiResponse);

server.listen({ port: 8080, host: '0.0.0.0' });
