import fastify from 'fastify';
import sendAiRequest from './routes/send-ai-request.js';
import retrieveAiResponse from './routes/retrieve-ai-response.js';
import type { FastifyCookieOptions } from '@fastify/cookie';
import fastifyCookie from '@fastify/cookie';
import fastifyView from '@fastify/view';
import fastifyStatic from '@fastify/static';
import { Eta } from "eta"

if (!process.env.STATIC_CONTENT) throw new Error('Missing STATIC_CONTENT');

const server = fastify();

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

server.register(fastifyCookie, {
  secret: process.env.COOKIE_SECRET,
  parseOptions: { },
} as FastifyCookieOptions);

server.register(sendAiRequest);
server.register(retrieveAiResponse);

server.listen({ port: 8080, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
});
