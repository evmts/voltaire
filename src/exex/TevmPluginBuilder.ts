import type { BlockType } from "../primitives/Block/BlockType.js";
import type { ReceiptType } from "../primitives/Receipt/ReceiptType.js";
import type {
	CommitHandler,
	NotificationType,
	ReorgHandler,
	RevertHandler,
	TevmPluginMiddleware,
} from "./TevmPluginHandlerContext.js";
import type { BuiltTevmPlugin } from "./types/BuiltTevmPluginType.js";

/**
 * Internal handler storage
 */
interface HandlerEntry<TVariables, Block, Receipt> {
	type: NotificationType | "middleware";
	handler:
		| TevmPluginMiddleware<TVariables, Block, Receipt>
		| CommitHandler<TVariables, Block, Receipt>
		| RevertHandler<TVariables, Block, Receipt>
		| ReorgHandler<TVariables, Block, Receipt>;
}

/**
 * TevmPlugin Builder - Fluent API for constructing TevmPlugin instances
 *
 * @example
 * ```typescript
 * const exex = TevmPlugin()
 *   .use(loggingMiddleware)
 *   .onCommit(async (ctx) => {
 *     await db.indexBlocks(ctx.chain.blocks);
 *     ctx.checkpoint();
 *   })
 *   .onRevert(async (ctx) => {
 *     await db.revertBlocks(ctx.chain.blocks);
 *     ctx.checkpoint();
 *   })
 *   .build();
 * ```
 */
export class TevmPluginBuilder<
	TVariables = {},
	Block = BlockType,
	Receipt = ReceiptType,
> {
	private readonly entries: HandlerEntry<TVariables, Block, Receipt>[] = [];

	/**
	 * Add middleware that runs for all notification types.
	 * Middleware executes in order added (onion model).
	 *
	 * @example
	 * ```typescript
	 * TevmPlugin()
	 *   .use(async (ctx, next) => {
	 *     console.log('before', ctx.type);
	 *     await next();
	 *     console.log('after', ctx.type);
	 *   })
	 * ```
	 */
	use<TNewVars = {}>(
		middleware: TevmPluginMiddleware<TVariables & TNewVars, Block, Receipt>,
	): TevmPluginBuilder<TVariables & TNewVars, Block, Receipt> {
		this.entries.push({
			type: "middleware",
			handler: middleware as TevmPluginMiddleware<TVariables, Block, Receipt>,
		});
		// Cast to new type with extended variables
		return this as unknown as TevmPluginBuilder<
			TVariables & TNewVars,
			Block,
			Receipt
		>;
	}

	/**
	 * Register handler for commit notifications.
	 * Called when new blocks are added to the canonical chain.
	 *
	 * @example
	 * ```typescript
	 * TevmPlugin()
	 *   .onCommit(async (ctx) => {
	 *     for (const block of ctx.chain.blocks) {
	 *       await db.indexBlock(block);
	 *     }
	 *     ctx.checkpoint(); // or ctx.checkpoint(ctx.chain.tip())
	 *   })
	 * ```
	 */
	onCommit(
		handler: CommitHandler<TVariables, Block, Receipt>,
	): TevmPluginBuilder<TVariables, Block, Receipt> {
		this.entries.push({ type: "commit", handler });
		return this;
	}

	/**
	 * Register handler for revert notifications.
	 * Called when blocks are removed from the canonical chain.
	 *
	 * @example
	 * ```typescript
	 * TevmPlugin()
	 *   .onRevert(async (ctx) => {
	 *     // Revert in reverse order (newest first)
	 *     for (const block of [...ctx.chain.blocks].reverse()) {
	 *       await db.revertBlock(block);
	 *     }
	 *     ctx.checkpoint();
	 *   })
	 * ```
	 */
	onRevert(
		handler: RevertHandler<TVariables, Block, Receipt>,
	): TevmPluginBuilder<TVariables, Block, Receipt> {
		this.entries.push({ type: "revert", handler });
		return this;
	}

	/**
	 * Register handler for reorg notifications.
	 * Called when chain reorganizes (some blocks reverted, new ones committed).
	 *
	 * @example
	 * ```typescript
	 * TevmPlugin()
	 *   .onReorg(async (ctx) => {
	 *     await db.transaction(async (tx) => {
	 *       // Revert old blocks
	 *       for (const block of [...ctx.reverted.blocks].reverse()) {
	 *         await tx.revertBlock(block);
	 *       }
	 *       // Index new blocks
	 *       for (const block of ctx.committed.blocks) {
	 *         await tx.indexBlock(block);
	 *       }
	 *     });
	 *     ctx.checkpoint(ctx.committed.tip());
	 *   })
	 * ```
	 */
	onReorg(
		handler: ReorgHandler<TVariables, Block, Receipt>,
	): TevmPluginBuilder<TVariables, Block, Receipt> {
		this.entries.push({ type: "reorg", handler });
		return this;
	}

	/**
	 * Build the TevmPlugin instance.
	 * Returns a built TevmPlugin that can be passed to TevmPluginManager.
	 */
	build(): BuiltTevmPlugin<Block, Receipt> {
		const middlewares: TevmPluginMiddleware<TVariables, Block, Receipt>[] = [];
		const commitHandlers: CommitHandler<TVariables, Block, Receipt>[] = [];
		const revertHandlers: RevertHandler<TVariables, Block, Receipt>[] = [];
		const reorgHandlers: ReorgHandler<TVariables, Block, Receipt>[] = [];

		for (const entry of this.entries) {
			switch (entry.type) {
				case "middleware":
					middlewares.push(
						entry.handler as TevmPluginMiddleware<TVariables, Block, Receipt>,
					);
					break;
				case "commit":
					commitHandlers.push(
						entry.handler as CommitHandler<TVariables, Block, Receipt>,
					);
					break;
				case "revert":
					revertHandlers.push(
						entry.handler as RevertHandler<TVariables, Block, Receipt>,
					);
					break;
				case "reorg":
					reorgHandlers.push(
						entry.handler as ReorgHandler<TVariables, Block, Receipt>,
					);
					break;
			}
		}

		return {
			__brand: "BuiltTevmPlugin" as const,
			middlewares: middlewares as TevmPluginMiddleware<
				unknown,
				Block,
				Receipt
			>[],
			commitHandlers: commitHandlers as CommitHandler<
				unknown,
				Block,
				Receipt
			>[],
			revertHandlers: revertHandlers as RevertHandler<
				unknown,
				Block,
				Receipt
			>[],
			reorgHandlers: reorgHandlers as ReorgHandler<unknown, Block, Receipt>[],
		};
	}
}

/**
 * Create a new TevmPlugin builder
 *
 * @example
 * ```typescript
 * const exex = TevmPlugin()
 *   .use(loggingMiddleware)
 *   .onCommit(async (ctx) => {
 *     await db.indexBlocks(ctx.chain.blocks);
 *     ctx.checkpoint();
 *   })
 *   .build();
 * ```
 */
export function TevmPlugin<
	Block = BlockType,
	Receipt = ReceiptType,
>(): TevmPluginBuilder<{}, Block, Receipt> {
	return new TevmPluginBuilder<{}, Block, Receipt>();
}
