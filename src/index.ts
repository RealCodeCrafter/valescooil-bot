import { ENV } from './common/config/config';
import app from './server/server';
import { Server } from 'http';
import { runCronJobs } from './common/cron-job/cron-job';
import { postgresDataBase } from './db/connect.db';
import { ensureSuperAdmin } from './db/seed/ensure-super-admin';

let server: Server;
let status: 'online' | 'offline' | 'starting' | 'stopping' = 'offline';

/**
 * Start the server
 */
async function runServer() {
  try {
    status = 'starting';

    // Initialize database
    const err = await postgresDataBase.initialize();
    if (err) {
      console.error('Database initialization failed:', err);
      process.exit(1);
    }

    // Ensure super admin exists
    await ensureSuperAdmin();

    // Import bot
    await import('./bot/core/index');

    // Optional cron jobs
    // runCronJobs();

    // Start HTTP server
    server = app.listen(ENV.HTTP_PORT, ENV.HTTP_HOST, () => {
      status = 'online';
      console.log(`Server running on ${ENV.HTTP_HOST}:${ENV.HTTP_PORT}`);
    });

    server.on('close', () => {
      console.log('Server closed');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    await gracefulShutDown('startup error', error as Error);
  }
}

/**
 * Graceful shutdown
 */
async function gracefulShutDown(reason: string, err?: Error) {
  if (status !== 'online') return;

  status = 'stopping';
  console.log(`Shutting down server due to: ${reason}`);
  if (err) console.error(err);

  // Close HTTP server
  await new Promise<void>((resolve) => {
    if (server) {
      server.close(() => {
        console.log('HTTP server closed');
        resolve();
      });
    } else resolve();
  });

  // Close DB connection
  try {
    await postgresDataBase.closeConnection();
    console.log('Database connection closed');
  } catch (dbErr) {
    console.error('Error closing database connection:', dbErr);
  }

  status = 'offline';
  process.exit(0);
}

/**
 * Global error handler
 */
function onErrorHandler(err: Error, reason: string) {
  console.error(`Error occurred due to: ${reason}`, err);
  gracefulShutDown(reason, err);
}

/**
 * NodeJS process event handlers
 */
function initNodeJSEventHandlers() {
  process.on('beforeExit', (_code) => {
    console.log('Process beforeExit event triggered');
  });

  process.on('rejectionHandled', (err: Error) =>
    onErrorHandler(err, 'rejectionHandled'),
  );
  process.on('uncaughtException', (err: Error) =>
    onErrorHandler(err, 'uncaughtException'),
  );
  process.on('unhandledRejection', (err: Error) =>
    onErrorHandler(err, 'unhandledRejection'),
  );
  process.on('uncaughtExceptionMonitor', (err: Error) =>
    onErrorHandler(err, 'uncaughtExceptionMonitor'),
  );

  process.on('SIGINT', () => onErrorHandler(new Error('SIGINT received'), 'SIGINT'));
  process.on('SIGTERM', () => onErrorHandler(new Error('SIGTERM received'), 'SIGTERM'));
}

// Initialize process handlers and run server
initNodeJSEventHandlers();
runServer();
