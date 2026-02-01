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
	override readonly _tag: string = "SerializationError";
	constructor(
		message: string,
		options?: {
			code?: number | string;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, {
			code: options?.code ?? "SERIALIZATION_ERROR",
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
	override readonly _tag: string = "EncodingError";
	constructor(
		message: string,
		options?: {
			code?: number | string;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, {
			code: options?.code ?? "ENCODING_ERROR",
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
	override readonly _tag: string = "DecodingError";
	constructor(
		message: string,
		options?: {
			code?: number | string;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, {
			code: options?.code ?? "DECODING_ERROR",
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "DecodingError";
	}
}
