import { PrimitiveError } from "./PrimitiveError.js";

/**
 * Base serialization error
 */
export class SerializationError extends PrimitiveError {
	constructor(
		message: string,
		options?: { code?: string; context?: Record<string, any> },
	) {
		super(
			message,
			options?.context !== undefined
				? {
						code: options.code || "SERIALIZATION_ERROR",
						context: options.context,
					}
				: { code: options?.code || "SERIALIZATION_ERROR" },
		);
		this.name = "SerializationError";
	}
}

/**
 * Encoding error (e.g., RLP encoding failure)
 */
export class EncodingError extends SerializationError {
	constructor(
		message: string,
		options?: { code?: string; context?: Record<string, any> },
	) {
		super(
			message,
			options?.context !== undefined
				? { code: options.code || "ENCODING_ERROR", context: options.context }
				: { code: options?.code || "ENCODING_ERROR" },
		);
		this.name = "EncodingError";
	}
}

/**
 * Decoding error (e.g., RLP decoding failure)
 */
export class DecodingError extends SerializationError {
	constructor(
		message: string,
		options?: { code?: string; context?: Record<string, any> },
	) {
		super(
			message,
			options?.context !== undefined
				? { code: options.code || "DECODING_ERROR", context: options.context }
				: { code: options?.code || "DECODING_ERROR" },
		);
		this.name = "DecodingError";
	}
}
