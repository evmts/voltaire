import type {
	InvalidFormatError,
	InvalidLengthError,
} from "../../primitives/errors/index.js";
import { CryptoError } from "../../primitives/errors/index.js";

/**
 * Base KZG error for polynomial commitment operations
 *
 * @see https://voltaire.tevm.sh/crypto/kzg for KZG documentation
 * @since 0.0.0
 */
export class KzgError extends CryptoError {
	override readonly _tag: string = "KzgError";
	constructor(
		message: string,
		options?: {
			code?: number;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, {
			code: options?.code ?? -32000,
			context: options?.context,
			docsPath: options?.docsPath || "/crypto/kzg#error-handling",
			cause: options?.cause,
		});
		this.name = "KzgError";
	}
}

/**
 * Trusted setup not initialized error
 *
 * Thrown when KZG operations are attempted before loadTrustedSetup() is called
 *
 * @see https://voltaire.tevm.sh/crypto/kzg/load-trusted-setup
 * @since 0.0.0
 */
export class KzgNotInitializedError extends KzgError {
	override readonly _tag = "KzgNotInitializedError" as const;
	constructor(
		message = "KZG trusted setup not initialized",
		options?: {
			code?: number;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, {
			code: options?.code ?? -32000,
			context: options?.context,
			docsPath:
				options?.docsPath || "/crypto/kzg/load-trusted-setup#error-handling",
			cause: options?.cause,
		});
		this.name = "KzgNotInitializedError";
	}
}

/**
 * Invalid blob error for EIP-4844 blob validation
 *
 * Thrown when blob data is malformed, wrong length, or contains invalid field elements
 *
 * @see https://voltaire.tevm.sh/crypto/kzg/validate-blob
 * @since 0.0.0
 */
export class KzgInvalidBlobError extends KzgError {
	override readonly _tag = "KzgInvalidBlobError" as const;
	constructor(
		message: string,
		options?: {
			code?: number;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, {
			code: options?.code ?? -32602,
			context: options?.context,
			docsPath: options?.docsPath || "/crypto/kzg/validate-blob#error-handling",
			cause: options?.cause,
		});
		this.name = "KzgInvalidBlobError";
	}
}

/**
 * Verification error for KZG proof verification failures
 *
 * Thrown when proof verification fails or verification inputs are invalid
 *
 * @see https://voltaire.tevm.sh/crypto/kzg/verify-blob-kzg-proof
 * @since 0.0.0
 */
export class KzgVerificationError extends KzgError {
	override readonly _tag = "KzgVerificationError" as const;
	constructor(
		message: string,
		options?: {
			code?: number;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, {
			code: options?.code ?? -32000,
			context: options?.context,
			docsPath:
				options?.docsPath || "/crypto/kzg/verify-blob-kzg-proof#error-handling",
			cause: options?.cause,
		});
		this.name = "KzgVerificationError";
	}
}

// Re-export validation errors for convenience
export type { InvalidFormatError, InvalidLengthError };
