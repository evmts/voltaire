/**
 * Unified native loader
 * Auto-detects Bun vs Node.js and uses appropriate FFI mechanism
 */
export { getNativeExtension, getPlatform, isNativeSupported, } from "./platform.js";
export { getNativeErrorMessage, NativeErrorCode } from "./types.js";
export { loadForkWasm } from "./wasm.js";
import { getNativeErrorMessage as _getNativeErrorMessage } from "./types.js";
/**
 * Runtime environment detection
 */
export function isBun() {
    return typeof globalThis.Bun !== "undefined";
}
export function isNode() {
    return (typeof process !== "undefined" &&
        process.versions != null &&
        process.versions.node != null);
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
    throw new Error("Unsupported runtime. Native bindings require Bun or Node.js.");
}
/**
 * Check error code and throw if non-zero
 */
export function checkError(code, operation) {
    if (code !== 0) {
        const message = _getNativeErrorMessage(code);
        throw new Error(`Native ${operation} failed: ${message}`);
    }
}
/**
 * Helper to allocate buffer for output
 */
export function allocateOutput(size) {
    return new Uint8Array(size);
}
/**
 * Helper to allocate buffer for string output
 */
export function allocateStringOutput(size) {
    const buffer = new Uint8Array(size);
    const ptr = new Uint8Array(8); // size_t* for output length
    return { buffer, ptr };
}
