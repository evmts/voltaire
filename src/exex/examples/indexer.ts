import { TevmPlugin, type TevmPluginBuilder } from "../TevmPluginBuilder.js";
import { loggingMiddleware } from "../middleware/logging.js";

/**
 * Example: Simple block indexer TevmPlugin
 *
 * Indexes blocks to a database, handles reverts and reorgs atomically.
 *
 * @example
 * ```typescript
 * const exex = createIndexer(db);
 *
 * const manager = new TevmPluginManager(node, contextFactory);
 * await manager.run({
 *   id: 'indexer',
 *   exex,
 *   startFrom: await db.getLastIndexedBlock(),
 * });
 * ```
 */
export function createIndexer(db: IndexerDatabase): TevmPluginBuilder {
	return TevmPlugin()
		.use(loggingMiddleware({ prefix: "[Indexer]" }))
		.onCommit(async (ctx) => {
			for (const block of ctx.chain.blocks) {
				await db.indexBlock(block);
			}
			ctx.checkpoint();
		})
		.onRevert(async (ctx) => {
			// Revert in reverse order (newest first)
			const blocks = [...ctx.chain.blocks];
			for (let i = blocks.length - 1; i >= 0; i--) {
				await db.revertBlock(blocks[i]);
			}
			ctx.checkpoint();
		})
		.onReorg(async (ctx) => {
			// Handle reorg atomically
			await db.transaction(async (tx) => {
				// First revert old blocks
				const reverted = [...ctx.reverted.blocks];
				for (let i = reverted.length - 1; i >= 0; i--) {
					await tx.revertBlock(reverted[i]);
				}
				// Then index new blocks
				for (const block of ctx.committed.blocks) {
					await tx.indexBlock(block);
				}
			});
			ctx.checkpoint(ctx.committed.tip());
		});
}

/**
 * Database interface for the indexer example
 */
export interface IndexerDatabase {
	indexBlock(block: unknown): Promise<void>;
	revertBlock(block: unknown): Promise<void>;
	transaction<T>(fn: (tx: IndexerTransaction) => Promise<T>): Promise<T>;
}

export interface IndexerTransaction {
	indexBlock(block: unknown): Promise<void>;
	revertBlock(block: unknown): Promise<void>;
}
