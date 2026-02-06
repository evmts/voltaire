/**
 * StateManager TypeScript FFI Bindings
 *
 * Wraps Zig StateManager implementation with async RPC support.
 * Manages pending requests for fork backend async operations.
 *
 * @module state-manager/StateManager
 */
import * as Address from "../../primitives/Address/index.js";
import * as HexUtils from "../../primitives/Hex/index.js";
/**
 * Error codes from c_api.zig
 */
export const STATE_MANAGER_SUCCESS = 0;
export const STATE_MANAGER_ERROR_INVALID_INPUT = -1;
export const STATE_MANAGER_ERROR_OUT_OF_MEMORY = -2;
export const STATE_MANAGER_ERROR_INVALID_SNAPSHOT = -3;
export const STATE_MANAGER_ERROR_RPC_FAILED = -4;
export const STATE_MANAGER_ERROR_INVALID_HEX = -5;
export const STATE_MANAGER_ERROR_RPC_PENDING = -6;
export const STATE_MANAGER_ERROR_NO_PENDING_REQUEST = -7;
export const STATE_MANAGER_ERROR_OUTPUT_TOO_SMALL = -8;
export const STATE_MANAGER_ERROR_INVALID_REQUEST = -9;
/**
 * StateManager TypeScript wrapper
 *
 * Manages Zig StateManager instance and provides async state operations.
 * Tracks pending RPC requests for fork backend continuations.
 *
 * @example
 * ```typescript
 * const manager = new StateManager({
 *   rpcClient: new RpcClientAdapter(httpProvider),
 *   forkBlockTag: '0x112a880',
 *   maxCacheSize: 10000,
 *   ffi: ffiExports
 * });
 *
 * // State operations
 * const balance = await manager.getBalance(address);
 * await manager.setBalance(address, 1000n);
 *
 * // Snapshots
 * const snapId = await manager.snapshot();
 * await manager.setBalance(address, 2000n);
 * await manager.revertToSnapshot(snapId);
 * ```
 */
export class StateManager {
    handle;
    forkBackendHandle = null;
    ffi;
    rpcClient = null;
    rpcProvider = null;
    forkBlockTag;
    maxCacheSize;
    constructor(options) {
        this.ffi = options.ffi;
        this.forkBlockTag = options.forkBlockTag ?? "latest";
        this.maxCacheSize = options.maxCacheSize ?? 10000;
        if (options.rpcClient && "request" in options.rpcClient) {
            this.rpcProvider = options.rpcClient;
        }
        else if (options.rpcClient) {
            this.rpcClient = options.rpcClient;
        }
        // Create fork backend if RPC client provided
        if (options.rpcClient) {
            this.forkBackendHandle = this.ffi.fork_backend_create(0n, // rpcClientPtr unused (async request/continue handles RPC)
            0n, this.encodeCString(this.forkBlockTag), this.maxCacheSize);
            if (!this.forkBackendHandle) {
                throw new Error("Failed to create fork backend");
            }
            // Create StateManager with fork
            const handle = this.ffi.state_manager_create_with_fork(this.forkBackendHandle);
            if (!handle) {
                this.ffi.fork_backend_destroy(this.forkBackendHandle);
                throw new Error("Failed to create StateManager with fork");
            }
            this.handle = handle;
        }
        else {
            // Create in-memory only StateManager
            const handle = this.ffi.state_manager_create();
            if (!handle) {
                throw new Error("Failed to create StateManager");
            }
            this.handle = handle;
        }
    }
    /**
     * Cleanup resources
     */
    destroy() {
        this.ffi.state_manager_destroy(this.handle);
        if (this.forkBackendHandle) {
            this.ffi.fork_backend_destroy(this.forkBackendHandle);
        }
    }
    /**
     * Encode string as null-terminated buffer for FFI
     * Workaround for Bun FFI cstring bug in 1.2.20
     */
    encodeCString(str) {
        return new TextEncoder().encode(`${str}\0`);
    }
    async processForkRequests() {
        if (!this.forkBackendHandle)
            return;
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        const buffers = this.createForkRequestBuffers();
        for (let i = 0; i < 1000; i++) {
            const request = this.readForkRequest(decoder, buffers);
            if (!request)
                return;
            const response = await this.executeForkRequest(request.method, request.params);
            const responseBytes = encoder.encode(JSON.stringify(response));
            const continueResult = this.ffi.fork_backend_continue(this.forkBackendHandle, request.requestId, responseBytes, responseBytes.length);
            if (continueResult !== STATE_MANAGER_SUCCESS) {
                throw new Error(`fork_backend_continue failed: ${continueResult}`);
            }
        }
        throw new Error("Exceeded fork request processing limit");
    }
    createForkRequestBuffers() {
        return {
            method: new Uint8Array(64),
            params: new Uint8Array(4096),
            methodLen: new BigUint64Array(1),
            paramsLen: new BigUint64Array(1),
            requestId: new BigUint64Array(1),
        };
    }
    readForkRequest(decoder, buffers) {
        if (!this.forkBackendHandle)
            return null;
        let result = this.ffi.fork_backend_next_request(this.forkBackendHandle, buffers.requestId, buffers.method, buffers.method.length, buffers.methodLen, buffers.params, buffers.params.length, buffers.paramsLen);
        if (result === STATE_MANAGER_ERROR_NO_PENDING_REQUEST) {
            return null;
        }
        if (result === STATE_MANAGER_ERROR_OUTPUT_TOO_SMALL) {
            const neededMethod = Number(buffers.methodLen[0]);
            const neededParams = Number(buffers.paramsLen[0]);
            if (neededMethod > buffers.method.length) {
                buffers.method = new Uint8Array(neededMethod);
            }
            if (neededParams > buffers.params.length) {
                buffers.params = new Uint8Array(neededParams);
            }
            result = this.ffi.fork_backend_next_request(this.forkBackendHandle, buffers.requestId, buffers.method, buffers.method.length, buffers.methodLen, buffers.params, buffers.params.length, buffers.paramsLen);
        }
        if (result !== STATE_MANAGER_SUCCESS) {
            throw new Error(`fork_backend_next_request failed: ${result}`);
        }
        const method = decoder.decode(buffers.method.subarray(0, Number(buffers.methodLen[0])));
        const params = JSON.parse(decoder.decode(buffers.params.subarray(0, Number(buffers.paramsLen[0]))));
        return {
            requestId: buffers.requestId[0] ?? 0n,
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
        if (method === "eth_getProof") {
            const [addressHex, slots, blockTag] = params;
            const proof = await this.rpcClient.getProof(Address.Address(addressHex), slots, blockTag);
            return {
                nonce: `0x${proof.nonce.toString(16)}`,
                balance: `0x${proof.balance.toString(16)}`,
                codeHash: proof.codeHash,
                storageHash: proof.storageRoot,
                storageProof: proof.storageProof,
            };
        }
        if (method === "eth_getCode") {
            const [addressHex, blockTag] = params;
            return this.rpcClient.getCode(Address.Address(addressHex), blockTag);
        }
        throw new Error(`Unsupported fork method: ${method}`);
    }
    // ========================================================================
    // State Operations
    // ========================================================================
    /**
     * Get account balance
     */
    async getBalance(address) {
        const addressHex = Address.toHex(address);
        const buffer = new Uint8Array(67); // "0x" + 64 hex + null
        for (let attempt = 0; attempt < 10; attempt++) {
            const result = this.ffi.state_manager_get_balance_sync(this.handle, this.encodeCString(addressHex), buffer, buffer.length);
            if (result === STATE_MANAGER_SUCCESS) {
                const nullIndex = buffer.indexOf(0);
                const hexString = new TextDecoder().decode(buffer.subarray(0, nullIndex));
                return BigInt(hexString);
            }
            if (result === STATE_MANAGER_ERROR_RPC_PENDING) {
                await this.processForkRequests();
                continue;
            }
            throw new Error(`Failed to get balance: error ${result}`);
        }
        throw new Error("Failed to resolve forked balance");
    }
    /**
     * Set account balance
     */
    async setBalance(address, balance) {
        const addressHex = Address.toHex(address);
        const balanceHex = `0x${balance.toString(16)}`;
        const result = this.ffi.state_manager_set_balance(this.handle, this.encodeCString(addressHex), this.encodeCString(balanceHex));
        if (result !== STATE_MANAGER_SUCCESS) {
            throw new Error(`Failed to set balance: error ${result}`);
        }
    }
    /**
     * Get account nonce
     */
    async getNonce(address) {
        const addressHex = Address.toHex(address);
        const outBuffer = new BigUint64Array(1);
        for (let attempt = 0; attempt < 10; attempt++) {
            const result = this.ffi.state_manager_get_nonce_sync(this.handle, this.encodeCString(addressHex), outBuffer);
            if (result === STATE_MANAGER_SUCCESS) {
                const nonce = outBuffer[0];
                if (nonce === undefined) {
                    throw new Error("Failed to read nonce from buffer");
                }
                return nonce;
            }
            if (result === STATE_MANAGER_ERROR_RPC_PENDING) {
                await this.processForkRequests();
                continue;
            }
            throw new Error(`Failed to get nonce: error ${result}`);
        }
        throw new Error("Failed to resolve forked nonce");
    }
    /**
     * Set account nonce
     */
    async setNonce(address, nonce) {
        const addressHex = Address.toHex(address);
        const result = this.ffi.state_manager_set_nonce(this.handle, this.encodeCString(addressHex), nonce);
        if (result !== STATE_MANAGER_SUCCESS) {
            throw new Error(`Failed to set nonce: error ${result}`);
        }
    }
    /**
     * Get storage slot value
     */
    async getStorage(address, slot) {
        const addressHex = Address.toHex(address);
        const buffer = new Uint8Array(67);
        for (let attempt = 0; attempt < 10; attempt++) {
            const result = this.ffi.state_manager_get_storage_sync(this.handle, this.encodeCString(addressHex), this.encodeCString(slot), buffer, buffer.length);
            if (result === STATE_MANAGER_SUCCESS) {
                const nullIndex = buffer.indexOf(0);
                return new TextDecoder().decode(buffer.subarray(0, nullIndex));
            }
            if (result === STATE_MANAGER_ERROR_RPC_PENDING) {
                await this.processForkRequests();
                continue;
            }
            throw new Error(`Failed to get storage: error ${result}`);
        }
        throw new Error("Failed to resolve forked storage");
    }
    /**
     * Set storage slot value
     */
    async setStorage(address, slot, value) {
        const addressHex = Address.toHex(address);
        const result = this.ffi.state_manager_set_storage(this.handle, this.encodeCString(addressHex), this.encodeCString(slot), this.encodeCString(value));
        if (result !== STATE_MANAGER_SUCCESS) {
            throw new Error(`Failed to set storage: error ${result}`);
        }
    }
    /**
     * Get contract code
     */
    async getCode(address) {
        const addressHex = Address.toHex(address);
        for (let attempt = 0; attempt < 10; attempt++) {
            // Get code length first
            const lenBuffer = new BigUint64Array(1);
            const lenResult = this.ffi.state_manager_get_code_len_sync(this.handle, this.encodeCString(addressHex), lenBuffer);
            if (lenResult === STATE_MANAGER_ERROR_RPC_PENDING) {
                await this.processForkRequests();
                continue;
            }
            if (lenResult !== STATE_MANAGER_SUCCESS) {
                throw new Error(`Failed to get code length: error ${lenResult}`);
            }
            const codeLen = Number(lenBuffer[0]);
            if (codeLen === 0) {
                return "0x";
            }
            // Get code bytes
            const codeBuffer = new Uint8Array(codeLen);
            const codeResult = this.ffi.state_manager_get_code_sync(this.handle, this.encodeCString(addressHex), codeBuffer, codeLen);
            if (codeResult === STATE_MANAGER_ERROR_RPC_PENDING) {
                await this.processForkRequests();
                continue;
            }
            if (codeResult !== STATE_MANAGER_SUCCESS) {
                throw new Error(`Failed to get code: error ${codeResult}`);
            }
            return HexUtils.fromBytes(codeBuffer);
        }
        throw new Error("Failed to resolve forked code");
    }
    /**
     * Set contract code
     */
    async setCode(address, code) {
        const addressHex = Address.toHex(address);
        const codeBytes = HexUtils.toBytes(code);
        const result = this.ffi.state_manager_set_code(this.handle, this.encodeCString(addressHex), codeBytes, codeBytes.length);
        if (result !== STATE_MANAGER_SUCCESS) {
            throw new Error(`Failed to set code: error ${result}`);
        }
    }
    // ========================================================================
    // Checkpoint Operations
    // ========================================================================
    /**
     * Create checkpoint (can be reverted or committed)
     */
    async checkpoint() {
        const result = this.ffi.state_manager_checkpoint(this.handle);
        if (result !== STATE_MANAGER_SUCCESS) {
            throw new Error(`Failed to checkpoint: error ${result}`);
        }
    }
    /**
     * Revert to last checkpoint
     */
    revert() {
        this.ffi.state_manager_revert(this.handle);
    }
    /**
     * Commit last checkpoint (merge into parent)
     */
    commit() {
        this.ffi.state_manager_commit(this.handle);
    }
    // ========================================================================
    // Snapshot Operations (for tevm_snapshot/tevm_revert)
    // ========================================================================
    /**
     * Create snapshot and return snapshot ID
     */
    async snapshot() {
        const outBuffer = new BigUint64Array(1);
        const result = this.ffi.state_manager_snapshot(this.handle, outBuffer);
        if (result !== STATE_MANAGER_SUCCESS) {
            throw new Error(`Failed to snapshot: error ${result}`);
        }
        const snapshotId = outBuffer[0];
        if (snapshotId === undefined) {
            throw new Error("Failed to read snapshot ID from buffer");
        }
        return snapshotId;
    }
    /**
     * Revert to snapshot ID
     */
    async revertToSnapshot(snapshotId) {
        const result = this.ffi.state_manager_revert_to_snapshot(this.handle, snapshotId);
        if (result !== STATE_MANAGER_SUCCESS) {
            if (result === STATE_MANAGER_ERROR_INVALID_SNAPSHOT) {
                throw new Error(`Invalid snapshot ID: ${snapshotId}`);
            }
            throw new Error(`Failed to revert to snapshot: error ${result}`);
        }
    }
    // ========================================================================
    // Cache Management
    // ========================================================================
    /**
     * Clear all caches (normal + fork)
     */
    clearCaches() {
        this.ffi.state_manager_clear_caches(this.handle);
    }
    /**
     * Clear only fork cache
     */
    clearForkCache() {
        this.ffi.state_manager_clear_fork_cache(this.handle);
    }
}
