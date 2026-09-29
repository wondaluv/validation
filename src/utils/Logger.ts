/**
 * AfriPay Logger Utility
 * Structured logging for payment operations
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  context: string;
  message: string;
  data?: Record<string, unknown>;
  error?: Error;
}

export class Logger {
  private context: string;
  private static logLevel: LogLevel = LogLevel.INFO;

  constructor(context: string) {
    this.context = context;
  }

  static setLogLevel(level: LogLevel): void {
    Logger.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(Logger.logLevel);
  }

  private formatLog(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    const context = `[${entry.context}]`.padEnd(25);
    let log = `${timestamp} ${level} ${context} ${entry.message}`;

    if (entry.data) {
      log += ` ${JSON.stringify(entry.data)}`;
    }

    if (entry.error) {
      log += `\nError: ${entry.error.message}\nStack: ${entry.error.stack}`;
    }

    return log;
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown> | Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      context: this.context,
      message,
      data: data instanceof Error ? undefined : data,
      error: data instanceof Error ? data : undefined
    };

    const formatted = this.formatLog(entry);

    switch (level) {
      case LogLevel.ERROR:
        console.error(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      default:
        console.log(formatted);
    }
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, error?: Error | Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, error);
  }
}

export default Logger;
