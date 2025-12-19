/**
 * TevmPlugin (Execution Extension) - Hono-style hooks for chain notifications
 *
 * Inspired by Reth's TevmPlugin pattern and Hono's middleware architecture.
 * TevmPlugines use named hooks for different notification types with middleware composition.
 *
 * @example
 * ```typescript
 * import { TevmPlugin, TevmPluginManager } from '@tevm/primitives/exex';
 * import { loggingMiddleware } from '@tevm/primitives/exex/middleware';
 *
 * // Build an TevmPlugin with middleware and named hooks
 * const exex = TevmPlugin()
 *   .use(loggingMiddleware())
 *   .onCommit(async (ctx) => {
 *     for (const block of ctx.chain.blocks) {
 *       await db.indexBlock(block);
 *     }
 *     ctx.checkpoint(); // signals finished at current tip
 *   })
 *   .onRevert(async (ctx) => {
 *     for (const block of [...ctx.chain.blocks].reverse()) {
 *       await db.revertBlock(block);
 *     }
 *     ctx.checkpoint();
 *   })
 *   .onReorg(async (ctx) => {
 *     await db.handleReorg(ctx.reverted, ctx.committed);
 *     ctx.checkpoint(ctx.committed.tip());
 *   })
 *   .build();
 *
 * // Run with manager
 * const manager = new TevmPluginManager(node, contextFactory);
 * await manager.run({ id: 'indexer', exex });
 * ```
 */

// Builder
export { TevmPlugin, TevmPluginBuilder } from "./TevmPluginBuilder.js";

// Context types
export {
	createMiddleware,
	type NotificationType,
	type TevmPluginBaseContext,
	type CommitContext,
	type RevertContext,
	type ReorgContext,
	type TevmPluginHandlerContext,
	type TevmPluginHandler,
	type CommitHandler,
	type RevertHandler,
	type ReorgHandler,
	type TevmPluginMiddleware,
} from "./TevmPluginHandlerContext.js";

// Core types
export type {
	BlockIdType,
	CommittedChainType,
	BuiltTevmPlugin,
	TevmPluginNotificationType,
	CommittedNotification,
	RevertedNotification,
	ReorgedNotification,
	StateReaderType,
	BlockReaderType,
	ChainEventSourceType,
} from "./types/index.js";

// Manager
export {
	TevmPluginManager,
	type ContextFactory,
	type TevmPluginRegistration,
} from "./TevmPluginManager.js";

// Middleware
export * as middleware from "./middleware/index.js";

// Examples
export * as examples from "./examples/index.js";
