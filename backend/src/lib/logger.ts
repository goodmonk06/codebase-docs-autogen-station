/**
 * Structured Logger
 * Provides contextual logging with correlation IDs
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  correlationId?: string;
  userId?: string;
  repoId?: string;
  runId?: string;
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: LogContext;
  error?: Error;
}

class Logger {
  private context: LogContext = {};

  /**
   * Set context for all subsequent logs
   */
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clear context
   */
  clearContext(): void {
    this.context = {};
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger();
    childLogger.setContext({ ...this.context, ...context });
    return childLogger;
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log('error', message, { ...context, error });
  }

  private log(level: LogLevel, message: string, additionalContext?: LogContext & { error?: Error }): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context: { ...this.context, ...additionalContext },
      error: additionalContext?.error,
    };

    const formattedEntry = this.format(entry);

    switch (level) {
      case 'debug':
        console.debug(formattedEntry);
        break;
      case 'info':
        console.info(formattedEntry);
        break;
      case 'warn':
        console.warn(formattedEntry);
        break;
      case 'error':
        console.error(formattedEntry);
        if (entry.error) {
          console.error(entry.error.stack);
        }
        break;
    }
  }

  private format(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    const contextStr = entry.context && Object.keys(entry.context).length > 0
      ? ` | ${JSON.stringify(entry.context)}`
      : '';

    return `[${timestamp}] ${level} | ${entry.message}${contextStr}`;
  }
}

// Global logger instance
export const logger = new Logger();

// Utility to generate correlation IDs
export function generateCorrelationId(): string {
  return `corr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
