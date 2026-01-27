/**
 * @fileoverview Effect-wrapped block utilities for voltaire-effect.
 *
 * @module block
 * @since 0.3.0
 *
 * @description
 * Provides Effect-wrapped utilities for fetching blockchain blocks.
 * These are standalone functions for one-off block fetches.
 *
 * For continuous block streaming with reorg detection, use makeBlockStream
 * from voltaire-effect.
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import * as Block from 'voltaire-effect/block'
 * import { HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   // Fetch by number
 *   const block = yield* Block.fetchBlock(18000000n, 'header')
 *
 *   // Fetch by hash
 *   const byHash = yield* Block.fetchBlockByHash('0x...', 'transactions')
 *
 *   // Convert to light block (pure, no Effect)
 *   const light = Block.toLightBlock(block)
 * }).pipe(Effect.provide(HttpTransport('https://eth.llamarpc.com')))
 * ```
 */

export type {
	BackfillOptions,
	BlockInclude,
	BlockStream,
	BlockStreamConstructorOptions,
	BlockStreamEvent,
	BlockStreamMetadata,
	BlockStreamOptions,
	BlocksEvent,
	LightBlock,
	ReorgEvent,
	RetryOptions,
	StreamBlock,
	WatchOptions,
} from "@tevm/voltaire/block";
export { BlockError, BlockNotFoundError } from "./BlockError.js";
export { fetchBlock } from "./fetchBlock.js";
export { fetchBlockByHash } from "./fetchBlockByHash.js";
export { fetchBlockReceipts } from "./fetchBlockReceipts.js";
export { toLightBlock } from "./toLightBlock.js";
