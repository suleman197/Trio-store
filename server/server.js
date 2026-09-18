const connectDB = require('./config/db');

process.on('unhandledRejection', (err) => {
  console.error('[fatal] Unhandled rejection:', err);
});

const startServer = async () => {
  await connectDB();
  const app = require('./app');

  const PORT = 5000;
  const server = app.listen(PORT, () => console.log(`[server] API listening on http://localhost:${PORT}`));

  // Graceful shutdown
  const shutdown = () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000).unref();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

startServer();
