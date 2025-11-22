/**
 * Node-API loader for native bindings
 * Uses Node.js native addon loading for compatibility
 */

import { getNativeLibPath } from "./platform.js";
import { getNativeErrorMessage } from "./types.js";

/**
 * Native module interface (loaded via require/dlopen)
 */
interface NativeModule {
	// Address operations
	primitives_address_from_hex(hex: string, output: Uint8Array): number;
	primitives_address_to_hex(address: Uint8Array, output: Uint8Array): number;
	primitives_address_to_checksum_hex(
		address: Uint8Array,
		output: Uint8Array,
	): number;
	primitives_address_is_zero(address: Uint8Array): boolean;
	primitives_address_equals(a: Uint8Array, b: Uint8Array): boolean;

	// Keccak256 operations
	primitives_keccak256(
		data: Uint8Array,
		length: number,
		output: Uint8Array,
	): number;

	// Hash operations
	primitives_hash_to_hex(hash: Uint8Array, output: Uint8Array): number;
	primitives_hash_from_hex(hex: string, output: Uint8Array): number;
	primitives_hash_equals(a: Uint8Array, b: Uint8Array): boolean;

	// Hex operations
	primitives_hex_to_bytes(
		hex: string,
		output: Uint8Array,
		lengthOut: Uint8Array,
	): number;
	primitives_bytes_to_hex(
		bytes: Uint8Array,
		length: number,
		output: Uint8Array,
		lengthOut: Uint8Array,
	): number;

	// secp256k1 operations
	primitives_secp256k1_recover_address(
		hash: Uint8Array,
		recoveryId: number,
		signature: Uint8Array,
		output: Uint8Array,
	): number;
	secp256k1Sign(
		hash: Uint8Array,
		privateKey: Uint8Array,
		output: Uint8Array,
	): number;
	secp256k1Verify(
		hash: Uint8Array,
		signature: Uint8Array,
		publicKey: Uint8Array,
	): boolean;
	secp256k1DerivePublicKey(privateKey: Uint8Array, output: Uint8Array): number;

	// Hash functions
	primitives_sha256(
		data: Uint8Array,
		length: number,
		output: Uint8Array,
	): number;
	primitives_ripemd160(
		data: Uint8Array,
		length: number,
		output: Uint8Array,
	): number;
	primitives_blake2b(
		data: Uint8Array,
		length: number,
		output: Uint8Array,
	): number;

	// Solidity-compatible hash functions
	primitives_solidity_keccak256(
		data: Uint8Array,
		length: number,
		output: Uint8Array,
	): number;
	primitives_solidity_sha256(
		data: Uint8Array,
		length: number,
		output: Uint8Array,
	): number;

	// ABI operations
	primitives_abi_compute_selector(
		signature: string,
		output: Uint8Array,
	): number;
}

let nativeModule: NativeModule | null = null;

/**
 * Load native library using Node.js addon mechanism
 * @throws Error if library cannot be loaded
 */
export function loadNodeNative(): NativeModule {
	if (nativeModule) return nativeModule;

	try {
		const libPath = getNativeLibPath();

		// Use dynamic require to load native addon
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		nativeModule = require(libPath) as NativeModule;

		return nativeModule;
	} catch (error) {
		throw new Error(
			`Failed to load native library with Node-API: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

/**
 * Check if native library is loaded
 */
export function isLoaded(): boolean {
	return nativeModule !== null;
}

/**
 * Unload native library
 * Note: Node.js doesn't provide explicit unload, just clear reference
 */
export function unload(): void {
	nativeModule = null;
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
