const fp = require('fastify-plugin');

async function authPlugin(fastify) {
  fastify.addHook('onRequest', async (request, reply) => {
    if (request.url.startsWith('/v1/audio/')) return;

    const auth = request.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      reply.code(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token ausente, inválido ou expirado.',
        },
      });
    }
  });
}

module.exports = fp(authPlugin);
