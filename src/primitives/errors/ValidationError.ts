import { PrimitiveError } from "./PrimitiveError.js";

/**
 * Base validation error
 *
 * @example
 * ```typescript
 * throw new ValidationError('Invalid value', {
 *   value: '0x123',
 *   expected: '20 bytes',
 *   code: 'VALIDATION_ERROR',
 *   docsPath: '/primitives/address/from-hex#error-handling',
 *   cause: originalError
 * })
 * ```
 */
export class ValidationError extends PrimitiveError {
	override readonly _tag: string = "ValidationError";
	value: unknown;
	expected: string;

	constructor(
		message: string,
		options: {
			code?: number | string;
			value: unknown;
			expected: string;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, {
			code: options.code ?? "VALIDATION_ERROR",
			context: options.context,
			docsPath: options.docsPath,
			cause: options.cause,
		});
		this.name = "ValidationError";
		this.value = options.value;
		this.expected = options.expected;
	}
}

/**
 * Invalid format error (e.g., wrong hex prefix, invalid characters)
 *
 * @throws {InvalidFormatError}
 */
export class InvalidFormatError extends ValidationError {
	override readonly _tag: string = "InvalidFormatError";
	constructor(
		message: string,
		options: {
			code?: number | string;
			value: unknown;
			expected: string;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, { ...options, code: options.code ?? "INVALID_FORMAT" });
		this.name = "InvalidFormatError";
	}
}

/**
 * Invalid length error (e.g., wrong byte count)
 *
 * @throws {InvalidLengthError}
 */
export class InvalidLengthError extends ValidationError {
	override readonly _tag: string = "InvalidLengthError";
	constructor(
		message: string,
		options: {
			code?: number | string;
			value: unknown;
			expected: string;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, { ...options, code: options.code ?? "INVALID_LENGTH" });
		this.name = "InvalidLengthError";
	}
}

/**
 * Invalid range error (e.g., value out of bounds)
 *
 * @throws {InvalidRangeError}
 */
export class InvalidRangeError extends ValidationError {
	override readonly _tag: string = "InvalidRangeError";
	constructor(
		message: string,
		options: {
			code?: number | string;
			value: unknown;
			expected: string;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, { ...options, code: options.code ?? "INVALID_RANGE" });
		this.name = "InvalidRangeError";
	}
}

/**
 * Invalid checksum error (e.g., EIP-55 checksum mismatch)
 *
 * @throws {InvalidChecksumError}
 */
export class InvalidChecksumError extends ValidationError {
	override readonly _tag: string = "InvalidChecksumError";
	constructor(
		message: string,
		options: {
			code?: number | string;
			value: unknown;
			expected: string;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, { ...options, code: options.code ?? "INVALID_CHECKSUM" });
		this.name = "InvalidChecksumError";
	}
}
