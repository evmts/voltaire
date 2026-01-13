/**
 * Node-API loader for native bindings
 * Uses Node.js native addon loading for compatibility
 */

import { getNativeLibPath } from "./platform.js";
import { getNativeErrorMessage } from "./types.js";

/**
 * Native module interface (loaded via require/dlopen)
 */
export interface NativeModule {
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

	// StateManager operations
	state_manager_create(): number | null;
	state_manager_create_with_fork(forkBackend: number): number | null;
	state_manager_destroy(handle: number): void;
	state_manager_get_balance_sync(
		handle: number,
		addressHex: string,
		outBuffer: Uint8Array,
		bufferLen: number,
	): number;
	state_manager_get_nonce_sync(
		handle: number,
		addressHex: string,
		outNonce: Uint8Array,
	): number;
	state_manager_get_code_len_sync(
		handle: number,
		addressHex: string,
		outLen: Uint8Array,
	): number;
	state_manager_get_code_sync(
		handle: number,
		addressHex: string,
		outBuffer: Uint8Array,
		bufferLen: number,
	): number;
	state_manager_get_storage_sync(
		handle: number,
		addressHex: string,
		slotHex: string,
		outBuffer: Uint8Array,
		bufferLen: number,
	): number;
	state_manager_set_balance(
		handle: number,
		addressHex: string,
		balanceHex: string,
	): number;
	state_manager_set_nonce(
		handle: number,
		addressHex: string,
		nonce: number,
	): number;
	state_manager_set_code(
		handle: number,
		addressHex: string,
		codePtr: Uint8Array,
		codeLen: number,
	): number;
	state_manager_set_storage(
		handle: number,
		addressHex: string,
		slotHex: string,
		valueHex: string,
	): number;
	state_manager_checkpoint(handle: number): number;
	state_manager_revert(handle: number): void;
	state_manager_commit(handle: number): void;
	state_manager_snapshot(handle: number, outSnapshotId: Uint8Array): number;
	state_manager_revert_to_snapshot(handle: number, snapshotId: number): number;
	state_manager_clear_caches(handle: number): void;
	state_manager_clear_fork_cache(handle: number): void;

	// ForkBackend operations
	fork_backend_create(
		rpcClientPtr: number,
		rpcVtable: number,
		blockTag: string,
		maxCacheSize: number,
	): number | null;
	fork_backend_destroy(handle: number): void;
	fork_backend_clear_cache(handle: number): void;

	// Blockchain operations
	blockchain_create(): number | null;
	blockchain_create_with_fork(forkCache: number): number | null;
	blockchain_destroy(handle: number): void;
	blockchain_get_block_by_hash(
		handle: number,
		blockHashPtr: Uint8Array,
		outBlockData: Uint8Array,
	): number;
	blockchain_get_block_by_number(
		handle: number,
		number: number,
		outBlockData: Uint8Array,
	): number;
	blockchain_get_canonical_hash(
		handle: number,
		number: number,
		outHash: Uint8Array,
	): number;
	blockchain_get_head_block_number(
		handle: number,
		outNumber: Uint8Array,
	): number;
	blockchain_put_block(handle: number, blockData: Uint8Array): number;
	blockchain_set_canonical_head(
		handle: number,
		blockHashPtr: Uint8Array,
	): number;
	blockchain_has_block(handle: number, blockHashPtr: Uint8Array): boolean;
	blockchain_local_block_count(handle: number): number;
	blockchain_orphan_count(handle: number): number;
	blockchain_canonical_chain_length(handle: number): number;
	blockchain_is_fork_block(handle: number, number: number): boolean;

	// ForkBlockCache operations
	fork_block_cache_create(
		rpcContext: number,
		vtableFetchByNumber: number,
		vtableFetchByHash: number,
		forkBlockNumber: number,
	): number | null;
	fork_block_cache_destroy(handle: number): void;
}

let nativeModule: NativeModule | null = null;

/**
 * Load native library using Node.js addon mechanism
 * @throws Error if library cannot be loaded
 */
export function loadNodeNative(): NativeModule {
	if (nativeModule) return nativeModule;

	// Try multiple possible paths for the native library
	const pathsToTry = [
		getNativeLibPath("voltaire_native"), // Standard build output path
		"./zig-out/native/libprimitives_ts_native.dylib", // macOS current build output
	];

	let lastError: Error | null = null;

	for (const libPath of pathsToTry) {
		try {
			// Use dynamic require to load native .node addon
			// Note: Native Node.js addons (.node files) must be loaded with require(),
			// not import(). This is a Node.js limitation, not an ESM compatibility issue.
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			nativeModule = require(libPath) as NativeModule;

			return nativeModule;
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));
			// Continue trying next path
		}
	}

	throw new Error(
		`Failed to load native library with Node-API: ${lastError?.message || "Unknown error"}. Node.js native FFI is not shipped yet — use the regular TypeScript API or WASM modules in Node.`,
	);
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
