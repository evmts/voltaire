/**
 * @fileoverview Live implementations of BlockchainService.
 *
 * @module Blockchain
 * @since 0.0.1
 *
 * @description
 * Provides live implementation layers for BlockchainService:
 * - InMemoryBlockchain: Local in-memory storage only
 * - ForkBlockchain: Fork mode with remote RPC fetching
 *
 * These are pure TypeScript implementations that can later be backed
 * by native FFI for performance.
 *
 * @see {@link BlockchainService} - The service interface
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import {
	type Block,
	BlockchainError,
	BlockchainService,
	type HexInput,
} from "./BlockchainService.js";

/**
 * Options for creating a fork blockchain.
 */
export interface ForkBlockchainOptions {
	forkBlockNumber: bigint;
	rpcUrl: string;
}

/**
 * Creates an in-memory blockchain store.
 */
function createInMemoryStore() {
	const blocks = new Map<string, Block>();
	const blocksByNumber = new Map<string, Block>();
	let headHash: string | null = null;

	return {
		getBlockByHash(hash: HexInput): Block | null {
			return blocks.get(hash as string) ?? null;
		},
		getBlockByNumber(number: bigint): Block | null {
			return blocksByNumber.get(number.toString()) ?? null;
		},
		getCanonicalHash(number: bigint): HexInput | null {
			const block = blocksByNumber.get(number.toString());
			return block?.hash ?? null;
		},
		getHeadBlockNumber(): bigint | null {
			if (!headHash) return null;
			const block = blocks.get(headHash);
			return block?.number ?? null;
		},
		putBlock(block: Block): void {
			blocks.set(block.hash as string, block);
			blocksByNumber.set(block.number.toString(), block);
			const currentHead = headHash ? blocks.get(headHash) : null;
			if (!currentHead || block.number > currentHead.number) {
				headHash = block.hash as string;
			}
		},
		setCanonicalHead(hash: HexInput): boolean {
			if (!blocks.has(hash as string)) {
				return false;
			}
			headHash = hash as string;
			return true;
		},
		hasBlock(hash: HexInput): boolean {
			return blocks.has(hash as string);
		},
		localBlockCount(): number {
			return blocks.size;
		},
		orphanCount(): number {
			let count = 0;
			for (const block of blocks.values()) {
				if (
					block.parentHash !==
						"0x0000000000000000000000000000000000000000000000000000000000000000" &&
					!blocks.has(block.parentHash as string)
				) {
					count++;
				}
			}
			return count;
		},
		canonicalChainLength(): number {
			if (!headHash) return 0;
			let count = 0;
			let current: Block | null = blocks.get(headHash) ?? null;
			while (current) {
				count++;
				if (
					current.parentHash ===
					"0x0000000000000000000000000000000000000000000000000000000000000000"
				) {
					break;
				}
				current = blocks.get(current.parentHash as string) ?? null;
			}
			return count;
		},
		clear(): void {
			blocks.clear();
			blocksByNumber.clear();
			headHash = null;
		},
	};
}

/**
 * In-memory blockchain layer.
 *
 * @description
 * Provides a BlockchainService backed by local in-memory storage only.
 * No remote RPC fetching - blocks must be added via putBlock().
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { BlockchainService, InMemoryBlockchain } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const blockchain = yield* BlockchainService
 *   yield* blockchain.putBlock(myBlock)
 *   const head = yield* blockchain.getHeadBlockNumber()
 *   return head
 * }).pipe(Effect.provide(InMemoryBlockchain))
 * ```
 */
export const InMemoryBlockchain: Layer.Layer<BlockchainService, never, never> =
	Layer.succeed(
		BlockchainService,
		(() => {
			const store = createInMemoryStore();

			return {
				getBlockByHash: (hash: HexInput) =>
					Effect.succeed(store.getBlockByHash(hash)),

				getBlockByNumber: (number: bigint) =>
					Effect.succeed(store.getBlockByNumber(number)),

				getCanonicalHash: (number: bigint) =>
					Effect.succeed(store.getCanonicalHash(number)),

				getHeadBlockNumber: () => Effect.succeed(store.getHeadBlockNumber()),

				putBlock: (block: Block) =>
					Effect.sync(() => {
						store.putBlock(block);
					}),

				setCanonicalHead: (hash: HexInput) =>
					Effect.gen(function* () {
						const success = store.setCanonicalHead(hash);
						if (!success) {
							return yield* Effect.fail(
								new BlockchainError({ hash }, "Block not found", {
									code: "BLOCK_NOT_FOUND",
								}),
							);
						}
					}),

				hasBlock: (hash: HexInput) => Effect.succeed(store.hasBlock(hash)),

				localBlockCount: () => Effect.succeed(store.localBlockCount()),

				orphanCount: () => Effect.succeed(store.orphanCount()),

				canonicalChainLength: () =>
					Effect.succeed(store.canonicalChainLength()),

				isForkBlock: () => Effect.succeed(false),

				destroy: () =>
					Effect.sync(() => {
						store.clear();
					}),
			};
		})(),
	);

/**
 * Fork blockchain layer factory.
 *
 * @description
 * Creates a BlockchainService that fetches blocks from a remote RPC
 * for block numbers at or below the fork block number.
 *
 * @param options - Fork configuration
 * @param options.forkBlockNumber - Blocks <= this are fetched from RPC
 * @param options.rpcUrl - URL of the RPC endpoint
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { BlockchainService, ForkBlockchain } from 'voltaire-effect'
 *
 * const forkLayer = ForkBlockchain({
 *   forkBlockNumber: 18000000n,
 *   rpcUrl: 'https://eth.llamarpc.com'
 * })
 *
 * const program = Effect.gen(function* () {
 *   const blockchain = yield* BlockchainService
 *   // Fetches from RPC
 *   const block = yield* blockchain.getBlockByNumber(17999999n)
 *   return block
 * }).pipe(Effect.provide(forkLayer))
 * ```
 */
export const ForkBlockchain = (
	options: ForkBlockchainOptions,
): Layer.Layer<BlockchainService, never, never> =>
	Layer.succeed(
		BlockchainService,
		(() => {
			const store = createInMemoryStore();
			const forkCache = new Map<string, Block>();

			const fetchBlockByNumber = async (
				number: bigint,
			): Promise<Block | null> => {
				const response = await fetch(options.rpcUrl, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						jsonrpc: "2.0",
						id: 1,
						method: "eth_getBlockByNumber",
						params: [`0x${number.toString(16)}`, true],
					}),
				});
				const json = (await response.json()) as {
					error?: { message: string };
					result?: Record<string, unknown>;
				};
				if (json.error) throw new Error(json.error.message);
				return json.result ? mapRpcBlockToBlock(json.result) : null;
			};

			const fetchBlockByHash = async (
				hash: HexInput,
			): Promise<Block | null> => {
				const response = await fetch(options.rpcUrl, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						jsonrpc: "2.0",
						id: 1,
						method: "eth_getBlockByHash",
						params: [hash, true],
					}),
				});
				const json = (await response.json()) as {
					error?: { message: string };
					result?: Record<string, unknown>;
				};
				if (json.error) throw new Error(json.error.message);
				return json.result ? mapRpcBlockToBlock(json.result) : null;
			};

			return {
				getBlockByHash: (hash: HexInput) =>
					Effect.gen(function* () {
						const local = store.getBlockByHash(hash);
						if (local) return local;

						const cached = forkCache.get(hash as string);
						if (cached) return cached;

						const block = yield* Effect.tryPromise({
							try: () => fetchBlockByHash(hash),
							catch: (e) =>
								new BlockchainError(
									{ hash },
									e instanceof Error ? e.message : "RPC fetch failed",
									{
										code: "RPC_ERROR",
										cause: e instanceof Error ? e : undefined,
									},
								),
						});

						if (block && block.number <= options.forkBlockNumber) {
							forkCache.set(hash as string, block);
						}

						return block;
					}),

				getBlockByNumber: (number: bigint) =>
					Effect.gen(function* () {
						const local = store.getBlockByNumber(number);
						if (local) return local;

						if (number > options.forkBlockNumber) {
							return null;
						}

						const block = yield* Effect.tryPromise({
							try: () => fetchBlockByNumber(number),
							catch: (e) =>
								new BlockchainError(
									{ number },
									e instanceof Error ? e.message : "RPC fetch failed",
									{
										code: "RPC_ERROR",
										cause: e instanceof Error ? e : undefined,
									},
								),
						});

						if (block) {
							forkCache.set(block.hash as string, block);
						}

						return block;
					}),

				getCanonicalHash: (number: bigint) =>
					Effect.gen(function* () {
						const local = store.getCanonicalHash(number);
						if (local) return local;

						if (number > options.forkBlockNumber) {
							return null;
						}

						const block = yield* Effect.tryPromise({
							try: () => fetchBlockByNumber(number),
							catch: (e) =>
								new BlockchainError(
									{ number },
									e instanceof Error ? e.message : "RPC fetch failed",
									{
										code: "RPC_ERROR",
										cause: e instanceof Error ? e : undefined,
									},
								),
						});

						return block?.hash ?? null;
					}),

				getHeadBlockNumber: () => Effect.succeed(store.getHeadBlockNumber()),

				putBlock: (block: Block) =>
					Effect.sync(() => {
						store.putBlock(block);
					}),

				setCanonicalHead: (hash: HexInput) =>
					Effect.gen(function* () {
						if (!store.hasBlock(hash) && !forkCache.has(hash as string)) {
							return yield* Effect.fail(
								new BlockchainError({ hash }, "Block not found", {
									code: "BLOCK_NOT_FOUND",
								}),
							);
						}
						store.setCanonicalHead(hash);
					}),

				hasBlock: (hash: HexInput) =>
					Effect.succeed(store.hasBlock(hash) || forkCache.has(hash as string)),

				localBlockCount: () => Effect.succeed(store.localBlockCount()),

				orphanCount: () => Effect.succeed(store.orphanCount()),

				canonicalChainLength: () =>
					Effect.succeed(store.canonicalChainLength()),

				isForkBlock: (number: bigint) =>
					Effect.succeed(number <= options.forkBlockNumber),

				destroy: () =>
					Effect.sync(() => {
						store.clear();
						forkCache.clear();
					}),
			};
		})(),
	);

/**
 * Maps an RPC block response to the Block type.
 */
function mapRpcBlockToBlock(rpcBlock: Record<string, unknown>): Block {
	return {
		hash: rpcBlock.hash as HexInput,
		parentHash: rpcBlock.parentHash as HexInput,
		ommersHash: (rpcBlock.sha3Uncles ?? rpcBlock.ommersHash) as HexInput,
		beneficiary: (rpcBlock.miner ?? rpcBlock.beneficiary) as HexInput,
		stateRoot: rpcBlock.stateRoot as HexInput,
		transactionsRoot: rpcBlock.transactionsRoot as HexInput,
		receiptsRoot: rpcBlock.receiptsRoot as HexInput,
		logsBloom: rpcBlock.logsBloom as HexInput,
		difficulty: BigInt((rpcBlock.difficulty as string) ?? "0x0"),
		number: BigInt((rpcBlock.number as string) ?? "0x0"),
		gasLimit: BigInt((rpcBlock.gasLimit as string) ?? "0x0"),
		gasUsed: BigInt((rpcBlock.gasUsed as string) ?? "0x0"),
		timestamp: BigInt((rpcBlock.timestamp as string) ?? "0x0"),
		extraData: rpcBlock.extraData as HexInput,
		mixHash: rpcBlock.mixHash as HexInput,
		nonce: BigInt((rpcBlock.nonce as string) ?? "0x0"),
		baseFeePerGas: rpcBlock.baseFeePerGas
			? BigInt(rpcBlock.baseFeePerGas as string)
			: undefined,
		withdrawalsRoot: rpcBlock.withdrawalsRoot as HexInput | undefined,
		blobGasUsed: rpcBlock.blobGasUsed
			? BigInt(rpcBlock.blobGasUsed as string)
			: undefined,
		excessBlobGas: rpcBlock.excessBlobGas
			? BigInt(rpcBlock.excessBlobGas as string)
			: undefined,
		parentBeaconBlockRoot: rpcBlock.parentBeaconBlockRoot as
			| HexInput
			| undefined,
		transactions: "0x" as HexInput,
		ommers: "0x" as HexInput,
		withdrawals: "0x" as HexInput,
		size: BigInt((rpcBlock.size as string) ?? "0x0"),
		totalDifficulty: rpcBlock.totalDifficulty
			? BigInt(rpcBlock.totalDifficulty as string)
			: undefined,
	};
}
