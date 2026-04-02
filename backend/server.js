const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');

const authPlugin = require('./plugins/auth');
const moviesRoutes = require('./routes/movies');
const practiceRoutes = require('./routes/practice');
const audioRoutes = require('./routes/audio');

async function start() {
  await fastify.register(cors, { origin: '*' });
  await fastify.register(authPlugin);
  await fastify.register(moviesRoutes);
  await fastify.register(practiceRoutes);
  await fastify.register(audioRoutes);

  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
