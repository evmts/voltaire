/**
 * Bun FFI loader for native bindings
 * Uses Bun's dlopen for high-performance native library loading
 */

import { dlopen, FFIType, type Library } from "bun:ffi";
import { getNativeLibPath } from "./platform.js";
import { getNativeErrorMessage } from "./types.js";

let nativeLib: Library<typeof symbols> | null = null;

/**
 * FFI symbol definitions for c_api.zig exports
 * Maps function names to their FFI signatures
 */
const symbols = {
	// Address operations
	primitives_address_from_hex: {
		args: [FFIType.cstring, FFIType.ptr],
		returns: FFIType.i32,
	},
	primitives_address_to_hex: {
		args: [FFIType.ptr, FFIType.ptr],
		returns: FFIType.i32,
	},
	primitives_address_to_checksum_hex: {
		args: [FFIType.ptr, FFIType.ptr],
		returns: FFIType.i32,
	},
	primitives_address_is_zero: {
		args: [FFIType.ptr],
		returns: FFIType.bool,
	},
	primitives_address_equals: {
		args: [FFIType.ptr, FFIType.ptr],
		returns: FFIType.bool,
	},

	// Keccak256 operations
	primitives_keccak256: {
		args: [FFIType.ptr, FFIType.u64, FFIType.ptr],
		returns: FFIType.i32,
	},

	// Hash operations
	primitives_hash_to_hex: {
		args: [FFIType.ptr, FFIType.ptr],
		returns: FFIType.i32,
	},
	primitives_hash_from_hex: {
		args: [FFIType.cstring, FFIType.ptr],
		returns: FFIType.i32,
	},
	primitives_hash_equals: {
		args: [FFIType.ptr, FFIType.ptr],
		returns: FFIType.bool,
	},

	// Hex operations
	primitives_hex_to_bytes: {
		args: [FFIType.cstring, FFIType.ptr, FFIType.ptr],
		returns: FFIType.i32,
	},
	primitives_bytes_to_hex: {
		args: [FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr],
		returns: FFIType.i32,
	},

	// secp256k1 operations
	primitives_secp256k1_recover_address: {
		args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr],
		returns: FFIType.i32,
	},
	secp256k1Sign: {
		args: [FFIType.ptr, FFIType.ptr, FFIType.ptr],
		returns: FFIType.i32,
	},
	secp256k1Verify: {
		args: [FFIType.ptr, FFIType.ptr, FFIType.ptr],
		returns: FFIType.bool,
	},
	secp256k1DerivePublicKey: {
		args: [FFIType.ptr, FFIType.ptr],
		returns: FFIType.i32,
	},

	// Hash functions
	primitives_sha256: {
		args: [FFIType.ptr, FFIType.u64, FFIType.ptr],
		returns: FFIType.i32,
	},
	primitives_ripemd160: {
		args: [FFIType.ptr, FFIType.u64, FFIType.ptr],
		returns: FFIType.i32,
	},
	primitives_blake2b: {
		args: [FFIType.ptr, FFIType.u64, FFIType.ptr],
		returns: FFIType.i32,
	},

	// Solidity-compatible hash functions
	primitives_solidity_keccak256: {
		args: [FFIType.ptr, FFIType.u64, FFIType.ptr],
		returns: FFIType.i32,
	},
	primitives_solidity_sha256: {
		args: [FFIType.ptr, FFIType.u64, FFIType.ptr],
		returns: FFIType.i32,
	},

	// ABI operations
	primitives_abi_compute_selector: {
		args: [FFIType.cstring, FFIType.ptr],
		returns: FFIType.i32,
	},

	// StateManager operations
	state_manager_create: {
		args: [],
		returns: FFIType.ptr,
	},
	state_manager_create_with_fork: {
		args: [FFIType.ptr],
		returns: FFIType.ptr,
	},
	state_manager_destroy: {
		args: [FFIType.ptr],
		returns: FFIType.void,
	},
	state_manager_get_balance_sync: {
		args: [FFIType.ptr, FFIType.cstring, FFIType.ptr, FFIType.u64],
		returns: FFIType.i32,
	},
	state_manager_get_nonce_sync: {
		args: [FFIType.ptr, FFIType.cstring, FFIType.ptr],
		returns: FFIType.i32,
	},
	state_manager_get_code_len_sync: {
		args: [FFIType.ptr, FFIType.cstring, FFIType.ptr],
		returns: FFIType.i32,
	},
	state_manager_get_code_sync: {
		args: [FFIType.ptr, FFIType.cstring, FFIType.ptr, FFIType.u64],
		returns: FFIType.i32,
	},
	state_manager_get_storage_sync: {
		args: [
			FFIType.ptr,
			FFIType.cstring,
			FFIType.cstring,
			FFIType.ptr,
			FFIType.u64,
		],
		returns: FFIType.i32,
	},
	state_manager_set_balance: {
		args: [FFIType.ptr, FFIType.cstring, FFIType.cstring],
		returns: FFIType.i32,
	},
	state_manager_set_nonce: {
		args: [FFIType.ptr, FFIType.cstring, FFIType.u64],
		returns: FFIType.i32,
	},
	state_manager_set_code: {
		args: [FFIType.ptr, FFIType.cstring, FFIType.ptr, FFIType.u64],
		returns: FFIType.i32,
	},
	state_manager_set_storage: {
		args: [FFIType.ptr, FFIType.cstring, FFIType.cstring, FFIType.cstring],
		returns: FFIType.i32,
	},
	state_manager_checkpoint: {
		args: [FFIType.ptr],
		returns: FFIType.i32,
	},
	state_manager_revert: {
		args: [FFIType.ptr],
		returns: FFIType.void,
	},
	state_manager_commit: {
		args: [FFIType.ptr],
		returns: FFIType.void,
	},
	state_manager_snapshot: {
		args: [FFIType.ptr, FFIType.ptr],
		returns: FFIType.i32,
	},
	state_manager_revert_to_snapshot: {
		args: [FFIType.ptr, FFIType.u64],
		returns: FFIType.i32,
	},
	state_manager_clear_caches: {
		args: [FFIType.ptr],
		returns: FFIType.void,
	},
	state_manager_clear_fork_cache: {
		args: [FFIType.ptr],
		returns: FFIType.void,
	},

	// ForkBackend operations
	fork_backend_create: {
		args: [FFIType.ptr, FFIType.ptr, FFIType.cstring, FFIType.u64],
		returns: FFIType.ptr,
	},
	fork_backend_destroy: {
		args: [FFIType.ptr],
		returns: FFIType.void,
	},
	fork_backend_clear_cache: {
		args: [FFIType.ptr],
		returns: FFIType.void,
	},
	fork_backend_next_request: {
		args: [
			FFIType.ptr,
			FFIType.ptr,
			FFIType.ptr,
			FFIType.u64,
			FFIType.ptr,
			FFIType.ptr,
			FFIType.u64,
			FFIType.ptr,
		],
		returns: FFIType.i32,
	},
	fork_backend_continue: {
		args: [FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.u64],
		returns: FFIType.i32,
	},

	// Blockchain operations
	blockchain_create: {
		args: [],
		returns: FFIType.ptr,
	},
	blockchain_create_with_fork: {
		args: [FFIType.ptr],
		returns: FFIType.ptr,
	},
	blockchain_destroy: {
		args: [FFIType.ptr],
		returns: FFIType.void,
	},
	blockchain_get_block_by_hash: {
		args: [FFIType.ptr, FFIType.ptr, FFIType.ptr],
		returns: FFIType.i32,
	},
	blockchain_get_block_by_number: {
		args: [FFIType.ptr, FFIType.u64, FFIType.ptr],
		returns: FFIType.i32,
	},
	blockchain_get_canonical_hash: {
		args: [FFIType.ptr, FFIType.u64, FFIType.ptr],
		returns: FFIType.i32,
	},
	blockchain_get_head_block_number: {
		args: [FFIType.ptr, FFIType.ptr],
		returns: FFIType.i32,
	},
	blockchain_put_block: {
		args: [FFIType.ptr, FFIType.ptr],
		returns: FFIType.i32,
	},
	blockchain_set_canonical_head: {
		args: [FFIType.ptr, FFIType.ptr],
		returns: FFIType.i32,
	},
	blockchain_has_block: {
		args: [FFIType.ptr, FFIType.ptr],
		returns: FFIType.bool,
	},
	blockchain_local_block_count: {
		args: [FFIType.ptr],
		returns: FFIType.u64,
	},
	blockchain_orphan_count: {
		args: [FFIType.ptr],
		returns: FFIType.u64,
	},
	blockchain_canonical_chain_length: {
		args: [FFIType.ptr],
		returns: FFIType.u64,
	},
	blockchain_is_fork_block: {
		args: [FFIType.ptr, FFIType.u64],
		returns: FFIType.bool,
	},

	// ForkBlockCache operations
	fork_block_cache_create: {
		args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u64],
		returns: FFIType.ptr,
	},
	fork_block_cache_destroy: {
		args: [FFIType.ptr],
		returns: FFIType.void,
	},
	fork_block_cache_next_request: {
		args: [
			FFIType.ptr,
			FFIType.ptr,
			FFIType.ptr,
			FFIType.u64,
			FFIType.ptr,
			FFIType.ptr,
			FFIType.u64,
			FFIType.ptr,
		],
		returns: FFIType.i32,
	},
	fork_block_cache_continue: {
		args: [FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.u64],
		returns: FFIType.i32,
	},
} as const;

/**
 * Load native library using Bun FFI
 * @throws Error if library cannot be loaded
 */
export function loadBunNative() {
	if (nativeLib) return nativeLib.symbols;

	// Try multiple possible paths for the native library
	const pathsToTry = [
		getNativeLibPath("voltaire_native"), // Standard build output path
		"./zig-out/native/libprimitives_ts_native.dylib", // macOS current build output
	];

	let lastError: Error | null = null;

	for (const libPath of pathsToTry) {
		try {
			nativeLib = dlopen(libPath, symbols);
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
