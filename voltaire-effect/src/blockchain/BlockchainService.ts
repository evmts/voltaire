/**
 * @fileoverview Blockchain service definition for Effect-wrapped block storage.
 *
 * @module BlockchainService
 * @since 0.0.1
 *
 * @description
 * The BlockchainService provides a high-level interface for block storage
 * and retrieval. It wraps blockchain functionality with Effect-based error
 * handling and resource management.
 *
 * Supports both in-memory storage and fork mode (fetching blocks from remote RPC).
 *
 * @see {@link InMemoryBlockchain} - In-memory only implementation
 * @see {@link ForkBlockchain} - Fork mode implementation with RPC fetching
 */

import { AbstractError } from "@tevm/voltaire/errors";
import type { HexType } from "@tevm/voltaire/Hex";
import * as Context from "effect/Context";
import type * as Effect from "effect/Effect";

/**
 * Hex input type for block hashes and data.
 */
export type HexInput = HexType | `0x${string}`;

/**
 * Block structure matching the native blockchain implementation.
 *
 * @description
 * Contains all Ethereum block header fields plus body data (transactions,
 * ommers, withdrawals) as RLP-encoded hex strings for FFI transfer.
 *
 * @since 0.0.1
 */
export interface Block {
	hash: HexInput;
	parentHash: HexInput;
	ommersHash: HexInput;
	beneficiary: HexInput;
	stateRoot: HexInput;
	transactionsRoot: HexInput;
	receiptsRoot: HexInput;
	logsBloom: HexInput;
	difficulty: bigint;
	number: bigint;
	gasLimit: bigint;
	gasUsed: bigint;
	timestamp: bigint;
	extraData: HexInput;
	mixHash: HexInput;
	nonce: bigint;
	baseFeePerGas?: bigint;
	withdrawalsRoot?: HexInput;
	blobGasUsed?: bigint;
	excessBlobGas?: bigint;
	parentBeaconBlockRoot?: HexInput;
	transactions: HexInput;
	ommers: HexInput;
	withdrawals: HexInput;
	size: bigint;
	totalDifficulty?: bigint;
}

/**
 * Error thrown when a blockchain operation fails.
 *
 * @description
 * Contains error codes matching common blockchain error conditions.
 *
 * Common error codes:
 * - `BLOCK_NOT_FOUND` - Block does not exist
 * - `INVALID_PARENT` - Block's parent not found
 * - `ORPHAN_HEAD` - Cannot set orphan block as head
 * - `INVALID_HASH` - Invalid block hash
 * - `RPC_ERROR` - RPC request failed (fork mode)
 *
 * @since 0.0.1
 */
export class BlockchainError extends AbstractError {
	readonly _tag = "BlockchainError" as const;

	readonly input: unknown;
	readonly errorCode?: string;

	constructor(
		input: unknown,
		message?: string,
		options?: {
			code?: string;
			context?: Record<string, unknown>;
			cause?: Error;
		},
	) {
		super(message ?? options?.cause?.message ?? "Blockchain error", {
			context: options?.context,
			cause: options?.cause,
		});
		this.name = "BlockchainError";
		this.input = input;
		this.errorCode = options?.code;
	}
}

/**
 * Shape of the blockchain service.
 *
 * @description
 * Defines all blockchain operations available through BlockchainService.
 * Each method returns an Effect that may fail with BlockchainError.
 *
 * @since 0.0.1
 */
export type BlockchainShape = {
	readonly getBlockByHash: (
		hash: HexInput,
	) => Effect.Effect<Block | null, BlockchainError>;
	readonly getBlockByNumber: (
		number: bigint,
	) => Effect.Effect<Block | null, BlockchainError>;
	readonly getCanonicalHash: (
		number: bigint,
	) => Effect.Effect<HexInput | null, BlockchainError>;
	readonly getHeadBlockNumber: () => Effect.Effect<
		bigint | null,
		BlockchainError
	>;
	readonly putBlock: (block: Block) => Effect.Effect<void, BlockchainError>;
	readonly setCanonicalHead: (
		hash: HexInput,
	) => Effect.Effect<void, BlockchainError>;
	readonly hasBlock: (hash: HexInput) => Effect.Effect<boolean, BlockchainError>;
	readonly localBlockCount: () => Effect.Effect<number, BlockchainError>;
	readonly orphanCount: () => Effect.Effect<number, BlockchainError>;
	readonly canonicalChainLength: () => Effect.Effect<number, BlockchainError>;
	readonly isForkBlock: (
		number: bigint,
	) => Effect.Effect<boolean, BlockchainError>;
	readonly destroy: () => Effect.Effect<void, never>;
};

/**
 * Blockchain service for block storage and retrieval.
 *
 * @description
 * Provides methods for storing, retrieving, and managing blocks.
 * This is an Effect Context.Tag that must be provided with a concrete
 * implementation (InMemoryBlockchain or ForkBlockchain) before running.
 *
 * The service handles:
 * - Block storage and retrieval by hash or number
 * - Canonical chain management
 * - Fork mode with remote RPC fetching
 * - Resource cleanup via destroy()
 *
 * @since 0.0.1
 *
 * @example Basic usage with InMemoryBlockchain
 * ```typescript
 * import { Effect } from 'effect'
 * import { BlockchainService, InMemoryBlockchain } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const blockchain = yield* BlockchainService
 *   const head = yield* blockchain.getHeadBlockNumber()
 *   return head
 * }).pipe(Effect.provide(InMemoryBlockchain))
 *
 * await Effect.runPromise(program)
 * ```
 *
 * @example Fork mode with RPC
 * ```typescript
 * import { Effect } from 'effect'
 * import { BlockchainService, ForkBlockchain } from 'voltaire-effect/services'
 *
 * const forkLayer = ForkBlockchain({
 *   forkBlockNumber: 18000000n,
 *   rpcUrl: 'https://eth.llamarpc.com'
 * })
 *
 * const program = Effect.gen(function* () {
 *   const blockchain = yield* BlockchainService
 *   const block = yield* blockchain.getBlockByNumber(17999999n)
 *   return block
 * }).pipe(Effect.provide(forkLayer))
 * ```
 *
 * @see {@link InMemoryBlockchain} - In-memory only implementation
 * @see {@link ForkBlockchain} - Fork mode implementation
 * @see {@link BlockchainError} - Error type for failed operations
 */
export class BlockchainService extends Context.Tag("BlockchainService")<
	BlockchainService,
	BlockchainShape
>() {}
