import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { initDatabase } from './server/db.ts';
import { apiRouter } from './server/routes.ts';
import {
  antiAbuseMiddleware,
  createRateLimiter,
  incrementApiRequestCount,
  incrementUnauthorizedCount,
  noStoreCache,
  securityHeaders,
} from './server/security.ts';

async function startServer(): Promise<void> {
  initDatabase();

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(securityHeaders);
  app.use((_req, res, next) => {
    res.setTimeout(30_000);
    next();
  });
  app.use(
    express.json({
      limit: '1mb',
      verify: (req, _res, buf) => {
        (req as Request & { rawBody?: Buffer }).rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: false, limit: '256kb' }));
  app.use(antiAbuseMiddleware);

  app.use('/api', (_req, res, next) => {
    incrementApiRequestCount();
    res.on('finish', () => {
      if (res.statusCode === 401 || res.statusCode === 403) {
        incrementUnauthorizedCount();
      }
    });
    next();
  });
  app.use(['/api/auth', '/api/dashboard', '/api/admin'], noStoreCache);
  app.use('/api', createRateLimiter(180, 60 * 1000, 'global'), apiRouter);

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

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof SyntaxError && 'status' in err && (err as { status?: number }).status === 400) {
      res.status(400).json({ error: 'Malformed JSON request body.' });
      return;
    }
    res.status(500).json({ error: 'An unexpected server error occurred.' });
  });

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`HelzerX Technologies server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start HelzerX server:', err);
  process.exit(1);
});
