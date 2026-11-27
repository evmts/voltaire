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
import { createRequire } from "node:module";
import {
	getNativeLibCandidates,
	getPlatform,
	isNativeSupported,
} from "./platform.js";
import {
	getNativeErrorMessage,
	NativeError,
	NativeLibraryNotFoundError,
} from "./types.js";

/**
 * FFI symbol definitions for c_api.zig, state-manager/c_api.zig, and
 * blockchain/c_api.zig exports.
 */
export const bunFfiSymbols = {
	// Address operations
	primitives_address_from_hex: {
		args: ["cstring", "ptr"],
		returns: "i32",
	},
	primitives_address_to_hex: {
		args: ["ptr", "ptr"],
		returns: "i32",
	},
	primitives_address_to_checksum_hex: {
		args: ["ptr", "ptr"],
		returns: "i32",
	},
	primitives_address_is_zero: {
		args: ["ptr"],
		returns: "bool",
	},
	primitives_address_equals: {
		args: ["ptr", "ptr"],
		returns: "bool",
	},
	primitives_address_validate_checksum: {
		args: ["cstring"],
		returns: "bool",
	},
	primitives_calculate_create_address: {
		args: ["ptr", "u64", "ptr"],
		returns: "i32",
	},
	primitives_calculate_create2_address: {
		args: ["ptr", "ptr", "ptr", "u64", "ptr"],
		returns: "i32",
	},

	// Keccak256 & hash utilities
	primitives_keccak256: {
		args: ["ptr", "u64", "ptr"],
		returns: "i32",
	},
	primitives_hash_to_hex: {
		args: ["ptr", "ptr"],
		returns: "i32",
	},
	primitives_hash_from_hex: {
		args: ["cstring", "ptr"],
		returns: "i32",
	},
	primitives_hash_equals: {
		args: ["ptr", "ptr"],
		returns: "bool",
	},
	primitives_eip191_hash_message: {
		args: ["ptr", "u64", "ptr"],
		returns: "i32",
	},
	primitives_solidity_keccak256: {
		args: ["ptr", "u64", "ptr"],
		returns: "i32",
	},
	primitives_solidity_sha256: {
		args: ["ptr", "u64", "ptr"],
		returns: "i32",
	},

	// Hash algorithms (SHA256, RIPEMD160, BLAKE2b)
	primitives_sha256: {
		args: ["ptr", "u64", "ptr"],
		returns: "i32",
	},
	primitives_ripemd160: {
		args: ["ptr", "u64", "ptr"],
		returns: "i32",
	},
	primitives_blake2b: {
		args: ["ptr", "u64", "ptr"],
		returns: "i32",
	},
	blake2Hash: {
		args: ["ptr", "u64", "ptr", "u64"],
		returns: "i32",
	},

	// Hex & U256 operations
	primitives_hex_to_bytes: {
		args: ["cstring", "ptr", "u64"],
		returns: "i32",
	},
	primitives_bytes_to_hex: {
		args: ["ptr", "u64", "ptr", "u64"],
		returns: "i32",
	},
	primitives_u256_from_hex: {
		args: ["cstring", "ptr"],
		returns: "i32",
	},
	primitives_u256_to_hex: {
		args: ["ptr", "ptr", "u64"],
		returns: "i32",
	},

	// secp256k1 & signature utilities
	primitives_secp256k1_recover_pubkey: {
		args: ["ptr", "ptr", "ptr", "u8", "ptr"],
		returns: "i32",
	},
	primitives_secp256k1_recover_address: {
		args: ["ptr", "ptr", "ptr", "u8", "ptr"],
		returns: "i32",
	},
	primitives_secp256k1_pubkey_from_private: {
		args: ["ptr", "ptr"],
		returns: "i32",
	},
	primitives_secp256k1_validate_signature: {
		args: ["ptr", "ptr"],
		returns: "bool",
	},
	secp256k1Sign: {
		args: ["ptr", "ptr", "ptr", "ptr"],
		returns: "i32",
	},
	secp256k1Verify: {
		args: ["ptr", "ptr", "ptr"],
		returns: "i32",
	},
	secp256k1Recover: {
		args: ["ptr", "ptr", "u8", "ptr"],
		returns: "i32",
	},
	secp256k1DerivePublicKey: {
		args: ["ptr", "ptr"],
		returns: "i32",
	},
	primitives_signature_normalize: {
		args: ["ptr", "ptr"],
		returns: "bool",
	},
	primitives_signature_is_canonical: {
		args: ["ptr", "ptr"],
		returns: "bool",
	},
	primitives_signature_parse: {
		args: ["ptr", "u64", "ptr", "ptr", "ptr"],
		returns: "i32",
	},
	primitives_signature_serialize: {
		args: ["ptr", "ptr", "u8", "bool", "ptr"],
		returns: "i32",
	},
	primitives_generate_private_key: {
		args: ["ptr"],
		returns: "i32",
	},
	primitives_compress_public_key: {
		args: ["ptr", "ptr"],
		returns: "i32",
	},

	// P256 (secp256r1) operations
	p256Sign: {
		args: ["ptr", "ptr", "ptr"],
		returns: "i32",
	},
	p256Verify: {
		args: ["ptr", "ptr", "ptr"],
		returns: "i32",
	},
	p256DerivePublicKey: {
		args: ["ptr", "ptr"],
		returns: "i32",
	},
	p256Ecdh: {
		args: ["ptr", "ptr", "ptr"],
		returns: "i32",
	},

	// Ed25519 operations
	ed25519Sign: {
		args: ["ptr", "u64", "ptr", "ptr"],
		returns: "i32",
	},
	ed25519Verify: {
		args: ["ptr", "u64", "ptr", "ptr"],
		returns: "i32",
	},
	ed25519DerivePublicKey: {
		args: ["ptr", "ptr"],
		returns: "i32",
	},

	// X25519 operations
	x25519DerivePublicKey: {
		args: ["ptr", "ptr"],
		returns: "i32",
	},
	x25519Scalarmult: {
		args: ["ptr", "ptr", "ptr"],
		returns: "i32",
	},
	x25519KeypairFromSeed: {
		args: ["ptr", "ptr", "ptr"],
		returns: "i32",
	},

	// AES-GCM operations
	aesGcm128Encrypt: {
		args: ["ptr", "u64", "ptr", "ptr", "ptr", "u64", "ptr"],
		returns: "i32",
	},
	aesGcm128Decrypt: {
		args: ["ptr", "u64", "ptr", "ptr", "ptr", "u64", "ptr"],
		returns: "i32",
	},
	aesGcm256Encrypt: {
		args: ["ptr", "u64", "ptr", "ptr", "ptr", "u64", "ptr"],
		returns: "i32",
	},
	aesGcm256Decrypt: {
		args: ["ptr", "u64", "ptr", "ptr", "ptr", "u64", "ptr"],
		returns: "i32",
	},

	// KZG (EIP-4844) operations
	kzg_load_trusted_setup: {
		args: [],
		returns: "i32",
	},
	kzg_load_trusted_setup_bytes: {
		args: ["ptr", "u64"],
		returns: "i32",
	},
	kzg_free_trusted_setup: {
		args: [],
		returns: "i32",
	},
	kzg_blob_to_commitment: {
		args: ["ptr", "ptr"],
		returns: "i32",
	},
	kzg_compute_proof: {
		args: ["ptr", "ptr", "ptr", "ptr"],
		returns: "i32",
	},
	kzg_compute_blob_proof: {
		args: ["ptr", "ptr", "ptr"],
		returns: "i32",
	},
	kzg_verify_proof: {
		args: ["ptr", "ptr", "ptr", "ptr"],
		returns: "i32",
	},
	kzg_verify_blob_proof: {
		args: ["ptr", "ptr", "ptr"],
		returns: "i32",
	},

	// BN254 (EIP-196 / EIP-197) operations
	primitives_bn254_ecadd: {
		args: ["ptr", "u64", "ptr", "u64"],
		returns: "i32",
	},
	primitives_bn254_ecmul: {
		args: ["ptr", "u64", "ptr", "u64"],
		returns: "i32",
	},
	primitives_bn254_ecpairing: {
		args: ["ptr", "u64", "ptr", "u64"],
		returns: "i32",
	},

	// ModExp (EIP-198) operations
	primitives_modexp: {
		args: ["ptr", "u64", "ptr", "u64", "ptr", "u64", "ptr", "u64"],
		returns: "i32",
	},

	// BLS12-381 (EIP-2537 via blst) operations
	primitives_bls12_381_g1_add: {
		args: ["ptr", "u64", "ptr", "u64"],
		returns: "i32",
	},
	primitives_bls12_381_g1_mul: {
		args: ["ptr", "u64", "ptr", "u64"],
		returns: "i32",
	},
	primitives_bls12_381_g1_msm: {
		args: ["ptr", "u64", "ptr", "u64"],
		returns: "i32",
	},
	primitives_bls12_381_g2_add: {
		args: ["ptr", "u64", "ptr", "u64"],
		returns: "i32",
	},
	primitives_bls12_381_g2_mul: {
		args: ["ptr", "u64", "ptr", "u64"],
		returns: "i32",
	},
	primitives_bls12_381_g2_msm: {
		args: ["ptr", "u64", "ptr", "u64"],
		returns: "i32",
	},
	primitives_bls12_381_pairing: {
		args: ["ptr", "u64", "ptr", "u64"],
		returns: "i32",
	},
	primitives_bls12_381_map_fp_to_g1: {
		args: ["ptr", "u64", "ptr", "u64"],
		returns: "i32",
	},
	primitives_bls12_381_map_fp2_to_g2: {
		args: ["ptr", "u64", "ptr", "u64"],
		returns: "i32",
	},

	// RLP, Transaction, ABI, Bytecode, Blob, Version operations
	primitives_rlp_encode_bytes: {
		args: ["ptr", "u64", "ptr", "u64"],
		returns: "i32",
	},
	primitives_rlp_encode_uint: {
		args: ["ptr", "ptr", "u64"],
		returns: "i32",
	},
	primitives_rlp_to_hex: {
		args: ["ptr", "u64", "ptr", "u64"],
		returns: "i32",
	},
	primitives_rlp_from_hex: {
		args: ["cstring", "ptr", "u64"],
		returns: "i32",
	},
	primitives_tx_detect_type: {
		args: ["ptr", "u64"],
		returns: "i32",
	},
	primitives_abi_compute_selector: {
		args: ["cstring", "ptr"],
		returns: "i32",
	},
	primitives_bytecode_analyze_jumpdests: {
		args: ["ptr", "u64", "ptr", "u64"],
		returns: "i32",
	},
	primitives_bytecode_is_boundary: {
		args: ["ptr", "u64", "u32"],
		returns: "bool",
	},
	primitives_bytecode_is_valid_jumpdest: {
		args: ["ptr", "u64", "u32"],
		returns: "bool",
	},
	primitives_bytecode_validate: {
		args: ["ptr", "u64"],
		returns: "i32",
	},
	primitives_blob_from_data: {
		args: ["ptr", "u64", "ptr"],
		returns: "i32",
	},
	primitives_blob_to_data: {
		args: ["ptr", "ptr", "ptr"],
		returns: "i32",
	},
	primitives_blob_is_valid: {
		args: ["u64"],
		returns: "i32",
	},
	primitives_version_string: {
		args: [],
		returns: "cstring",
	},

	// HD Wallet (BIP-39 / BIP-32 via libwally-core)
	hdwallet_generate_mnemonic: {
		args: ["ptr", "u64", "ptr", "u64"],
		returns: "i32",
	},
	hdwallet_mnemonic_to_seed: {
		args: ["cstring", "ptr", "ptr"],
		returns: "i32",
	},
	hdwallet_validate_mnemonic: {
		args: ["cstring"],
		returns: "i32",
	},
	hdwallet_from_seed: {
		args: ["ptr", "u64"],
		returns: "u64",
	},
	hdwallet_derive: {
		args: ["u64", "ptr", "u64"],
		returns: "u64",
	},
	hdwallet_get_private_key: {
		args: ["u64", "ptr"],
		returns: "i32",
	},
	hdwallet_get_public_key: {
		args: ["u64", "ptr"],
		returns: "i32",
	},
	hdwallet_get_address: {
		args: ["u64", "ptr"],
		returns: "i32",
	},
	hdwallet_free: {
		args: ["u64"],
		returns: "i32",
	},

	// StateManager operations
	state_manager_create: {
		args: [],
		returns: "ptr",
	},
	state_manager_create_with_fork: {
		args: ["ptr"],
		returns: "ptr",
	},
	state_manager_destroy: {
		args: ["ptr"],
		returns: "void",
	},
	state_manager_get_balance_sync: {
		args: ["ptr", "cstring", "ptr", "u64"],
		returns: "i32",
	},
	state_manager_get_nonce_sync: {
		args: ["ptr", "cstring", "ptr"],
		returns: "i32",
	},
	state_manager_get_code_len_sync: {
		args: ["ptr", "cstring", "ptr"],
		returns: "i32",
	},
	state_manager_get_code_sync: {
		args: ["ptr", "cstring", "ptr", "u64"],
		returns: "i32",
	},
	state_manager_get_storage_sync: {
		args: ["ptr", "cstring", "cstring", "ptr", "u64"],
		returns: "i32",
	},
	state_manager_set_balance: {
		args: ["ptr", "cstring", "cstring"],
		returns: "i32",
	},
	state_manager_set_nonce: {
		args: ["ptr", "cstring", "u64"],
		returns: "i32",
	},
	state_manager_set_code: {
		args: ["ptr", "cstring", "ptr", "u64"],
		returns: "i32",
	},
	state_manager_set_storage: {
		args: ["ptr", "cstring", "cstring", "cstring"],
		returns: "i32",
	},
	state_manager_checkpoint: {
		args: ["ptr"],
		returns: "i32",
	},
	state_manager_revert: {
		args: ["ptr"],
		returns: "void",
	},
	state_manager_commit: {
		args: ["ptr"],
		returns: "void",
	},
	state_manager_snapshot: {
		args: ["ptr", "ptr"],
		returns: "i32",
	},
	state_manager_revert_to_snapshot: {
		args: ["ptr", "u64"],
		returns: "i32",
	},
	state_manager_clear_caches: {
		args: ["ptr"],
		returns: "void",
	},
	state_manager_clear_fork_cache: {
		args: ["ptr"],
		returns: "void",
	},

	// ForkBackend operations
	fork_backend_create: {
		args: ["ptr", "ptr", "cstring", "u64"],
		returns: "ptr",
	},
	fork_backend_destroy: {
		args: ["ptr"],
		returns: "void",
	},
	fork_backend_clear_cache: {
		args: ["ptr"],
		returns: "void",
	},
	fork_backend_next_request: {
		args: ["ptr", "ptr", "ptr", "u64", "ptr", "ptr", "u64", "ptr"],
		returns: "i32",
	},
	fork_backend_continue: {
		args: ["ptr", "u64", "ptr", "u64"],
		returns: "i32",
	},

	// Blockchain operations
	blockchain_create: {
		args: [],
		returns: "ptr",
	},
	blockchain_create_with_fork: {
		args: ["ptr"],
		returns: "ptr",
	},
	blockchain_destroy: {
		args: ["ptr"],
		returns: "void",
	},
	blockchain_get_block_by_hash: {
		args: ["ptr", "ptr", "ptr"],
		returns: "i32",
	},
	blockchain_get_block_by_number: {
		args: ["ptr", "u64", "ptr"],
		returns: "i32",
	},
	blockchain_get_canonical_hash: {
		args: ["ptr", "u64", "ptr"],
		returns: "i32",
	},
	blockchain_get_head_block_number: {
		args: ["ptr", "ptr"],
		returns: "i32",
	},
	blockchain_put_block: {
		args: ["ptr", "ptr"],
		returns: "i32",
	},
	blockchain_set_canonical_head: {
		args: ["ptr", "ptr"],
		returns: "i32",
	},
	blockchain_has_block: {
		args: ["ptr", "ptr"],
		returns: "bool",
	},
	blockchain_local_block_count: {
		args: ["ptr"],
		returns: "u64",
	},
	blockchain_orphan_count: {
		args: ["ptr"],
		returns: "u64",
	},
	blockchain_canonical_chain_length: {
		args: ["ptr"],
		returns: "u64",
	},
	blockchain_is_fork_block: {
		args: ["ptr", "u64"],
		returns: "bool",
	},

	// ForkBlockCache operations
	fork_block_cache_create: {
		args: ["u64", "u64", "u64", "u64"],
		returns: "ptr",
	},
	fork_block_cache_destroy: {
		args: ["ptr"],
		returns: "void",
	},
	fork_block_cache_next_request: {
		args: ["ptr", "ptr", "ptr", "u64", "ptr", "ptr", "u64", "ptr"],
		returns: "i32",
	},
	fork_block_cache_continue: {
		args: ["ptr", "u64", "ptr", "u64"],
		returns: "i32",
	},
} as const;

export type BunNativeSymbols = Library<typeof bunFfiSymbols>["symbols"];

interface BunFfiModule {
	dlopen: typeof import("bun:ffi").dlopen;
}

const BUN_FFI_SPECIFIER = "bun:ffi";

let nativeLib: Library<typeof bunFfiSymbols> | null = null;
let loadedLibPath: string | null = null;

function requireBunFfi(): BunFfiModule {
	const req = createRequire(import.meta.url);
	return req(BUN_FFI_SPECIFIER) as BunFfiModule;
}

/**
 * Load native library synchronously using Bun FFI (`dlopen`).
 * @throws {NativeLibraryNotFoundError} If library cannot be found or opened
 */
export function loadBunNativeSync(): BunNativeSymbols {
	if (nativeLib) return nativeLib.symbols;

	const { dlopen } = requireBunFfi();
	const candidates = getNativeLibCandidates({ runtime: "bun-ffi" });
	let lastError: Error | null = null;

	for (const libPath of candidates) {
		try {
			nativeLib = dlopen(libPath, bunFfiSymbols);
			loadedLibPath = libPath;
			return nativeLib.symbols;
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));
		}
	}

	const platform = isNativeSupported()
		? getPlatform()
		: `${process.platform}-${process.arch}`;
	throw new NativeLibraryNotFoundError(
		platform,
		candidates,
		lastError ?? undefined,
	);
}

/**
 * Load native library using Bun FFI (async wrapper over {@link loadBunNativeSync}).
 * @throws {NativeLibraryNotFoundError} If library cannot be found or opened
 */
export async function loadBunNative(): Promise<BunNativeSymbols> {
	return loadBunNativeSync();
}

/**
 * Return the path of the currently loaded Bun FFI shared library, or null.
 */
export function getLoadedBunLibPath(): string | null {
	return loadedLibPath;
}

/**
 * Check if native library is loaded.
 */
export function isLoaded(): boolean {
	return nativeLib !== null;
}

/**
 * Unload native library handle and clear cached reference.
 */
export function unload(): void {
	if (nativeLib) {
		try {
			nativeLib.close();
		} catch {
			// Ignore close errors if already closed
		}
	}
	nativeLib = null;
	loadedLibPath = null;
}

/**
 * Check error code and throw a typed NativeError if non-zero.
 */
export function checkError(code: number, operation: string): void {
	if (code !== 0) {
		throw new NativeError(
			operation,
			code,
			`Native ${operation} failed: ${getNativeErrorMessage(code)}`,
		);
	}
}

/**
 * Helper to allocate buffer for output.
 */
export function allocateOutput(size: number): Uint8Array {
	return new Uint8Array(size);
}

/**
 * Helper to allocate buffer for string output.
 */
export function allocateStringOutput(size: number): {
	buffer: Uint8Array;
	ptr: Uint8Array;
} {
	const buffer = new Uint8Array(size);
	const ptr = new Uint8Array(8);
	return { buffer, ptr };
}
