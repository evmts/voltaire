/**
 * Unified native loader
 * Auto-detects Bun vs Node.js and uses appropriate FFI mechanism
 */

export {
	getPlatform,
	getNativeExtension,
	isNativeSupported,
	type Platform,
} from "./platform.js";
export { getNativeErrorMessage, NativeErrorCode } from "./types.js";
export type { NativeErrorCode as NativeErrorCodeType } from "./types.js";
export type { NativeModule } from "./node-api.js";

/**
 * Runtime environment detection
 */
export function isBun(): boolean {
	return typeof (globalThis as { Bun?: unknown }).Bun !== "undefined";
}

export function isNode(): boolean {
	return (
		typeof process !== "undefined" &&
		process.versions != null &&
		process.versions.node != null
	);
}

/**
 * Load native library using appropriate loader
 */
export async function loadNative() {
	if (isBun()) {
		const { loadBunNative } = await import("./bun-ffi.js");
		return loadBunNative();
	}

	if (isNode()) {
		const { loadNodeNative } = await import("./node-api.js");
		return loadNodeNative();
	}

	throw new Error(
		"Unsupported runtime. Native bindings require Bun or Node.js.",
	);
}

/**
 * Check error code and throw if non-zero
 */
export function checkError(code: number, operation: string): void {
	if (code !== 0) {
		const { getNativeErrorMessage } = require("./types.js");
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

