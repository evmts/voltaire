/**
 * Error thrown when calldata is too short (must be at least 4 bytes for selector)
 */
export class InvalidCallDataLengthError extends Error {
	readonly code = "INVALID_CALLDATA_LENGTH";
	readonly value: unknown;
	readonly expected: string;

	constructor(
		message: string,
		options?: { value?: unknown; expected?: string },
	) {
		super(message);
		this.name = "InvalidCallDataLengthError";
		this.value = options?.value;
		this.expected = options?.expected ?? "at least 4 bytes";
	}
}

/**
 * Error thrown when hex string format is invalid
 */
export class InvalidHexFormatError extends Error {
	readonly code = "INVALID_HEX_FORMAT";

	constructor(message: string) {
		super(message);
		this.name = "InvalidHexFormatError";
	}
}

/**
 * Error thrown when value type is unsupported
 */
export class InvalidValueError extends Error {
	readonly code = "INVALID_VALUE";
	readonly value: unknown;
	readonly expected?: string;

	constructor(
		message: string,
		options?: { value?: unknown; expected?: string },
	) {
		super(message);
		this.name = "InvalidValueError";
		this.value = options?.value;
		this.expected = options?.expected;
	}
}
