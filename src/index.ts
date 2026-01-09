import 'reflect-metadata';
import dotenv from 'dotenv';
import { createApp } from './app';
import { initializeDatabase } from './config/database';
import { config } from './config';

dotenv.config();

async function bootstrap(): Promise<void> {
  try {
    // Initialize database connection
    await initializeDatabase();
    console.log('Database initialized successfully');

    // Create Express app
    const app = createApp();

    // Start server
    const port = config.app.port;
    app.listen(port, () => {
      console.log(`🚀 Server is running on port ${port}`);
      console.log(`📚 API Documentation: http://localhost:${port}/api/v1/health`);
      console.log(`🌍 Environment: ${config.app.nodeEnv}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

bootstrap();