/**
 * RIPEMD160 Hash Function (WASM Implementation)
 *
 * WebAssembly-based implementation using Zig ripemd160 module.
 * Provides the same interface as the Noble-based implementation.
 *
 * @example
 * ```typescript
 * import { Ripemd160Wasm } from './ripemd160.wasm.js';
 *
 * // Load WASM first
 * await Ripemd160Wasm.load();
 *
 * // Hash bytes
 * const hash = Ripemd160Wasm.hash(data);
 *
 * // Hash string
 * const hash2 = Ripemd160Wasm.hashString("hello");
 * ```
 */

// WASM instance and memory
let wasmInstance: WebAssembly.Instance | null = null;
let wasmMemory: WebAssembly.Memory | null = null;
let memoryOffset = 0;

/**
 * WASM exports interface
 */
interface WasmExports {
	memory: WebAssembly.Memory;
	ripemd160Hash: (
		inputPtr: number,
		inputLen: number,
		outputPtr: number,
	) => number;
}

/**
 * Load WASM module
 */
async function loadWasm(): Promise<void> {
	if (wasmInstance) return; // Already loaded

	// Minimal WASI shim
	const wasi = {
		args_get: () => 0,
		args_sizes_get: (argcPtr: number, argvBufSizePtr: number): number => {
			if (!wasmMemory) return -1;
			const view = new DataView(wasmMemory.buffer);
			view.setUint32(argcPtr, 0, true);
			view.setUint32(argvBufSizePtr, 0, true);
			return 0;
		},
		environ_get: () => 0,
		environ_sizes_get: (
			environCountPtr: number,
			environBufSizePtr: number,
		): number => {
			if (!wasmMemory) return -1;
			const view = new DataView(wasmMemory.buffer);
			view.setUint32(environCountPtr, 0, true);
			view.setUint32(environBufSizePtr, 0, true);
			return 0;
		},
		fd_write: () => 0,
		fd_fdstat_get: () => 0,
		fd_filestat_get: () => 0,
		fd_seek: () => 0,
		fd_close: () => 0,
		fd_read: () => 0,
		fd_pread: () => 0,
		fd_pwrite: () => 0,
		clock_time_get: () => 0,
		random_get: () => 0,
		proc_exit: (code: number): never => {
			throw new Error(`WASI proc_exit(${code})`);
		},
		sched_yield: () => 0,
		poll_oneoff: () => 0,
		path_filestat_get: () => 0,
		path_open: () => 0,
		path_readlink: () => 0,
		fd_prestat_get: () => 0,
		fd_prestat_dir_name: () => 0,
		fd_datasync: () => 0,
		fd_sync: () => 0,
	};

	const importObject = {
		env: {},
		wasi_snapshot_preview1: wasi,
	};

	// Load WASM file
	const wasmPath = new URL("../../wasm/ripemd160.wasm", import.meta.url);
	const response = await fetch(wasmPath);
	const buffer = await response.arrayBuffer();
	const wasmModule = await WebAssembly.instantiate(buffer, importObject);

	wasmInstance = wasmModule.instance;
	const exports = wasmInstance.exports as unknown as WasmExports;
	wasmMemory = exports.memory;

	if (!wasmMemory) {
		throw new Error("WASM module does not export memory");
	}

	// Initialize memory offset (start at 64KB to be safe)
	memoryOffset = 64 * 1024;
}

/**
 * Allocate memory in WASM
 */
function malloc(size: number): number {
	if (!wasmMemory) {
		throw new Error("WASM not initialized");
	}

	// Align to 8 bytes
	const aligned = (size + 7) & ~7;
	const ptr = memoryOffset;
	memoryOffset += aligned;

	// Grow memory if needed
	const pagesNeeded = Math.ceil(memoryOffset / 65536);
	const currentPages = wasmMemory.buffer.byteLength / 65536;

	if (pagesNeeded > currentPages) {
		const pagesToGrow = pagesNeeded - currentPages;
		try {
			wasmMemory.grow(pagesToGrow);
		} catch (e) {
			throw new Error(
				`Out of memory: failed to grow WASM memory from ${currentPages} to ${pagesNeeded} pages`,
			);
		}
	}

	return ptr;
}

/**
 * Write bytes to WASM memory
 */
function writeBytes(data: Uint8Array, ptr: number): void {
	if (!wasmMemory) {
		throw new Error("WASM not initialized");
	}
	const memory = new Uint8Array(wasmMemory.buffer);
	memory.set(data, ptr);
}

/**
 * Read bytes from WASM memory
 */
function readBytes(ptr: number, length: number): Uint8Array {
	if (!wasmMemory) {
		throw new Error("WASM not initialized");
	}
	const memory = new Uint8Array(wasmMemory.buffer);
	return memory.slice(ptr, ptr + length);
}

/**
 * Reset memory allocator (currently unused)
 */
// function _resetMemory(): void {
//   memoryOffset = 64 * 1024;
// }

// ============================================================================
// Ripemd160Wasm Namespace
// ============================================================================

export namespace Ripemd160Wasm {
	/**
	 * Load WASM module (must be called before using other functions)
	 */
	export async function load(): Promise<void> {
		await loadWasm();
	}

	/**
	 * Compute RIPEMD160 hash (20 bytes)
	 *
	 * @param data - Input data (Uint8Array or string)
	 * @returns 20-byte hash
	 *
	 * @example
	 * ```typescript
	 * const hash = Ripemd160Wasm.hash(data);
	 * // Uint8Array(20)
	 * ```
	 */
	export function hash(data: Uint8Array | string): Uint8Array {
		if (typeof data === "string") {
			return hashString(data);
		}

		const savedOffset = memoryOffset;
		try {
			if (!wasmInstance) {
				throw new Error("WASM not loaded. Call Ripemd160Wasm.load() first.");
			}

			const exports = wasmInstance.exports as unknown as WasmExports;
			const inputPtr = malloc(data.length);
			const outputPtr = malloc(20);

			writeBytes(data, inputPtr);
			const result = exports.ripemd160Hash(inputPtr, data.length, outputPtr);

			if (result !== 0) {
				throw new Error("RIPEMD160 hash computation failed");
			}

			return readBytes(outputPtr, 20);
		} finally {
			memoryOffset = savedOffset;
		}
	}

	/**
	 * Compute RIPEMD160 hash of UTF-8 string
	 *
	 * @param str - Input string
	 * @returns 20-byte hash
	 *
	 * @example
	 * ```typescript
	 * const hash = Ripemd160Wasm.hashString("hello");
	 * // Uint8Array(20)
	 * ```
	 */
	export function hashString(str: string): Uint8Array {
		const encoder = new TextEncoder();
		const bytes = encoder.encode(str);
		return hash(bytes);
	}
}

// Re-export namespace as default
export default Ripemd160Wasm;
