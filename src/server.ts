import fastify from 'fastify'
import dotenv from 'dotenv';
import fastifyRedis from '@fastify/redis';

import { skinportRoutes } from './routes/skinport.route';

const server = fastify()

dotenv.config();

server.register(fastifyRedis, {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379
}).after((err) => {
  if (err) {
    server.log.error(err);
  } else {
    server.log.info('Redis connected');
  }
});

server.register(skinportRoutes, { prefix: '/skinport' });

server.listen({ port: Number(process.env.SERVER_PORT) || 3000, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server listening at ${process.env.SERVER_PORT}`)
})