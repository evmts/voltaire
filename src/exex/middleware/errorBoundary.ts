import { createMiddleware } from "../TevmPluginHandlerContext.js";

/**
 * Error boundary middleware - catches and handles errors
 *
 * @example
 * ```typescript
 * const exex = TevmPlugin()
 *   .use(errorBoundary({
 *     onError: async (error, ctx) => {
 *       await alertService.notify(error);
 *     },
 *     rethrow: true,
 *   }))
 *   .onCommit(...)
 *   .build();
 * ```
 */
export function errorBoundary(options: ErrorBoundaryOptions = {}) {
	const { onError, rethrow = true, fallbackCheckpoint = true } = options;

	return createMiddleware(async (ctx, next) => {
		try {
			await next();
		} catch (error) {
			// Call error handler if provided
			if (onError) {
				await onError(error, ctx);
			}

			// Auto-checkpoint on error if enabled (prevents infinite retry)
			if (fallbackCheckpoint) {
				ctx.checkpoint();
			}

			// Re-throw if configured to do so
			if (rethrow) {
				throw error;
			}
		}
	});
}

export interface ErrorBoundaryOptions {
	/**
	 * Called when an error occurs.
	 * Can be used for logging, alerting, etc.
	 */
	onError?: (error: unknown, ctx: unknown) => Promise<void>;

	/**
	 * Whether to re-throw the error after handling (default: true)
	 */
	rethrow?: boolean;

	/**
	 * Whether to auto-checkpoint on error (default: true)
	 * Prevents infinite retry loops
	 */
	fallbackCheckpoint?: boolean;
}
