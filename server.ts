import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { initDatabase } from './server/db.ts';
import { apiRouter } from './server/routes.ts';
import { securityHeaders } from './server/security.ts';

async function startServer(): Promise<void> {
  initDatabase();

  const app = express();
  app.set('trust proxy', 1);

  app.use(securityHeaders);
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: false }));

  app.use('/api', apiRouter);

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`HelzerX Technologies server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start HelzerX server:', err);
  process.exit(1);
});
