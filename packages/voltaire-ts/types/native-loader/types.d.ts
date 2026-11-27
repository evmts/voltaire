/**
 * TypeScript type definitions and typed errors for native FFI bindings.
 * Mirrors packages/voltaire-zig/src/primitives.h error codes and conventions.
 */
/**
 * Runtime error codes returned by Voltaire's C99 ABI (`primitives.h`).
 */
export declare enum NativeErrorCode {
    SUCCESS = 0,
    INVALID_HEX = -1,
    INVALID_LENGTH = -2,
    INVALID_CHECKSUM = -3,
    OUT_OF_MEMORY = -4,
    INVALID_INPUT = -5,
    INVALID_SIGNATURE = -6,
    INVALID_SELECTOR = -7,
    UNSUPPORTED_TYPE = -8,
    MAX_LENGTH_EXCEEDED = -9,
    ACCESS_LIST_INVALID = -10,
    AUTHORIZATION_INVALID = -11,
    KZG_NOT_LOADED = -20,
    KZG_INVALID_BLOB = -21,
    KZG_INVALID_PROOF = -22,
    UNKNOWN_ERROR = -99
}
/**
 * Native runtime loader kind.
 */
export type NativeRuntimeKind = "bun-ffi" | "node-api";
/**
 * Convert native C ABI error code to a human-readable message.
 */
export declare function getNativeErrorMessage(code: number): string;
/**
 * Error thrown when a native C ABI call returns a non-zero status code.
 */
export declare class NativeError extends Error {
    readonly _tag: "NativeError";
    readonly code: number;
    readonly operation: string;
    constructor(operation: string, code: number, message?: string);
}
/**
 * Error thrown when the current OS/architecture does not have native bindings.
 */
export declare class NativeUnsupportedPlatformError extends Error {
    readonly _tag: "NativeUnsupportedPlatformError";
    readonly platform: string;
    readonly arch: string;
    constructor(platform: string, arch: string);
}
/**
 * Error thrown when native FFI is invoked in a runtime without Bun FFI or Node-API.
 */
export declare class NativeUnsupportedRuntimeError extends Error {
    readonly _tag: "NativeUnsupportedRuntimeError";
    constructor(message?: string);
}
/**
 * Error thrown when no loadable Voltaire native library can be found.
 */
export declare class NativeLibraryNotFoundError extends Error {
    readonly _tag: "NativeLibraryNotFoundError";
    readonly platform: string;
    readonly searchedPaths: readonly string[];
    constructor(platform: string, searchedPaths: readonly string[], cause?: Error);
}
//# sourceMappingURL=types.d.ts.map