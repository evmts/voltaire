/**
 * Blockchain TypeScript FFI Bindings
 *
 * Wraps Zig Blockchain implementation with async request/continue support.
 * Manages block storage, fork cache, and canonical chain.
 *
 * @module blockchain/Blockchain
 */

import type { Hex } from "../../primitives/Hex/HexType.js";
import * as HexUtils from "../../primitives/Hex/index.js";
import type { Provider } from "../../provider/Provider.js";

/**
 * Block structure (simplified TypeScript representation)
 */
export interface Block {
	// Header
	hash: Hex;
	parentHash: Hex;
	ommersHash: Hex;
	beneficiary: Hex;
	stateRoot: Hex;
	transactionsRoot: Hex;
	receiptsRoot: Hex;
	logsBloom: Hex;
	difficulty: bigint;
	number: bigint;
	gasLimit: bigint;
	gasUsed: bigint;
	timestamp: bigint;
	extraData: Hex;
	mixHash: Hex;
	nonce: bigint;
	baseFeePerGas?: bigint;
	withdrawalsRoot?: Hex;
	blobGasUsed?: bigint;
	excessBlobGas?: bigint;
	parentBeaconBlockRoot?: Hex;

	// Body (RLP-encoded for FFI transfer)
	transactions: Hex;
	ommers: Hex;
	withdrawals: Hex;

	// Metadata
	size: bigint;
	totalDifficulty?: bigint;
}

/**
 * BlockData struct matching c_api.zig extern struct
 * Used for FFI transfer (binary format)
 */

/**
 * FFI library exports (loaded from native or WASM)
 */
export interface BlockchainFFIExports {
	// Lifecycle
	blockchain_create(): bigint | null;
	blockchain_create_with_fork(forkCache: bigint): bigint | null;
	blockchain_destroy(handle: bigint): void;

	fork_block_cache_create(
		rpcContext: bigint,
		vtableFetchByNumber: bigint,
		vtableFetchByHash: bigint,
		forkBlockNumber: bigint,
	): bigint | null;
	fork_block_cache_destroy(handle: bigint): void;
	fork_block_cache_next_request(
		handle: bigint,
		outRequestId: BigUint64Array,
		outMethod: Uint8Array,
		methodBufLen: number,
		outMethodLen: BigUint64Array,
		outParams: Uint8Array,
		paramsBufLen: number,
		outParamsLen: BigUint64Array,
	): number;
	fork_block_cache_continue(
		handle: bigint,
		requestId: bigint,
		responsePtr: Uint8Array,
		responseLen: number,
	): number;

	// Block operations
	blockchain_get_block_by_hash(
		handle: bigint,
		blockHashPtr: Uint8Array,
		outBlockData: Uint8Array,
	): number;
	blockchain_get_block_by_number(
		handle: bigint,
		number: bigint,
		outBlockData: Uint8Array,
	): number;
	blockchain_get_canonical_hash(
		handle: bigint,
		number: bigint,
		outHash: Uint8Array,
	): number;
	blockchain_get_head_block_number(
		handle: bigint,
		outNumber: BigUint64Array,
	): number;
	blockchain_put_block(handle: bigint, blockData: Uint8Array): number;
	blockchain_set_canonical_head(
		handle: bigint,
		blockHashPtr: Uint8Array,
	): number;
	blockchain_has_block(handle: bigint, blockHashPtr: Uint8Array): boolean;

	// Statistics
	blockchain_local_block_count(handle: bigint): number;
	blockchain_orphan_count(handle: bigint): number;
	blockchain_canonical_chain_length(handle: bigint): number;
	blockchain_is_fork_block(handle: bigint, number: bigint): boolean;
}

/**
 * Error codes from c_api.zig
 */
export const BLOCKCHAIN_SUCCESS = 0;
export const BLOCKCHAIN_ERROR_INVALID_INPUT = -1;
export const BLOCKCHAIN_ERROR_OUT_OF_MEMORY = -2;
export const BLOCKCHAIN_ERROR_BLOCK_NOT_FOUND = -3;
export const BLOCKCHAIN_ERROR_INVALID_PARENT = -4;
export const BLOCKCHAIN_ERROR_ORPHAN_HEAD = -5;
export const BLOCKCHAIN_ERROR_INVALID_HASH = -6;
export const BLOCKCHAIN_ERROR_RPC_PENDING = -7;
export const BLOCKCHAIN_ERROR_NO_PENDING_REQUEST = -8;
export const BLOCKCHAIN_ERROR_OUTPUT_TOO_SMALL = -9;
export const BLOCKCHAIN_ERROR_INVALID_REQUEST = -10;

/**
 * RPC Client interface for fork mode
 */
export interface RpcClient {
	/**
	 * Fetch block by number
	 */
	getBlockByNumber(number: bigint): Promise<Block | null>;

	/**
	 * Fetch block by hash
	 */
	getBlockByHash(hash: Hex): Promise<Block | null>;
}

/**
 * Blockchain options
 */
export interface BlockchainOptions {
	/**
	 * Optional RPC client for fork mode
	 */
	rpcClient?: RpcClient | Provider;

	/**
	 * Fork block number (blocks ≤ this from remote)
	 */
	forkBlockNumber?: bigint;

	/**
	 * FFI exports (loaded from native-loader)
	 */
	ffi: BlockchainFFIExports;
}

/**
 * Blockchain TypeScript wrapper
 *
 * Manages Zig Blockchain instance for block storage and retrieval.
 * Supports fork mode with remote RPC fetching.
 *
 * @example
 * ```typescript
 * const blockchain = new Blockchain({
 *   rpcClient: new RpcClientAdapter(httpProvider),
 *   forkBlockNumber: 1000000n,
 *   ffi: ffiExports
 * });
 *
 * // Get blocks
 * const block = await blockchain.getBlockByNumber(12345n);
 * const head = await blockchain.getHeadBlockNumber();
 *
 * // Put blocks
 * await blockchain.putBlock(block);
 * await blockchain.setCanonicalHead(block.hash);
 *
 * // Statistics
 * const count = blockchain.localBlockCount();
 * ```
 */
export class Blockchain {
	private handle: bigint;
	private forkCacheHandle: bigint | null = null;
	private ffi: BlockchainFFIExports;
	private rpcClient: RpcClient | null = null;
	private rpcProvider: Provider | null = null;
	private forkBlockNumber: bigint | null = null;

	constructor(options: BlockchainOptions) {
		this.ffi = options.ffi;
		this.forkBlockNumber =
			options.forkBlockNumber !== undefined ? options.forkBlockNumber : null;

		if (options.rpcClient && "request" in options.rpcClient) {
			this.rpcProvider = options.rpcClient as Provider;
		} else if (options.rpcClient) {
			this.rpcClient = options.rpcClient as RpcClient;
		}

		// Create fork cache if RPC client provided
		if (options.rpcClient && options.forkBlockNumber !== undefined) {
			this.forkCacheHandle = this.ffi.fork_block_cache_create(
				0n, // rpcContext unused (async request/continue handles RPC)
				0n,
				0n,
				options.forkBlockNumber,
			);

			if (!this.forkCacheHandle) {
				throw new Error("Failed to create fork block cache");
			}

			// Create Blockchain with fork
			const handle = this.ffi.blockchain_create_with_fork(this.forkCacheHandle);
			if (!handle) {
				this.ffi.fork_block_cache_destroy(this.forkCacheHandle);
				throw new Error("Failed to create Blockchain with fork");
			}
			this.handle = handle;
		} else {
			// Create in-memory only Blockchain
			const handle = this.ffi.blockchain_create();
			if (!handle) {
				throw new Error("Failed to create Blockchain");
			}
			this.handle = handle;
		}
	}

	/**
	 * Cleanup resources
	 */
	destroy(): void {
		this.ffi.blockchain_destroy(this.handle);
		if (this.forkCacheHandle) {
			this.ffi.fork_block_cache_destroy(this.forkCacheHandle);
		}
	}

	private async processForkRequests(): Promise<void> {
		if (!this.forkCacheHandle) return;

		const decoder = new TextDecoder();
		for (let i = 0; i < 1000; i++) {
			const request = this.readForkRequest(decoder);
			if (!request) {
				return;
			}

			const response = await this.executeForkRequest(
				request.method,
				request.params,
			);
			const responseBytes = new TextEncoder().encode(JSON.stringify(response));

			const continueResult = this.ffi.fork_block_cache_continue(
				this.forkCacheHandle,
				request.requestId,
				responseBytes,
				responseBytes.length,
			);

			if (continueResult !== BLOCKCHAIN_SUCCESS) {
				throw new Error(`fork_block_cache_continue failed: ${continueResult}`);
			}
		}

		throw new Error("Exceeded fork block request processing limit");
	}

	private readForkRequest(
		decoder: TextDecoder,
	): { requestId: bigint; method: string; params: unknown[] } | null {
		if (!this.forkCacheHandle) return null;

		let methodBuf = new Uint8Array(64);
		let paramsBuf = new Uint8Array(8192);
		const methodLen = new BigUint64Array(1);
		const paramsLen = new BigUint64Array(1);
		const requestId = new BigUint64Array(1);

		let result = this.ffi.fork_block_cache_next_request(
			this.forkCacheHandle,
			requestId,
			methodBuf,
			methodBuf.length,
			methodLen,
			paramsBuf,
			paramsBuf.length,
			paramsLen,
		);

		if (result === BLOCKCHAIN_ERROR_NO_PENDING_REQUEST) {
			return null;
		}

		if (result === BLOCKCHAIN_ERROR_OUTPUT_TOO_SMALL) {
			const neededMethod = Number(methodLen[0]);
			const neededParams = Number(paramsLen[0]);
			if (neededMethod > methodBuf.length) {
				methodBuf = new Uint8Array(neededMethod);
			}
			if (neededParams > paramsBuf.length) {
				paramsBuf = new Uint8Array(neededParams);
			}
			result = this.ffi.fork_block_cache_next_request(
				this.forkCacheHandle,
				requestId,
				methodBuf,
				methodBuf.length,
				methodLen,
				paramsBuf,
				paramsBuf.length,
				paramsLen,
			);
		}

		if (result !== BLOCKCHAIN_SUCCESS) {
			throw new Error(`fork_block_cache_next_request failed: ${result}`);
		}

		const method = decoder.decode(
			methodBuf.subarray(0, Number(methodLen[0])),
		);
		const params = JSON.parse(
			decoder.decode(paramsBuf.subarray(0, Number(paramsLen[0]))),
		) as unknown[];

		return {
			requestId: requestId[0] ?? 0n,
			method,
			params,
		};
	}

	private async executeForkRequest(
		method: string,
		params: unknown[],
	): Promise<unknown> {
		if (this.rpcProvider) {
			return this.rpcProvider.request({ method, params });
		}

		if (!this.rpcClient) {
			throw new Error("Fork RPC client not configured");
		}

		if (method === "eth_getBlockByNumber") {
			const [blockTag, fullTx] = params as [string, boolean];
			const number =
				blockTag === "latest" || blockTag === "pending"
					? this.forkBlockNumber ?? 0n
					: BigInt(blockTag);
			const result = await this.rpcClient.getBlockByNumber(number);
			if (fullTx) return result;
			return result;
		}

		if (method === "eth_getBlockByHash") {
			const [hash] = params as [Hex];
			return this.rpcClient.getBlockByHash(hash);
		}

		throw new Error(`Unsupported fork method: ${method}`);
	}

	// ========================================================================
	// Block Operations
	// ========================================================================

	/**
	 * Get block by hash
	 */
	async getBlockByHash(hash: Hex): Promise<Block | null> {
		const hashBytes = HexUtils.toBytes(hash);
		if (hashBytes.length !== 32) {
			throw new Error("Invalid block hash length");
		}
		const blockDataBuffer = new Uint8Array(4096);

		for (let attempt = 0; attempt < 10; attempt++) {
			const result = this.ffi.blockchain_get_block_by_hash(
				this.handle,
				hashBytes,
				blockDataBuffer,
			);

			if (result === BLOCKCHAIN_SUCCESS) {
				return this.deserializeBlock(blockDataBuffer);
			}

			if (result === BLOCKCHAIN_ERROR_RPC_PENDING) {
				await this.processForkRequests();
				continue;
			}

			if (result === BLOCKCHAIN_ERROR_BLOCK_NOT_FOUND) {
				return null;
			}

			throw new Error(`Failed to get block by hash: error ${result}`);
		}

		throw new Error("Failed to resolve forked block by hash");
	}

	/**
	 * Get block by number (canonical chain)
	 */
	async getBlockByNumber(number: bigint): Promise<Block | null> {
		// Allocate BlockData buffer
		const blockDataBuffer = new Uint8Array(4096);

		for (let attempt = 0; attempt < 10; attempt++) {
			const result = this.ffi.blockchain_get_block_by_number(
				this.handle,
				number,
				blockDataBuffer,
			);

			if (result === BLOCKCHAIN_SUCCESS) {
				return this.deserializeBlock(blockDataBuffer);
			}

			if (result === BLOCKCHAIN_ERROR_RPC_PENDING) {
				await this.processForkRequests();
				continue;
			}

			if (result === BLOCKCHAIN_ERROR_BLOCK_NOT_FOUND) {
				return null;
			}

			throw new Error(`Failed to get block by number: error ${result}`);
		}

		throw new Error("Failed to resolve forked block by number");
	}

	/**
	 * Get canonical hash for block number
	 */
	async getCanonicalHash(number: bigint): Promise<Hex | null> {
		const hashBuffer = new Uint8Array(32);

		const result = this.ffi.blockchain_get_canonical_hash(
			this.handle,
			number,
			hashBuffer,
		);

		if (result === BLOCKCHAIN_ERROR_BLOCK_NOT_FOUND) {
			return null;
		}

		if (result !== BLOCKCHAIN_SUCCESS) {
			throw new Error(`Failed to get canonical hash: error ${result}`);
		}

		return HexUtils.fromBytes(hashBuffer);
	}

	/**
	 * Get current head block number
	 */
	async getHeadBlockNumber(): Promise<bigint | null> {
		const outBuffer = new BigUint64Array(1);

		const result = this.ffi.blockchain_get_head_block_number(
			this.handle,
			outBuffer,
		);

		if (result === BLOCKCHAIN_ERROR_BLOCK_NOT_FOUND) {
			return null;
		}

		if (result !== BLOCKCHAIN_SUCCESS) {
			throw new Error(`Failed to get head block number: error ${result}`);
		}

		const blockNumber = outBuffer[0];
		return blockNumber !== undefined ? blockNumber : null;
	}

	/**
	 * Put block in local storage
	 */
	async putBlock(block: Block): Promise<void> {
		// Serialize Block to BlockData
		const blockDataBuffer = this.serializeBlock(block);

		const result = this.ffi.blockchain_put_block(this.handle, blockDataBuffer);

		if (result !== BLOCKCHAIN_SUCCESS) {
			throw new Error(`Failed to put block: error ${result}`);
		}
	}

	/**
	 * Set canonical head (makes block and ancestors canonical)
	 */
	async setCanonicalHead(hash: Hex): Promise<void> {
		const hashBytes = HexUtils.toBytes(hash);
		if (hashBytes.length !== 32) {
			throw new Error("Invalid block hash length");
		}

		const result = this.ffi.blockchain_set_canonical_head(
			this.handle,
			hashBytes,
		);

		if (result !== BLOCKCHAIN_SUCCESS) {
			if (result === BLOCKCHAIN_ERROR_BLOCK_NOT_FOUND) {
				throw new Error("Block not found");
			}
			if (result === BLOCKCHAIN_ERROR_ORPHAN_HEAD) {
				throw new Error("Cannot set orphan block as head");
			}
			throw new Error(`Failed to set canonical head: error ${result}`);
		}
	}

	/**
	 * Check if block exists (local or fork cache)
	 */
	hasBlock(hash: Hex): boolean {
		const hashBytes = HexUtils.toBytes(hash);
		if (hashBytes.length !== 32) {
			throw new Error("Invalid block hash length");
		}

		return this.ffi.blockchain_has_block(this.handle, hashBytes);
	}

	// ========================================================================
	// Statistics
	// ========================================================================

	/**
	 * Get total blocks in local storage
	 */
	localBlockCount(): number {
		return this.ffi.blockchain_local_block_count(this.handle);
	}

	/**
	 * Get orphan count in local storage
	 */
	orphanCount(): number {
		return this.ffi.blockchain_orphan_count(this.handle);
	}

	/**
	 * Get canonical chain length
	 */
	canonicalChainLength(): number {
		return this.ffi.blockchain_canonical_chain_length(this.handle);
	}

	/**
	 * Check if block number is within fork boundary
	 */
	isForkBlock(number: bigint): boolean {
		return this.ffi.blockchain_is_fork_block(this.handle, number);
	}

	// ========================================================================
	// Serialization Helpers
	// ========================================================================

	/**
	 * Serialize Block to BlockData buffer for FFI transfer
	 * NOTE: This is a simplified implementation
	 * Production code should use proper struct serialization
	 */
	private serializeBlock(block: Block): Uint8Array {
		// For now, use JSON serialization as placeholder
		// Real implementation should use binary struct layout matching c_api.zig BlockData
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

	/**
	 * Deserialize BlockData buffer to Block
	 * NOTE: This is a simplified implementation
	 * Production code should use proper struct deserialization
	 */
	private deserializeBlock(buffer: Uint8Array): Block {
		// For now, use JSON deserialization as placeholder
		// Real implementation should read binary struct layout matching c_api.zig BlockData
		const nullIndex = buffer.indexOf(0);
		const slice = nullIndex === -1 ? buffer : buffer.subarray(0, nullIndex);
		const json = new TextDecoder().decode(slice);
		const obj = JSON.parse(json);

		return {
			hash: obj.hash as Hex,
			parentHash: obj.parentHash as Hex,
			ommersHash: obj.ommersHash as Hex,
			beneficiary: obj.beneficiary as Hex,
			stateRoot: obj.stateRoot as Hex,
			transactionsRoot: obj.transactionsRoot as Hex,
			receiptsRoot: obj.receiptsRoot as Hex,
			logsBloom: obj.logsBloom as Hex,
			difficulty: BigInt(obj.difficulty),
			number: BigInt(obj.number),
			gasLimit: BigInt(obj.gasLimit),
			gasUsed: BigInt(obj.gasUsed),
			timestamp: BigInt(obj.timestamp),
			extraData: obj.extraData as Hex,
			mixHash: obj.mixHash as Hex,
			nonce: BigInt(obj.nonce),
			baseFeePerGas: obj.baseFeePerGas ? BigInt(obj.baseFeePerGas) : undefined,
			withdrawalsRoot: obj.withdrawalsRoot ? (obj.withdrawalsRoot as Hex) : undefined,
			blobGasUsed: obj.blobGasUsed ? BigInt(obj.blobGasUsed) : undefined,
			excessBlobGas: obj.excessBlobGas ? BigInt(obj.excessBlobGas) : undefined,
			parentBeaconBlockRoot: obj.parentBeaconBlockRoot
				? (obj.parentBeaconBlockRoot as Hex)
				: undefined,
			transactions: obj.transactions as Hex,
			ommers: obj.ommers as Hex,
			withdrawals: obj.withdrawals as Hex,
			size: BigInt(obj.size),
			totalDifficulty: obj.totalDifficulty
				? BigInt(obj.totalDifficulty)
				: undefined,
		};
	}
}
