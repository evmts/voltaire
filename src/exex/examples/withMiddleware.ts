import { TevmPlugin, type TevmPluginBuilder } from "../TevmPluginBuilder.js";
import { createMiddleware } from "../TevmPluginHandlerContext.js";
import { errorBoundary } from "../middleware/errorBoundary.js";
import { loggingMiddleware } from "../middleware/logging.js";
import { MetricsCollector, metricsMiddleware } from "../middleware/metrics.js";

/**
 * Example: TevmPlugin with middleware composition
 *
 * Demonstrates using middleware for cross-cutting concerns:
 * - Logging
 * - Metrics collection
 * - Error handling
 * - Resource management (database connection)
 *
 * @example
 * ```typescript
 * const { exex, metrics } = createWithMiddleware(dbConfig);
 *
 * const manager = new TevmPluginManager(node, contextFactory);
 * await manager.run({ id: 'with-middleware', exex });
 *
 * // Check metrics
 * console.log(metrics.getStats());
 * ```
 */
export function createWithMiddleware(dbConfig: DbConfig): {
	exex: TevmPluginBuilder<{ db: Database }>;
	metrics: MetricsCollector;
} {
	const metrics = new MetricsCollector();

	// Database connection middleware
	const withDatabase = createMiddleware<{ db: Database }>(async (ctx, next) => {
		const db = await Database.connect(dbConfig);
		ctx.set("db", db);
		try {
			await next();
		} finally {
			await db.close();
		}
	});

	const exex = TevmPlugin()
		// Middleware runs for ALL notification types
		.use(loggingMiddleware({ prefix: "[Indexer]" }))
		.use(metricsMiddleware(metrics))
		.use(
			errorBoundary({
				onError: async (error) => {
					console.error("TevmPlugin error:", error);
				},
			}),
		)
		.use(withDatabase)

		// Named handlers only run for their notification type
		.onCommit(async (ctx) => {
			const db = ctx.get("db");
			for (const block of ctx.chain.blocks) {
				await db.indexBlock(block);
			}
			ctx.checkpoint();
		})
		.onRevert(async (ctx) => {
			const db = ctx.get("db");
			const blocks = [...ctx.chain.blocks];
			for (let i = blocks.length - 1; i >= 0; i--) {
				await db.revertBlock(blocks[i]);
			}
			ctx.checkpoint();
		})
		.onReorg(async (ctx) => {
			const db = ctx.get("db");
			await db.transaction(async (tx) => {
				const reverted = [...ctx.reverted.blocks];
				for (let i = reverted.length - 1; i >= 0; i--) {
					await tx.revertBlock(reverted[i]);
				}
				for (const block of ctx.committed.blocks) {
					await tx.indexBlock(block);
				}
			});
			ctx.checkpoint(ctx.committed.tip());
		});

	return { exex, metrics };
}

// Mock types for example
interface DbConfig {
	connectionString: string;
}

interface Database {
	indexBlock(block: unknown): Promise<void>;
	revertBlock(block: unknown): Promise<void>;
	transaction<T>(fn: (tx: Database) => Promise<T>): Promise<T>;
	close(): Promise<void>;
}

// biome-ignore lint/suspicious/noShadowRestrictedNames: Example code
const Database = {
	connect: async (_config: DbConfig): Promise<Database> => {
		return {
			indexBlock: async () => {},
			revertBlock: async () => {},
			transaction: async <T>(fn: (tx: Database) => Promise<T>) => {
				return fn(Database.connect({} as DbConfig) as unknown as Database);
			},
			close: async () => {},
		};
	},
};
