/**
 * RIPEMD160 Hash Function (Standalone 1.5 kB Micro-WASM Implementation)
 *
 * Instantiates the standalone `ripemd160.wasm` (1.5 kB, zero imports) directly
 * without loading the unified `primitives.wasm` monolith.
 * Auto-initializes synchronously in Node/Bun on first call; in browsers, call
 * `await Ripemd160Wasm.load()` (or `await Ripemd160Wasm.init()`) before hashing.
 *
 * @example
 * ```typescript
 * import { Ripemd160Wasm } from './ripemd160.wasm.js';
 *
 * // Node/Bun: auto-loads 1.5 kB micro-WASM synchronously on first call
 * // Browser: await Ripemd160Wasm.load();
 * const hash = Ripemd160Wasm.hash(data);
 * const hash2 = Ripemd160Wasm.hashString("hello");
 * ```
 */

import {
	createScratch,
	type Scratch,
	scratchAlloc,
	WASM_PAGE_SIZE,
} from "../wasm-loader/scratch.js";

export type Ripemd160WasmInput = string | URL | Uint8Array | ArrayBuffer;

interface Ripemd160MicroExports {
	memory: WebAssembly.Memory;
	ripemd160Hash: (
		inputPtr: number,
		inputLen: number,
		outputPtr: number,
	) => number;
}

interface NodeFsSync {
	readFileSync: (path: string | URL) => Uint8Array;
}

interface ProcessWithBuiltin {
	getBuiltinModule?: (id: string) => unknown;
}

let wasmExports: Ripemd160MicroExports | null = null;
let wasmMemory: WebAssembly.Memory | null = null;
let scratch: Scratch | null = null;
let memoryOffset = 0;

const utf8Encoder = new TextEncoder();

function getDefaultWasmUrl(): URL {
	// Resolves via packages/voltaire-ts/wasm symlink in dev;
	// tsup rewrites `wasm/crypto/ripemd160.wasm` to dist/wasm/crypto/ripemd160.wasm.
	return new URL("../../wasm/crypto/ripemd160.wasm", import.meta.url);
}

function getNodeFsSync(): NodeFsSync | null {
	const proc = (globalThis as { process?: ProcessWithBuiltin }).process;
	if (typeof proc?.getBuiltinModule !== "function") {
		return null;
	}
	const mod = proc.getBuiltinModule("node:fs") as
		| Partial<NodeFsSync>
		| undefined;
	return mod && typeof mod.readFileSync === "function"
		? (mod as NodeFsSync)
		: null;
}

function toArrayBuffer(bytes: Uint8Array | ArrayBuffer): ArrayBuffer {
	if (bytes instanceof ArrayBuffer) return bytes;
	if (
		bytes.buffer instanceof ArrayBuffer &&
		bytes.byteOffset === 0 &&
		bytes.byteLength === bytes.buffer.byteLength
	) {
		return bytes.buffer;
	}
	const copy = new Uint8Array(bytes.byteLength);
	copy.set(bytes);
	return copy.buffer;
}

function bindInstance(instance: WebAssembly.Instance): void {
	const exports = instance.exports as unknown as Ripemd160MicroExports;
	if (!exports.memory || typeof exports.ripemd160Hash !== "function") {
		throw new Error(
			"Invalid ripemd160.wasm module: missing memory or ripemd160Hash export",
		);
	}
	wasmExports = exports;
	wasmMemory = exports.memory;
	scratch = createScratch(wasmMemory, WASM_PAGE_SIZE);
	memoryOffset = scratch.base;
}

async function loadBytesAsync(
	source: Ripemd160WasmInput,
): Promise<ArrayBuffer> {
	if (source instanceof ArrayBuffer || source instanceof Uint8Array) {
		return toArrayBuffer(source);
	}
	const isFileUrl =
		(source instanceof URL && source.protocol === "file:") ||
		(typeof source === "string" && source.startsWith("file://"));
	const isLocalPath =
		typeof source === "string" &&
		!/^https?:\/\//i.test(source) &&
		getNodeFsSync() !== null;
	if (isFileUrl || isLocalPath) {
		const fs = await import("node:fs/promises");
		const target =
			typeof source === "string" && source.startsWith("file://")
				? new URL(source)
				: source;
		return toArrayBuffer(await fs.readFile(target));
	}
	const response = await fetch(source);
	if (response.ok === false) {
		throw new Error(
			`Failed to fetch ripemd160.wasm: ${response.status} ${response.statusText}`,
		);
	}
	return response.arrayBuffer();
}

function loadBytesSync(source: Ripemd160WasmInput): ArrayBuffer {
	if (source instanceof ArrayBuffer || source instanceof Uint8Array) {
		return toArrayBuffer(source);
	}
	if (
		(source instanceof URL && source.protocol !== "file:") ||
		(typeof source === "string" && /^https?:\/\//i.test(source))
	) {
		throw new Error(
			"WASM not loaded. Call await Ripemd160Wasm.load() first in browser environments.",
		);
	}
	const fs = getNodeFsSync();
	if (!fs) {
		throw new Error(
			"WASM not loaded. Call await Ripemd160Wasm.load() first in browser environments.",
		);
	}
	const target =
		typeof source === "string" && source.startsWith("file://")
			? new URL(source)
			: source;
	return toArrayBuffer(fs.readFileSync(target));
}

function ensureReady(): {
	exports: Ripemd160MicroExports;
	memory: WebAssembly.Memory;
	scratch: Scratch;
} {
	if (!wasmExports || !wasmMemory || !scratch) {
		Ripemd160Wasm.loadSync();
	}
	if (!wasmExports || !wasmMemory || !scratch) {
		throw new Error("WASM not loaded. Call Ripemd160Wasm.load() first.");
	}
	return { exports: wasmExports, memory: wasmMemory, scratch };
}

// ============================================================================
// Ripemd160Wasm Namespace
// ============================================================================

export namespace Ripemd160Wasm {
	/**
	 * Load standalone 1.5 kB RIPEMD160 micro-WASM asynchronously.
	 */
	export async function load(wasmInput?: Ripemd160WasmInput): Promise<void> {
		if (wasmExports && wasmInput === undefined) return;
		const source = wasmInput ?? getDefaultWasmUrl();
		const bytes = await loadBytesAsync(source);
		const { instance } = await WebAssembly.instantiate(bytes, {});
		bindInstance(instance);
	}

	/**
	 * Alias for `load()` to match `Keccak256Wasm.init()` / `Blake2Wasm.init()`.
	 */
	export async function init(wasmInput?: Ripemd160WasmInput): Promise<void> {
		await load(wasmInput);
	}

	/**
	 * Load standalone 1.5 kB RIPEMD160 micro-WASM synchronously.
	 */
	export function loadSync(wasmInput?: Ripemd160WasmInput): void {
		if (wasmExports && wasmInput === undefined) return;
		const source = wasmInput ?? getDefaultWasmUrl();
		const bytes = loadBytesSync(source);
		const mod = new WebAssembly.Module(bytes);
		bindInstance(new WebAssembly.Instance(mod, {}));
	}

	/**
	 * Alias for `loadSync()`.
	 */
	export function initSync(wasmInput?: Ripemd160WasmInput): void {
		loadSync(wasmInput);
	}

	/**
	 * Check whether the standalone RIPEMD160 micro-WASM is loaded.
	 */
	export function isReady(): boolean {
		return wasmExports !== null;
	}

	/**
	 * Unload the standalone RIPEMD160 micro-WASM instance (primarily for testing).
	 */
	export function reset(): void {
		wasmExports = null;
		wasmMemory = null;
		scratch = null;
		memoryOffset = 0;
	}

	/**
	 * Compute RIPEMD160 hash (20 bytes) using standalone 1.5 kB micro-WASM.
	 *
	 * @param data - Input data (Uint8Array or string)
	 * @returns 20-byte hash
	 */
	export function hash(data: Uint8Array | string): Uint8Array {
		const input = typeof data === "string" ? utf8Encoder.encode(data) : data;
		const { exports, memory, scratch: region } = ensureReady();
		const savedOffset = memoryOffset;
		try {
			const inputAlloc = scratchAlloc(region, memoryOffset, input.length);
			memoryOffset = inputAlloc.next;
			const outputAlloc = scratchAlloc(region, memoryOffset, 20);
			memoryOffset = outputAlloc.next;

			new Uint8Array(memory.buffer).set(input, inputAlloc.ptr);
			const result = exports.ripemd160Hash(
				inputAlloc.ptr,
				input.length,
				outputAlloc.ptr,
			);
			if (result !== 0) {
				throw new Error("RIPEMD160 hash computation failed");
			}
			return new Uint8Array(memory.buffer).slice(
				outputAlloc.ptr,
				outputAlloc.ptr + 20,
			);
		} finally {
			memoryOffset = savedOffset;
		}
	}

	/**
	 * Compute RIPEMD160 hash of UTF-8 string.
	 *
	 * @param str - Input string
	 * @returns 20-byte hash
	 */
	export function hashString(str: string): Uint8Array {
		return hash(utf8Encoder.encode(str));
	}

	/**
	 * Compute RIPEMD160 hash of hex string (with or without 0x prefix).
	 *
	 * @param hex - Hex string
	 * @returns 20-byte hash
	 */
	export function hashHex(hex: string): Uint8Array {
		const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
		const bytes = new Uint8Array(normalized.length / 2);
		for (let i = 0; i < bytes.length; i++) {
			bytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
		}
		return hash(bytes);
	}
}

export default Ripemd160Wasm;
