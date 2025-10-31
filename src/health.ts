import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { INestApplication } from '@nestjs/common';

async function checkHealth(): Promise<boolean> {
  let app: INestApplication | null = null;

  try {
    // Create a minimal application instance for health check
    app = await NestFactory.create(AppModule, { logger: false });

    // Try to initialize the application
    await app.init();

    // If we reach here, the application is healthy
    console.log('Health check: OK');
    return true;
  } catch (error) {
    console.error('Health check: FAILED', error);
    return false;
  } finally {
    if (app) {
      await app.close();
    }
  }
}

// Run health check and exit with appropriate code
checkHealth()
  .then(healthy => {
    process.exit(healthy ? 0 : 1);
  })
  .catch(error => {
    console.error('Health check error:', error);
    process.exit(1);
  });
