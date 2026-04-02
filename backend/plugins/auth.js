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
      return;
    }

    const token = auth.slice(7);
    const { rows } = await fastify.db.query(
      'SELECT id, native_language, language_locked FROM users WHERE token = $1',
      [token]
    );

    if (rows.length === 0) {
      reply.code(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token ausente, inválido ou expirado.',
        },
      });
      return;
    }

    request.user = rows[0];
  });
}

module.exports = fp(authPlugin);
