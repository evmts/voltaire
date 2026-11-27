/**
 * Unified native loader.
 * Auto-detects Bun vs Node.js and uses the appropriate synchronous FFI loader.
 */

import {
	type BunNativeSymbols,
	isLoaded as isBunLoaded,
	loadBunNativeSync,
	unload as unloadBun,
} from "./bun-ffi.js";
import {
	isLoaded as isNodeLoaded,
	loadNodeNativeSync,
	type NativeModule,
	unload as unloadNode,
} from "./node-api.js";
import {
	getNativeErrorMessage as _getNativeErrorMessage,
	NativeError,
	NativeUnsupportedRuntimeError,
} from "./types.js";

export type { BunNativeSymbols } from "./bun-ffi.js";
export {
	bunFfiSymbols,
	getLoadedBunLibPath,
	loadBunNative,
	loadBunNativeSync,
} from "./bun-ffi.js";
export type { NativeModule } from "./node-api.js";
export { loadNodeNative, loadNodeNativeSync } from "./node-api.js";
export {
	getNativeExtension,
	getNativeLibCandidates,
	getNativeLibPath,
	getNativeLibPrefix,
	getPlatform,
	isNativeSupported,
	type NativeExtension,
	type NativePathOptions,
	type Platform,
	resolveNativeLibPath,
} from "./platform.js";
export type {
	NativeErrorCode as NativeErrorCodeType,
	NativeRuntimeKind,
} from "./types.js";
export {
	getNativeErrorMessage,
	NativeError,
	NativeErrorCode,
	NativeLibraryNotFoundError,
	NativeUnsupportedPlatformError,
	NativeUnsupportedRuntimeError,
} from "./types.js";
export { loadForkWasm } from "./wasm.js";

/**
 * Unified native library symbol table returned by {@link loadNativeSync}.
 */
export type NativeLibrary = BunNativeSymbols | NativeModule;

const NON_EMPTY_SENTINEL = new Uint8Array(1);

/**
 * Runtime environment detection for Bun.
 */
export function isBun(): boolean {
	return typeof (globalThis as { Bun?: unknown }).Bun !== "undefined";
}

/**
 * Runtime environment detection for Node.js.
 */
export function isNode(): boolean {
	return (
		typeof process !== "undefined" &&
		process.versions != null &&
		process.versions.node != null
	);
}

/**
 * Load native library synchronously using Bun FFI or Node-API.
 * Zero `await` required — enables drop-in synchronous parity with `@tevm/voltaire`.
 */
export function loadNativeSync(): NativeLibrary {
	if (isBun()) {
		return loadBunNativeSync();
	}

	if (isNode()) {
		return loadNodeNativeSync();
	}

	throw new NativeUnsupportedRuntimeError();
}

/**
 * Load native library asynchronously (backwards-compatible wrapper over {@link loadNativeSync}).
 */
export async function loadNative(): Promise<NativeLibrary> {
	return loadNativeSync();
}

/**
 * Check whether the native library is currently loaded in this runtime.
 */
export function isNativeLoaded(): boolean {
	if (isBun()) return isBunLoaded();
	if (isNode()) return isNodeLoaded();
	return false;
}

/**
 * Unload any cached native library handle (useful in tests or reloading with a new path).
 */
export function unloadNative(): void {
	unloadBun();
	unloadNode();
}

/**
 * Check error code and throw a typed NativeError if non-zero.
 */
export function checkError(code: number, operation: string): void {
	if (code !== 0) {
		const message = _getNativeErrorMessage(code);
		throw new NativeError(
			operation,
			code,
			`Native ${operation} failed: ${message}`,
		);
	}
}

/**
 * Return a non-empty Uint8Array safe to pass as a non-null C pointer when `data.length === 0`.
 * Always pass `data.length` (0) as the length argument alongside this buffer.
 */
export function safeBufferPtr(data: Uint8Array): Uint8Array {
	return data.length === 0 ? NON_EMPTY_SENTINEL : data;
}

/**
 * Encode a JavaScript string as a null-terminated UTF-8 buffer for C `const char*` calls.
 */
export function toCStringBuffer(str: string): Uint8Array {
	const encoded = new TextEncoder().encode(str);
	const out = new Uint8Array(encoded.length + 1);
	out.set(encoded, 0);
	out[encoded.length] = 0;
	return out;
}

/**
 * Helper to allocate buffer for output.
 */
export function allocateOutput(size: number): Uint8Array {
	return new Uint8Array(size);
}

/**
 * Helper to allocate buffer for string output.
 */
export function allocateStringOutput(size: number): {
	buffer: Uint8Array;
	ptr: Uint8Array;
} {
	const buffer = new Uint8Array(size);
	const ptr = new Uint8Array(8);
	return { buffer, ptr };
}
