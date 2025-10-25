/**
 * WebAssembly loader for Ethereum primitives library
 *
 * Loads and initializes the WASM module compiled from Zig
 * Provides typed bindings to C API functions
 */

import type { WasmAllocator } from "./memory.ts";

/**
 * WASM imports namespace (functions provided by JS to WASM)
 */
export interface WasmImports {
	env: {
		// Standard C library functions that WASM may need
		// These would be implemented if needed by the Zig WASM build
	};
}

/**
 * WASM exports from primitives library
 * Direct bindings to C API functions from primitives.h
 */
export interface WasmExports {
	memory: WebAssembly.Memory;

	// Memory management
	malloc(size: number): number;
	free(ptr: number): void;

	// Address API
	primitives_address_from_hex(hex_ptr: number, out_address_ptr: number): number;
	primitives_address_to_hex(address_ptr: number, buf_ptr: number): number;
	primitives_address_to_checksum_hex(
		address_ptr: number,
		buf_ptr: number,
	): number;
	primitives_address_is_zero(address_ptr: number): boolean;
	primitives_address_equals(a_ptr: number, b_ptr: number): boolean;
	primitives_address_validate_checksum(hex_ptr: number): boolean;

	// Keccak-256 API
	primitives_keccak256(
		data_ptr: number,
		data_len: number,
		out_hash_ptr: number,
	): number;
	primitives_hash_to_hex(hash_ptr: number, buf_ptr: number): number;
	primitives_hash_from_hex(hex_ptr: number, out_hash_ptr: number): number;
	primitives_hash_equals(a_ptr: number, b_ptr: number): boolean;

	// Hex utilities API
	primitives_hex_to_bytes(
		hex_ptr: number,
		out_buf_ptr: number,
		buf_len: number,
	): number;
	primitives_bytes_to_hex(
		data_ptr: number,
		data_len: number,
		out_buf_ptr: number,
		buf_len: number,
	): number;

	// U256 API
	primitives_u256_from_hex(hex_ptr: number, out_u256_ptr: number): number;
	primitives_u256_to_hex(
		value_u256_ptr: number,
		buf_ptr: number,
		buf_len: number,
	): number;

	// EIP-191 API
	primitives_eip191_hash_message(
		message_ptr: number,
		message_len: number,
		out_hash_ptr: number,
	): number;

	// Address derivation API
	primitives_calculate_create_address(
		sender_ptr: number,
		nonce: bigint,
		out_address_ptr: number,
	): number;

	// Version info
	primitives_version_string(): number;
}

/**
 * WASM instance with typed exports
 */
export interface WasmInstance {
	exports: WasmExports;
}

/**
 * WASM allocator implementation
 */
class WasmAllocatorImpl implements WasmAllocator {
	constructor(private readonly exports: WasmExports) {}

	malloc(size: number): number {
		return this.exports.malloc(size);
	}

	free(ptr: number): void {
		this.exports.free(ptr);
	}

	getMemory(): Uint8Array {
		return new Uint8Array(this.exports.memory.buffer);
	}
}

/**
 * Loaded WASM module state
 */
export interface LoadedWasm {
	instance: WasmInstance;
	allocator: WasmAllocator;
	exports: WasmExports;
}

/**
 * WASM loader configuration
 */
export interface WasmLoaderConfig {
	/**
	 * Path or URL to WASM file
	 */
	wasmPath: string;

	/**
	 * Custom imports to provide to WASM module
	 */
	imports?: WasmImports;

	/**
	 * Whether to use streaming instantiation (faster for HTTP)
	 * Default: true for URLs, false for file paths
	 */
	streaming?: boolean;
}

/**
 * Load WASM module from file or URL
 *
 * @param config Loader configuration
 * @returns Loaded WASM instance with typed exports
 *
 * @example
 * ```ts
 * const wasm = await loadWasm({
 *   wasmPath: './zig-out/lib/primitives.wasm'
 * });
 * ```
 */
export async function loadWasm(config: WasmLoaderConfig): Promise<LoadedWasm> {
	const imports: WasmImports = config.imports || { env: {} };

	let instance: WasmInstance;

	// Determine if we should use streaming based on config or path
	const useStreaming = config.streaming ?? isUrl(config.wasmPath);

	if (useStreaming) {
		// Use streaming compilation for URLs (faster for HTTP)
		const response = await fetch(config.wasmPath);
		if (!response.ok) {
			throw new Error(`Failed to fetch WASM module: ${response.statusText}`);
		}
		const result = await WebAssembly.instantiateStreaming(response, imports);
		instance = result.instance as WasmInstance;
	} else {
		// Use ArrayBuffer for file system paths
		const wasmBuffer = await loadWasmBuffer(config.wasmPath);
		const result = await WebAssembly.instantiate(wasmBuffer, imports);
		instance = result.instance as WasmInstance;
	}

	// Verify required exports exist
	validateExports(instance.exports);

	const allocator = new WasmAllocatorImpl(instance.exports);

	return {
		instance,
		allocator,
		exports: instance.exports,
	};
}

/**
 * Check if path is a URL
 */
function isUrl(path: string): boolean {
	return (
		path.startsWith("http://") ||
		path.startsWith("https://") ||
		path.startsWith("file://")
	);
}

/**
 * Load WASM file as ArrayBuffer
 * Platform-specific implementation required
 */
async function loadWasmBuffer(path: string): Promise<ArrayBuffer> {
	// In Node.js
	if (
		typeof process !== "undefined" &&
		process.versions &&
		process.versions.node
	) {
		const fs = await import("fs/promises");
		const buffer = await fs.readFile(path);
		return buffer.buffer.slice(
			buffer.byteOffset,
			buffer.byteOffset + buffer.byteLength,
		);
	}

	// In Bun
	if (typeof Bun !== "undefined") {
		const file = Bun.file(path);
		return await file.arrayBuffer();
	}

	// In browser or Deno, use fetch
	const response = await fetch(path);
	if (!response.ok) {
		throw new Error(`Failed to load WASM file: ${response.statusText}`);
	}
	return await response.arrayBuffer();
}

/**
 * Validate that WASM module exports required functions
 */
function validateExports(exports: WasmExports): void {
	const required = [
		"memory",
		"malloc",
		"free",
		"primitives_address_from_hex",
		"primitives_keccak256",
		"primitives_version_string",
	];

	for (const name of required) {
		if (!(name in exports)) {
			throw new Error(`WASM module missing required export: ${name}`);
		}
	}
}

/**
 * Singleton WASM instance
 */
let wasmInstance: LoadedWasm | null = null;

/**
 * Get or initialize WASM instance
 *
 * @param config Optional configuration for first initialization
 * @returns Loaded WASM instance
 */
export async function getWasm(config?: WasmLoaderConfig): Promise<LoadedWasm> {
	if (!wasmInstance) {
		if (!config) {
			throw new Error("WASM not initialized. Provide config on first call.");
		}
		wasmInstance = await loadWasm(config);
	}
	return wasmInstance;
}

/**
 * Reset WASM instance (for testing)
 */
export function resetWasm(): void {
	wasmInstance = null;
}
