/**
 * Blockchain TypeScript FFI Bindings
 *
 * Wraps Zig Blockchain implementation with async request/continue support.
 * Manages block storage, fork cache, and canonical chain.
 *
 * @module blockchain/Blockchain
 */
import * as HexUtils from "../../primitives/Hex/index.js";
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
    handle;
    forkCacheHandle = null;
    ffi;
    rpcClient = null;
    rpcProvider = null;
    forkBlockNumber = null;
    constructor(options) {
        this.ffi = options.ffi;
        this.forkBlockNumber =
            options.forkBlockNumber !== undefined ? options.forkBlockNumber : null;
        if (options.rpcClient && "request" in options.rpcClient) {
            this.rpcProvider = options.rpcClient;
        }
        else if (options.rpcClient) {
            this.rpcClient = options.rpcClient;
        }
        // Create fork cache if RPC client provided
        if (options.rpcClient && options.forkBlockNumber !== undefined) {
            this.forkCacheHandle = this.ffi.fork_block_cache_create(0n, // rpcContext unused (async request/continue handles RPC)
            0n, 0n, options.forkBlockNumber);
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
        }
        else {
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
    destroy() {
        this.ffi.blockchain_destroy(this.handle);
        if (this.forkCacheHandle) {
            this.ffi.fork_block_cache_destroy(this.forkCacheHandle);
        }
    }
    async processForkRequests() {
        if (!this.forkCacheHandle)
            return;
        const decoder = new TextDecoder();
        for (let i = 0; i < 1000; i++) {
            const request = this.readForkRequest(decoder);
            if (!request) {
                return;
            }
            const response = await this.executeForkRequest(request.method, request.params);
            const responseBytes = new TextEncoder().encode(JSON.stringify(response));
            const continueResult = this.ffi.fork_block_cache_continue(this.forkCacheHandle, request.requestId, responseBytes, responseBytes.length);
            if (continueResult !== BLOCKCHAIN_SUCCESS) {
                throw new Error(`fork_block_cache_continue failed: ${continueResult}`);
            }
        }
        throw new Error("Exceeded fork block request processing limit");
    }
    readForkRequest(decoder) {
        if (!this.forkCacheHandle)
            return null;
        let methodBuf = new Uint8Array(64);
        let paramsBuf = new Uint8Array(8192);
        const methodLen = new BigUint64Array(1);
        const paramsLen = new BigUint64Array(1);
        const requestId = new BigUint64Array(1);
        let result = this.ffi.fork_block_cache_next_request(this.forkCacheHandle, requestId, methodBuf, methodBuf.length, methodLen, paramsBuf, paramsBuf.length, paramsLen);
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
            result = this.ffi.fork_block_cache_next_request(this.forkCacheHandle, requestId, methodBuf, methodBuf.length, methodLen, paramsBuf, paramsBuf.length, paramsLen);
        }
        if (result !== BLOCKCHAIN_SUCCESS) {
            throw new Error(`fork_block_cache_next_request failed: ${result}`);
        }
        const method = decoder.decode(methodBuf.subarray(0, Number(methodLen[0])));
        const params = JSON.parse(decoder.decode(paramsBuf.subarray(0, Number(paramsLen[0]))));
        return {
            requestId: requestId[0] ?? 0n,
            method,
            params,
        };
    }
    async executeForkRequest(method, params) {
        if (this.rpcProvider) {
            return this.rpcProvider.request({ method, params });
        }
        if (!this.rpcClient) {
            throw new Error("Fork RPC client not configured");
        }
        if (method === "eth_getBlockByNumber") {
            const [blockTag, fullTx] = params;
            const number = blockTag === "latest" || blockTag === "pending"
                ? (this.forkBlockNumber ?? 0n)
                : BigInt(blockTag);
            const result = await this.rpcClient.getBlockByNumber(number);
            if (fullTx)
                return result;
            return result;
        }
        if (method === "eth_getBlockByHash") {
            const [hash] = params;
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
    async getBlockByHash(hash) {
        const hashBytes = HexUtils.toBytes(hash);
        if (hashBytes.length !== 32) {
            throw new Error("Invalid block hash length");
        }
        const blockDataBuffer = new Uint8Array(4096);
        for (let attempt = 0; attempt < 10; attempt++) {
            const result = this.ffi.blockchain_get_block_by_hash(this.handle, hashBytes, blockDataBuffer);
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
    async getBlockByNumber(number) {
        // Allocate BlockData buffer
        const blockDataBuffer = new Uint8Array(4096);
        for (let attempt = 0; attempt < 10; attempt++) {
            const result = this.ffi.blockchain_get_block_by_number(this.handle, number, blockDataBuffer);
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
    async getCanonicalHash(number) {
        const hashBuffer = new Uint8Array(32);
        const result = this.ffi.blockchain_get_canonical_hash(this.handle, number, hashBuffer);
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
    async getHeadBlockNumber() {
        const outBuffer = new BigUint64Array(1);
        const result = this.ffi.blockchain_get_head_block_number(this.handle, outBuffer);
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
    async putBlock(block) {
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
    async setCanonicalHead(hash) {
        const hashBytes = HexUtils.toBytes(hash);
        if (hashBytes.length !== 32) {
            throw new Error("Invalid block hash length");
        }
        const result = this.ffi.blockchain_set_canonical_head(this.handle, hashBytes);
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
    hasBlock(hash) {
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
    localBlockCount() {
        return this.ffi.blockchain_local_block_count(this.handle);
    }
    /**
     * Get orphan count in local storage
     */
    orphanCount() {
        return this.ffi.blockchain_orphan_count(this.handle);
    }
    /**
     * Get canonical chain length
     */
    canonicalChainLength() {
        return this.ffi.blockchain_canonical_chain_length(this.handle);
    }
    /**
     * Check if block number is within fork boundary
     */
    isForkBlock(number) {
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
    serializeBlock(block) {
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
    deserializeBlock(buffer) {
        // For now, use JSON deserialization as placeholder
        // Real implementation should read binary struct layout matching c_api.zig BlockData
        const nullIndex = buffer.indexOf(0);
        const slice = nullIndex === -1 ? buffer : buffer.subarray(0, nullIndex);
        const json = new TextDecoder().decode(slice);
        const obj = JSON.parse(json);
        return {
            hash: obj.hash,
            parentHash: obj.parentHash,
            ommersHash: obj.ommersHash,
            beneficiary: obj.beneficiary,
            stateRoot: obj.stateRoot,
            transactionsRoot: obj.transactionsRoot,
            receiptsRoot: obj.receiptsRoot,
            logsBloom: obj.logsBloom,
            difficulty: BigInt(obj.difficulty),
            number: BigInt(obj.number),
            gasLimit: BigInt(obj.gasLimit),
            gasUsed: BigInt(obj.gasUsed),
            timestamp: BigInt(obj.timestamp),
            extraData: obj.extraData,
            mixHash: obj.mixHash,
            nonce: BigInt(obj.nonce),
            baseFeePerGas: obj.baseFeePerGas ? BigInt(obj.baseFeePerGas) : undefined,
            withdrawalsRoot: obj.withdrawalsRoot
                ? obj.withdrawalsRoot
                : undefined,
            blobGasUsed: obj.blobGasUsed ? BigInt(obj.blobGasUsed) : undefined,
            excessBlobGas: obj.excessBlobGas ? BigInt(obj.excessBlobGas) : undefined,
            parentBeaconBlockRoot: obj.parentBeaconBlockRoot
                ? obj.parentBeaconBlockRoot
                : undefined,
            transactions: obj.transactions,
            ommers: obj.ommers,
            withdrawals: obj.withdrawals,
            size: BigInt(obj.size),
            totalDifficulty: obj.totalDifficulty
                ? BigInt(obj.totalDifficulty)
                : undefined,
        };
    }
}
