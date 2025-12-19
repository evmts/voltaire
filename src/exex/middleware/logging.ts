import { createMiddleware } from "../TevmPluginHandlerContext.js";

/**
 * Logging middleware - logs notification processing
 *
 * @example
 * ```typescript
 * const exex = TevmPlugin()
 *   .use(loggingMiddleware())
 *   .onCommit(...)
 *   .build();
 * ```
 */
export function loggingMiddleware(options: LoggingOptions = {}) {
	const { prefix = "[TevmPlugin]", logTiming = true } = options;

	return createMiddleware(async (ctx, next) => {
		const start = logTiming ? performance.now() : 0;

		try {
			await next();

			if (logTiming) {
				const duration = (performance.now() - start).toFixed(2);
			}
		} catch (error) {
			console.error(`${prefix} Error processing ${ctx.type}:`, error);
			throw error;
		}
	});
}

export interface LoggingOptions {
	/** Prefix for log messages (default: "[TevmPlugin]") */
	prefix?: string;
	/** Whether to log timing (default: true) */
	logTiming?: boolean;
}
