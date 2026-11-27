/**
 * WASM Keccak256 Hash Function (Standalone 3.1 kB Micro-WASM)
 *
 * Instantiates the standalone `keccak256.wasm` (3.1 kB, zero imports) directly
 * without loading the unified `primitives.wasm` monolith.
 * Auto-initializes synchronously in Node/Bun on first call; in browsers, call
 * `await Keccak256Wasm.init()` before hashing.
 *
 * @example
 * ```typescript
 * import { Keccak256Wasm } from './keccak256.wasm.js';
 *
 * // Node/Bun: works synchronously out of the box (auto-loads 3.1 kB micro-WASM)
 * // Browser: await Keccak256Wasm.init();
 * const hash = Keccak256Wasm.hash(data);
 * const strHash = Keccak256Wasm.hashString('hello');
 * const hexHash = Keccak256Wasm.hashHex('0x1234');
 * ```
 */

import type { HashType } from "../primitives/Hash/index.js";
import { encodeList } from "../primitives/Rlp/encodeList.js";
import {
	createScratch,
	type Scratch,
	scratchAlloc,
	WASM_PAGE_SIZE,
} from "../wasm-loader/scratch.js";

export type Keccak256WasmInput = string | URL | Uint8Array | ArrayBuffer;

interface Keccak256MicroExports {
	memory: WebAssembly.Memory;
	keccak256Hash: (
		inputPtr: number,
		inputLen: number,
		outputPtr: number,
	) => void;
}

interface NodeFsSync {
	readFileSync: (path: string | URL) => Uint8Array;
}

interface ProcessWithBuiltin {
	getBuiltinModule?: (id: string) => unknown;
}

let wasmExports: Keccak256MicroExports | null = null;
let wasmMemory: WebAssembly.Memory | null = null;
let scratch: Scratch | null = null;
let memoryOffset = 0;

const utf8Encoder = new TextEncoder();

function getDefaultWasmUrl(): URL {
	// Resolves via packages/voltaire-ts/wasm symlink in dev;
	// tsup rewrites `wasm/crypto/keccak256.wasm` to dist/wasm/crypto/keccak256.wasm.
	return new URL("../../wasm/crypto/keccak256.wasm", import.meta.url);
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
	const exports = instance.exports as unknown as Keccak256MicroExports;
	if (!exports.memory || typeof exports.keccak256Hash !== "function") {
		throw new Error(
			"Invalid keccak256.wasm module: missing memory or keccak256Hash export",
		);
	}
	wasmExports = exports;
	wasmMemory = exports.memory;
	scratch = createScratch(wasmMemory, WASM_PAGE_SIZE);
	memoryOffset = scratch.base;
}

async function loadBytesAsync(
	source: Keccak256WasmInput,
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
			`Failed to fetch keccak256.wasm: ${response.status} ${response.statusText}`,
		);
	}
	return response.arrayBuffer();
}

function loadBytesSync(source: Keccak256WasmInput): ArrayBuffer {
	if (source instanceof ArrayBuffer || source instanceof Uint8Array) {
		return toArrayBuffer(source);
	}
	if (
		(source instanceof URL && source.protocol !== "file:") ||
		(typeof source === "string" && /^https?:\/\//i.test(source))
	) {
		throw new Error(
			"WASM not initialized. Call await Keccak256Wasm.init() first in browser environments.",
		);
	}
	const fs = getNodeFsSync();
	if (!fs) {
		throw new Error(
			"WASM not initialized. Call await Keccak256Wasm.init() first in browser environments.",
		);
	}
	const target =
		typeof source === "string" && source.startsWith("file://")
			? new URL(source)
			: source;
	return toArrayBuffer(fs.readFileSync(target));
}

function ensureReady(): {
	exports: Keccak256MicroExports;
	memory: WebAssembly.Memory;
	scratch: Scratch;
} {
	if (!wasmExports || !wasmMemory || !scratch) {
		initSync();
	}
	if (!wasmExports || !wasmMemory || !scratch) {
		throw new Error(
			"WASM not initialized. Call await Keccak256Wasm.init() first.",
		);
	}
	return { exports: wasmExports, memory: wasmMemory, scratch };
}

function keccak256Raw(data: Uint8Array): HashType {
	const { exports, memory, scratch: region } = ensureReady();
	const savedOffset = memoryOffset;
	try {
		const inputAlloc = scratchAlloc(region, memoryOffset, data.length);
		memoryOffset = inputAlloc.next;
		const outputAlloc = scratchAlloc(region, memoryOffset, 32);
		memoryOffset = outputAlloc.next;

		new Uint8Array(memory.buffer).set(data, inputAlloc.ptr);
		exports.keccak256Hash(inputAlloc.ptr, data.length, outputAlloc.ptr);
		return new Uint8Array(memory.buffer).slice(
			outputAlloc.ptr,
			outputAlloc.ptr + 32,
		) as HashType;
	} finally {
		memoryOffset = savedOffset;
	}
}

// ============================================================================
// Core Hash Functions
// ============================================================================

/**
 * Hash bytes using standalone 3.1 kB Keccak256 micro-WASM.
 * @param data - Input bytes to hash
 * @returns 32-byte Keccak256 hash
 */
export function hash(data: Uint8Array): HashType {
	return keccak256Raw(data);
}

/**
 * Hash a UTF-8 string using standalone Keccak256 micro-WASM.
 * @param str - String to hash
 * @returns 32-byte Keccak256 hash
 */
export function hashString(str: string): HashType {
	return keccak256Raw(utf8Encoder.encode(str));
}

/**
 * Hash a hex string using standalone Keccak256 micro-WASM.
 * @param hex - Hex string to hash (with or without 0x prefix)
 * @returns 32-byte Keccak256 hash
 */
export function hashHex(hex: string): HashType {
	const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
	if (!/^[0-9a-fA-F]*$/.test(normalized)) {
		throw new Error("Invalid hex string");
	}
	if (normalized.length % 2 !== 0) {
		throw new Error("Hex string must have even length");
	}
	const bytes = new Uint8Array(normalized.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
	}
	return keccak256Raw(bytes);
}

/**
 * Hash multiple byte arrays in sequence using standalone Keccak256 micro-WASM.
 * @param chunks - Array of byte arrays to hash
 * @returns 32-byte Keccak256 hash
 */
export function hashMultiple(chunks: readonly Uint8Array[]): HashType {
	const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
	const combined = new Uint8Array(totalLength);
	let offset = 0;
	for (const chunk of chunks) {
		combined.set(chunk, offset);
		offset += chunk.length;
	}
	return keccak256Raw(combined);
}

// ============================================================================
// Ethereum Utilities
// ============================================================================

/**
 * Compute function selector (first 4 bytes of hash)
 * @param signature - Function signature string (e.g., "transfer(address,uint256)")
 * @returns 4-byte function selector
 */
export function selector(signature: string): Uint8Array {
	return keccak256Raw(utf8Encoder.encode(signature)).slice(0, 4);
}

/**
 * Compute event topic (full 32-byte hash)
 * @param signature - Event signature string (e.g., "Transfer(address,address,uint256)")
 * @returns 32-byte event topic as HashType
 */
export function topic(signature: string): HashType {
	return keccak256Raw(utf8Encoder.encode(signature));
}

function nonceToBytes(nonce: bigint): Uint8Array {
	if (nonce === 0n) {
		return new Uint8Array(0);
	}
	const hex = nonce.toString(16);
	const paddedHex = hex.length % 2 ? `0${hex}` : hex;
	const bytes = new Uint8Array(paddedHex.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(paddedHex.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes;
}

/**
 * Compute CREATE contract address
 * @param sender - Sender address (20 bytes)
 * @param nonce - Transaction nonce
 * @returns Contract address (20 bytes)
 */
export function contractAddress(sender: Uint8Array, nonce: bigint): Uint8Array {
	if (sender.length !== 20) {
		throw new Error("Sender must be 20 bytes");
	}
	const rlpEncoded = encodeList([sender, nonceToBytes(nonce)]);
	return keccak256Raw(rlpEncoded).slice(12);
}

/**
 * Compute CREATE2 contract address
 * @param sender - Sender address (20 bytes)
 * @param salt - Salt (32 bytes)
 * @param initCodeHash - Init code hash (32 bytes)
 * @returns Contract address (20 bytes)
 */
export function create2Address(
	sender: Uint8Array,
	salt: Uint8Array,
	initCodeHash: Uint8Array,
): Uint8Array {
	if (sender.length !== 20) {
		throw new Error("Sender must be 20 bytes");
	}
	if (salt.length !== 32) {
		throw new Error("Salt must be 32 bytes");
	}
	if (initCodeHash.length !== 32) {
		throw new Error("Init code hash must be 32 bytes");
	}
	const combined = new Uint8Array(85);
	combined[0] = 0xff;
	combined.set(sender, 1);
	combined.set(salt, 21);
	combined.set(initCodeHash, 53);
	return keccak256Raw(combined).slice(-20);
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize standalone 3.1 kB Keccak256 micro-WASM asynchronously.
 * Required before hashing in browsers; optional in Node/Bun (auto-inits synchronously).
 */
export async function init(wasmInput?: Keccak256WasmInput): Promise<void> {
	if (wasmExports && wasmInput === undefined) return;
	const source = wasmInput ?? getDefaultWasmUrl();
	const bytes = await loadBytesAsync(source);
	const { instance } = await WebAssembly.instantiate(bytes, {});
	bindInstance(instance);
}

/**
 * Initialize standalone 3.1 kB Keccak256 micro-WASM synchronously.
 * Supported in Node/Bun or anywhere when passed raw WASM bytes.
 */
export function initSync(wasmInput?: Keccak256WasmInput): void {
	if (wasmExports && wasmInput === undefined) return;
	const source = wasmInput ?? getDefaultWasmUrl();
	const bytes = loadBytesSync(source);
	const mod = new WebAssembly.Module(bytes);
	bindInstance(new WebAssembly.Instance(mod, {}));
}

/**
 * Check if the standalone Keccak256 micro-WASM is initialized.
 */
export function isReady(): boolean {
	return wasmExports !== null;
}

/**
 * Unload the standalone Keccak256 micro-WASM instance (primarily for testing).
 */
export function reset(): void {
	wasmExports = null;
	wasmMemory = null;
	scratch = null;
	memoryOffset = 0;
}

// ============================================================================
// Re-export for namespace access
// ============================================================================

export const Keccak256Wasm = {
	hash,
	hashString,
	hashHex,
	hashMultiple,
	selector,
	topic,
	contractAddress,
	create2Address,
	init,
	initSync,
	isReady,
	reset,
	DIGEST_SIZE: 32,
	RATE: 136,
	STATE_SIZE: 25,
};
