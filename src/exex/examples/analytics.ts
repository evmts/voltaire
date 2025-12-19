import type { BlockType } from "../../primitives/Block/BlockType.js";
import { TevmPlugin, type TevmPluginBuilder } from "../TevmPluginBuilder.js";
import type { BlockIdType } from "../types/BlockIdType.js";

/**
 * Example: Batched analytics TevmPlugin
 *
 * Collects analytics events and flushes them periodically.
 * Only checkpoints every N blocks to reduce overhead.
 *
 * @example
 * ```typescript
 * const exex = createAnalytics({
 *   batchSize: 100,
 *   extractEvents: (block) => [...],
 *   flush: async (events) => { ... },
 * });
 *
 * const manager = new TevmPluginManager(node, contextFactory);
 * await manager.run({ id: 'analytics', exex });
 * ```
 */
export function createAnalytics<TEvent>(
	config: AnalyticsConfig<TEvent>,
): TevmPluginBuilder {
	const { batchSize = 100, extractEvents, flush } = config;

	// Shared state across notifications
	let batch: TEvent[] = [];
	let lastCheckpoint: BlockIdType | null = null;
	let blocksSinceCheckpoint = 0;

	return TevmPlugin()
		.onCommit(async (ctx) => {
			// Extract events from committed blocks
			for (const block of ctx.chain.blocks) {
				const events = extractEvents(block);
				batch.push(...events);
				blocksSinceCheckpoint++;
			}

			// Flush every N blocks
			if (blocksSinceCheckpoint >= batchSize) {
				await flush(batch);
				batch = [];
				blocksSinceCheckpoint = 0;
				lastCheckpoint = ctx.chain.tip();
				ctx.checkpoint(lastCheckpoint);
			}
			// Otherwise, don't checkpoint (auto-checkpoint will handle it)
		})
		.onRevert(async (ctx) => {
			// On revert, clear batch (analytics may need recalculation)
			batch = [];
			blocksSinceCheckpoint = 0;
			ctx.checkpoint();
		})
		.onReorg(async (ctx) => {
			// Clear and restart from committed
			batch = [];
			blocksSinceCheckpoint = 0;

			for (const block of ctx.committed.blocks) {
				const events = extractEvents(block);
				batch.push(...events);
				blocksSinceCheckpoint++;
			}

			ctx.checkpoint(ctx.committed.tip());
		});
}

/**
 * Configuration for analytics TevmPlugin
 */
export interface AnalyticsConfig<TEvent> {
	/** Number of blocks between flushes (default: 100) */
	batchSize?: number;
	/** Extract analytics events from a block */
	extractEvents: (block: BlockType) => TEvent[];
	/** Flush batch of events to storage */
	flush: (events: TEvent[]) => Promise<void>;
}
