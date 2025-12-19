import type { BlockType } from "../primitives/Block/BlockType.js";
import { from as blockNumberFrom } from "../primitives/BlockNumber/from.js";
import type { ChainIdType } from "../primitives/ChainId/ChainIdType.js";
import type { ReceiptType } from "../primitives/Receipt/ReceiptType.js";
import type { TevmPluginBuilder } from "./TevmPluginBuilder.js";
import { TevmPluginExecutor } from "./TevmPluginExecutor.js";
import type { BlockIdType } from "./types/BlockIdType.js";
import type { BlockReaderType } from "./types/BlockReaderType.js";
import type { ChainEventSourceType } from "./types/ChainEventSourceType.js";
import type { StateReaderType } from "./types/StateReaderType.js";
import type { TevmPluginNotificationType } from "./types/TevmPluginNotificationType.js";

/**
 * Factory function type for creating TevmPlugin context
 */
export type ContextFactory<
	Block = BlockType,
	Receipt = ReceiptType,
> = () => Promise<{
	head: BlockIdType;
	chainId: ChainIdType;
	state: StateReaderType;
	blocks: BlockReaderType<Block, Receipt>;
}>;

/**
 * Registration for an TevmPlugin with the manager
 */
export interface TevmPluginRegistration<
	Block = BlockType,
	Receipt = ReceiptType,
> {
	/** Unique identifier for this TevmPlugin */
	readonly id: string;

	/** The TevmPlugin builder (will be built internally) */
	readonly exex: TevmPluginBuilder<unknown, Block, Receipt>;

	/** If provided, manager will backfill from this point */
	readonly startFrom?: BlockIdType;
}

/**
 * TevmPlugin Manager - orchestrates multiple TevmPlugin instances
 *
 * @example
 * ```typescript
 * const exex = TevmPlugin()
 *   .onCommit(async (ctx) => {
 *     await db.indexBlocks(ctx.chain.blocks);
 *     ctx.checkpoint();
 *   });
 *
 * const manager = new TevmPluginManager(node, async () => ({
 *   head: await node.getHead(),
 *   chainId: 1 as ChainIdType,
 *   state: node.stateReader,
 *   blocks: node.blockReader,
 * }));
 *
 * await manager.run({ id: 'indexer', exex });
 * ```
 */
export class TevmPluginManager<Block = BlockType, Receipt = ReceiptType> {
	private readonly executors: Map<string, TevmPluginExecutor<Block, Receipt>> =
		new Map();
	private readonly finishedHeights: Map<string, BlockIdType> = new Map();
	private readonly runningIds: Set<string> = new Set();

	constructor(
		private readonly source: ChainEventSourceType<Block, Receipt>,
		private readonly contextFactory: ContextFactory<Block, Receipt>,
	) {}

	/**
	 * Start an TevmPlugin. Returns when the notification stream ends.
	 */
	async run(
		registration: TevmPluginRegistration<Block, Receipt>,
	): Promise<void> {
		const { id, exex, startFrom } = registration;
		const baseCtx = await this.contextFactory();

		// Build and create executor
		const built = exex.build();
		const executor = new TevmPluginExecutor(built, baseCtx);
		this.executors.set(id, executor);
		this.runningIds.add(id);

		try {
			// Create notification stream (with optional backfill)
			const notifications = this.createNotificationStream(
				startFrom,
				baseCtx.head,
			);

			// Process notifications
			for await (const notification of notifications) {
				const checkpoint = await executor.execute(notification);
				this.finishedHeights.set(id, checkpoint);
			}
		} finally {
			this.runningIds.delete(id);
		}
	}

	/**
	 * Run multiple TevmPlugines concurrently.
	 */
	async runAll(
		registrations: readonly TevmPluginRegistration<Block, Receipt>[],
	): Promise<void> {
		await Promise.all(registrations.map((r) => this.run(r)));
	}

	/**
	 * Get the lowest finished height across all TevmPlugines.
	 * Useful for determining safe pruning point.
	 */
	getFinishedHeight(): BlockIdType | null {
		let lowest: BlockIdType | null = null;
		const heights = Array.from(this.finishedHeights.values());
		for (const height of heights) {
			if (!lowest || height.number < lowest.number) {
				lowest = height;
			}
		}
		return lowest;
	}

	/**
	 * Get finished height for a specific TevmPlugin
	 */
	getFinishedHeightFor(id: string): BlockIdType | undefined {
		return this.finishedHeights.get(id);
	}

	/**
	 * Check if an TevmPlugin is registered and running
	 */
	isRunning(id: string): boolean {
		return this.runningIds.has(id);
	}

	/**
	 * Create notification stream with optional backfill
	 */
	private async *createNotificationStream(
		startFrom: BlockIdType | undefined,
		head: BlockIdType,
	): AsyncIterable<TevmPluginNotificationType<Block, Receipt>> {
		// Backfill if starting behind head
		if (startFrom && startFrom.number < head.number) {
			const nextBlock = blockNumberFrom(startFrom.number + BigInt(1));
			yield* this.source.replayRange(nextBlock, head.number);
		}
		// Then stream live
		yield* this.source.subscribe();
	}
}
