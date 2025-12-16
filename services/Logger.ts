/**
 * Structured Logging Service
 * Centralizes logging logic to allow for filtering, formatting, and potential external shipping.
 */

// Define Log Levels
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
}

const CURRENT_LEVEL = import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.INFO;

interface LogEntry {
    timestamp: string;
    level: string;
    message: string;
    data?: any;
    context?: string;
}

class LoggerService {
    private formatMessage(level: string, message: string, data?: any, context?: string): LogEntry {
        return {
            timestamp: new Date().toISOString(),
            level,
            message,
            data,
            context
        };
    }

    private print(level: LogLevel, entry: LogEntry) {
        if (level < CURRENT_LEVEL) return;

        const prefix = `[${entry.timestamp}] [${entry.level}]${entry.context ? ` [${entry.context}]` : ''}:`;

        switch (level) {
            case LogLevel.DEBUG:
                console.debug(prefix, entry.message, entry.data || '');
                break;
            case LogLevel.INFO:
                console.info(prefix, entry.message, entry.data || '');
                break;
            case LogLevel.WARN:
                console.warn(prefix, entry.message, entry.data || '');
                break;
            case LogLevel.ERROR:
                console.error(prefix, entry.message, entry.data || '');
                break;
        }
    }

    public debug(message: string, data?: any, context?: string) {
        this.print(LogLevel.DEBUG, this.formatMessage('DEBUG', message, data, context));
    }

    public info(message: string, data?: any, context?: string) {
        this.print(LogLevel.INFO, this.formatMessage('INFO', message, data, context));
    }

    public warn(message: string, data?: any, context?: string) {
        this.print(LogLevel.WARN, this.formatMessage('WARN', message, data, context));
    }

    public error(message: string, error?: any, context?: string) {
        this.print(LogLevel.ERROR, this.formatMessage('ERROR', message, error, context));
    }
}

export const logger = new LoggerService();
