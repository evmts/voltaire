/**
 * Blockchain TypeScript FFI Bindings
 *
 * Wraps Zig Blockchain implementation with async request/continue support.
 * Manages block storage, fork cache, and canonical chain.
 *
 * @module blockchain/Blockchain
 */
import type { Hex } from "../../primitives/Hex/HexType.js";
import type { Provider } from "../../provider/Provider.js";
/**
 * Block structure (simplified TypeScript representation)
 */
export interface Block {
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
    transactions: Hex;
    ommers: Hex;
    withdrawals: Hex;
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
    blockchain_create(): bigint | null;
    blockchain_create_with_fork(forkCache: bigint): bigint | null;
    blockchain_destroy(handle: bigint): void;
    fork_block_cache_create(rpcContext: bigint, vtableFetchByNumber: bigint, vtableFetchByHash: bigint, forkBlockNumber: bigint): bigint | null;
    fork_block_cache_destroy(handle: bigint): void;
    fork_block_cache_next_request(handle: bigint, outRequestId: BigUint64Array, outMethod: Uint8Array, methodBufLen: number, outMethodLen: BigUint64Array, outParams: Uint8Array, paramsBufLen: number, outParamsLen: BigUint64Array): number;
    fork_block_cache_continue(handle: bigint, requestId: bigint, responsePtr: Uint8Array, responseLen: number): number;
    blockchain_get_block_by_hash(handle: bigint, blockHashPtr: Uint8Array, outBlockData: Uint8Array): number;
    blockchain_get_block_by_number(handle: bigint, number: bigint, outBlockData: Uint8Array): number;
    blockchain_get_canonical_hash(handle: bigint, number: bigint, outHash: Uint8Array): number;
    blockchain_get_head_block_number(handle: bigint, outNumber: BigUint64Array): number;
    blockchain_put_block(handle: bigint, blockData: Uint8Array): number;
    blockchain_set_canonical_head(handle: bigint, blockHashPtr: Uint8Array): number;
    blockchain_has_block(handle: bigint, blockHashPtr: Uint8Array): boolean;
    blockchain_local_block_count(handle: bigint): number;
    blockchain_orphan_count(handle: bigint): number;
    blockchain_canonical_chain_length(handle: bigint): number;
    blockchain_is_fork_block(handle: bigint, number: bigint): boolean;
}
/**
 * Error codes from c_api.zig
 */
export declare const BLOCKCHAIN_SUCCESS = 0;
export declare const BLOCKCHAIN_ERROR_INVALID_INPUT = -1;
export declare const BLOCKCHAIN_ERROR_OUT_OF_MEMORY = -2;
export declare const BLOCKCHAIN_ERROR_BLOCK_NOT_FOUND = -3;
export declare const BLOCKCHAIN_ERROR_INVALID_PARENT = -4;
export declare const BLOCKCHAIN_ERROR_ORPHAN_HEAD = -5;
export declare const BLOCKCHAIN_ERROR_INVALID_HASH = -6;
export declare const BLOCKCHAIN_ERROR_RPC_PENDING = -7;
export declare const BLOCKCHAIN_ERROR_NO_PENDING_REQUEST = -8;
export declare const BLOCKCHAIN_ERROR_OUTPUT_TOO_SMALL = -9;
export declare const BLOCKCHAIN_ERROR_INVALID_REQUEST = -10;
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
export declare class Blockchain {
    private handle;
    private forkCacheHandle;
    private ffi;
    private rpcClient;
    private rpcProvider;
    private forkBlockNumber;
    constructor(options: BlockchainOptions);
    /**
     * Cleanup resources
     */
    destroy(): void;
    private processForkRequests;
    private readForkRequest;
    private executeForkRequest;
    /**
     * Get block by hash
     */
    getBlockByHash(hash: Hex): Promise<Block | null>;
    /**
     * Get block by number (canonical chain)
     */
    getBlockByNumber(number: bigint): Promise<Block | null>;
    /**
     * Get canonical hash for block number
     */
    getCanonicalHash(number: bigint): Promise<Hex | null>;
    /**
     * Get current head block number
     */
    getHeadBlockNumber(): Promise<bigint | null>;
    /**
     * Put block in local storage
     */
    putBlock(block: Block): Promise<void>;
    /**
     * Set canonical head (makes block and ancestors canonical)
     */
    setCanonicalHead(hash: Hex): Promise<void>;
    /**
     * Check if block exists (local or fork cache)
     */
    hasBlock(hash: Hex): boolean;
    /**
     * Get total blocks in local storage
     */
    localBlockCount(): number;
    /**
     * Get orphan count in local storage
     */
    orphanCount(): number;
    /**
     * Get canonical chain length
     */
    canonicalChainLength(): number;
    /**
     * Check if block number is within fork boundary
     */
    isForkBlock(number: bigint): boolean;
    /**
     * Serialize Block to BlockData buffer for FFI transfer
     * NOTE: This is a simplified implementation
     * Production code should use proper struct serialization
     */
    private serializeBlock;
    /**
     * Deserialize BlockData buffer to Block
     * NOTE: This is a simplified implementation
     * Production code should use proper struct deserialization
     */
    private deserializeBlock;
}
//# sourceMappingURL=index.d.ts.map