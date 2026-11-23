/**
 * Bun FFI loader for native bindings
 * Uses Bun's dlopen for high-performance native library loading.
 *
 * `bun:ffi` is imported lazily inside {@link loadBunNative}. A static import
 * would be hoisted to the top of every bundle that reaches this module
 * (for example `@tevm/voltaire/provider`) and crash Node with
 * ERR_UNSUPPORTED_ESM_URL_SCHEME before any code runs.
 */
/**
 * FFI symbol definitions for c_api.zig exports
 * Maps function names to their FFI signatures
 */
export declare const bunFfiSymbols: {
    readonly primitives_address_from_hex: {
        readonly args: readonly ["cstring", "ptr"];
        readonly returns: "i32";
    };
    readonly primitives_address_to_hex: {
        readonly args: readonly ["ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly primitives_address_to_checksum_hex: {
        readonly args: readonly ["ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly primitives_address_is_zero: {
        readonly args: readonly ["ptr"];
        readonly returns: "bool";
    };
    readonly primitives_address_equals: {
        readonly args: readonly ["ptr", "ptr"];
        readonly returns: "bool";
    };
    readonly primitives_keccak256: {
        readonly args: readonly ["ptr", "u64", "ptr"];
        readonly returns: "i32";
    };
    readonly primitives_hash_to_hex: {
        readonly args: readonly ["ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly primitives_hash_from_hex: {
        readonly args: readonly ["cstring", "ptr"];
        readonly returns: "i32";
    };
    readonly primitives_hash_equals: {
        readonly args: readonly ["ptr", "ptr"];
        readonly returns: "bool";
    };
    readonly primitives_hex_to_bytes: {
        readonly args: readonly ["cstring", "ptr", "u64"];
        readonly returns: "i32";
    };
    readonly primitives_bytes_to_hex: {
        readonly args: readonly ["ptr", "u64", "ptr", "u64"];
        readonly returns: "i32";
    };
    readonly primitives_secp256k1_recover_address: {
        readonly args: readonly ["ptr", "ptr", "ptr", "u8", "ptr"];
        readonly returns: "i32";
    };
    readonly secp256k1Sign: {
        readonly args: readonly ["ptr", "ptr", "ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly secp256k1Verify: {
        readonly args: readonly ["ptr", "ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly secp256k1DerivePublicKey: {
        readonly args: readonly ["ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly primitives_sha256: {
        readonly args: readonly ["ptr", "u64", "ptr"];
        readonly returns: "i32";
    };
    readonly primitives_ripemd160: {
        readonly args: readonly ["ptr", "u64", "ptr"];
        readonly returns: "i32";
    };
    readonly primitives_blake2b: {
        readonly args: readonly ["ptr", "u64", "ptr"];
        readonly returns: "i32";
    };
    readonly primitives_solidity_keccak256: {
        readonly args: readonly ["ptr", "u64", "ptr"];
        readonly returns: "i32";
    };
    readonly primitives_solidity_sha256: {
        readonly args: readonly ["ptr", "u64", "ptr"];
        readonly returns: "i32";
    };
    readonly primitives_abi_compute_selector: {
        readonly args: readonly ["cstring", "ptr"];
        readonly returns: "i32";
    };
    readonly state_manager_create: {
        readonly args: readonly [];
        readonly returns: "ptr";
    };
    readonly state_manager_create_with_fork: {
        readonly args: readonly ["ptr"];
        readonly returns: "ptr";
    };
    readonly state_manager_destroy: {
        readonly args: readonly ["ptr"];
        readonly returns: "void";
    };
    readonly state_manager_get_balance_sync: {
        readonly args: readonly ["ptr", "cstring", "ptr", "u64"];
        readonly returns: "i32";
    };
    readonly state_manager_get_nonce_sync: {
        readonly args: readonly ["ptr", "cstring", "ptr"];
        readonly returns: "i32";
    };
    readonly state_manager_get_code_len_sync: {
        readonly args: readonly ["ptr", "cstring", "ptr"];
        readonly returns: "i32";
    };
    readonly state_manager_get_code_sync: {
        readonly args: readonly ["ptr", "cstring", "ptr", "u64"];
        readonly returns: "i32";
    };
    readonly state_manager_get_storage_sync: {
        readonly args: readonly ["ptr", "cstring", "cstring", "ptr", "u64"];
        readonly returns: "i32";
    };
    readonly state_manager_set_balance: {
        readonly args: readonly ["ptr", "cstring", "cstring"];
        readonly returns: "i32";
    };
    readonly state_manager_set_nonce: {
        readonly args: readonly ["ptr", "cstring", "u64"];
        readonly returns: "i32";
    };
    readonly state_manager_set_code: {
        readonly args: readonly ["ptr", "cstring", "ptr", "u64"];
        readonly returns: "i32";
    };
    readonly state_manager_set_storage: {
        readonly args: readonly ["ptr", "cstring", "cstring", "cstring"];
        readonly returns: "i32";
    };
    readonly state_manager_checkpoint: {
        readonly args: readonly ["ptr"];
        readonly returns: "i32";
    };
    readonly state_manager_revert: {
        readonly args: readonly ["ptr"];
        readonly returns: "void";
    };
    readonly state_manager_commit: {
        readonly args: readonly ["ptr"];
        readonly returns: "void";
    };
    readonly state_manager_snapshot: {
        readonly args: readonly ["ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly state_manager_revert_to_snapshot: {
        readonly args: readonly ["ptr", "u64"];
        readonly returns: "i32";
    };
    readonly state_manager_clear_caches: {
        readonly args: readonly ["ptr"];
        readonly returns: "void";
    };
    readonly state_manager_clear_fork_cache: {
        readonly args: readonly ["ptr"];
        readonly returns: "void";
    };
    readonly fork_backend_create: {
        readonly args: readonly ["ptr", "ptr", "cstring", "u64"];
        readonly returns: "ptr";
    };
    readonly fork_backend_destroy: {
        readonly args: readonly ["ptr"];
        readonly returns: "void";
    };
    readonly fork_backend_clear_cache: {
        readonly args: readonly ["ptr"];
        readonly returns: "void";
    };
    readonly fork_backend_next_request: {
        readonly args: readonly ["ptr", "ptr", "ptr", "u64", "ptr", "ptr", "u64", "ptr"];
        readonly returns: "i32";
    };
    readonly fork_backend_continue: {
        readonly args: readonly ["ptr", "u64", "ptr", "u64"];
        readonly returns: "i32";
    };
    readonly blockchain_create: {
        readonly args: readonly [];
        readonly returns: "ptr";
    };
    readonly blockchain_create_with_fork: {
        readonly args: readonly ["ptr"];
        readonly returns: "ptr";
    };
    readonly blockchain_destroy: {
        readonly args: readonly ["ptr"];
        readonly returns: "void";
    };
    readonly blockchain_get_block_by_hash: {
        readonly args: readonly ["ptr", "ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly blockchain_get_block_by_number: {
        readonly args: readonly ["ptr", "u64", "ptr"];
        readonly returns: "i32";
    };
    readonly blockchain_get_canonical_hash: {
        readonly args: readonly ["ptr", "u64", "ptr"];
        readonly returns: "i32";
    };
    readonly blockchain_get_head_block_number: {
        readonly args: readonly ["ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly blockchain_put_block: {
        readonly args: readonly ["ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly blockchain_set_canonical_head: {
        readonly args: readonly ["ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly blockchain_has_block: {
        readonly args: readonly ["ptr", "ptr"];
        readonly returns: "bool";
    };
    readonly blockchain_local_block_count: {
        readonly args: readonly ["ptr"];
        readonly returns: "u64";
    };
    readonly blockchain_orphan_count: {
        readonly args: readonly ["ptr"];
        readonly returns: "u64";
    };
    readonly blockchain_canonical_chain_length: {
        readonly args: readonly ["ptr"];
        readonly returns: "u64";
    };
    readonly blockchain_is_fork_block: {
        readonly args: readonly ["ptr", "u64"];
        readonly returns: "bool";
    };
    readonly fork_block_cache_create: {
        readonly args: readonly ["u64", "u64", "u64", "u64"];
        readonly returns: "ptr";
    };
    readonly fork_block_cache_destroy: {
        readonly args: readonly ["ptr"];
        readonly returns: "void";
    };
    readonly fork_block_cache_next_request: {
        readonly args: readonly ["ptr", "ptr", "ptr", "u64", "ptr", "ptr", "u64", "ptr"];
        readonly returns: "i32";
    };
    readonly fork_block_cache_continue: {
        readonly args: readonly ["ptr", "u64", "ptr", "u64"];
        readonly returns: "i32";
    };
};
/**
 * Load native library using Bun FFI
 * @throws Error if library cannot be loaded
 */
export declare function loadBunNative(): Promise<import("bun:ffi").ConvertFns<{
    readonly primitives_address_from_hex: {
        readonly args: readonly ["cstring", "ptr"];
        readonly returns: "i32";
    };
    readonly primitives_address_to_hex: {
        readonly args: readonly ["ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly primitives_address_to_checksum_hex: {
        readonly args: readonly ["ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly primitives_address_is_zero: {
        readonly args: readonly ["ptr"];
        readonly returns: "bool";
    };
    readonly primitives_address_equals: {
        readonly args: readonly ["ptr", "ptr"];
        readonly returns: "bool";
    };
    readonly primitives_keccak256: {
        readonly args: readonly ["ptr", "u64", "ptr"];
        readonly returns: "i32";
    };
    readonly primitives_hash_to_hex: {
        readonly args: readonly ["ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly primitives_hash_from_hex: {
        readonly args: readonly ["cstring", "ptr"];
        readonly returns: "i32";
    };
    readonly primitives_hash_equals: {
        readonly args: readonly ["ptr", "ptr"];
        readonly returns: "bool";
    };
    readonly primitives_hex_to_bytes: {
        readonly args: readonly ["cstring", "ptr", "u64"];
        readonly returns: "i32";
    };
    readonly primitives_bytes_to_hex: {
        readonly args: readonly ["ptr", "u64", "ptr", "u64"];
        readonly returns: "i32";
    };
    readonly primitives_secp256k1_recover_address: {
        readonly args: readonly ["ptr", "ptr", "ptr", "u8", "ptr"];
        readonly returns: "i32";
    };
    readonly secp256k1Sign: {
        readonly args: readonly ["ptr", "ptr", "ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly secp256k1Verify: {
        readonly args: readonly ["ptr", "ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly secp256k1DerivePublicKey: {
        readonly args: readonly ["ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly primitives_sha256: {
        readonly args: readonly ["ptr", "u64", "ptr"];
        readonly returns: "i32";
    };
    readonly primitives_ripemd160: {
        readonly args: readonly ["ptr", "u64", "ptr"];
        readonly returns: "i32";
    };
    readonly primitives_blake2b: {
        readonly args: readonly ["ptr", "u64", "ptr"];
        readonly returns: "i32";
    };
    readonly primitives_solidity_keccak256: {
        readonly args: readonly ["ptr", "u64", "ptr"];
        readonly returns: "i32";
    };
    readonly primitives_solidity_sha256: {
        readonly args: readonly ["ptr", "u64", "ptr"];
        readonly returns: "i32";
    };
    readonly primitives_abi_compute_selector: {
        readonly args: readonly ["cstring", "ptr"];
        readonly returns: "i32";
    };
    readonly state_manager_create: {
        readonly args: readonly [];
        readonly returns: "ptr";
    };
    readonly state_manager_create_with_fork: {
        readonly args: readonly ["ptr"];
        readonly returns: "ptr";
    };
    readonly state_manager_destroy: {
        readonly args: readonly ["ptr"];
        readonly returns: "void";
    };
    readonly state_manager_get_balance_sync: {
        readonly args: readonly ["ptr", "cstring", "ptr", "u64"];
        readonly returns: "i32";
    };
    readonly state_manager_get_nonce_sync: {
        readonly args: readonly ["ptr", "cstring", "ptr"];
        readonly returns: "i32";
    };
    readonly state_manager_get_code_len_sync: {
        readonly args: readonly ["ptr", "cstring", "ptr"];
        readonly returns: "i32";
    };
    readonly state_manager_get_code_sync: {
        readonly args: readonly ["ptr", "cstring", "ptr", "u64"];
        readonly returns: "i32";
    };
    readonly state_manager_get_storage_sync: {
        readonly args: readonly ["ptr", "cstring", "cstring", "ptr", "u64"];
        readonly returns: "i32";
    };
    readonly state_manager_set_balance: {
        readonly args: readonly ["ptr", "cstring", "cstring"];
        readonly returns: "i32";
    };
    readonly state_manager_set_nonce: {
        readonly args: readonly ["ptr", "cstring", "u64"];
        readonly returns: "i32";
    };
    readonly state_manager_set_code: {
        readonly args: readonly ["ptr", "cstring", "ptr", "u64"];
        readonly returns: "i32";
    };
    readonly state_manager_set_storage: {
        readonly args: readonly ["ptr", "cstring", "cstring", "cstring"];
        readonly returns: "i32";
    };
    readonly state_manager_checkpoint: {
        readonly args: readonly ["ptr"];
        readonly returns: "i32";
    };
    readonly state_manager_revert: {
        readonly args: readonly ["ptr"];
        readonly returns: "void";
    };
    readonly state_manager_commit: {
        readonly args: readonly ["ptr"];
        readonly returns: "void";
    };
    readonly state_manager_snapshot: {
        readonly args: readonly ["ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly state_manager_revert_to_snapshot: {
        readonly args: readonly ["ptr", "u64"];
        readonly returns: "i32";
    };
    readonly state_manager_clear_caches: {
        readonly args: readonly ["ptr"];
        readonly returns: "void";
    };
    readonly state_manager_clear_fork_cache: {
        readonly args: readonly ["ptr"];
        readonly returns: "void";
    };
    readonly fork_backend_create: {
        readonly args: readonly ["ptr", "ptr", "cstring", "u64"];
        readonly returns: "ptr";
    };
    readonly fork_backend_destroy: {
        readonly args: readonly ["ptr"];
        readonly returns: "void";
    };
    readonly fork_backend_clear_cache: {
        readonly args: readonly ["ptr"];
        readonly returns: "void";
    };
    readonly fork_backend_next_request: {
        readonly args: readonly ["ptr", "ptr", "ptr", "u64", "ptr", "ptr", "u64", "ptr"];
        readonly returns: "i32";
    };
    readonly fork_backend_continue: {
        readonly args: readonly ["ptr", "u64", "ptr", "u64"];
        readonly returns: "i32";
    };
    readonly blockchain_create: {
        readonly args: readonly [];
        readonly returns: "ptr";
    };
    readonly blockchain_create_with_fork: {
        readonly args: readonly ["ptr"];
        readonly returns: "ptr";
    };
    readonly blockchain_destroy: {
        readonly args: readonly ["ptr"];
        readonly returns: "void";
    };
    readonly blockchain_get_block_by_hash: {
        readonly args: readonly ["ptr", "ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly blockchain_get_block_by_number: {
        readonly args: readonly ["ptr", "u64", "ptr"];
        readonly returns: "i32";
    };
    readonly blockchain_get_canonical_hash: {
        readonly args: readonly ["ptr", "u64", "ptr"];
        readonly returns: "i32";
    };
    readonly blockchain_get_head_block_number: {
        readonly args: readonly ["ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly blockchain_put_block: {
        readonly args: readonly ["ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly blockchain_set_canonical_head: {
        readonly args: readonly ["ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly blockchain_has_block: {
        readonly args: readonly ["ptr", "ptr"];
        readonly returns: "bool";
    };
    readonly blockchain_local_block_count: {
        readonly args: readonly ["ptr"];
        readonly returns: "u64";
    };
    readonly blockchain_orphan_count: {
        readonly args: readonly ["ptr"];
        readonly returns: "u64";
    };
    readonly blockchain_canonical_chain_length: {
        readonly args: readonly ["ptr"];
        readonly returns: "u64";
    };
    readonly blockchain_is_fork_block: {
        readonly args: readonly ["ptr", "u64"];
        readonly returns: "bool";
    };
    readonly fork_block_cache_create: {
        readonly args: readonly ["u64", "u64", "u64", "u64"];
        readonly returns: "ptr";
    };
    readonly fork_block_cache_destroy: {
        readonly args: readonly ["ptr"];
        readonly returns: "void";
    };
    readonly fork_block_cache_next_request: {
        readonly args: readonly ["ptr", "ptr", "ptr", "u64", "ptr", "ptr", "u64", "ptr"];
        readonly returns: "i32";
    };
    readonly fork_block_cache_continue: {
        readonly args: readonly ["ptr", "u64", "ptr", "u64"];
        readonly returns: "i32";
    };
}>>;
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