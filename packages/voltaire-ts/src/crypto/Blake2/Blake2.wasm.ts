/**
 * BLAKE2b WASM implementation (Standalone 1.8 kB Micro-WASM)
 *
 * Instantiates the standalone `blake2.wasm` (1.8 kB, zero imports) directly
 * without loading the unified `primitives.wasm` monolith.
 * Auto-initializes synchronously in Node/Bun on first call; in browsers, call
 * `await Blake2Wasm.init()` before hashing.
 */

import {
	createScratch,
	type Scratch,
	scratchAlloc,
	WASM_PAGE_SIZE,
} from "../../wasm-loader/scratch.js";
import { Blake2InvalidOutputLengthError } from "./errors.js";

export type Blake2WasmInput = string | URL | Uint8Array | ArrayBuffer;

interface Blake2MicroExports {
	memory: WebAssembly.Memory;
	blake2Hash: (
		inputPtr: number,
		inputLen: number,
		outputPtr: number,
		outputLen: number,
	) => number;
}

interface NodeFsSync {
	readFileSync: (path: string | URL) => Uint8Array;
}

interface ProcessWithBuiltin {
	getBuiltinModule?: (id: string) => unknown;
}

let wasmExports: Blake2MicroExports | null = null;
let wasmMemory: WebAssembly.Memory | null = null;
let scratch: Scratch | null = null;
let memoryOffset = 0;

const utf8Encoder = new TextEncoder();

function getDefaultWasmUrl(): URL {
	// Resolves via packages/voltaire-ts/wasm symlink in dev;
	// tsup rewrites `wasm/crypto/blake2.wasm` to dist/wasm/crypto/blake2.wasm.
	return new URL("../../../wasm/crypto/blake2.wasm", import.meta.url);
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
	const exports = instance.exports as unknown as Blake2MicroExports;
	if (!exports.memory || typeof exports.blake2Hash !== "function") {
		throw new Error(
			"Invalid blake2.wasm module: missing memory or blake2Hash export",
		);
	}
	wasmExports = exports;
	wasmMemory = exports.memory;
	scratch = createScratch(wasmMemory, WASM_PAGE_SIZE);
	memoryOffset = scratch.base;
}

async function loadBytesAsync(source: Blake2WasmInput): Promise<ArrayBuffer> {
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
			`Failed to fetch blake2.wasm: ${response.status} ${response.statusText}`,
		);
	}
	return response.arrayBuffer();
}

function loadBytesSync(source: Blake2WasmInput): ArrayBuffer {
	if (source instanceof ArrayBuffer || source instanceof Uint8Array) {
		return toArrayBuffer(source);
	}
	if (
		(source instanceof URL && source.protocol !== "file:") ||
		(typeof source === "string" && /^https?:\/\//i.test(source))
	) {
		throw new Error(
			"WASM not initialized. Call await Blake2Wasm.init() first in browser environments.",
		);
	}
	const fs = getNodeFsSync();
	if (!fs) {
		throw new Error(
			"WASM not initialized. Call await Blake2Wasm.init() first in browser environments.",
		);
	}
	const target =
		typeof source === "string" && source.startsWith("file://")
			? new URL(source)
			: source;
	return toArrayBuffer(fs.readFileSync(target));
}

function ensureReady(): {
	exports: Blake2MicroExports;
	memory: WebAssembly.Memory;
	scratch: Scratch;
} {
	if (!wasmExports || !wasmMemory || !scratch) {
		Blake2Wasm.initSync();
	}
	if (!wasmExports || !wasmMemory || !scratch) {
		throw new Error(
			"WASM not initialized. Call await Blake2Wasm.init() first.",
		);
	}
	return { exports: wasmExports, memory: wasmMemory, scratch };
}

/**
 * BLAKE2b operations namespace (standalone 1.8 kB WASM variant)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 */
export namespace Blake2Wasm {
	/**
	 * Initialize standalone 1.8 kB BLAKE2b micro-WASM asynchronously.
	 */
	export async function init(wasmInput?: Blake2WasmInput): Promise<void> {
		if (wasmExports && wasmInput === undefined) return;
		const source = wasmInput ?? getDefaultWasmUrl();
		const bytes = await loadBytesAsync(source);
		const { instance } = await WebAssembly.instantiate(bytes, {});
		bindInstance(instance);
	}

	/**
	 * Initialize standalone 1.8 kB BLAKE2b micro-WASM synchronously.
	 */
	export function initSync(wasmInput?: Blake2WasmInput): void {
		if (wasmExports && wasmInput === undefined) return;
		const source = wasmInput ?? getDefaultWasmUrl();
		const bytes = loadBytesSync(source);
		const mod = new WebAssembly.Module(bytes);
		bindInstance(new WebAssembly.Instance(mod, {}));
	}

	/**
	 * Check whether the standalone BLAKE2b micro-WASM is loaded.
	 */
	export function isReady(): boolean {
		return wasmExports !== null;
	}

	/**
	 * Unload the standalone BLAKE2b micro-WASM instance (primarily for testing).
	 */
	export function reset(): void {
		wasmExports = null;
		wasmMemory = null;
		scratch = null;
		memoryOffset = 0;
	}

	/**
	 * Hash data with BLAKE2b using standalone 1.8 kB WASM implementation.
	 *
	 * @param data - Input data to hash (Uint8Array or string)
	 * @param outputLength - Output length in bytes (1-64, default 64)
	 * @returns BLAKE2b hash
	 * @throws {Blake2InvalidOutputLengthError} If outputLength is invalid
	 */
	export function hash(
		data: Uint8Array | string,
		outputLength = 64,
	): Uint8Array {
		if (
			!Number.isInteger(outputLength) ||
			outputLength < 1 ||
			outputLength > 64
		) {
			throw new Blake2InvalidOutputLengthError(outputLength);
		}

		const input = typeof data === "string" ? utf8Encoder.encode(data) : data;
		const { exports, memory, scratch: region } = ensureReady();
		const savedOffset = memoryOffset;
		try {
			const inputAlloc = scratchAlloc(region, memoryOffset, input.length);
			memoryOffset = inputAlloc.next;
			const outputAlloc = scratchAlloc(region, memoryOffset, 64);
			memoryOffset = outputAlloc.next;

			new Uint8Array(memory.buffer).set(input, inputAlloc.ptr);
			const result = exports.blake2Hash(
				inputAlloc.ptr,
				input.length,
				outputAlloc.ptr,
				outputLength,
			);
			if (result !== 0) {
				throw new Error(`BLAKE2b WASM hash failed (code: ${result})`);
			}
			return new Uint8Array(memory.buffer).slice(
				outputAlloc.ptr,
				outputAlloc.ptr + outputLength,
			);
		} finally {
			memoryOffset = savedOffset;
		}
	}

	/**
	 * Hash string with BLAKE2b using standalone WASM implementation.
	 *
	 * @param str - Input string to hash
	 * @param outputLength - Output length in bytes (1-64, default 64)
	 * @returns BLAKE2b hash
	 */
	export function hashString(str: string, outputLength = 64): Uint8Array {
		return hash(str, outputLength);
	}
}

export default Blake2Wasm;
