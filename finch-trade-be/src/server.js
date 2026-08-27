import express, { json } from 'express';
import cors from 'cors';
import 'dotenv/config';
import db from './models/db.js';
import userRoutes from './routes/userRoutes.js';
import tradeRoutes from './routes/tradeRoutes.js';
import itemRoutes from './routes/itemRoutes.js';

const configuredPort = Number.parseInt(process.env.PORT, 10);
const port = Number.isInteger(configuredPort) ? configuredPort : 5000;
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

const app = express();
app.use(json());
app.use(cors({ origin: corsOrigin }));

app.use('/api/users', userRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/items', itemRoutes);

const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

const shutdown = async (signal) => {
  console.log(`Received ${signal}, shutting down`);
  server.close(async (error) => {
    if (error) {
      console.error('Error closing HTTP server:', error);
      process.exitCode = 1;
    }

    try {
      await db.close();
    } catch (poolError) {
      console.error('Error closing database pool:', poolError);
      process.exitCode = 1;
    }
  });
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
