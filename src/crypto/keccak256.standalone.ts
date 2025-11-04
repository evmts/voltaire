/**
 * Standalone Keccak256 WASM Implementation
 *
 * Minimal 3KB WASM module containing only Zig stdlib keccak256.
 * Used for bundle size comparison vs noble curves implementation.
 *
 * @example
 * ```typescript
 * import * as Keccak256Standalone from './keccak256.standalone.js';
 *
 * await Keccak256Standalone.init();
 * const hash = Keccak256Standalone.hash(data);
 * ```
 */

import type { BrandedHash } from "../primitives/Hash/index.js";

let wasmInstance: WebAssembly.Instance | null = null;
let memory: WebAssembly.Memory | null = null;
let memoryOffset = 0;

/**
 * Initialize standalone keccak256 WASM module
 */
export async function init(): Promise<void> {
	if (wasmInstance) return;

	const wasmPath = new URL(
		"../../wasm/crypto/keccak256.wasm",
		import.meta.url,
	);

	// Create memory for WASM (1 page = 64KB)
	memory = new WebAssembly.Memory({ initial: 1, maximum: 1 });
	memoryOffset = 0;

	const wasmModule = await WebAssembly.instantiateStreaming(fetch(wasmPath), {
		env: { memory },
	});

	wasmInstance = wasmModule.instance;
}

/**
 * Allocate memory in WASM
 */
function alloc(size: number): number {
	if (!memory) throw new Error("WASM not initialized");
	const ptr = memoryOffset;
	memoryOffset += size;
	if (memoryOffset > memory.buffer.byteLength) {
		throw new Error("Out of WASM memory");
	}
	return ptr;
}

/**
 * Hash bytes using standalone keccak256 WASM
 */
export function hash(data: Uint8Array): BrandedHash {
	if (!wasmInstance) {
		throw new Error("WASM not initialized. Call init() first.");
	}

	const exports = wasmInstance.exports as {
		keccak256Hash: (
			inputPtr: number,
			inputLen: number,
			outputPtr: number,
		) => void;
		memory: WebAssembly.Memory;
	};

	// Allocate input and output buffers
	const inputPtr = alloc(data.length);
	const outputPtr = alloc(32);

	// Copy input data to WASM memory
	const wasmMemory = new Uint8Array(exports.memory.buffer);
	wasmMemory.set(data, inputPtr);

	// Call WASM function
	exports.keccak256Hash(inputPtr, data.length, outputPtr);

	// Copy result
	const result = new Uint8Array(32);
	result.set(wasmMemory.subarray(outputPtr, outputPtr + 32));

	// Reset allocator for next call
	memoryOffset = 0;

	return result as BrandedHash;
}

/**
 * Hash UTF-8 string
 */
export function hashString(str: string): BrandedHash {
	const bytes = new TextEncoder().encode(str);
	return hash(bytes);
}

/**
 * Hash hex string
 */
export function hashHex(hex: string): BrandedHash {
	const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
	const bytes = new Uint8Array(cleanHex.length / 2);
	for (let i = 0; i < cleanHex.length; i += 2) {
		bytes[i / 2] = Number.parseInt(cleanHex.slice(i, i + 2), 16);
	}
	return hash(bytes);
}

/**
 * Check if WASM is initialized
 */
export function isReady(): boolean {
	return wasmInstance !== null;
}

// Namespace export
export const Keccak256Standalone = {
	hash,
	hashString,
	hashHex,
	init,
	isReady,
};
