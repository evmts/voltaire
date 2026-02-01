/**
 * Bun FFI loader for native bindings
 * Uses Bun's dlopen for high-performance native library loading
 */
import { FFIType } from "bun:ffi";
/**
 * Load native library using Bun FFI
 * @throws Error if library cannot be loaded
 */
export declare function loadBunNative(): import("bun:ffi").ConvertFns<{
    readonly primitives_address_from_hex: {
        readonly args: readonly [FFIType.cstring, FFIType.ptr];
        readonly returns: FFIType.int32_t;
    };
    readonly primitives_address_to_hex: {
        readonly args: readonly [FFIType.ptr, FFIType.ptr];
        readonly returns: FFIType.int32_t;
    };
    readonly primitives_address_to_checksum_hex: {
        readonly args: readonly [FFIType.ptr, FFIType.ptr];
        readonly returns: FFIType.int32_t;
    };
    readonly primitives_address_is_zero: {
        readonly args: readonly [FFIType.ptr];
        readonly returns: FFIType.bool;
    };
    readonly primitives_address_equals: {
        readonly args: readonly [FFIType.ptr, FFIType.ptr];
        readonly returns: FFIType.bool;
    };
    readonly primitives_keccak256: {
        readonly args: readonly [FFIType.ptr, FFIType.uint64_t, FFIType.ptr];
        readonly returns: FFIType.int32_t;
    };
    readonly primitives_hash_to_hex: {
        readonly args: readonly [FFIType.ptr, FFIType.ptr];
        readonly returns: FFIType.int32_t;
    };
    readonly primitives_hash_from_hex: {
        readonly args: readonly [FFIType.cstring, FFIType.ptr];
        readonly returns: FFIType.int32_t;
    };
    readonly primitives_hash_equals: {
        readonly args: readonly [FFIType.ptr, FFIType.ptr];
        readonly returns: FFIType.bool;
    };
    readonly primitives_hex_to_bytes: {
        readonly args: readonly [FFIType.cstring, FFIType.ptr, FFIType.ptr];
        readonly returns: FFIType.int32_t;
    };
    readonly primitives_bytes_to_hex: {
        readonly args: readonly [FFIType.ptr, FFIType.uint64_t, FFIType.ptr, FFIType.ptr];
        readonly returns: FFIType.int32_t;
    };
    readonly primitives_secp256k1_recover_address: {
        readonly args: readonly [FFIType.ptr, FFIType.int32_t, FFIType.ptr, FFIType.ptr];
        readonly returns: FFIType.int32_t;
    };
    readonly secp256k1Sign: {
        readonly args: readonly [FFIType.ptr, FFIType.ptr, FFIType.ptr];
        readonly returns: FFIType.int32_t;
    };
    readonly secp256k1Verify: {
        readonly args: readonly [FFIType.ptr, FFIType.ptr, FFIType.ptr];
        readonly returns: FFIType.bool;
    };
    readonly secp256k1DerivePublicKey: {
        readonly args: readonly [FFIType.ptr, FFIType.ptr];
        readonly returns: FFIType.int32_t;
    };
    readonly primitives_sha256: {
        readonly args: readonly [FFIType.ptr, FFIType.uint64_t, FFIType.ptr];
        readonly returns: FFIType.int32_t;
    };
    readonly primitives_ripemd160: {
        readonly args: readonly [FFIType.ptr, FFIType.uint64_t, FFIType.ptr];
        readonly returns: FFIType.int32_t;
    };
    readonly primitives_blake2b: {
        readonly args: readonly [FFIType.ptr, FFIType.uint64_t, FFIType.ptr];
        readonly returns: FFIType.int32_t;
    };
    readonly primitives_solidity_keccak256: {
        readonly args: readonly [FFIType.ptr, FFIType.uint64_t, FFIType.ptr];
        readonly returns: FFIType.int32_t;
    };
    readonly primitives_solidity_sha256: {
        readonly args: readonly [FFIType.ptr, FFIType.uint64_t, FFIType.ptr];
        readonly returns: FFIType.int32_t;
    };
    readonly primitives_abi_compute_selector: {
        readonly args: readonly [FFIType.cstring, FFIType.ptr];
        readonly returns: FFIType.int32_t;
    };
    readonly state_manager_create: {
        readonly args: readonly [];
        readonly returns: FFIType.ptr;
    };
    readonly state_manager_create_with_fork: {
        readonly args: readonly [FFIType.ptr];
        readonly returns: FFIType.ptr;
    };
    readonly state_manager_destroy: {
        readonly args: readonly [FFIType.ptr];
        readonly returns: FFIType.void;
    };
    readonly state_manager_get_balance_sync: {
        readonly args: readonly [FFIType.ptr, FFIType.cstring, FFIType.ptr, FFIType.uint64_t];
        readonly returns: FFIType.int32_t;
    };
    readonly state_manager_get_nonce_sync: {
        readonly args: readonly [FFIType.ptr, FFIType.cstring, FFIType.ptr];
        readonly returns: FFIType.int32_t;
    };
    readonly state_manager_get_code_len_sync: {
        readonly args: readonly [FFIType.ptr, FFIType.cstring, FFIType.ptr];
        readonly returns: FFIType.int32_t;
    };
    readonly state_manager_get_code_sync: {
        readonly args: readonly [FFIType.ptr, FFIType.cstring, FFIType.ptr, FFIType.uint64_t];
        readonly returns: FFIType.int32_t;
    };
    readonly state_manager_get_storage_sync: {
        readonly args: readonly [FFIType.ptr, FFIType.cstring, FFIType.cstring, FFIType.ptr, FFIType.uint64_t];
        readonly returns: FFIType.int32_t;
    };
    readonly state_manager_set_balance: {
        readonly args: readonly [FFIType.ptr, FFIType.cstring, FFIType.cstring];
        readonly returns: FFIType.int32_t;
    };
    readonly state_manager_set_nonce: {
        readonly args: readonly [FFIType.ptr, FFIType.cstring, FFIType.uint64_t];
        readonly returns: FFIType.int32_t;
    };
    readonly state_manager_set_code: {
        readonly args: readonly [FFIType.ptr, FFIType.cstring, FFIType.ptr, FFIType.uint64_t];
        readonly returns: FFIType.int32_t;
    };
    readonly state_manager_set_storage: {
        readonly args: readonly [FFIType.ptr, FFIType.cstring, FFIType.cstring, FFIType.cstring];
        readonly returns: FFIType.int32_t;
    };
    readonly state_manager_checkpoint: {
        readonly args: readonly [FFIType.ptr];
        readonly returns: FFIType.int32_t;
    };
    readonly state_manager_revert: {
        readonly args: readonly [FFIType.ptr];
        readonly returns: FFIType.void;
    };
    readonly state_manager_commit: {
        readonly args: readonly [FFIType.ptr];
        readonly returns: FFIType.void;
    };
    readonly state_manager_snapshot: {
        readonly args: readonly [FFIType.ptr, FFIType.ptr];
        readonly returns: FFIType.int32_t;
    };
    readonly state_manager_revert_to_snapshot: {
        readonly args: readonly [FFIType.ptr, FFIType.uint64_t];
        readonly returns: FFIType.int32_t;
    };
    readonly state_manager_clear_caches: {
        readonly args: readonly [FFIType.ptr];
        readonly returns: FFIType.void;
    };
    readonly state_manager_clear_fork_cache: {
        readonly args: readonly [FFIType.ptr];
        readonly returns: FFIType.void;
    };
    readonly fork_backend_create: {
        readonly args: readonly [FFIType.ptr, FFIType.ptr, FFIType.cstring, FFIType.uint64_t];
        readonly returns: FFIType.ptr;
    };
    readonly fork_backend_destroy: {
        readonly args: readonly [FFIType.ptr];
        readonly returns: FFIType.void;
    };
    readonly fork_backend_clear_cache: {
        readonly args: readonly [FFIType.ptr];
        readonly returns: FFIType.void;
    };
    readonly fork_backend_next_request: {
        readonly args: readonly [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.uint64_t, FFIType.ptr, FFIType.ptr, FFIType.uint64_t, FFIType.ptr];
        readonly returns: FFIType.int32_t;
    };
    readonly fork_backend_continue: {
        readonly args: readonly [FFIType.ptr, FFIType.uint64_t, FFIType.ptr, FFIType.uint64_t];
        readonly returns: FFIType.int32_t;
    };
    readonly blockchain_create: {
        readonly args: readonly [];
        readonly returns: FFIType.ptr;
    };
    readonly blockchain_create_with_fork: {
        readonly args: readonly [FFIType.ptr];
        readonly returns: FFIType.ptr;
    };
    readonly blockchain_destroy: {
        readonly args: readonly [FFIType.ptr];
        readonly returns: FFIType.void;
    };
    readonly blockchain_get_block_by_hash: {
        readonly args: readonly [FFIType.ptr, FFIType.ptr, FFIType.ptr];
        readonly returns: FFIType.int32_t;
    };
    readonly blockchain_get_block_by_number: {
        readonly args: readonly [FFIType.ptr, FFIType.uint64_t, FFIType.ptr];
        readonly returns: FFIType.int32_t;
    };
    readonly blockchain_get_canonical_hash: {
        readonly args: readonly [FFIType.ptr, FFIType.uint64_t, FFIType.ptr];
        readonly returns: FFIType.int32_t;
    };
    readonly blockchain_get_head_block_number: {
        readonly args: readonly [FFIType.ptr, FFIType.ptr];
        readonly returns: FFIType.int32_t;
    };
    readonly blockchain_put_block: {
        readonly args: readonly [FFIType.ptr, FFIType.ptr];
        readonly returns: FFIType.int32_t;
    };
    readonly blockchain_set_canonical_head: {
        readonly args: readonly [FFIType.ptr, FFIType.ptr];
        readonly returns: FFIType.int32_t;
    };
    readonly blockchain_has_block: {
        readonly args: readonly [FFIType.ptr, FFIType.ptr];
        readonly returns: FFIType.bool;
    };
    readonly blockchain_local_block_count: {
        readonly args: readonly [FFIType.ptr];
        readonly returns: FFIType.uint64_t;
    };
    readonly blockchain_orphan_count: {
        readonly args: readonly [FFIType.ptr];
        readonly returns: FFIType.uint64_t;
    };
    readonly blockchain_canonical_chain_length: {
        readonly args: readonly [FFIType.ptr];
        readonly returns: FFIType.uint64_t;
    };
    readonly blockchain_is_fork_block: {
        readonly args: readonly [FFIType.ptr, FFIType.uint64_t];
        readonly returns: FFIType.bool;
    };
    readonly fork_block_cache_create: {
        readonly args: readonly [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.uint64_t];
        readonly returns: FFIType.ptr;
    };
    readonly fork_block_cache_destroy: {
        readonly args: readonly [FFIType.ptr];
        readonly returns: FFIType.void;
    };
    readonly fork_block_cache_next_request: {
        readonly args: readonly [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.uint64_t, FFIType.ptr, FFIType.ptr, FFIType.uint64_t, FFIType.ptr];
        readonly returns: FFIType.int32_t;
    };
    readonly fork_block_cache_continue: {
        readonly args: readonly [FFIType.ptr, FFIType.uint64_t, FFIType.ptr, FFIType.uint64_t];
        readonly returns: FFIType.int32_t;
    };
}>;
/**
 * Check if native library is loaded
 */
export declare function isLoaded(): boolean;
/**
 * Unload native library
 * Note: Bun doesn't provide explicit unload, just clear reference
 */
export declare function unload(): void;
/**
 * Helper to check error code and throw if non-zero
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
//# sourceMappingURL=bun-ffi.d.ts.map