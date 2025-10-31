import { Logger } from '@nestjs/common';

export class CustomLogger {
  private readonly logger = new Logger();

  log(message: string, context?: string) {
    this.logger.log(message, context);
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, trace, context);
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, context);
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, context);
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, context);
  }

  // Custom logging methods
  info(message: string, context?: string) {
    this.log(message, context);
  }

  success(message: string, context?: string) {
    this.logger.log(`✅ ${message}`, context);
  }

  warning(message: string, context?: string) {
    this.warn(`⚠️ ${message}`, context);
  }

  api(message: string, method: string, path: string, statusCode?: number) {
    const status = statusCode ? ` [${statusCode}]` : '';
    this.logger.log(`🌐 ${method.toUpperCase()} ${path}${status} - ${message}`, 'API');
  }

  database(message: string, operation?: string) {
    const op = operation ? ` [${operation}]` : '';
    this.logger.log(`🗄️ ${message}${op}`, 'DATABASE');
  }

  auth(message: string, user?: string) {
    const userInfo = user ? ` [${user}]` : '';
    this.logger.log(`🔐 ${message}${userInfo}`, 'AUTH');
  }
}

export const logger = new CustomLogger();
