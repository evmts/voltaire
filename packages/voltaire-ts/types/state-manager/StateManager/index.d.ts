/**
 * StateManager TypeScript FFI Bindings
 *
 * Wraps Zig StateManager implementation with async RPC support.
 * Manages pending requests for fork backend async operations.
 *
 * @module state-manager/StateManager
 */
import type { AddressType } from "../../primitives/Address/AddressType.js";
import type { Hex } from "../../primitives/Hex/HexType.js";
import type { Provider } from "../../provider/Provider.js";
/**
 * FFI library exports (loaded from native or WASM)
 */
export interface StateManagerFFIExports {
    state_manager_create(): bigint | null;
    state_manager_create_with_fork(forkBackend: bigint): bigint | null;
    state_manager_destroy(handle: bigint): void;
    fork_backend_create(rpcClientPtr: bigint, vtablePtr: bigint, blockTag: string, maxCacheSize: number): bigint | null;
    fork_backend_destroy(handle: bigint): void;
    fork_backend_clear_cache(handle: bigint): void;
    fork_backend_next_request(handle: bigint, outRequestId: BigUint64Array, outMethod: Uint8Array, methodBufLen: number, outMethodLen: BigUint64Array, outParams: Uint8Array, paramsBufLen: number, outParamsLen: BigUint64Array): number;
    fork_backend_continue(handle: bigint, requestId: bigint, responsePtr: Uint8Array, responseLen: number): number;
    state_manager_get_balance_sync(handle: bigint, addressHex: string, outBuffer: Uint8Array, bufferLen: number): number;
    state_manager_set_balance(handle: bigint, addressHex: string, balanceHex: string): number;
    state_manager_get_nonce_sync(handle: bigint, addressHex: string, outNonce: BigUint64Array): number;
    state_manager_set_nonce(handle: bigint, addressHex: string, nonce: bigint): number;
    state_manager_get_storage_sync(handle: bigint, addressHex: string, slotHex: string, outBuffer: Uint8Array, bufferLen: number): number;
    state_manager_set_storage(handle: bigint, addressHex: string, slotHex: string, valueHex: string): number;
    state_manager_get_code_len_sync(handle: bigint, addressHex: string, outLen: BigUint64Array): number;
    state_manager_get_code_sync(handle: bigint, addressHex: string, outBuffer: Uint8Array, bufferLen: number): number;
    state_manager_set_code(handle: bigint, addressHex: string, codePtr: Uint8Array, codeLen: number): number;
    state_manager_checkpoint(handle: bigint): number;
    state_manager_revert(handle: bigint): void;
    state_manager_commit(handle: bigint): void;
    state_manager_snapshot(handle: bigint, outSnapshotId: BigUint64Array): number;
    state_manager_revert_to_snapshot(handle: bigint, snapshotId: bigint): number;
    state_manager_clear_caches(handle: bigint): void;
    state_manager_clear_fork_cache(handle: bigint): void;
}
/**
 * Error codes from c_api.zig
 */
export declare const STATE_MANAGER_SUCCESS = 0;
export declare const STATE_MANAGER_ERROR_INVALID_INPUT = -1;
export declare const STATE_MANAGER_ERROR_OUT_OF_MEMORY = -2;
export declare const STATE_MANAGER_ERROR_INVALID_SNAPSHOT = -3;
export declare const STATE_MANAGER_ERROR_RPC_FAILED = -4;
export declare const STATE_MANAGER_ERROR_INVALID_HEX = -5;
export declare const STATE_MANAGER_ERROR_RPC_PENDING = -6;
export declare const STATE_MANAGER_ERROR_NO_PENDING_REQUEST = -7;
export declare const STATE_MANAGER_ERROR_OUTPUT_TOO_SMALL = -8;
export declare const STATE_MANAGER_ERROR_INVALID_REQUEST = -9;
/**
 * RPC Client interface (must be implemented by adapter)
 */
export interface RpcClient {
    /**
     * Get account proof (eth_getProof)
     */
    getProof(address: AddressType, slots: readonly Hex[], blockTag: string): Promise<EthProof>;
    /**
     * Get contract code (eth_getCode)
     */
    getCode(address: AddressType, blockTag: string): Promise<Hex>;
}
/**
 * eth_getProof response structure
 */
export interface EthProof {
    nonce: bigint;
    balance: bigint;
    codeHash: Hex;
    storageRoot: Hex;
    storageProof: Array<{
        key: Hex;
        value: Hex;
        proof: Hex[];
    }>;
}
/**
 * StateManager options
 */
export interface StateManagerOptions {
    /**
     * Optional RPC client for fork mode
     */
    rpcClient?: RpcClient | Provider;
    /**
     * Block tag for fork (e.g., "latest", "0x123...")
     */
    forkBlockTag?: string;
    /**
     * Max LRU cache size for fork backend
     */
    maxCacheSize?: number;
    /**
     * FFI exports (loaded from native-loader)
     */
    ffi: StateManagerFFIExports;
}
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
export declare class StateManager {
    private handle;
    private forkBackendHandle;
    private ffi;
    private rpcClient;
    private rpcProvider;
    private forkBlockTag;
    private maxCacheSize;
    constructor(options: StateManagerOptions);
    /**
     * Cleanup resources
     */
    destroy(): void;
    /**
     * Encode string as null-terminated buffer for FFI
     * Workaround for Bun FFI cstring bug in 1.2.20
     */
    private encodeCString;
    private processForkRequests;
    private createForkRequestBuffers;
    private readForkRequest;
    private executeForkRequest;
    /**
     * Get account balance
     */
    getBalance(address: AddressType): Promise<bigint>;
    /**
     * Set account balance
     */
    setBalance(address: AddressType, balance: bigint): Promise<void>;
    /**
     * Get account nonce
     */
    getNonce(address: AddressType): Promise<bigint>;
    /**
     * Set account nonce
     */
    setNonce(address: AddressType, nonce: bigint): Promise<void>;
    /**
     * Get storage slot value
     */
    getStorage(address: AddressType, slot: Hex): Promise<Hex>;
    /**
     * Set storage slot value
     */
    setStorage(address: AddressType, slot: Hex, value: Hex): Promise<void>;
    /**
     * Get contract code
     */
    getCode(address: AddressType): Promise<Hex>;
    /**
     * Set contract code
     */
    setCode(address: AddressType, code: Hex): Promise<void>;
    /**
     * Create checkpoint (can be reverted or committed)
     */
    checkpoint(): Promise<void>;
    /**
     * Revert to last checkpoint
     */
    revert(): void;
    /**
     * Commit last checkpoint (merge into parent)
     */
    commit(): void;
    /**
     * Create snapshot and return snapshot ID
     */
    snapshot(): Promise<bigint>;
    /**
     * Revert to snapshot ID
     */
    revertToSnapshot(snapshotId: bigint): Promise<void>;
    /**
     * Clear all caches (normal + fork)
     */
    clearCaches(): void;
    /**
     * Clear only fork cache
     */
    clearForkCache(): void;
}
//# sourceMappingURL=index.d.ts.map