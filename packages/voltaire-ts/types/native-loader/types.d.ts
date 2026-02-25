/**
 * TypeScript type definitions for native FFI bindings
 * Mirrors c_api.zig exports
 */
/**
 * Runtime error codes from native library
 */
export declare enum NativeErrorCode {
    SUCCESS = 0,
    INVALID_HEX = -1,
    INVALID_LENGTH = -2,
    INVALID_CHECKSUM = -3,
    BUFFER_TOO_SMALL = -4,
    INVALID_SIGNATURE = -5,
    INVALID_RECOVERY_ID = -6,
    INVALID_PRIVATE_KEY = -7,
    INVALID_PUBLIC_KEY = -8,
    ENCODING_ERROR = -9,
    DECODING_ERROR = -10,
    NULL_POINTER = -11,
    OUT_OF_MEMORY = -12,
    UNKNOWN_ERROR = -99
}
/**
 * Convert native error code to error message
 */
export declare function getNativeErrorMessage(code: number): string;
//# sourceMappingURL=types.d.ts.map