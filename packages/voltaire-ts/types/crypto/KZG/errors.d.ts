import type { InvalidFormatError, InvalidLengthError } from "../../primitives/errors/index.js";
import { CryptoError } from "../../primitives/errors/index.js";
/**
 * Base KZG error for polynomial commitment operations
 *
 * @see https://voltaire.tevm.sh/crypto/kzg for KZG documentation
 * @since 0.0.0
 */
export declare class KzgError extends CryptoError {
    readonly _tag: string;
    constructor(message: string, options?: {
        code?: number;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Trusted setup not initialized error
 *
 * Thrown when KZG operations are attempted before loadTrustedSetup() is called
 *
 * @see https://voltaire.tevm.sh/crypto/kzg/load-trusted-setup
 * @since 0.0.0
 */
export declare class KzgNotInitializedError extends KzgError {
    readonly _tag: "KzgNotInitializedError";
    constructor(message?: string, options?: {
        code?: number;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Invalid blob error for EIP-4844 blob validation
 *
 * Thrown when blob data is malformed, wrong length, or contains invalid field elements
 *
 * @see https://voltaire.tevm.sh/crypto/kzg/validate-blob
 * @since 0.0.0
 */
export declare class KzgInvalidBlobError extends KzgError {
    readonly _tag: "KzgInvalidBlobError";
    constructor(message: string, options?: {
        code?: number;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Verification error for KZG proof verification failures
 *
 * Thrown when proof verification fails or verification inputs are invalid
 *
 * @see https://voltaire.tevm.sh/crypto/kzg/verify-blob-kzg-proof
 * @since 0.0.0
 */
export declare class KzgVerificationError extends KzgError {
    readonly _tag: "KzgVerificationError";
    constructor(message: string, options?: {
        code?: number;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
export type { InvalidFormatError, InvalidLengthError };
//# sourceMappingURL=errors.d.ts.map