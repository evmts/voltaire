import { PrimitiveError } from "./PrimitiveError.js";

/**
 * Base validation error
 */
export class ValidationError extends PrimitiveError {
	value: any;
	expected: string;

	constructor(
		message: string,
		options: {
			code?: string;
			value: any;
			expected: string;
			context?: Record<string, any>;
		},
	) {
		super(
			message,
			options.context !== undefined
				? {
						code: options.code || "VALIDATION_ERROR",
						context: options.context,
					}
				: { code: options.code || "VALIDATION_ERROR" },
		);
		this.name = "ValidationError";
		this.value = options.value;
		this.expected = options.expected;
	}
}

/**
 * Invalid format error (e.g., wrong hex prefix, invalid characters)
 */
export class InvalidFormatError extends ValidationError {
	constructor(
		message: string,
		options: {
			code?: string;
			value: any;
			expected: string;
			context?: Record<string, any>;
		},
	) {
		super(message, { ...options, code: options.code || "INVALID_FORMAT" });
		this.name = "InvalidFormatError";
	}
}

/**
 * Invalid length error (e.g., wrong byte count)
 */
export class InvalidLengthError extends ValidationError {
	constructor(
		message: string,
		options: {
			code?: string;
			value: any;
			expected: string;
			context?: Record<string, any>;
		},
	) {
		super(message, { ...options, code: options.code || "INVALID_LENGTH" });
		this.name = "InvalidLengthError";
	}
}

/**
 * Invalid range error (e.g., value out of bounds)
 */
export class InvalidRangeError extends ValidationError {
	constructor(
		message: string,
		options: {
			code?: string;
			value: any;
			expected: string;
			context?: Record<string, any>;
		},
	) {
		super(message, { ...options, code: options.code || "INVALID_RANGE" });
		this.name = "InvalidRangeError";
	}
}

/**
 * Invalid checksum error (e.g., EIP-55 checksum mismatch)
 */
export class InvalidChecksumError extends ValidationError {
	constructor(
		message: string,
		options: {
			code?: string;
			value: any;
			expected: string;
			context?: Record<string, any>;
		},
	) {
		super(message, { ...options, code: options.code || "INVALID_CHECKSUM" });
		this.name = "InvalidChecksumError";
	}
}
