/**
 * Bun FFI loader for native bindings.
 * Uses Bun's synchronous `dlopen` for zero-overhead native library loading.
 *
 * `bun:ffi` is loaded lazily via `createRequire(import.meta.url)` inside
 * {@link loadBunNativeSync}. A static import would be hoisted to the top of
 * bundles that reach this module (such as `@tevm/voltaire/provider`) and crash
 * Node with ERR_UNSUPPORTED_ESM_URL_SCHEME before any code runs.
 */
import type { Library } from "bun:ffi";
/**
 * FFI symbol definitions for c_api.zig, state-manager/c_api.zig, and
 * blockchain/c_api.zig exports.
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
    readonly primitives_address_validate_checksum: {
        readonly args: readonly ["cstring"];
        readonly returns: "bool";
    };
    readonly primitives_calculate_create_address: {
        readonly args: readonly ["ptr", "u64", "ptr"];
        readonly returns: "i32";
    };
    readonly primitives_calculate_create2_address: {
        readonly args: readonly ["ptr", "ptr", "ptr", "u64", "ptr"];
        readonly returns: "i32";
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
    readonly primitives_eip191_hash_message: {
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
    readonly blake2Hash: {
        readonly args: readonly ["ptr", "u64", "ptr", "u64"];
        readonly returns: "i32";
    };
    readonly primitives_hex_to_bytes: {
        readonly args: readonly ["cstring", "ptr", "u64"];
        readonly returns: "i32";
    };
    readonly primitives_bytes_to_hex: {
        readonly args: readonly ["ptr", "u64", "ptr", "u64"];
        readonly returns: "i32";
    };
    readonly primitives_u256_from_hex: {
        readonly args: readonly ["cstring", "ptr"];
        readonly returns: "i32";
    };
    readonly primitives_u256_to_hex: {
        readonly args: readonly ["ptr", "ptr", "u64"];
        readonly returns: "i32";
    };
    readonly primitives_secp256k1_recover_pubkey: {
        readonly args: readonly ["ptr", "ptr", "ptr", "u8", "ptr"];
        readonly returns: "i32";
    };
    readonly primitives_secp256k1_recover_address: {
        readonly args: readonly ["ptr", "ptr", "ptr", "u8", "ptr"];
        readonly returns: "i32";
    };
    readonly primitives_secp256k1_pubkey_from_private: {
        readonly args: readonly ["ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly primitives_secp256k1_validate_signature: {
        readonly args: readonly ["ptr", "ptr"];
        readonly returns: "bool";
    };
    readonly secp256k1Sign: {
        readonly args: readonly ["ptr", "ptr", "ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly secp256k1Verify: {
        readonly args: readonly ["ptr", "ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly secp256k1Recover: {
        readonly args: readonly ["ptr", "ptr", "u8", "ptr"];
        readonly returns: "i32";
    };
    readonly secp256k1DerivePublicKey: {
        readonly args: readonly ["ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly primitives_signature_normalize: {
        readonly args: readonly ["ptr", "ptr"];
        readonly returns: "bool";
    };
    readonly primitives_signature_is_canonical: {
        readonly args: readonly ["ptr", "ptr"];
        readonly returns: "bool";
    };
    readonly primitives_signature_parse: {
        readonly args: readonly ["ptr", "u64", "ptr", "ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly primitives_signature_serialize: {
        readonly args: readonly ["ptr", "ptr", "u8", "bool", "ptr"];
        readonly returns: "i32";
    };
    readonly primitives_generate_private_key: {
        readonly args: readonly ["ptr"];
        readonly returns: "i32";
    };
    readonly primitives_compress_public_key: {
        readonly args: readonly ["ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly p256Sign: {
        readonly args: readonly ["ptr", "ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly p256Verify: {
        readonly args: readonly ["ptr", "ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly p256DerivePublicKey: {
        readonly args: readonly ["ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly p256Ecdh: {
        readonly args: readonly ["ptr", "ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly ed25519Sign: {
        readonly args: readonly ["ptr", "u64", "ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly ed25519Verify: {
        readonly args: readonly ["ptr", "u64", "ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly ed25519DerivePublicKey: {
        readonly args: readonly ["ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly x25519DerivePublicKey: {
        readonly args: readonly ["ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly x25519Scalarmult: {
        readonly args: readonly ["ptr", "ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly x25519KeypairFromSeed: {
        readonly args: readonly ["ptr", "ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly aesGcm128Encrypt: {
        readonly args: readonly ["ptr", "u64", "ptr", "ptr", "ptr", "u64", "ptr"];
        readonly returns: "i32";
    };
    readonly aesGcm128Decrypt: {
        readonly args: readonly ["ptr", "u64", "ptr", "ptr", "ptr", "u64", "ptr"];
        readonly returns: "i32";
    };
    readonly aesGcm256Encrypt: {
        readonly args: readonly ["ptr", "u64", "ptr", "ptr", "ptr", "u64", "ptr"];
        readonly returns: "i32";
    };
    readonly aesGcm256Decrypt: {
        readonly args: readonly ["ptr", "u64", "ptr", "ptr", "ptr", "u64", "ptr"];
        readonly returns: "i32";
    };
    readonly kzg_load_trusted_setup: {
        readonly args: readonly [];
        readonly returns: "i32";
    };
    readonly kzg_load_trusted_setup_bytes: {
        readonly args: readonly ["ptr", "u64"];
        readonly returns: "i32";
    };
    readonly kzg_free_trusted_setup: {
        readonly args: readonly [];
        readonly returns: "i32";
    };
    readonly kzg_blob_to_commitment: {
        readonly args: readonly ["ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly kzg_compute_proof: {
        readonly args: readonly ["ptr", "ptr", "ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly kzg_compute_blob_proof: {
        readonly args: readonly ["ptr", "ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly kzg_verify_proof: {
        readonly args: readonly ["ptr", "ptr", "ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly kzg_verify_blob_proof: {
        readonly args: readonly ["ptr", "ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly primitives_bn254_ecadd: {
        readonly args: readonly ["ptr", "u64", "ptr", "u64"];
        readonly returns: "i32";
    };
    readonly primitives_bn254_ecmul: {
        readonly args: readonly ["ptr", "u64", "ptr", "u64"];
        readonly returns: "i32";
    };
    readonly primitives_bn254_ecpairing: {
        readonly args: readonly ["ptr", "u64", "ptr", "u64"];
        readonly returns: "i32";
    };
    readonly primitives_modexp: {
        readonly args: readonly ["ptr", "u64", "ptr", "u64", "ptr", "u64", "ptr", "u64"];
        readonly returns: "i32";
    };
    readonly primitives_bls12_381_g1_add: {
        readonly args: readonly ["ptr", "u64", "ptr", "u64"];
        readonly returns: "i32";
    };
    readonly primitives_bls12_381_g1_mul: {
        readonly args: readonly ["ptr", "u64", "ptr", "u64"];
        readonly returns: "i32";
    };
    readonly primitives_bls12_381_g1_msm: {
        readonly args: readonly ["ptr", "u64", "ptr", "u64"];
        readonly returns: "i32";
    };
    readonly primitives_bls12_381_g2_add: {
        readonly args: readonly ["ptr", "u64", "ptr", "u64"];
        readonly returns: "i32";
    };
    readonly primitives_bls12_381_g2_mul: {
        readonly args: readonly ["ptr", "u64", "ptr", "u64"];
        readonly returns: "i32";
    };
    readonly primitives_bls12_381_g2_msm: {
        readonly args: readonly ["ptr", "u64", "ptr", "u64"];
        readonly returns: "i32";
    };
    readonly primitives_bls12_381_pairing: {
        readonly args: readonly ["ptr", "u64", "ptr", "u64"];
        readonly returns: "i32";
    };
    readonly primitives_bls12_381_map_fp_to_g1: {
        readonly args: readonly ["ptr", "u64", "ptr", "u64"];
        readonly returns: "i32";
    };
    readonly primitives_bls12_381_map_fp2_to_g2: {
        readonly args: readonly ["ptr", "u64", "ptr", "u64"];
        readonly returns: "i32";
    };
    readonly primitives_rlp_encode_bytes: {
        readonly args: readonly ["ptr", "u64", "ptr", "u64"];
        readonly returns: "i32";
    };
    readonly primitives_rlp_encode_uint: {
        readonly args: readonly ["ptr", "ptr", "u64"];
        readonly returns: "i32";
    };
    readonly primitives_rlp_to_hex: {
        readonly args: readonly ["ptr", "u64", "ptr", "u64"];
        readonly returns: "i32";
    };
    readonly primitives_rlp_from_hex: {
        readonly args: readonly ["cstring", "ptr", "u64"];
        readonly returns: "i32";
    };
    readonly primitives_tx_detect_type: {
        readonly args: readonly ["ptr", "u64"];
        readonly returns: "i32";
    };
    readonly primitives_abi_compute_selector: {
        readonly args: readonly ["cstring", "ptr"];
        readonly returns: "i32";
    };
    readonly primitives_bytecode_analyze_jumpdests: {
        readonly args: readonly ["ptr", "u64", "ptr", "u64"];
        readonly returns: "i32";
    };
    readonly primitives_bytecode_is_boundary: {
        readonly args: readonly ["ptr", "u64", "u32"];
        readonly returns: "bool";
    };
    readonly primitives_bytecode_is_valid_jumpdest: {
        readonly args: readonly ["ptr", "u64", "u32"];
        readonly returns: "bool";
    };
    readonly primitives_bytecode_validate: {
        readonly args: readonly ["ptr", "u64"];
        readonly returns: "i32";
    };
    readonly primitives_blob_from_data: {
        readonly args: readonly ["ptr", "u64", "ptr"];
        readonly returns: "i32";
    };
    readonly primitives_blob_to_data: {
        readonly args: readonly ["ptr", "ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly primitives_blob_is_valid: {
        readonly args: readonly ["u64"];
        readonly returns: "i32";
    };
    readonly primitives_version_string: {
        readonly args: readonly [];
        readonly returns: "cstring";
    };
    readonly hdwallet_generate_mnemonic: {
        readonly args: readonly ["ptr", "u64", "ptr", "u64"];
        readonly returns: "i32";
    };
    readonly hdwallet_mnemonic_to_seed: {
        readonly args: readonly ["cstring", "ptr", "ptr"];
        readonly returns: "i32";
    };
    readonly hdwallet_validate_mnemonic: {
        readonly args: readonly ["cstring"];
        readonly returns: "i32";
    };
    readonly hdwallet_from_seed: {
        readonly args: readonly ["ptr", "u64"];
        readonly returns: "u64";
    };
    readonly hdwallet_derive: {
        readonly args: readonly ["u64", "ptr", "u64"];
        readonly returns: "u64";
    };
    readonly hdwallet_get_private_key: {
        readonly args: readonly ["u64", "ptr"];
        readonly returns: "i32";
    };
    readonly hdwallet_get_public_key: {
        readonly args: readonly ["u64", "ptr"];
        readonly returns: "i32";
    };
    readonly hdwallet_get_address: {
        readonly args: readonly ["u64", "ptr"];
        readonly returns: "i32";
    };
    readonly hdwallet_free: {
        readonly args: readonly ["u64"];
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
export type BunNativeSymbols = Library<typeof bunFfiSymbols>["symbols"];
/**
 * Load native library synchronously using Bun FFI (`dlopen`).
 * @throws {NativeLibraryNotFoundError} If library cannot be found or opened
 */
export declare function loadBunNativeSync(): BunNativeSymbols;
/**
 * Load native library using Bun FFI (async wrapper over {@link loadBunNativeSync}).
 * @throws {NativeLibraryNotFoundError} If library cannot be found or opened
 */
export declare function loadBunNative(): Promise<BunNativeSymbols>;
/**
 * Return the path of the currently loaded Bun FFI shared library, or null.
 */
export declare function getLoadedBunLibPath(): string | null;
/**
 * Check if native library is loaded.
 */
export declare function isLoaded(): boolean;
/**
 * Unload native library handle and clear cached reference.
 */
export declare function unload(): void;
/**
 * Check error code and throw a typed NativeError if non-zero.
 */
export declare function checkError(code: number, operation: string): void;
/**
 * Helper to allocate buffer for output.
 */
export declare function allocateOutput(size: number): Uint8Array;
/**
 * Helper to allocate buffer for string output.
 */
export declare function allocateStringOutput(size: number): {
    buffer: Uint8Array;
    ptr: Uint8Array;
};
//# sourceMappingURL=bun-ffi.d.ts.map