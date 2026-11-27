import { describe, expect, it, vi } from "vitest";
import type { Hex } from "../../primitives/Hex/HexType.js";
import * as HexUtils from "../../primitives/Hex/index.js";
import type { Provider } from "../../provider/Provider.js";
import {
	BLOCKCHAIN_ERROR_BLOCK_NOT_FOUND,
	BLOCKCHAIN_ERROR_INVALID_INPUT,
	BLOCKCHAIN_ERROR_NO_PENDING_REQUEST,
	BLOCKCHAIN_ERROR_ORPHAN_HEAD,
	BLOCKCHAIN_ERROR_OUTPUT_TOO_SMALL,
	BLOCKCHAIN_ERROR_RPC_PENDING,
	BLOCKCHAIN_SUCCESS,
	type Block,
	Blockchain,
	type BlockchainFFIExports,
	type RpcClient,
} from "./index.js";

const HASH_1 = `0x${"11".repeat(32)}` as Hex;
const HASH_2 = `0x${"22".repeat(32)}` as Hex;
const ZERO_HASH = `0x${"00".repeat(32)}` as Hex;
const ZERO_ADDR = `0x${"00".repeat(20)}` as Hex;
const ZERO_BLOOM = `0x${"00".repeat(256)}` as Hex;

function makeSampleBlock(overrides: Partial<Block> = {}): Block {
	return {
		hash: HASH_1,
		parentHash: ZERO_HASH,
		ommersHash: ZERO_HASH,
		beneficiary: ZERO_ADDR,
		stateRoot: HASH_2,
		transactionsRoot: ZERO_HASH,
		receiptsRoot: ZERO_HASH,
		logsBloom: ZERO_BLOOM,
		difficulty: 0n,
		number: 1n,
		gasLimit: 30_000_000n,
		gasUsed: 21_000n,
		timestamp: 1_700_000_000n,
		extraData: "0x" as Hex,
		mixHash: ZERO_HASH,
		nonce: 0n,
		baseFeePerGas: 1_000_000_000n,
		withdrawalsRoot: HASH_2,
		blobGasUsed: 131_072n,
		excessBlobGas: 0n,
		parentBeaconBlockRoot: HASH_1,
		transactions: "0xc0" as Hex,
		ommers: "0xc0" as Hex,
		withdrawals: "0xc0" as Hex,
		size: 1024n,
		totalDifficulty: 58_750_003_716_598_352_816_469n,
		...overrides,
	};
}

interface MockBlockchainFfiState {
	ffi: BlockchainFFIExports;
	blocksByHash: Map<string, Uint8Array>;
	blocksByNumber: Map<bigint, Uint8Array>;
	canonicalHashes: Map<bigint, Uint8Array>;
	headNumber: bigint | null;
	pendingRequests: Array<{ id: bigint; method: string; params: unknown[] }>;
	continuedResponses: Array<{ id: bigint; payload: unknown }>;
	destroyedHandles: bigint[];
	destroyedForkHandles: bigint[];
}

function createMockFfi(
	overrides: Partial<BlockchainFFIExports> = {},
): MockBlockchainFfiState {
	const blocksByHash = new Map<string, Uint8Array>();
	const blocksByNumber = new Map<bigint, Uint8Array>();
	const canonicalHashes = new Map<bigint, Uint8Array>();
	const pendingRequests: Array<{
		id: bigint;
		method: string;
		params: unknown[];
	}> = [];
	const continuedResponses: Array<{ id: bigint; payload: unknown }> = [];
	const destroyedHandles: bigint[] = [];
	const destroyedForkHandles: bigint[] = [];
	const state: MockBlockchainFfiState = {
		ffi: null as unknown as BlockchainFFIExports,
		blocksByHash,
		blocksByNumber,
		canonicalHashes,
		headNumber: null,
		pendingRequests,
		continuedResponses,
		destroyedHandles,
		destroyedForkHandles,
	};

	const encoder = new TextEncoder();
	const decoder = new TextDecoder();

	const ffi: BlockchainFFIExports = {
		blockchain_create: vi.fn(() => 101n),
		blockchain_create_with_fork: vi.fn(() => 202n),
		blockchain_destroy: vi.fn((handle: bigint) => {
			destroyedHandles.push(handle);
		}),

		fork_block_cache_create: vi.fn(() => 303n),
		fork_block_cache_destroy: vi.fn((handle: bigint) => {
			destroyedForkHandles.push(handle);
		}),
		fork_block_cache_next_request: vi.fn(
			(
				_handle,
				outRequestId,
				outMethod,
				methodBufLen,
				outMethodLen,
				outParams,
				paramsBufLen,
				outParamsLen,
			) => {
				const next = pendingRequests[0];
				if (!next) return BLOCKCHAIN_ERROR_NO_PENDING_REQUEST;
				const methodBytes = encoder.encode(next.method);
				const paramsBytes = encoder.encode(JSON.stringify(next.params));
				outMethodLen[0] = BigInt(methodBytes.length);
				outParamsLen[0] = BigInt(paramsBytes.length);
				if (
					methodBytes.length > methodBufLen ||
					paramsBytes.length > paramsBufLen
				) {
					return BLOCKCHAIN_ERROR_OUTPUT_TOO_SMALL;
				}
				pendingRequests.shift();
				outRequestId[0] = next.id;
				outMethod.set(methodBytes, 0);
				outParams.set(paramsBytes, 0);
				return BLOCKCHAIN_SUCCESS;
			},
		),
		fork_block_cache_continue: vi.fn(
			(_handle, requestId, responsePtr, responseLen) => {
				const text = decoder.decode(responsePtr.subarray(0, responseLen));
				continuedResponses.push({ id: requestId, payload: JSON.parse(text) });
				return BLOCKCHAIN_SUCCESS;
			},
		),

		blockchain_get_block_by_hash: vi.fn((_handle, hashPtr, outBlockData) => {
			const hex = HexUtils.fromBytes(hashPtr);
			const stored = blocksByHash.get(hex);
			if (!stored) return BLOCKCHAIN_ERROR_BLOCK_NOT_FOUND;
			outBlockData.fill(0);
			outBlockData.set(stored, 0);
			return BLOCKCHAIN_SUCCESS;
		}),
		blockchain_get_block_by_number: vi.fn((_handle, number, outBlockData) => {
			const stored = blocksByNumber.get(number);
			if (!stored) return BLOCKCHAIN_ERROR_BLOCK_NOT_FOUND;
			outBlockData.fill(0);
			outBlockData.set(stored, 0);
			return BLOCKCHAIN_SUCCESS;
		}),
		blockchain_get_canonical_hash: vi.fn((_handle, number, outHash) => {
			const stored = canonicalHashes.get(number);
			if (!stored) return BLOCKCHAIN_ERROR_BLOCK_NOT_FOUND;
			outHash.set(stored, 0);
			return BLOCKCHAIN_SUCCESS;
		}),
		blockchain_get_head_block_number: vi.fn((_handle, outNumber) => {
			if (state.headNumber === null) return BLOCKCHAIN_ERROR_BLOCK_NOT_FOUND;
			outNumber[0] = state.headNumber;
			return BLOCKCHAIN_SUCCESS;
		}),
		blockchain_put_block: vi.fn((_handle, blockData) => {
			const copy = new Uint8Array(blockData);
			const parsed = JSON.parse(decoder.decode(copy)) as {
				hash: Hex;
				number: string;
			};
			blocksByHash.set(parsed.hash, copy);
			blocksByNumber.set(BigInt(parsed.number), copy);
			return BLOCKCHAIN_SUCCESS;
		}),
		blockchain_set_canonical_head: vi.fn((_handle, hashPtr) => {
			const hex = HexUtils.fromBytes(hashPtr);
			const stored = blocksByHash.get(hex);
			if (!stored) return BLOCKCHAIN_ERROR_BLOCK_NOT_FOUND;
			const parsed = JSON.parse(decoder.decode(stored)) as { number: string };
			const num = BigInt(parsed.number);
			canonicalHashes.set(num, new Uint8Array(hashPtr));
			state.headNumber = num;
			return BLOCKCHAIN_SUCCESS;
		}),
		blockchain_has_block: vi.fn((_handle, hashPtr) => {
			return blocksByHash.has(HexUtils.fromBytes(hashPtr));
		}),

		blockchain_local_block_count: vi.fn(() => blocksByHash.size),
		blockchain_orphan_count: vi.fn(() => 0),
		blockchain_canonical_chain_length: vi.fn(() => canonicalHashes.size),
		blockchain_is_fork_block: vi.fn((_handle, number) => number <= 100n),
		...overrides,
	};

	state.ffi = ffi;
	return state;
}

describe("Blockchain", () => {
	describe("lifecycle", () => {
		it("creates and destroys an in-memory blockchain", () => {
			const mock = createMockFfi();
			const chain = new Blockchain({ ffi: mock.ffi });

			expect(mock.ffi.blockchain_create).toHaveBeenCalledTimes(1);
			expect(mock.ffi.fork_block_cache_create).not.toHaveBeenCalled();

			chain.destroy();
			expect(mock.destroyedHandles).toEqual([101n]);
			expect(mock.destroyedForkHandles).toEqual([]);
		});

		it("throws when blockchain_create returns null", () => {
			const mock = createMockFfi({ blockchain_create: vi.fn(() => null) });
			expect(() => new Blockchain({ ffi: mock.ffi })).toThrow(
				"Failed to create Blockchain",
			);
		});

		it("creates and destroys a forked blockchain with an RpcClient", () => {
			const mock = createMockFfi();
			const rpcClient: RpcClient = {
				getBlockByNumber: vi.fn(async () => null),
				getBlockByHash: vi.fn(async () => null),
			};

			const chain = new Blockchain({
				ffi: mock.ffi,
				rpcClient,
				forkBlockNumber: 1_000_000n,
			});

			expect(mock.ffi.fork_block_cache_create).toHaveBeenCalledWith(
				0n,
				0n,
				0n,
				1_000_000n,
			);
			expect(mock.ffi.blockchain_create_with_fork).toHaveBeenCalledWith(303n);

			chain.destroy();
			expect(mock.destroyedHandles).toEqual([202n]);
			expect(mock.destroyedForkHandles).toEqual([303n]);
		});

		it("throws if fork_block_cache_create fails", () => {
			const mock = createMockFfi({
				fork_block_cache_create: vi.fn(() => null),
			});
			const rpcClient: RpcClient = {
				getBlockByNumber: vi.fn(async () => null),
				getBlockByHash: vi.fn(async () => null),
			};

			expect(
				() =>
					new Blockchain({
						ffi: mock.ffi,
						rpcClient,
						forkBlockNumber: 10n,
					}),
			).toThrow("Failed to create fork block cache");
		});

		it("destroys fork cache if blockchain_create_with_fork fails", () => {
			const mock = createMockFfi({
				blockchain_create_with_fork: vi.fn(() => null),
			});
			const rpcClient: RpcClient = {
				getBlockByNumber: vi.fn(async () => null),
				getBlockByHash: vi.fn(async () => null),
			};

			expect(
				() =>
					new Blockchain({
						ffi: mock.ffi,
						rpcClient,
						forkBlockNumber: 10n,
					}),
			).toThrow("Failed to create Blockchain with fork");
			expect(mock.destroyedForkHandles).toEqual([303n]);
		});
	});

	describe("block storage, lookup, and canonical chain", () => {
		it("round-trips a full block with EIP-1559 and EIP-4844 fields", async () => {
			const mock = createMockFfi();
			const chain = new Blockchain({ ffi: mock.ffi });
			const block = makeSampleBlock();

			await chain.putBlock(block);
			expect(chain.hasBlock(HASH_1)).toBe(true);
			expect(chain.hasBlock(HASH_2)).toBe(false);
			expect(chain.localBlockCount()).toBe(1);

			const byHash = await chain.getBlockByHash(HASH_1);
			expect(byHash).toEqual(block);

			const byNum = await chain.getBlockByNumber(1n);
			expect(byNum).toEqual(block);

			await chain.setCanonicalHead(HASH_1);
			expect(await chain.getHeadBlockNumber()).toBe(1n);
			expect(await chain.getCanonicalHash(1n)).toBe(HASH_1);
			expect(chain.canonicalChainLength()).toBe(1);
			expect(chain.orphanCount()).toBe(0);
			expect(chain.isForkBlock(50n)).toBe(true);
			expect(chain.isForkBlock(150n)).toBe(false);
		});

		it("round-trips a pre-EIP-1559 block with omitted optional fields", async () => {
			const mock = createMockFfi();
			const chain = new Blockchain({ ffi: mock.ffi });
			const legacyBlock = makeSampleBlock({
				baseFeePerGas: undefined,
				withdrawalsRoot: undefined,
				blobGasUsed: undefined,
				excessBlobGas: undefined,
				parentBeaconBlockRoot: undefined,
				totalDifficulty: undefined,
			});

			await chain.putBlock(legacyBlock);
			const fetched = await chain.getBlockByHash(HASH_1);
			expect(fetched).toEqual(legacyBlock);
		});

		it("returns null for missing blocks, canonical hashes, and head", async () => {
			const mock = createMockFfi();
			const chain = new Blockchain({ ffi: mock.ffi });

			expect(await chain.getBlockByHash(HASH_1)).toBeNull();
			expect(await chain.getBlockByNumber(999n)).toBeNull();
			expect(await chain.getCanonicalHash(999n)).toBeNull();
			expect(await chain.getHeadBlockNumber()).toBeNull();
		});

		it("validates 32-byte block hash lengths", async () => {
			const mock = createMockFfi();
			const chain = new Blockchain({ ffi: mock.ffi });
			const shortHash = "0x1234" as Hex;

			await expect(chain.getBlockByHash(shortHash)).rejects.toThrow(
				"Invalid block hash length",
			);
			await expect(chain.setCanonicalHead(shortHash)).rejects.toThrow(
				"Invalid block hash length",
			);
			expect(() => chain.hasBlock(shortHash)).toThrow(
				"Invalid block hash length",
			);
		});

		it("surfaces FFI errors for putBlock, setCanonicalHead, canonical hash, and head", async () => {
			const mock = createMockFfi({
				blockchain_put_block: vi.fn(() => BLOCKCHAIN_ERROR_INVALID_INPUT),
				blockchain_get_canonical_hash: vi.fn(
					() => BLOCKCHAIN_ERROR_INVALID_INPUT,
				),
				blockchain_get_head_block_number: vi.fn(
					() => BLOCKCHAIN_ERROR_INVALID_INPUT,
				),
				blockchain_get_block_by_hash: vi.fn(
					() => BLOCKCHAIN_ERROR_INVALID_INPUT,
				),
				blockchain_get_block_by_number: vi.fn(
					() => BLOCKCHAIN_ERROR_INVALID_INPUT,
				),
			});
			const chain = new Blockchain({ ffi: mock.ffi });

			await expect(chain.putBlock(makeSampleBlock())).rejects.toThrow(
				`Failed to put block: error ${BLOCKCHAIN_ERROR_INVALID_INPUT}`,
			);
			await expect(chain.getCanonicalHash(1n)).rejects.toThrow(
				`Failed to get canonical hash: error ${BLOCKCHAIN_ERROR_INVALID_INPUT}`,
			);
			await expect(chain.getHeadBlockNumber()).rejects.toThrow(
				`Failed to get head block number: error ${BLOCKCHAIN_ERROR_INVALID_INPUT}`,
			);
			await expect(chain.getBlockByHash(HASH_1)).rejects.toThrow(
				`Failed to get block by hash: error ${BLOCKCHAIN_ERROR_INVALID_INPUT}`,
			);
			await expect(chain.getBlockByNumber(1n)).rejects.toThrow(
				`Failed to get block by number: error ${BLOCKCHAIN_ERROR_INVALID_INPUT}`,
			);
		});

		it("maps setCanonicalHead error codes accurately", async () => {
			const missingMock = createMockFfi();
			const missingChain = new Blockchain({ ffi: missingMock.ffi });
			await expect(missingChain.setCanonicalHead(HASH_1)).rejects.toThrow(
				"Block not found",
			);

			const orphanMock = createMockFfi({
				blockchain_set_canonical_head: vi.fn(
					() => BLOCKCHAIN_ERROR_ORPHAN_HEAD,
				),
			});
			const orphanChain = new Blockchain({ ffi: orphanMock.ffi });
			await expect(orphanChain.setCanonicalHead(HASH_1)).rejects.toThrow(
				"Cannot set orphan block as head",
			);

			const errMock = createMockFfi({
				blockchain_set_canonical_head: vi.fn(
					() => BLOCKCHAIN_ERROR_INVALID_INPUT,
				),
			});
			const errChain = new Blockchain({ ffi: errMock.ffi });
			await expect(errChain.setCanonicalHead(HASH_1)).rejects.toThrow(
				`Failed to set canonical head: error ${BLOCKCHAIN_ERROR_INVALID_INPUT}`,
			);
		});
	});

	describe("async fork RPC continuation", () => {
		it("resolves forked getBlockByNumber via RpcClient and handles buffer resize", async () => {
			const sample = makeSampleBlock({ number: 42n });
			const encoded = new TextEncoder().encode(
				JSON.stringify({
					...sample,
					difficulty: sample.difficulty.toString(),
					number: sample.number.toString(),
					gasLimit: sample.gasLimit.toString(),
					gasUsed: sample.gasUsed.toString(),
					timestamp: sample.timestamp.toString(),
					nonce: sample.nonce.toString(),
					baseFeePerGas: sample.baseFeePerGas?.toString(),
					blobGasUsed: sample.blobGasUsed?.toString(),
					excessBlobGas: sample.excessBlobGas?.toString(),
					size: sample.size.toString(),
					totalDifficulty: sample.totalDifficulty?.toString(),
				}),
			);

			let firstLookup = true;
			const mock = createMockFfi();
			// Create a huge params payload (> 8192 bytes) to exercise OUTPUT_TOO_SMALL resize
			const hugePad = "x".repeat(9000);
			mock.ffi.blockchain_get_block_by_number = vi.fn(
				(_handle, _num, outBuf) => {
					if (firstLookup) {
						firstLookup = false;
						mock.pendingRequests.push({
							id: 7n,
							method: "eth_getBlockByNumber",
							params: ["0x2a", false, hugePad],
						});
						return BLOCKCHAIN_ERROR_RPC_PENDING;
					}
					outBuf.fill(0);
					outBuf.set(encoded, 0);
					return BLOCKCHAIN_SUCCESS;
				},
			);

			const rpcClient: RpcClient = {
				getBlockByNumber: vi.fn(async () => ({
					...sample,
					difficulty: 0n,
					number: 42n,
				})),
				getBlockByHash: vi.fn(async () => null),
			};
			// Use JSON-safe response object returned by fork continuation
			(
				rpcClient.getBlockByNumber as ReturnType<typeof vi.fn>
			).mockResolvedValue({ number: "0x2a", hash: HASH_1 });

			const chain = new Blockchain({
				ffi: mock.ffi,
				rpcClient,
				forkBlockNumber: 100n,
			});

			const result = await chain.getBlockByNumber(42n);
			expect(result?.number).toBe(42n);
			expect(rpcClient.getBlockByNumber).toHaveBeenCalledWith(42n);
			expect(mock.continuedResponses).toEqual([
				{ id: 7n, payload: { number: "0x2a", hash: HASH_1 } },
			]);
		});

		it("resolves forked getBlockByHash via RpcClient", async () => {
			const sample = makeSampleBlock({ hash: HASH_2, number: 55n });
			const encoded = new TextEncoder().encode(
				JSON.stringify({
					...sample,
					difficulty: "0",
					number: "55",
					gasLimit: "30000000",
					gasUsed: "21000",
					timestamp: "1700000000",
					nonce: "0",
					size: "1024",
					baseFeePerGas: "1000000000",
					blobGasUsed: "131072",
					excessBlobGas: "0",
					totalDifficulty: "58750003716598352816469",
				}),
			);

			let pending = true;
			const mock = createMockFfi();
			mock.ffi.blockchain_get_block_by_hash = vi.fn((_h, _hash, outBuf) => {
				if (pending) {
					pending = false;
					mock.pendingRequests.push({
						id: 9n,
						method: "eth_getBlockByHash",
						params: [HASH_2, true],
					});
					return BLOCKCHAIN_ERROR_RPC_PENDING;
				}
				outBuf.fill(0);
				outBuf.set(encoded, 0);
				return BLOCKCHAIN_SUCCESS;
			});

			const rpcClient: RpcClient = {
				getBlockByNumber: vi.fn(async () => null),
				getBlockByHash: vi.fn(
					async () => ({ hash: HASH_2 }) as unknown as Block,
				),
			};

			const chain = new Blockchain({
				ffi: mock.ffi,
				rpcClient,
				forkBlockNumber: 100n,
			});

			const block = await chain.getBlockByHash(HASH_2);
			expect(block?.hash).toBe(HASH_2);
			expect(rpcClient.getBlockByHash).toHaveBeenCalledWith(HASH_2);
			expect(mock.continuedResponses).toEqual([
				{ id: 9n, payload: { hash: HASH_2 } },
			]);
		});

		it("routes fork requests directly through an EIP-1193 Provider", async () => {
			const sample = makeSampleBlock({ number: 12n });
			const encoded = new TextEncoder().encode(
				JSON.stringify({
					...sample,
					difficulty: "0",
					number: "12",
					gasLimit: "30000000",
					gasUsed: "21000",
					timestamp: "1700000000",
					nonce: "0",
					size: "1024",
					baseFeePerGas: "1000000000",
					blobGasUsed: "131072",
					excessBlobGas: "0",
					totalDifficulty: "58750003716598352816469",
				}),
			);

			let pending = true;
			const mock = createMockFfi();
			mock.ffi.blockchain_get_block_by_number = vi.fn((_h, _n, outBuf) => {
				if (pending) {
					pending = false;
					mock.pendingRequests.push({
						id: 11n,
						method: "eth_getBlockByNumber",
						params: ["latest", false],
					});
					return BLOCKCHAIN_ERROR_RPC_PENDING;
				}
				outBuf.fill(0);
				outBuf.set(encoded, 0);
				return BLOCKCHAIN_SUCCESS;
			});

			const provider: Provider = {
				request: vi.fn(async () => ({ number: "0xc", hash: HASH_1 })),
				on: vi.fn(() => provider),
				removeListener: vi.fn(() => provider),
			};

			const chain = new Blockchain({
				ffi: mock.ffi,
				rpcClient: provider,
				forkBlockNumber: 12n,
			});

			const block = await chain.getBlockByNumber(12n);
			expect(block?.number).toBe(12n);
			expect(provider.request).toHaveBeenCalledWith({
				method: "eth_getBlockByNumber",
				params: ["latest", false],
			});
		});

		it("throws on unsupported fork method, continue failure, or unresolved retry exhaustion", async () => {
			const mock = createMockFfi();
			mock.ffi.blockchain_get_block_by_number = vi.fn(() => {
				mock.pendingRequests.push({
					id: 1n,
					method: "debug_traceBlock",
					params: [],
				});
				return BLOCKCHAIN_ERROR_RPC_PENDING;
			});
			const rpcClient: RpcClient = {
				getBlockByNumber: vi.fn(async () => null),
				getBlockByHash: vi.fn(async () => null),
			};

			const chain = new Blockchain({
				ffi: mock.ffi,
				rpcClient,
				forkBlockNumber: 10n,
			});

			await expect(chain.getBlockByNumber(5n)).rejects.toThrow(
				"Unsupported fork method: debug_traceBlock",
			);

			const failContinueMock = createMockFfi({
				fork_block_cache_continue: vi.fn(() => BLOCKCHAIN_ERROR_INVALID_INPUT),
			});
			failContinueMock.ffi.blockchain_get_block_by_number = vi.fn(() => {
				failContinueMock.pendingRequests.push({
					id: 2n,
					method: "eth_getBlockByNumber",
					params: ["latest", true],
				});
				return BLOCKCHAIN_ERROR_RPC_PENDING;
			});
			const failContinueChain = new Blockchain({
				ffi: failContinueMock.ffi,
				rpcClient,
				forkBlockNumber: 10n,
			});
			await expect(failContinueChain.getBlockByNumber(5n)).rejects.toThrow(
				`fork_block_cache_continue failed: ${BLOCKCHAIN_ERROR_INVALID_INPUT}`,
			);

			const loopMock = createMockFfi({
				blockchain_get_block_by_hash: vi.fn(() => BLOCKCHAIN_ERROR_RPC_PENDING),
			});
			const loopChain = new Blockchain({
				ffi: loopMock.ffi,
				rpcClient,
				forkBlockNumber: 10n,
			});
			await expect(loopChain.getBlockByHash(HASH_1)).rejects.toThrow(
				"Failed to resolve forked block by hash",
			);
		});
	});
});
