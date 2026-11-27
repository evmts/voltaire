/**
 * Unified native loader.
 * Auto-detects Bun vs Node.js and uses the appropriate synchronous FFI loader.
 */
import { type BunNativeSymbols } from "./bun-ffi.js";
import { type NativeModule } from "./node-api.js";
export type { BunNativeSymbols } from "./bun-ffi.js";
export { bunFfiSymbols, getLoadedBunLibPath, loadBunNative, loadBunNativeSync, } from "./bun-ffi.js";
export type { NativeModule } from "./node-api.js";
export { loadNodeNative, loadNodeNativeSync } from "./node-api.js";
export { getNativeExtension, getNativeLibCandidates, getNativeLibPath, getNativeLibPrefix, getPlatform, isNativeSupported, type NativeExtension, type NativePathOptions, type Platform, resolveNativeLibPath, } from "./platform.js";
export type { NativeErrorCode as NativeErrorCodeType, NativeRuntimeKind, } from "./types.js";
export { getNativeErrorMessage, NativeError, NativeErrorCode, NativeLibraryNotFoundError, NativeUnsupportedPlatformError, NativeUnsupportedRuntimeError, } from "./types.js";
export { loadForkWasm } from "./wasm.js";
/**
 * Unified native library symbol table returned by {@link loadNativeSync}.
 */
export type NativeLibrary = BunNativeSymbols | NativeModule;
/**
 * Runtime environment detection for Bun.
 */
export declare function isBun(): boolean;
/**
 * Runtime environment detection for Node.js.
 */
export declare function isNode(): boolean;
/**
 * Load native library synchronously using Bun FFI or Node-API.
 * Zero `await` required — enables drop-in synchronous parity with `@tevm/voltaire`.
 */
export declare function loadNativeSync(): NativeLibrary;
/**
 * Load native library asynchronously (backwards-compatible wrapper over {@link loadNativeSync}).
 */
export declare function loadNative(): Promise<NativeLibrary>;
/**
 * Check whether the native library is currently loaded in this runtime.
 */
export declare function isNativeLoaded(): boolean;
/**
 * Unload any cached native library handle (useful in tests or reloading with a new path).
 */
export declare function unloadNative(): void;
/**
 * Check error code and throw a typed NativeError if non-zero.
 */
export declare function checkError(code: number, operation: string): void;
/**
 * Return a non-empty Uint8Array safe to pass as a non-null C pointer when `data.length === 0`.
 * Always pass `data.length` (0) as the length argument alongside this buffer.
 */
export declare function safeBufferPtr(data: Uint8Array): Uint8Array;
/**
 * Encode a JavaScript string as a null-terminated UTF-8 buffer for C `const char*` calls.
 */
export declare function toCStringBuffer(str: string): Uint8Array;
/**
 * Helper to allocate buffer for output.
 */
export declare function allocateOutput(size: number): Uint8Array;
/**
 * Helper to allocate buffer for string output.
 */
export declare function allocateStringOutput(size: number): {
    buffer: Uint8Array;
    ptr: Uint8Array;
};
//# sourceMappingURL=index.d.ts.map