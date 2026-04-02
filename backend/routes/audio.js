const path = require('path');
const fs = require('fs');

const AUDIO_DIR = path.resolve(__dirname, '..', '..', 'wiremock', '__files');

async function audioRoutes(fastify) {
  fastify.get('/v1/audio/:filename', async (request, reply) => {
    const filePath = path.join(AUDIO_DIR, request.params.filename);

    try {
      await fs.promises.access(filePath);
    } catch {
      return reply.code(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Arquivo de áudio não encontrado.',
        },
      });
    }

    const buffer = await fs.promises.readFile(filePath);

    return reply
      .header('Content-Type', 'audio/mpeg')
      .header('Content-Length', buffer.length)
      .header('Accept-Ranges', 'bytes')
      .send(buffer);
  });
}

module.exports = audioRoutes;
