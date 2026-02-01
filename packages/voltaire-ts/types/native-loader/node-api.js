/**
 * Node-API loader for native bindings
 * Uses Node.js native addon loading for compatibility
 */
import { getNativeLibPath } from "./platform.js";
import { getNativeErrorMessage } from "./types.js";
let nativeModule = null;
/**
 * Load native library using Node.js addon mechanism
 * @throws Error if library cannot be loaded
 */
export function loadNodeNative() {
    if (nativeModule)
        return nativeModule;
    // Try multiple possible paths for the native library
    const pathsToTry = [
        getNativeLibPath("voltaire_native"), // Standard build output path
        "./zig-out/native/libprimitives_ts_native.dylib", // macOS current build output
    ];
    let lastError = null;
    for (const libPath of pathsToTry) {
        try {
            // Use dynamic require to load native .node addon
            // Note: Native Node.js addons (.node files) must be loaded with require(),
            // not import(). This is a Node.js limitation, not an ESM compatibility issue.
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            nativeModule = require(libPath);
            return nativeModule;
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            // Continue trying next path
        }
    }
    throw new Error(`Failed to load native library with Node-API: ${lastError?.message || "Unknown error"}. Node.js native FFI is not shipped yet — use the regular TypeScript API or WASM modules in Node.`);
}
/**
 * Check if native library is loaded
 */
export function isLoaded() {
    return nativeModule !== null;
}
/**
 * Unload native library
 * Note: Node.js doesn't provide explicit unload, just clear reference
 */
export function unload() {
    nativeModule = null;
}
/**
 * Helper to check error code and throw if non-zero
 */
export function checkError(code, operation) {
    if (code !== 0) {
        const message = getNativeErrorMessage(code);
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
