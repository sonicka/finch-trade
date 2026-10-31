import express, { json } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import db from './models/db.js';
import userRoutes from './routes/userRoutes.js';
import tradeRoutes from './routes/tradeRoutes.js';
import itemRoutes from './routes/itemRoutes.js';
import { config } from './config/env.js';
import { errorHandler, notFoundHandler } from './errors.js';

const app = express();
if (config.trustProxyHops > 0) {
  app.set('trust proxy', config.trustProxyHops);
}
app.use(helmet());
app.use(cors({ origin: config.corsOrigins }));
app.use(json({ limit: config.jsonBodyLimit }));

app.use('/api/users', userRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/items', itemRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  await db.waitUntilReady();
  const server = app.listen(config.port);
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });

  console.log(`Server running on port ${config.port}`);

  let isShuttingDown = false;
  const shutdown = async (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`Received ${signal}, shutting down`);

    server.close(async (error) => {
      if (error) {
        console.error('Error closing HTTP server:', error.message);
        process.exitCode = 1;
      }

      try {
        await db.close();
      } catch (closeError) {
        console.error('Error closing database pool:', closeError.message);
        process.exitCode = 1;
      }
    });
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
};

startServer().catch(async (error) => {
  console.error('Failed to start server:', error.message);
  process.exitCode = 1;
  try {
    await db.close();
  } catch (closeError) {
    console.error('Error closing database pool:', closeError.message);
  }
});
