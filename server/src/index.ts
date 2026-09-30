import { app } from './app';
import { env } from './config/env';
import { prisma } from './db';

const server = app.listen(env.PORT, () => {
  console.log(`API listening on port ${env.PORT}`);
});

async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);