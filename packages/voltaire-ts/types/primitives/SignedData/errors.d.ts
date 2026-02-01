/**
 * Error thrown when signed data has invalid version byte
 */
export declare class InvalidSignedDataVersionError extends Error {
    constructor(message: string, context?: unknown);
    context?: unknown;
}
/**
 * Error thrown when signed data has invalid format
 */
export declare class InvalidSignedDataFormatError extends Error {
    constructor(message: string, context?: unknown);
    context?: unknown;
}
/**
 * Error thrown when signature verification fails
 */
export declare class SignatureVerificationError extends Error {
    constructor(message: string, context?: unknown);
    context?: unknown;
}
//# sourceMappingURL=errors.d.ts.map