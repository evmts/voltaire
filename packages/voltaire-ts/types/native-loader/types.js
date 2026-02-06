/**
 * TypeScript type definitions for native FFI bindings
 * Mirrors c_api.zig exports
 */
/**
 * Runtime error codes from native library
 */
export var NativeErrorCode;
(function (NativeErrorCode) {
    NativeErrorCode[NativeErrorCode["SUCCESS"] = 0] = "SUCCESS";
    NativeErrorCode[NativeErrorCode["INVALID_HEX"] = -1] = "INVALID_HEX";
    NativeErrorCode[NativeErrorCode["INVALID_LENGTH"] = -2] = "INVALID_LENGTH";
    NativeErrorCode[NativeErrorCode["INVALID_CHECKSUM"] = -3] = "INVALID_CHECKSUM";
    NativeErrorCode[NativeErrorCode["BUFFER_TOO_SMALL"] = -4] = "BUFFER_TOO_SMALL";
    NativeErrorCode[NativeErrorCode["INVALID_SIGNATURE"] = -5] = "INVALID_SIGNATURE";
    NativeErrorCode[NativeErrorCode["INVALID_RECOVERY_ID"] = -6] = "INVALID_RECOVERY_ID";
    NativeErrorCode[NativeErrorCode["INVALID_PRIVATE_KEY"] = -7] = "INVALID_PRIVATE_KEY";
    NativeErrorCode[NativeErrorCode["INVALID_PUBLIC_KEY"] = -8] = "INVALID_PUBLIC_KEY";
    NativeErrorCode[NativeErrorCode["ENCODING_ERROR"] = -9] = "ENCODING_ERROR";
    NativeErrorCode[NativeErrorCode["DECODING_ERROR"] = -10] = "DECODING_ERROR";
    NativeErrorCode[NativeErrorCode["NULL_POINTER"] = -11] = "NULL_POINTER";
    NativeErrorCode[NativeErrorCode["OUT_OF_MEMORY"] = -12] = "OUT_OF_MEMORY";
    NativeErrorCode[NativeErrorCode["UNKNOWN_ERROR"] = -99] = "UNKNOWN_ERROR";
})(NativeErrorCode || (NativeErrorCode = {}));
/**
 * Convert native error code to error message
 */
export function getNativeErrorMessage(code) {
    switch (code) {
        case NativeErrorCode.SUCCESS:
            return "Success";
        case NativeErrorCode.INVALID_HEX:
            return "Invalid hexadecimal string";
        case NativeErrorCode.INVALID_LENGTH:
            return "Invalid length";
        case NativeErrorCode.INVALID_CHECKSUM:
            return "Invalid checksum";
        case NativeErrorCode.BUFFER_TOO_SMALL:
            return "Output array too small";
        case NativeErrorCode.INVALID_SIGNATURE:
            return "Invalid signature";
        case NativeErrorCode.INVALID_RECOVERY_ID:
            return "Invalid recovery ID";
        case NativeErrorCode.INVALID_PRIVATE_KEY:
            return "Invalid private key";
        case NativeErrorCode.INVALID_PUBLIC_KEY:
            return "Invalid public key";
        case NativeErrorCode.ENCODING_ERROR:
            return "Encoding error";
        case NativeErrorCode.DECODING_ERROR:
            return "Decoding error";
        case NativeErrorCode.NULL_POINTER:
            return "Null pointer";
        case NativeErrorCode.OUT_OF_MEMORY:
            return "Out of memory";
        case NativeErrorCode.UNKNOWN_ERROR:
            return "Unknown error";
        default:
            return `Native error code: ${code}`;
    }
}
