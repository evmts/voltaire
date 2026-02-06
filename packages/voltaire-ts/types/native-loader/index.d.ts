/**
 * Unified native loader
 * Auto-detects Bun vs Node.js and uses appropriate FFI mechanism
 */
export type { NativeModule } from "./node-api.js";
export { getNativeExtension, getPlatform, isNativeSupported, type Platform, } from "./platform.js";
export type { NativeErrorCode as NativeErrorCodeType } from "./types.js";
export { getNativeErrorMessage, NativeErrorCode } from "./types.js";
export { loadForkWasm } from "./wasm.js";
/**
 * Runtime environment detection
 */
export declare function isBun(): boolean;
export declare function isNode(): boolean;
/**
 * Load native library using appropriate loader
 */
export declare function loadNative(): Promise<import("./node-api.js").NativeModule | import("bun:ffi").ConvertFns<{
    readonly primitives_address_from_hex: {
        readonly args: readonly [import("bun:ffi").FFIType.cstring, import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.int32_t;
    };
    readonly primitives_address_to_hex: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.int32_t;
    };
    readonly primitives_address_to_checksum_hex: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.int32_t;
    };
    readonly primitives_address_is_zero: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.bool;
    };
    readonly primitives_address_equals: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.bool;
    };
    readonly primitives_keccak256: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.uint64_t, import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.int32_t;
    };
    readonly primitives_hash_to_hex: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.int32_t;
    };
    readonly primitives_hash_from_hex: {
        readonly args: readonly [import("bun:ffi").FFIType.cstring, import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.int32_t;
    };
    readonly primitives_hash_equals: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.bool;
    };
    readonly primitives_hex_to_bytes: {
        readonly args: readonly [import("bun:ffi").FFIType.cstring, import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.int32_t;
    };
    readonly primitives_bytes_to_hex: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.uint64_t, import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.int32_t;
    };
    readonly primitives_secp256k1_recover_address: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.int32_t, import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.int32_t;
    };
    readonly secp256k1Sign: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.int32_t;
    };
    readonly secp256k1Verify: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.bool;
    };
    readonly secp256k1DerivePublicKey: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.int32_t;
    };
    readonly primitives_sha256: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.uint64_t, import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.int32_t;
    };
    readonly primitives_ripemd160: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.uint64_t, import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.int32_t;
    };
    readonly primitives_blake2b: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.uint64_t, import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.int32_t;
    };
    readonly primitives_solidity_keccak256: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.uint64_t, import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.int32_t;
    };
    readonly primitives_solidity_sha256: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.uint64_t, import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.int32_t;
    };
    readonly primitives_abi_compute_selector: {
        readonly args: readonly [import("bun:ffi").FFIType.cstring, import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.int32_t;
    };
    readonly state_manager_create: {
        readonly args: readonly [];
        readonly returns: import("bun:ffi").FFIType.ptr;
    };
    readonly state_manager_create_with_fork: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.ptr;
    };
    readonly state_manager_destroy: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.void;
    };
    readonly state_manager_get_balance_sync: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.cstring, import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.uint64_t];
        readonly returns: import("bun:ffi").FFIType.int32_t;
    };
    readonly state_manager_get_nonce_sync: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.cstring, import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.int32_t;
    };
    readonly state_manager_get_code_len_sync: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.cstring, import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.int32_t;
    };
    readonly state_manager_get_code_sync: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.cstring, import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.uint64_t];
        readonly returns: import("bun:ffi").FFIType.int32_t;
    };
    readonly state_manager_get_storage_sync: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.cstring, import("bun:ffi").FFIType.cstring, import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.uint64_t];
        readonly returns: import("bun:ffi").FFIType.int32_t;
    };
    readonly state_manager_set_balance: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.cstring, import("bun:ffi").FFIType.cstring];
        readonly returns: import("bun:ffi").FFIType.int32_t;
    };
    readonly state_manager_set_nonce: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.cstring, import("bun:ffi").FFIType.uint64_t];
        readonly returns: import("bun:ffi").FFIType.int32_t;
    };
    readonly state_manager_set_code: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.cstring, import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.uint64_t];
        readonly returns: import("bun:ffi").FFIType.int32_t;
    };
    readonly state_manager_set_storage: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.cstring, import("bun:ffi").FFIType.cstring, import("bun:ffi").FFIType.cstring];
        readonly returns: import("bun:ffi").FFIType.int32_t;
    };
    readonly state_manager_checkpoint: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.int32_t;
    };
    readonly state_manager_revert: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.void;
    };
    readonly state_manager_commit: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.void;
    };
    readonly state_manager_snapshot: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.int32_t;
    };
    readonly state_manager_revert_to_snapshot: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.uint64_t];
        readonly returns: import("bun:ffi").FFIType.int32_t;
    };
    readonly state_manager_clear_caches: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.void;
    };
    readonly state_manager_clear_fork_cache: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.void;
    };
    readonly fork_backend_create: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.cstring, import("bun:ffi").FFIType.uint64_t];
        readonly returns: import("bun:ffi").FFIType.ptr;
    };
    readonly fork_backend_destroy: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.void;
    };
    readonly fork_backend_clear_cache: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.void;
    };
    readonly fork_backend_next_request: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.uint64_t, import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.uint64_t, import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.int32_t;
    };
    readonly fork_backend_continue: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.uint64_t, import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.uint64_t];
        readonly returns: import("bun:ffi").FFIType.int32_t;
    };
    readonly blockchain_create: {
        readonly args: readonly [];
        readonly returns: import("bun:ffi").FFIType.ptr;
    };
    readonly blockchain_create_with_fork: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.ptr;
    };
    readonly blockchain_destroy: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.void;
    };
    readonly blockchain_get_block_by_hash: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.int32_t;
    };
    readonly blockchain_get_block_by_number: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.uint64_t, import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.int32_t;
    };
    readonly blockchain_get_canonical_hash: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.uint64_t, import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.int32_t;
    };
    readonly blockchain_get_head_block_number: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.int32_t;
    };
    readonly blockchain_put_block: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.int32_t;
    };
    readonly blockchain_set_canonical_head: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.int32_t;
    };
    readonly blockchain_has_block: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.bool;
    };
    readonly blockchain_local_block_count: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.uint64_t;
    };
    readonly blockchain_orphan_count: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.uint64_t;
    };
    readonly blockchain_canonical_chain_length: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.uint64_t;
    };
    readonly blockchain_is_fork_block: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.uint64_t];
        readonly returns: import("bun:ffi").FFIType.bool;
    };
    readonly fork_block_cache_create: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.uint64_t];
        readonly returns: import("bun:ffi").FFIType.ptr;
    };
    readonly fork_block_cache_destroy: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.void;
    };
    readonly fork_block_cache_next_request: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.uint64_t, import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.uint64_t, import("bun:ffi").FFIType.ptr];
        readonly returns: import("bun:ffi").FFIType.int32_t;
    };
    readonly fork_block_cache_continue: {
        readonly args: readonly [import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.uint64_t, import("bun:ffi").FFIType.ptr, import("bun:ffi").FFIType.uint64_t];
        readonly returns: import("bun:ffi").FFIType.int32_t;
    };
}>>;
/**
 * Check error code and throw if non-zero
 */
export declare function checkError(code: number, operation: string): void;
/**
 * Helper to allocate buffer for output
 */
export declare function allocateOutput(size: number): Uint8Array;
/**
 * Helper to allocate buffer for string output
 */
export declare function allocateStringOutput(size: number): {
    buffer: Uint8Array;
    ptr: Uint8Array;
};
//# sourceMappingURL=index.d.ts.map