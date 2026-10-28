import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createApiApp } from './server/createApp.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = createApiApp();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const distPath = path.resolve(__dirname, 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));
  const isProd = process.env.NODE_ENV === 'production' || hasDist;

  // In production (or when dist bundle is built), serve static files from dist
  if (isProd && hasDist) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // In development, hook up Vite dev server middleware
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        allowedHosts: true, // Allow all hosts (e.g. *.onrender.com)
        watch: {
          ignored: ['**/data/**', '**/data/db.json', '**/*.log', '**/.system_generated/**'],
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Enterprise SaaS Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
