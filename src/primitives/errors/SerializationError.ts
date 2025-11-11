import { PrimitiveError } from "./PrimitiveError.js";

/**
 * Base serialization error
 *
 * @example
 * ```typescript
 * throw new SerializationError('Failed to serialize', {
 *   code: 'SERIALIZATION_ERROR',
 *   context: { data: [...] },
 *   docsPath: '/primitives/rlp/encode#error-handling',
 *   cause: originalError
 * })
 * ```
 */
export class SerializationError extends PrimitiveError {
	constructor(
		message: string,
		options?: {
			code?: string;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, {
			code: options?.code || "SERIALIZATION_ERROR",
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "SerializationError";
	}
}

/**
 * Encoding error (e.g., RLP encoding failure)
 *
 * @throws {EncodingError}
 */
export class EncodingError extends SerializationError {
	constructor(
		message: string,
		options?: {
			code?: string;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, {
			code: options?.code || "ENCODING_ERROR",
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "EncodingError";
	}
}

/**
 * Decoding error (e.g., RLP decoding failure)
 *
 * @throws {DecodingError}
 */
export class DecodingError extends SerializationError {
	constructor(
		message: string,
		options?: {
			code?: string;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, {
			code: options?.code || "DECODING_ERROR",
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "DecodingError";
	}
}
