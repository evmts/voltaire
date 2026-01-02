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
} as const;

/**
 * Load native library using Bun FFI
 * @throws Error if library cannot be loaded
 */
export function loadBunNative() {
	if (nativeLib) return nativeLib.symbols;

	try {
		const libPath = getNativeLibPath();

		nativeLib = dlopen(libPath, symbols);

		return nativeLib.symbols;
	} catch (error) {
		throw new Error(
			`Failed to load native library with Bun FFI: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
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
