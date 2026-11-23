/**
 * Bun FFI loader for native bindings
 * Uses Bun's dlopen for high-performance native library loading.
 *
 * `bun:ffi` is imported lazily inside {@link loadBunNative}. A static import
 * would be hoisted to the top of every bundle that reaches this module
 * (for example `@tevm/voltaire/provider`) and crash Node with
 * ERR_UNSUPPORTED_ESM_URL_SCHEME before any code runs.
 */

import type { Library } from "bun:ffi";
import { getNativeLibPath } from "./platform.js";
import { getNativeErrorMessage } from "./types.js";

let nativeLib: Library<typeof bunFfiSymbols> | null = null;

/**
 * FFI symbol definitions for c_api.zig exports
 * Maps function names to their FFI signatures
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

	// Keccak256 operations
	primitives_keccak256: {
		args: ["ptr", "u64", "ptr"],
		returns: "i32",
	},

	// Hash operations
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

	// Hex operations
	// (hex, out_buf, buf_len) -> bytes written or negative error
	primitives_hex_to_bytes: {
		args: ["cstring", "ptr", "u64"],
		returns: "i32",
	},
	// (data, data_len, out_buf, buf_len) -> chars written or negative error
	primitives_bytes_to_hex: {
		args: ["ptr", "u64", "ptr", "u64"],
		returns: "i32",
	},

	// secp256k1 operations
	// (message_hash[32], r[32], s[32], v, out_address[20])
	primitives_secp256k1_recover_address: {
		args: ["ptr", "ptr", "ptr", "u8", "ptr"],
		returns: "i32",
	},
	// (msg_hash[32], priv_key[32], out_sig[64], out_recid[1])
	secp256k1Sign: {
		args: ["ptr", "ptr", "ptr", "ptr"],
		returns: "i32",
	},
	// (msg_hash[32], sig[64], pub_key[64]) -> 1 valid, 0 invalid
	secp256k1Verify: {
		args: ["ptr", "ptr", "ptr"],
		returns: "i32",
	},
	secp256k1DerivePublicKey: {
		args: ["ptr", "ptr"],
		returns: "i32",
	},

	// Hash functions
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

	// Solidity-compatible hash functions
	primitives_solidity_keccak256: {
		args: ["ptr", "u64", "ptr"],
		returns: "i32",
	},
	primitives_solidity_sha256: {
		args: ["ptr", "u64", "ptr"],
		returns: "i32",
	},

	// ABI operations
	primitives_abi_compute_selector: {
		args: ["cstring", "ptr"],
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
	// (rpc_context: usize, vtable_fetch_by_number: usize, vtable_fetch_by_hash: usize, fork_block_number: u64)
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

/**
 * Load native library using Bun FFI
 * @throws Error if library cannot be loaded
 */
export async function loadBunNative() {
	if (nativeLib) return nativeLib.symbols;

	const { dlopen } = await import("bun:ffi");

	// Try multiple possible paths for the native library
	const pathsToTry = [
		getNativeLibPath("voltaire_native"), // Standard build output path
		"./zig-out/native/libprimitives_ts_native.dylib", // macOS current build output
	];

	let lastError: Error | null = null;

	for (const libPath of pathsToTry) {
		try {
			nativeLib = dlopen(libPath, bunFfiSymbols);
			return nativeLib.symbols;
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));
			// Continue trying next path
		}
	}

	throw new Error(
		`Failed to load native library with Bun FFI: ${lastError?.message || "Unknown error"}`,
	);
}

/**
 * Check if native library is loaded
 */
export function isLoaded(): boolean {
	return nativeLib !== null;
}

/**
 * Unload native library
 * Note: Bun doesn't provide explicit unload, just clear reference
 */
export function unload(): void {
	nativeLib = null;
}

/**
 * Helper to check error code and throw if non-zero
 */
export function checkError(code: number, operation: string): void {
	if (code !== 0) {
		const message = getNativeErrorMessage(code);
		throw new Error(`Native ${operation} failed: ${message}`);
	}
}

/**
 * Helper to allocate buffer for output
 */
export function allocateOutput(size: number): Uint8Array {
	return new Uint8Array(size);
}

/**
 * Helper to allocate buffer for string output
 */
export function allocateStringOutput(size: number): {
	buffer: Uint8Array;
	ptr: Uint8Array;
} {
	const buffer = new Uint8Array(size);
	const ptr = new Uint8Array(8); // size_t* for output length
	return { buffer, ptr };
}
