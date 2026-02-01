/**
 * @fileoverview Blockchain module exports for voltaire-effect.
 *
 * @module blockchain
 * @since 0.0.1
 *
 * @description
 * This module provides Effect-wrapped blockchain storage and retrieval.
 *
 * ## Components
 *
 * ### Service
 * - {@link BlockchainService} - Service interface tag
 * - {@link BlockchainShape} - Service shape type
 * - {@link BlockchainError} - Error type for failed operations
 * - {@link Block} - Block data type
 *
 * ### Layers
 * - {@link InMemoryBlockchain} - In-memory only storage
 * - {@link ForkBlockchain} - Fork mode with RPC fetching
 *
 * @example Basic usage
 * ```typescript
 * import { Effect } from 'effect'
 * import { BlockchainService, InMemoryBlockchain } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const blockchain = yield* BlockchainService
 *   const head = yield* blockchain.getHeadBlockNumber()
 *   return head
 * }).pipe(Effect.provide(InMemoryBlockchain))
 * ```
 */

export {
	ForkBlockchain,
	type ForkBlockchainOptions,
	InMemoryBlockchain,
} from "./Blockchain.js";
export {
	type Block,
	BlockchainError,
	BlockchainService,
	type BlockchainShape,
	type HexInput,
} from "./BlockchainService.js";
