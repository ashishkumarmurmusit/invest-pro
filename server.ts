import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { authRouter } from './server/routes/auth';
import { walletRouter } from './server/routes/wallet';
import { productsRouter } from './server/routes/products';
import { checkinRouter } from './server/routes/checkin';
import { referralRouter } from './server/routes/referral';
import { transactionsRouter } from './server/routes/transactions';
import { notificationsRouter } from './server/routes/notifications';
import { adsRouter } from './server/routes/ads';
import { themeRouter } from './server/routes/theme';
import { adminRouter } from './server/routes/admin';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logger for API calls
  app.use((req, _res, next) => {
    if (req.path.startsWith('/api')) {
      // quiet API request log
    }
    next();
  });

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Mount API routers
  app.use('/api/auth', authRouter);
  app.use('/api/wallet', walletRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/checkin', checkinRouter);
  app.use('/api/referral', referralRouter);
  app.use('/api/transactions', transactionsRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/ads', adsRouter);
  app.use('/api/theme', themeRouter);
  app.use('/api/admin', adminRouter);

  // Global API error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('API Error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  });

  if (!isProd) {
    // Vite Dev Server middleware
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nexus Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
