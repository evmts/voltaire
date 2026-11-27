import { describe, expect, it, vi } from "vitest";
import type { Hex } from "../../primitives/Hex/HexType.js";
import * as HexUtils from "../../primitives/Hex/index.js";
import type { Provider } from "../../provider/Provider.js";
import {
	BLOCKCHAIN_ERROR_BLOCK_NOT_FOUND,
	BLOCKCHAIN_ERROR_INVALID_HASH,
	BLOCKCHAIN_ERROR_INVALID_INPUT,
	BLOCKCHAIN_ERROR_INVALID_PARENT,
	BLOCKCHAIN_ERROR_INVALID_REQUEST,
	BLOCKCHAIN_ERROR_NO_PENDING_REQUEST,
	BLOCKCHAIN_ERROR_ORPHAN_HEAD,
	BLOCKCHAIN_ERROR_OUT_OF_MEMORY,
	BLOCKCHAIN_ERROR_OUTPUT_TOO_SMALL,
	BLOCKCHAIN_ERROR_RPC_PENDING,
	BLOCKCHAIN_SUCCESS,
	type Block,
	Blockchain,
	type BlockchainFFIExports,
	type RpcClient,
} from "./index.js";

const ZERO_HASH = `0x${"00".repeat(32)}` as Hex;
const ZERO_ADDRESS = `0x${"00".repeat(20)}` as Hex;
const EMPTY_BLOOM = `0x${"00".repeat(256)}` as Hex;

function makeHash(byteHex: string): Hex {
	return `0x${byteHex.repeat(32)}` as Hex;
}

function makeBlock(
	overrides: Partial<Block> & { hash: Hex; parentHash: Hex; number: bigint },
): Block {
	return {
		hash: overrides.hash,
		parentHash: overrides.parentHash,
		ommersHash: overrides.ommersHash ?? makeHash("1d"),
		beneficiary: overrides.beneficiary ?? ZERO_ADDRESS,
		stateRoot: overrides.stateRoot ?? makeHash("56"),
		transactionsRoot: overrides.transactionsRoot ?? makeHash("56"),
		receiptsRoot: overrides.receiptsRoot ?? makeHash("56"),
		logsBloom: overrides.logsBloom ?? EMPTY_BLOOM,
		difficulty: overrides.difficulty ?? 0n,
		number: overrides.number,
		gasLimit: overrides.gasLimit ?? 30_000_000n,
		gasUsed: overrides.gasUsed ?? 21_000n,
		timestamp: overrides.timestamp ?? 1_700_000_000n + overrides.number * 12n,
		extraData: overrides.extraData ?? ("0x" as Hex),
		mixHash: overrides.mixHash ?? ZERO_HASH,
		nonce: overrides.nonce ?? 0n,
		baseFeePerGas: overrides.baseFeePerGas,
		withdrawalsRoot: overrides.withdrawalsRoot,
		blobGasUsed: overrides.blobGasUsed,
		excessBlobGas: overrides.excessBlobGas,
		parentBeaconBlockRoot: overrides.parentBeaconBlockRoot,
		transactions: overrides.transactions ?? ("0xc0" as Hex),
		ommers: overrides.ommers ?? ("0xc0" as Hex),
		withdrawals: overrides.withdrawals ?? ("0xc0" as Hex),
		size: overrides.size ?? 1024n,
		totalDifficulty: overrides.totalDifficulty,
	};
}

interface PendingForkBlockRequest {
	requestId: bigint;
	method: string;
	params: unknown[];
	onResponse: (response: unknown) => void;
}

interface ForkCacheState {
	forkBlockNumber: bigint;
	pending: PendingForkBlockRequest[];
	nextRequestId: bigint;
	fetchedNumbers: Set<bigint>;
	fetchedHashes: Set<string>;
}

interface ChainState {
	blocksByHash: Map<string, Uint8Array>;
	parsedBlocks: Map<
		string,
		{ hash: string; parentHash: string; number: bigint }
	>;
	orphans: Set<string>;
	canonicalByNumber: Map<bigint, string>;
	headNumber: bigint | null;
	forkCacheHandle: bigint | null;
}

function serializeRawBlockJson(block: Block): Uint8Array {
	const json = JSON.stringify({
		hash: block.hash,
		parentHash: block.parentHash,
		ommersHash: block.ommersHash,
		beneficiary: block.beneficiary,
		stateRoot: block.stateRoot,
		transactionsRoot: block.transactionsRoot,
		receiptsRoot: block.receiptsRoot,
		logsBloom: block.logsBloom,
		difficulty: block.difficulty.toString(),
		number: block.number.toString(),
		gasLimit: block.gasLimit.toString(),
		gasUsed: block.gasUsed.toString(),
		timestamp: block.timestamp.toString(),
		extraData: block.extraData,
		mixHash: block.mixHash,
		nonce: block.nonce.toString(),
		baseFeePerGas: block.baseFeePerGas?.toString(),
		withdrawalsRoot: block.withdrawalsRoot,
		blobGasUsed: block.blobGasUsed?.toString(),
		excessBlobGas: block.excessBlobGas?.toString(),
		parentBeaconBlockRoot: block.parentBeaconBlockRoot,
		transactions: block.transactions,
		ommers: block.ommers,
		withdrawals: block.withdrawals,
		size: block.size.toString(),
		totalDifficulty: block.totalDifficulty?.toString(),
	});
	return new TextEncoder().encode(json);
}

function createBlockchainFFISimulator() {
	let nextHandle = 500n;
	const chains = new Map<bigint, ChainState>();
	const forkCaches = new Map<bigint, ForkCacheState>();
	const destroyedChains: bigint[] = [];
	const destroyedForkCaches: bigint[] = [];

	function getChain(handle: bigint): ChainState {
		const chain = chains.get(handle);
		if (!chain) {
			throw new Error(`Unknown Blockchain handle ${handle}`);
		}
		return chain;
	}

	function storeSerializedBlock(chain: ChainState, raw: Uint8Array): void {
		const text = new TextDecoder().decode(raw);
		const parsed = JSON.parse(text) as {
			hash: string;
			parentHash: string;
			number: string;
		};
		const hashKey = parsed.hash.toLowerCase();
		const parentKey = parsed.parentHash.toLowerCase();
		const number = BigInt(parsed.number);

		chain.blocksByHash.set(hashKey, new Uint8Array(raw));
		chain.parsedBlocks.set(hashKey, {
			hash: hashKey,
			parentHash: parentKey,
			number,
		});

		const isGenesis = number === 0n;
		const hasParent = chain.blocksByHash.has(parentKey);
		if (!isGenesis && !hasParent) {
			chain.orphans.add(hashKey);
		} else {
			chain.orphans.delete(hashKey);
		}

		// Re-check any existing orphans whose parent is now present
		let resolvedAny = true;
		while (resolvedAny) {
			resolvedAny = false;
			for (const orphanHash of Array.from(chain.orphans)) {
				const meta = chain.parsedBlocks.get(orphanHash);
				if (
					meta &&
					chain.blocksByHash.has(meta.parentHash) &&
					!chain.orphans.has(meta.parentHash)
				) {
					chain.orphans.delete(orphanHash);
					resolvedAny = true;
				}
			}
		}
	}

	function writeBlockOutput(raw: Uint8Array, out: Uint8Array): number {
		if (raw.length >= out.length) {
			return BLOCKCHAIN_ERROR_OUTPUT_TOO_SMALL;
		}
		out.fill(0);
		out.set(raw, 0);
		return BLOCKCHAIN_SUCCESS;
	}

	const ffi: BlockchainFFIExports = {
		blockchain_create: () => {
			const handle = nextHandle++;
			chains.set(handle, {
				blocksByHash: new Map(),
				parsedBlocks: new Map(),
				orphans: new Set(),
				canonicalByNumber: new Map(),
				headNumber: null,
				forkCacheHandle: null,
			});
			return handle;
		},

		blockchain_create_with_fork: (forkCache: bigint) => {
			if (!forkCaches.has(forkCache)) return null;
			const handle = nextHandle++;
			chains.set(handle, {
				blocksByHash: new Map(),
				parsedBlocks: new Map(),
				orphans: new Set(),
				canonicalByNumber: new Map(),
				headNumber: null,
				forkCacheHandle: forkCache,
			});
			return handle;
		},

		blockchain_destroy: (handle: bigint) => {
			destroyedChains.push(handle);
			chains.delete(handle);
		},

		fork_block_cache_create: (
			_rpcContext: bigint,
			_vtableFetchByNumber: bigint,
			_vtableFetchByHash: bigint,
			forkBlockNumber: bigint,
		) => {
			const handle = nextHandle++;
			forkCaches.set(handle, {
				forkBlockNumber,
				pending: [],
				nextRequestId: 1n,
				fetchedNumbers: new Set(),
				fetchedHashes: new Set(),
			});
			return handle;
		},

		fork_block_cache_destroy: (handle: bigint) => {
			destroyedForkCaches.push(handle);
			forkCaches.delete(handle);
		},

		fork_block_cache_next_request: (
			handle: bigint,
			outRequestId: BigUint64Array,
			outMethod: Uint8Array,
			methodBufLen: number,
			outMethodLen: BigUint64Array,
			outParams: Uint8Array,
			paramsBufLen: number,
			outParamsLen: BigUint64Array,
		) => {
			const cache = forkCaches.get(handle);
			if (!cache) return BLOCKCHAIN_ERROR_INVALID_INPUT;
			const req = cache.pending[0];
			if (!req) return BLOCKCHAIN_ERROR_NO_PENDING_REQUEST;

			const encoder = new TextEncoder();
			const methodBytes = encoder.encode(req.method);
			const paramsBytes = encoder.encode(JSON.stringify(req.params));
			outMethodLen[0] = BigInt(methodBytes.length);
			outParamsLen[0] = BigInt(paramsBytes.length);

			if (
				methodBytes.length > methodBufLen ||
				paramsBytes.length > paramsBufLen
			) {
				return BLOCKCHAIN_ERROR_OUTPUT_TOO_SMALL;
			}

			outRequestId[0] = req.requestId;
			outMethod.set(methodBytes, 0);
			outParams.set(paramsBytes, 0);
			return BLOCKCHAIN_SUCCESS;
		},

		fork_block_cache_continue: (
			handle: bigint,
			requestId: bigint,
			responsePtr: Uint8Array,
			responseLen: number,
		) => {
			const cache = forkCaches.get(handle);
			if (!cache) return BLOCKCHAIN_ERROR_INVALID_INPUT;
			const idx = cache.pending.findIndex((r) => r.requestId === requestId);
			if (idx === -1) return BLOCKCHAIN_ERROR_INVALID_REQUEST;
			const [req] = cache.pending.splice(idx, 1);
			if (!req) return BLOCKCHAIN_ERROR_INVALID_REQUEST;
			const json = new TextDecoder().decode(
				responsePtr.subarray(0, responseLen),
			);
			req.onResponse(JSON.parse(json));
			return BLOCKCHAIN_SUCCESS;
		},

		blockchain_get_block_by_hash: (
			handle: bigint,
			blockHashPtr: Uint8Array,
			outBlockData: Uint8Array,
		) => {
			const chain = getChain(handle);
			const hashHex = HexUtils.fromBytes(blockHashPtr).toLowerCase();
			const raw = chain.blocksByHash.get(hashHex);
			if (raw) {
				return writeBlockOutput(raw, outBlockData);
			}
			if (chain.forkCacheHandle) {
				const cache = forkCaches.get(chain.forkCacheHandle);
				if (cache && !cache.fetchedHashes.has(hashHex)) {
					const requestId = cache.nextRequestId++;
					cache.pending.push({
						requestId,
						method: "eth_getBlockByHash",
						params: [hashHex, true],
						onResponse: (resp: unknown) => {
							cache.fetchedHashes.add(hashHex);
							if (resp && typeof resp === "object") {
								const encoded = new TextEncoder().encode(JSON.stringify(resp));
								storeSerializedBlock(chain, encoded);
							}
						},
					});
					return BLOCKCHAIN_ERROR_RPC_PENDING;
				}
			}
			return BLOCKCHAIN_ERROR_BLOCK_NOT_FOUND;
		},

		blockchain_get_block_by_number: (
			handle: bigint,
			number: bigint,
			outBlockData: Uint8Array,
		) => {
			const chain = getChain(handle);
			const hashHex = chain.canonicalByNumber.get(number);
			if (hashHex) {
				const raw = chain.blocksByHash.get(hashHex);
				if (raw) {
					return writeBlockOutput(raw, outBlockData);
				}
			}
			if (chain.forkCacheHandle) {
				const cache = forkCaches.get(chain.forkCacheHandle);
				if (
					cache &&
					number <= cache.forkBlockNumber &&
					!cache.fetchedNumbers.has(number)
				) {
					const requestId = cache.nextRequestId++;
					cache.pending.push({
						requestId,
						method: "eth_getBlockByNumber",
						params: [`0x${number.toString(16)}`, true],
						onResponse: (resp: unknown) => {
							cache.fetchedNumbers.add(number);
							if (resp && typeof resp === "object") {
								const obj = resp as { hash: string };
								const encoded = new TextEncoder().encode(JSON.stringify(resp));
								storeSerializedBlock(chain, encoded);
								chain.canonicalByNumber.set(number, obj.hash.toLowerCase());
							}
						},
					});
					return BLOCKCHAIN_ERROR_RPC_PENDING;
				}
			}
			return BLOCKCHAIN_ERROR_BLOCK_NOT_FOUND;
		},

		blockchain_get_canonical_hash: (
			handle: bigint,
			number: bigint,
			outHash: Uint8Array,
		) => {
			const chain = getChain(handle);
			const hashHex = chain.canonicalByNumber.get(number);
			if (!hashHex) return BLOCKCHAIN_ERROR_BLOCK_NOT_FOUND;
			outHash.set(HexUtils.toBytes(hashHex as Hex), 0);
			return BLOCKCHAIN_SUCCESS;
		},

		blockchain_get_head_block_number: (
			handle: bigint,
			outNumber: BigUint64Array,
		) => {
			const chain = getChain(handle);
			if (chain.headNumber === null) {
				return BLOCKCHAIN_ERROR_BLOCK_NOT_FOUND;
			}
			outNumber[0] = chain.headNumber;
			return BLOCKCHAIN_SUCCESS;
		},

		blockchain_put_block: (handle: bigint, blockData: Uint8Array) => {
			const chain = getChain(handle);
			storeSerializedBlock(chain, blockData);
			return BLOCKCHAIN_SUCCESS;
		},

		blockchain_set_canonical_head: (
			handle: bigint,
			blockHashPtr: Uint8Array,
		) => {
			const chain = getChain(handle);
			const hashHex = HexUtils.fromBytes(blockHashPtr).toLowerCase();
			if (!chain.blocksByHash.has(hashHex)) {
				return BLOCKCHAIN_ERROR_BLOCK_NOT_FOUND;
			}
			if (chain.orphans.has(hashHex)) {
				return BLOCKCHAIN_ERROR_ORPHAN_HEAD;
			}

			// Walk ancestors back to genesis (or fork root) and rebuild canonical chain
			const lineage: Array<{ number: bigint; hash: string }> = [];
			let cursor: string | undefined = hashHex;
			while (cursor) {
				const meta = chain.parsedBlocks.get(cursor);
				if (!meta) break;
				lineage.push({ number: meta.number, hash: meta.hash });
				if (meta.number === 0n) break;
				cursor = chain.parsedBlocks.has(meta.parentHash)
					? meta.parentHash
					: undefined;
			}

			chain.canonicalByNumber.clear();
			for (const entry of lineage) {
				chain.canonicalByNumber.set(entry.number, entry.hash);
			}
			const headMeta = chain.parsedBlocks.get(hashHex);
			chain.headNumber = headMeta ? headMeta.number : null;
			return BLOCKCHAIN_SUCCESS;
		},

		blockchain_has_block: (handle: bigint, blockHashPtr: Uint8Array) => {
			const chain = getChain(handle);
			const hashHex = HexUtils.fromBytes(blockHashPtr).toLowerCase();
			return chain.blocksByHash.has(hashHex);
		},

		blockchain_local_block_count: (handle: bigint) => {
			return getChain(handle).blocksByHash.size;
		},

		blockchain_orphan_count: (handle: bigint) => {
			return getChain(handle).orphans.size;
		},

		blockchain_canonical_chain_length: (handle: bigint) => {
			return getChain(handle).canonicalByNumber.size;
		},

		blockchain_is_fork_block: (handle: bigint, number: bigint) => {
			const chain = getChain(handle);
			if (!chain.forkCacheHandle) return false;
			const cache = forkCaches.get(chain.forkCacheHandle);
			return cache ? number <= cache.forkBlockNumber : false;
		},
	};

	return {
		ffi,
		chains,
		forkCaches,
		destroyedChains,
		destroyedForkCaches,
	};
}

describe("Blockchain error code constants", () => {
	it("exports exact c_api.zig error codes", () => {
		expect(BLOCKCHAIN_SUCCESS).toBe(0);
		expect(BLOCKCHAIN_ERROR_INVALID_INPUT).toBe(-1);
		expect(BLOCKCHAIN_ERROR_OUT_OF_MEMORY).toBe(-2);
		expect(BLOCKCHAIN_ERROR_BLOCK_NOT_FOUND).toBe(-3);
		expect(BLOCKCHAIN_ERROR_INVALID_PARENT).toBe(-4);
		expect(BLOCKCHAIN_ERROR_ORPHAN_HEAD).toBe(-5);
		expect(BLOCKCHAIN_ERROR_INVALID_HASH).toBe(-6);
		expect(BLOCKCHAIN_ERROR_RPC_PENDING).toBe(-7);
		expect(BLOCKCHAIN_ERROR_NO_PENDING_REQUEST).toBe(-8);
		expect(BLOCKCHAIN_ERROR_OUTPUT_TOO_SMALL).toBe(-9);
		expect(BLOCKCHAIN_ERROR_INVALID_REQUEST).toBe(-10);
	});
});

describe("Blockchain lifecycle & construction", () => {
	it("creates and destroys in-memory Blockchain", () => {
		const sim = createBlockchainFFISimulator();
		const chain = new Blockchain({ ffi: sim.ffi });

		expect(sim.chains.size).toBe(1);
		expect(sim.forkCaches.size).toBe(0);

		chain.destroy();
		expect(sim.chains.size).toBe(0);
		expect(sim.destroyedChains).toHaveLength(1);
		expect(sim.destroyedForkCaches).toHaveLength(0);
	});

	it("creates fork-mode Blockchain when rpcClient and forkBlockNumber are provided", () => {
		const sim = createBlockchainFFISimulator();
		const rpcClient: RpcClient = {
			getBlockByNumber: vi.fn(async () => null),
			getBlockByHash: vi.fn(async () => null),
		};

		const chain = new Blockchain({
			ffi: sim.ffi,
			rpcClient,
			forkBlockNumber: 1_000_000n,
		});

		expect(sim.chains.size).toBe(1);
		expect(sim.forkCaches.size).toBe(1);
		expect(chain.isForkBlock(1_000_000n)).toBe(true);
		expect(chain.isForkBlock(999_999n)).toBe(true);
		expect(chain.isForkBlock(1_000_001n)).toBe(false);

		chain.destroy();
		expect(sim.destroyedChains).toHaveLength(1);
		expect(sim.destroyedForkCaches).toHaveLength(1);
	});

	it("stays in local-only mode if rpcClient is provided without forkBlockNumber", () => {
		const sim = createBlockchainFFISimulator();
		const rpcClient: RpcClient = {
			getBlockByNumber: vi.fn(async () => null),
			getBlockByHash: vi.fn(async () => null),
		};

		const chain = new Blockchain({ ffi: sim.ffi, rpcClient });
		expect(sim.forkCaches.size).toBe(0);
		expect(chain.isForkBlock(0n)).toBe(false);
		chain.destroy();
	});

	it("throws when blockchain_create or fork_block_cache_create returns null", () => {
		const sim = createBlockchainFFISimulator();
		sim.ffi.blockchain_create = () => null;
		expect(() => new Blockchain({ ffi: sim.ffi })).toThrow(
			"Failed to create Blockchain",
		);

		const rpcClient: RpcClient = {
			getBlockByNumber: vi.fn(async () => null),
			getBlockByHash: vi.fn(async () => null),
		};
		sim.ffi.fork_block_cache_create = () => null;
		expect(
			() =>
				new Blockchain({
					ffi: sim.ffi,
					rpcClient,
					forkBlockNumber: 100n,
				}),
		).toThrow("Failed to create fork block cache");
	});

	it("destroys fork cache if blockchain_create_with_fork fails", () => {
		const sim = createBlockchainFFISimulator();
		const rpcClient: RpcClient = {
			getBlockByNumber: vi.fn(async () => null),
			getBlockByHash: vi.fn(async () => null),
		};
		sim.ffi.blockchain_create_with_fork = () => null;

		expect(
			() =>
				new Blockchain({
					ffi: sim.ffi,
					rpcClient,
					forkBlockNumber: 100n,
				}),
		).toThrow("Failed to create Blockchain with fork");
		expect(sim.destroyedForkCaches).toHaveLength(1);
		expect(sim.forkCaches.size).toBe(0);
	});
});

describe("Blockchain block storage, serialization, and lookups", () => {
	it("round-trips full post-Cancun block with all optional fields", async () => {
		const sim = createBlockchainFFISimulator();
		const chain = new Blockchain({ ffi: sim.ffi });

		const fullBlock = makeBlock({
			hash: makeHash("aa"),
			parentHash: ZERO_HASH,
			number: 0n,
			difficulty: 17_179_869_184n,
			gasLimit: 30_000_000n,
			gasUsed: 12_345_678n,
			timestamp: 1_710_338_135n,
			extraData: "0x766f6c7461697265" as Hex,
			nonce: 66n,
			baseFeePerGas: 15_000_000_000n,
			withdrawalsRoot: makeHash("77"),
			blobGasUsed: 393_216n,
			excessBlobGas: 131_072n,
			parentBeaconBlockRoot: makeHash("88"),
			totalDifficulty: 58_750_003_716_598_352_816_469n,
		});

		await chain.putBlock(fullBlock);
		expect(chain.hasBlock(fullBlock.hash)).toBe(true);
		expect(chain.hasBlock(makeHash("ff"))).toBe(false);

		const fetched = await chain.getBlockByHash(fullBlock.hash);
		expect(fetched).toEqual(fullBlock);

		chain.destroy();
	});

	it("preserves undefined optional fields on pre-London blocks", async () => {
		const sim = createBlockchainFFISimulator();
		const chain = new Blockchain({ ffi: sim.ffi });

		const legacyBlock = makeBlock({
			hash: makeHash("01"),
			parentHash: ZERO_HASH,
			number: 0n,
		});

		await chain.putBlock(legacyBlock);
		const fetched = await chain.getBlockByHash(legacyBlock.hash);
		expect(fetched?.baseFeePerGas).toBeUndefined();
		expect(fetched?.withdrawalsRoot).toBeUndefined();
		expect(fetched?.blobGasUsed).toBeUndefined();
		expect(fetched?.excessBlobGas).toBeUndefined();
		expect(fetched?.parentBeaconBlockRoot).toBeUndefined();
		expect(fetched?.totalDifficulty).toBeUndefined();

		chain.destroy();
	});

	it("returns null for missing blocks, hashes, and empty chain head", async () => {
		const sim = createBlockchainFFISimulator();
		const chain = new Blockchain({ ffi: sim.ffi });

		expect(await chain.getHeadBlockNumber()).toBeNull();
		expect(await chain.getBlockByHash(makeHash("99"))).toBeNull();
		expect(await chain.getBlockByNumber(0n)).toBeNull();
		expect(await chain.getCanonicalHash(0n)).toBeNull();

		chain.destroy();
	});

	it("rejects non-32-byte block hashes across hash-taking methods", async () => {
		const sim = createBlockchainFFISimulator();
		const chain = new Blockchain({ ffi: sim.ffi });
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

		chain.destroy();
	});
});

describe("Blockchain canonical chain, orphans, and reorgs", () => {
	it("tracks canonical progression, orphan resolution, and rejects orphan heads", async () => {
		const sim = createBlockchainFFISimulator();
		const chain = new Blockchain({ ffi: sim.ffi });

		const b0 = makeBlock({
			hash: makeHash("a0"),
			parentHash: ZERO_HASH,
			number: 0n,
		});
		const b1 = makeBlock({
			hash: makeHash("a1"),
			parentHash: b0.hash,
			number: 1n,
		});
		const b2 = makeBlock({
			hash: makeHash("a2"),
			parentHash: b1.hash,
			number: 2n,
		});

		// Put genesis and b2 before b1 -> b2 is an orphan
		await chain.putBlock(b0);
		await chain.putBlock(b2);
		expect(chain.localBlockCount()).toBe(2);
		expect(chain.orphanCount()).toBe(1);

		await expect(chain.setCanonicalHead(b2.hash)).rejects.toThrow(
			"Cannot set orphan block as head",
		);
		await expect(chain.setCanonicalHead(makeHash("ee"))).rejects.toThrow(
			"Block not found",
		);

		// Putting b1 resolves orphan b2
		await chain.putBlock(b1);
		expect(chain.localBlockCount()).toBe(3);
		expect(chain.orphanCount()).toBe(0);

		await chain.setCanonicalHead(b2.hash);
		expect(await chain.getHeadBlockNumber()).toBe(2n);
		expect(chain.canonicalChainLength()).toBe(3);
		expect(await chain.getCanonicalHash(0n)).toBe(b0.hash);
		expect(await chain.getCanonicalHash(1n)).toBe(b1.hash);
		expect(await chain.getCanonicalHash(2n)).toBe(b2.hash);
		expect((await chain.getBlockByNumber(1n))?.hash).toBe(b1.hash);

		chain.destroy();
	});

	it("reorganizes canonical chain onto a heavier competing fork while retaining old blocks by hash", async () => {
		const sim = createBlockchainFFISimulator();
		const chain = new Blockchain({ ffi: sim.ffi });

		const genesis = makeBlock({
			hash: makeHash("00"),
			parentHash: ZERO_HASH,
			number: 0n,
		});
		const a1 = makeBlock({
			hash: makeHash("a1"),
			parentHash: genesis.hash,
			number: 1n,
		});
		const a2 = makeBlock({
			hash: makeHash("a2"),
			parentHash: a1.hash,
			number: 2n,
		});

		const b1 = makeBlock({
			hash: makeHash("b1"),
			parentHash: genesis.hash,
			number: 1n,
		});
		const b2 = makeBlock({
			hash: makeHash("b2"),
			parentHash: b1.hash,
			number: 2n,
		});
		const b3 = makeBlock({
			hash: makeHash("b3"),
			parentHash: b2.hash,
			number: 3n,
		});

		for (const blk of [genesis, a1, a2]) {
			await chain.putBlock(blk);
		}
		await chain.setCanonicalHead(a2.hash);
		expect(await chain.getHeadBlockNumber()).toBe(2n);
		expect(await chain.getCanonicalHash(2n)).toBe(a2.hash);

		// Add fork B and reorg canonical head to b3
		for (const blk of [b1, b2, b3]) {
			await chain.putBlock(blk);
		}
		await chain.setCanonicalHead(b3.hash);

		expect(await chain.getHeadBlockNumber()).toBe(3n);
		expect(chain.canonicalChainLength()).toBe(4);
		expect(chain.localBlockCount()).toBe(6);
		expect(await chain.getCanonicalHash(0n)).toBe(genesis.hash);
		expect(await chain.getCanonicalHash(1n)).toBe(b1.hash);
		expect(await chain.getCanonicalHash(2n)).toBe(b2.hash);
		expect(await chain.getCanonicalHash(3n)).toBe(b3.hash);
		expect((await chain.getBlockByNumber(2n))?.hash).toBe(b2.hash);

		// Old fork block remains accessible by hash
		expect((await chain.getBlockByHash(a2.hash))?.hash).toBe(a2.hash);

		chain.destroy();
	});
});

describe("Blockchain fork mode async RPC continuations & error paths", () => {
	it("fetches blocks by number and hash via EIP-1193 Provider on RPC_PENDING", async () => {
		const sim = createBlockchainFFISimulator();
		const remote5 = makeBlock({
			hash: makeHash("55"),
			parentHash: makeHash("44"),
			number: 5n,
		});
		const remoteJson = JSON.parse(
			new TextDecoder().decode(serializeRawBlockJson(remote5)),
		);

		const provider: Provider = {
			request: vi.fn(async ({ method, params }) => {
				if (method === "eth_getBlockByNumber" && Array.isArray(params)) {
					return params[0] === "0x5" ? remoteJson : null;
				}
				if (method === "eth_getBlockByHash" && Array.isArray(params)) {
					return params[0] === remote5.hash ? remoteJson : null;
				}
				return null;
			}),
			on: () => provider,
			removeListener: () => provider,
		};

		const chain = new Blockchain({
			ffi: sim.ffi,
			rpcClient: provider,
			forkBlockNumber: 10n,
		});

		const fetchedByNum = await chain.getBlockByNumber(5n);
		expect(fetchedByNum).toEqual(remote5);

		// Missing block above fork boundary returns null without RPC
		expect(await chain.getBlockByNumber(11n)).toBeNull();

		// Fetch different block by hash via provider
		const remoteHashBlock = makeBlock({
			hash: makeHash("66"),
			parentHash: remote5.hash,
			number: 6n,
		});
		const remoteHashJson = JSON.parse(
			new TextDecoder().decode(serializeRawBlockJson(remoteHashBlock)),
		);
		(provider.request as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
			remoteHashJson,
		);
		const fetchedByHash = await chain.getBlockByHash(remoteHashBlock.hash);
		expect(fetchedByHash).toEqual(remoteHashBlock);

		chain.destroy();
	});

	it("fetches forked blocks via RpcClient including latest/pending tags and buffer resizing", async () => {
		const sim = createBlockchainFFISimulator();
		const forkHead = makeBlock({
			hash: makeHash("77"),
			parentHash: makeHash("76"),
			number: 50n,
		});
		const forkHeadPlain = JSON.parse(
			new TextDecoder().decode(serializeRawBlockJson(forkHead)),
		);

		const getBlockByNumber = vi.fn(async () => forkHeadPlain);
		const getBlockByHash = vi.fn(async () => forkHeadPlain);
		const rpcClient: RpcClient = { getBlockByNumber, getBlockByHash };

		const chain = new Blockchain({
			ffi: sim.ffi,
			rpcClient,
			forkBlockNumber: 50n,
		});

		// Resolve normal eth_getBlockByNumber
		const b50 = await chain.getBlockByNumber(50n);
		expect(b50?.hash).toBe(forkHead.hash);
		expect(getBlockByNumber).toHaveBeenCalledWith(50n);

		// Exercise latest/pending tag + OUTPUT_TOO_SMALL buffer resize for params > 8192 bytes
		const [cacheHandle] = Array.from(sim.forkCaches.keys());
		const cache =
			cacheHandle !== undefined ? sim.forkCaches.get(cacheHandle) : null;
		const origGetByHash = sim.ffi.blockchain_get_block_by_hash;
		let injectLarge = true;
		sim.ffi.blockchain_get_block_by_hash = (h, hashPtr, out) => {
			if (injectLarge && cache) {
				injectLarge = false;
				cache.pending.push({
					requestId: 500n,
					method: "eth_getBlockByNumber",
					params: ["latest", false, "z".repeat(9000)],
					onResponse: () => {},
				});
				return BLOCKCHAIN_ERROR_RPC_PENDING;
			}
			return origGetByHash(h, hashPtr, out);
		};

		const resolved = await chain.getBlockByHash(forkHead.hash);
		expect(resolved?.hash).toBe(forkHead.hash);
		expect(getBlockByNumber).toHaveBeenLastCalledWith(50n);

		chain.destroy();
	});

	it("throws descriptive errors on unsupported fork methods, FFI failures, and retry exhaustion", async () => {
		const sim = createBlockchainFFISimulator();
		const rpcClient: RpcClient = {
			getBlockByNumber: vi.fn(async () => null),
			getBlockByHash: vi.fn(async () => null),
		};

		const chain = new Blockchain({
			ffi: sim.ffi,
			rpcClient,
			forkBlockNumber: 10n,
		});
		const [cacheHandle] = Array.from(sim.forkCaches.keys());
		const cache =
			cacheHandle !== undefined ? sim.forkCaches.get(cacheHandle) : null;

		// Unsupported method
		sim.ffi.blockchain_get_block_by_number = () => {
			cache?.pending.push({
				requestId: 1n,
				method: "eth_getUncleByBlockNumberAndIndex",
				params: [],
				onResponse: () => {},
			});
			return BLOCKCHAIN_ERROR_RPC_PENDING;
		};
		await expect(chain.getBlockByNumber(1n)).rejects.toThrow(
			"Unsupported fork method: eth_getUncleByBlockNumberAndIndex",
		);
		if (cache) cache.pending.length = 0;

		// fork_block_cache_next_request failure
		const origNext = sim.ffi.fork_block_cache_next_request;
		sim.ffi.fork_block_cache_next_request = () =>
			BLOCKCHAIN_ERROR_INVALID_INPUT;
		await expect(chain.getBlockByNumber(1n)).rejects.toThrow(
			`fork_block_cache_next_request failed: ${BLOCKCHAIN_ERROR_INVALID_INPUT}`,
		);
		sim.ffi.fork_block_cache_next_request = origNext;
		if (cache) cache.pending.length = 0;

		// fork_block_cache_continue failure
		const origContinue = sim.ffi.fork_block_cache_continue;
		sim.ffi.blockchain_get_block_by_hash = () => {
			cache?.pending.push({
				requestId: 2n,
				method: "eth_getBlockByHash",
				params: [makeHash("11")],
				onResponse: () => {},
			});
			return BLOCKCHAIN_ERROR_RPC_PENDING;
		};
		sim.ffi.fork_block_cache_continue = () => BLOCKCHAIN_ERROR_INVALID_REQUEST;
		await expect(chain.getBlockByHash(makeHash("11"))).rejects.toThrow(
			`fork_block_cache_continue failed: ${BLOCKCHAIN_ERROR_INVALID_REQUEST}`,
		);
		sim.ffi.fork_block_cache_continue = origContinue;
		if (cache) cache.pending.length = 0;

		// Retry exhaustion (>10 RPC_PENDING)
		sim.ffi.blockchain_get_block_by_hash = () => BLOCKCHAIN_ERROR_RPC_PENDING;
		await expect(chain.getBlockByHash(makeHash("11"))).rejects.toThrow(
			"Failed to resolve forked block by hash",
		);

		sim.ffi.blockchain_get_block_by_number = () => BLOCKCHAIN_ERROR_RPC_PENDING;
		await expect(chain.getBlockByNumber(1n)).rejects.toThrow(
			"Failed to resolve forked block by number",
		);

		// Unexpected FFI error codes on all operations
		sim.ffi.blockchain_get_block_by_hash = () => BLOCKCHAIN_ERROR_OUT_OF_MEMORY;
		await expect(chain.getBlockByHash(makeHash("11"))).rejects.toThrow(
			`Failed to get block by hash: error ${BLOCKCHAIN_ERROR_OUT_OF_MEMORY}`,
		);

		sim.ffi.blockchain_get_block_by_number = () =>
			BLOCKCHAIN_ERROR_INVALID_INPUT;
		await expect(chain.getBlockByNumber(1n)).rejects.toThrow(
			`Failed to get block by number: error ${BLOCKCHAIN_ERROR_INVALID_INPUT}`,
		);

		sim.ffi.blockchain_get_canonical_hash = () => BLOCKCHAIN_ERROR_INVALID_HASH;
		await expect(chain.getCanonicalHash(1n)).rejects.toThrow(
			`Failed to get canonical hash: error ${BLOCKCHAIN_ERROR_INVALID_HASH}`,
		);

		sim.ffi.blockchain_get_head_block_number = () =>
			BLOCKCHAIN_ERROR_OUT_OF_MEMORY;
		await expect(chain.getHeadBlockNumber()).rejects.toThrow(
			`Failed to get head block number: error ${BLOCKCHAIN_ERROR_OUT_OF_MEMORY}`,
		);

		sim.ffi.blockchain_put_block = () => BLOCKCHAIN_ERROR_INVALID_PARENT;
		await expect(
			chain.putBlock(
				makeBlock({ hash: makeHash("cc"), parentHash: ZERO_HASH, number: 0n }),
			),
		).rejects.toThrow(
			`Failed to put block: error ${BLOCKCHAIN_ERROR_INVALID_PARENT}`,
		);

		sim.ffi.blockchain_set_canonical_head = () =>
			BLOCKCHAIN_ERROR_INVALID_INPUT;
		await expect(chain.setCanonicalHead(makeHash("cc"))).rejects.toThrow(
			`Failed to set canonical head: error ${BLOCKCHAIN_ERROR_INVALID_INPUT}`,
		);

		// Processing limit (>1000 requests in single cycle)
		let seq = 1n;
		sim.ffi.blockchain_get_block_by_number = () => BLOCKCHAIN_ERROR_RPC_PENDING;
		sim.ffi.fork_block_cache_next_request = (
			_h,
			outId,
			outMethod,
			_mLen,
			outMLen,
			outParams,
			_pLen,
			outPLen,
		) => {
			const m = new TextEncoder().encode("eth_getBlockByHash");
			const p = new TextEncoder().encode(JSON.stringify([makeHash("11")]));
			outId[0] = seq++;
			outMethod.set(m, 0);
			outMLen[0] = BigInt(m.length);
			outParams.set(p, 0);
			outPLen[0] = BigInt(p.length);
			return BLOCKCHAIN_SUCCESS;
		};
		sim.ffi.fork_block_cache_continue = () => BLOCKCHAIN_SUCCESS;
		await expect(chain.getBlockByNumber(1n)).rejects.toThrow(
			"Exceeded fork block request processing limit",
		);

		chain.destroy();
	});
});
