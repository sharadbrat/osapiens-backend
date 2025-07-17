/**
 * Logger utility class for logging messages with a customizable prefix and timestamp.
 *
 * Usage:
 * - Create a logger instance with a specific prefix using `Logger.withPrefix(prefix)`.
 * - Use `log`, `error`, and `warn` methods to output messages to the console.
 *
 * Example:
 * ```typescript
 * const logger = Logger.withPrefix('MyApp');
 * logger.log('This is an info message');
 * logger.error('This is an error message');
 * logger.warn('This is a warning message');
 * ```
 */
export class Logger {
    private constructor(private readonly prefix: string) {}

    public static withPrefix(prefix: string): Logger {
        return new Logger(prefix);
    }

    public log(...args: any[]): void {
        console.log(...this.format(...args));
    }

    public error(...args: any[]): void {
        console.error(...this.format(...args));
    }

    public warn(...args: any[]): void {
        console.warn(...this.format(...args));
    }

    private format(...args: any[]): any[] {
        const timestamp = new Date().toISOString();
        return [`[${timestamp}] #${this.prefix}:`, ...args];
    }
}
