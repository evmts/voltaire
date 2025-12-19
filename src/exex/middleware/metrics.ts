import { createMiddleware } from "../TevmPluginHandlerContext.js";

/**
 * Metrics middleware - collects processing metrics
 *
 * @example
 * ```typescript
 * const metrics = new MetricsCollector();
 *
 * const exex = TevmPlugin()
 *   .use(metricsMiddleware(metrics))
 *   .onCommit(...)
 *   .build();
 *
 * // Later, access metrics
 * console.log(metrics.getStats());
 * ```
 */
export function metricsMiddleware(collector: MetricsCollector) {
	return createMiddleware(async (ctx, next) => {
		const start = performance.now();
		collector.incrementProcessed(ctx.type);

		try {
			await next();
			const duration = performance.now() - start;
			collector.recordDuration(ctx.type, duration);
		} catch (error) {
			collector.incrementErrors(ctx.type);
			throw error;
		}
	});
}

/**
 * Simple metrics collector
 */
export class MetricsCollector {
	private processed: Record<string, number> = {};
	private errors: Record<string, number> = {};
	private durations: Record<string, number[]> = {};

	incrementProcessed(type: string): void {
		this.processed[type] = (this.processed[type] ?? 0) + 1;
	}

	incrementErrors(type: string): void {
		this.errors[type] = (this.errors[type] ?? 0) + 1;
	}

	recordDuration(type: string, ms: number): void {
		if (!this.durations[type]) {
			this.durations[type] = [];
		}
		this.durations[type].push(ms);
	}

	getStats(): MetricsStats {
		const stats: MetricsStats = {};

		for (const type of Object.keys(this.processed)) {
			const durations = this.durations[type] ?? [];
			const avg =
				durations.length > 0
					? durations.reduce((a, b) => a + b, 0) / durations.length
					: 0;

			stats[type] = {
				processed: this.processed[type] ?? 0,
				errors: this.errors[type] ?? 0,
				avgDurationMs: avg,
				minDurationMs: durations.length > 0 ? Math.min(...durations) : 0,
				maxDurationMs: durations.length > 0 ? Math.max(...durations) : 0,
			};
		}

		return stats;
	}

	reset(): void {
		this.processed = {};
		this.errors = {};
		this.durations = {};
	}
}

export interface MetricsStats {
	[type: string]: {
		processed: number;
		errors: number;
		avgDurationMs: number;
		minDurationMs: number;
		maxDurationMs: number;
	};
}
