/**
 * Error handling for Ethereum primitives library
 *
 * Maps C API error codes to TypeScript exceptions
 * Based on primitives.h error definitions
 */

/**
 * Error codes from C API (primitives.h)
 */
export enum ErrorCode {
	SUCCESS = 0,
	INVALID_HEX = -1,
	INVALID_LENGTH = -2,
	INVALID_CHECKSUM = -3,
	OUT_OF_MEMORY = -4,
	INVALID_INPUT = -5,
	INVALID_SIGNATURE = -6,
}

/**
 * Base error class for all primitives library errors
 */
export class PrimitivesError extends Error {
	public readonly code: ErrorCode;

	constructor(message: string, code: ErrorCode) {
		super(message);
		this.name = "PrimitivesError";
		this.code = code;

		// Maintains proper stack trace for where error was thrown (V8 only)
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}
}

/**
 * Thrown when a hexadecimal string is invalid
 * Maps to PRIMITIVES_ERROR_INVALID_HEX (-1)
 */
export class InvalidHexError extends PrimitivesError {
	constructor(message = "Invalid hexadecimal string") {
		super(message, ErrorCode.INVALID_HEX);
		this.name = "InvalidHexError";
	}
}

/**
 * Thrown when input length is invalid for the operation
 * Maps to PRIMITIVES_ERROR_INVALID_LENGTH (-2)
 */
export class InvalidLengthError extends PrimitivesError {
	constructor(message = "Invalid length for operation") {
		super(message, ErrorCode.INVALID_LENGTH);
		this.name = "InvalidLengthError";
	}
}

/**
 * Thrown when EIP-55 checksum validation fails
 * Maps to PRIMITIVES_ERROR_INVALID_CHECKSUM (-3)
 */
export class InvalidChecksumError extends PrimitivesError {
	constructor(message = "Invalid EIP-55 checksum") {
		super(message, ErrorCode.INVALID_CHECKSUM);
		this.name = "InvalidChecksumError";
	}
}

/**
 * Thrown when memory allocation fails
 * Maps to PRIMITIVES_ERROR_OUT_OF_MEMORY (-4)
 */
export class OutOfMemoryError extends PrimitivesError {
	constructor(message = "Out of memory") {
		super(message, ErrorCode.OUT_OF_MEMORY);
		this.name = "OutOfMemoryError";
	}
}

/**
 * Thrown when input parameter is invalid
 * Maps to PRIMITIVES_ERROR_INVALID_INPUT (-5)
 */
export class InvalidInputError extends PrimitivesError {
	constructor(message = "Invalid input parameter") {
		super(message, ErrorCode.INVALID_INPUT);
		this.name = "InvalidInputError";
	}
}

/**
 * Thrown when signature validation fails
 * Maps to PRIMITIVES_ERROR_INVALID_SIGNATURE (-6)
 */
export class InvalidSignatureError extends PrimitivesError {
	constructor(message = "Invalid signature") {
		super(message, ErrorCode.INVALID_SIGNATURE);
		this.name = "InvalidSignatureError";
	}
}

/**
 * Maps C API error code to appropriate TypeScript error class
 *
 * @param code Error code from C API
 * @param message Optional custom error message
 * @returns Appropriate error instance
 */
export function fromErrorCode(
	code: ErrorCode,
	message?: string,
): PrimitivesError {
	switch (code) {
		case ErrorCode.SUCCESS:
			throw new Error("Cannot create error from SUCCESS code");
		case ErrorCode.INVALID_HEX:
			return new InvalidHexError(message);
		case ErrorCode.INVALID_LENGTH:
			return new InvalidLengthError(message);
		case ErrorCode.INVALID_CHECKSUM:
			return new InvalidChecksumError(message);
		case ErrorCode.OUT_OF_MEMORY:
			return new OutOfMemoryError(message);
		case ErrorCode.INVALID_INPUT:
			return new InvalidInputError(message);
		case ErrorCode.INVALID_SIGNATURE:
			return new InvalidSignatureError(message);
		default:
			return new PrimitivesError(message || "Unknown error", code);
	}
}

/**
 * Checks if error code indicates success
 *
 * @param code Error code from C API
 * @returns true if operation succeeded
 */
export function isSuccess(code: number): boolean {
	return code === ErrorCode.SUCCESS;
}

/**
 * Throws appropriate error if code indicates failure
 *
 * @param code Error code from C API
 * @param message Optional custom error message
 * @throws PrimitivesError if code is not SUCCESS
 */
export function throwIfError(code: number, message?: string): void {
	if (!isSuccess(code)) {
		throw fromErrorCode(code as ErrorCode, message);
	}
}
