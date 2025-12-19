import type { BlockType } from "../primitives/Block/BlockType.js";
import type { ChainIdType } from "../primitives/ChainId/ChainIdType.js";
import type { ReceiptType } from "../primitives/Receipt/ReceiptType.js";
import {
	type CommitContext,
	type CommitHandler,
	type NotificationType,
	type ReorgContext,
	type ReorgHandler,
	type RevertContext,
	type RevertHandler,
	TevmPluginHandlerContextImpl,
	type TevmPluginMiddleware,
} from "./TevmPluginHandlerContext.js";
import type { BlockIdType } from "./types/BlockIdType.js";
import type { BlockReaderType } from "./types/BlockReaderType.js";
import type { BuiltTevmPlugin } from "./types/BuiltTevmPluginType.js";
import type { CommittedChainType } from "./types/CommittedChainType.js";
import type { StateReaderType } from "./types/StateReaderType.js";
import type { TevmPluginNotificationType } from "./types/TevmPluginNotificationType.js";

/**
 * Shared context provided to executor
 */
export interface ExecutorContext<Block = BlockType, Receipt = ReceiptType> {
	head: BlockIdType;
	chainId: ChainIdType;
	state: StateReaderType;
	blocks: BlockReaderType<Block, Receipt>;
}

/**
 * Execute a built TevmPlugin against notifications
 *
 * Implements the onion model:
 * 1. Middleware runs in order added (before next())
 * 2. Named handlers run
 * 3. Middleware cleanup runs in reverse (after next())
 * 4. Auto-checkpoint if none called
 */
export class TevmPluginExecutor<Block = BlockType, Receipt = ReceiptType> {
	constructor(
		private readonly exex: BuiltTevmPlugin<Block, Receipt>,
		private readonly ctx: ExecutorContext<Block, Receipt>,
	) {}

	/**
	 * Execute the TevmPlugin for a notification.
	 * Returns the checkpoint BlockId (explicit or auto).
	 */
	async execute(
		notification: TevmPluginNotificationType<Block, Receipt>,
	): Promise<BlockIdType> {
		const { type, defaultTip, chain, reverted, committed } =
			this.parseNotification(notification);

		// Create context implementation
		const handlerCtx = new TevmPluginHandlerContextImpl(
			type,
			this.ctx.head,
			this.ctx.chainId,
			this.ctx.state,
			this.ctx.blocks,
			chain,
			reverted,
			committed,
			defaultTip,
		);

		// Get handlers for this notification type
		const handlers = this.getHandlers(type);

		// Build the execution chain (onion model)
		const chain_fn = this.buildChain(
			this.exex.middlewares as TevmPluginMiddleware<unknown, Block, Receipt>[],
			handlers,
			type,
		);

		// Execute
		await chain_fn(handlerCtx as unknown as Parameters<typeof chain_fn>[0]);

		// Return checkpoint (explicit or auto)
		const checkpoint = handlerCtx.getCheckpoint();
		if (checkpoint) {
			return checkpoint;
		}

		// Auto-checkpoint to default tip
		return defaultTip;
	}

	private parseNotification(
		notification: TevmPluginNotificationType<Block, Receipt>,
	): {
		type: NotificationType;
		defaultTip: BlockIdType;
		chain?: CommittedChainType<Block, Receipt>;
		reverted?: CommittedChainType<Block, Receipt>;
		committed?: CommittedChainType<Block, Receipt>;
	} {
		switch (notification.type) {
			case "committed":
				return {
					type: "commit",
					defaultTip: notification.chain.tip(),
					chain: notification.chain,
				};
			case "reverted":
				return {
					type: "revert",
					defaultTip: notification.chain.tip(),
					chain: notification.chain,
				};
			case "reorged":
				return {
					type: "reorg",
					defaultTip: notification.committed.tip(),
					reverted: notification.reverted,
					committed: notification.committed,
				};
		}
	}

	private getHandlers(
		type: NotificationType,
	): readonly (
		| CommitHandler<unknown, Block, Receipt>
		| RevertHandler<unknown, Block, Receipt>
		| ReorgHandler<unknown, Block, Receipt>
	)[] {
		switch (type) {
			case "commit":
				return this.exex.commitHandlers;
			case "revert":
				return this.exex.revertHandlers;
			case "reorg":
				return this.exex.reorgHandlers;
		}
	}

	/**
	 * Build the onion execution chain
	 *
	 * Given middlewares [A, B, C] and handlers [H1, H2]:
	 *
	 * A(ctx, () =>
	 *   B(ctx, () =>
	 *     C(ctx, () =>
	 *       H1(ctx); H2(ctx)
	 *     )
	 *   )
	 * )
	 */
	private buildChain(
		middlewares: readonly TevmPluginMiddleware<unknown, Block, Receipt>[],
		handlers: readonly (
			| CommitHandler<unknown, Block, Receipt>
			| RevertHandler<unknown, Block, Receipt>
			| ReorgHandler<unknown, Block, Receipt>
		)[],
		type: NotificationType,
	): (ctx: TevmPluginHandlerContextImpl<unknown>) => Promise<void> {
		// Inner function: run all handlers
		const runHandlers = async (ctx: TevmPluginHandlerContextImpl<unknown>) => {
			for (const handler of handlers) {
				switch (type) {
					case "commit":
						await (handler as CommitHandler<unknown, Block, Receipt>)(
							ctx as unknown as CommitContext<unknown, Block, Receipt>,
						);
						break;
					case "revert":
						await (handler as RevertHandler<unknown, Block, Receipt>)(
							ctx as unknown as RevertContext<unknown, Block, Receipt>,
						);
						break;
					case "reorg":
						await (handler as ReorgHandler<unknown, Block, Receipt>)(
							ctx as unknown as ReorgContext<unknown, Block, Receipt>,
						);
						break;
				}
			}
		};

		// Build onion from inside out
		let chain: (ctx: TevmPluginHandlerContextImpl<unknown>) => Promise<void> =
			runHandlers;

		// Wrap with middleware in reverse order
		for (let i = middlewares.length - 1; i >= 0; i--) {
			const middleware = middlewares[i];
			if (!middleware) continue;
			const next = chain;
			const mw = middleware;
			chain = async (ctx) => {
				await mw(ctx as Parameters<typeof mw>[0], async () => {
					await next(ctx);
				});
			};
		}

		return chain;
	}
}
