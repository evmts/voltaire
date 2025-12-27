import { InvalidRangeError } from "./ValidationError.js";

/**
 * Error thrown when integer value exceeds maximum bound
 *
 * @example
 * ```typescript
 * throw new IntegerOverflowError(
 *   'Value exceeds uint8 maximum',
 *   {
 *     value: 256n,
 *     max: 255n,
 *     type: 'uint8',
 *   }
 * )
 * ```
 */
export class IntegerOverflowError extends InvalidRangeError {
	/** Maximum allowed value */
	max: bigint | number;
	/** Integer type (e.g., 'uint8', 'uint256') */
	integerType: string;

	constructor(
		message: string,
		options: {
			code?: string;
			value: bigint | number;
			max: bigint | number;
			type: string;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, {
			code: options.code || "INTEGER_OVERFLOW",
			value: options.value,
			expected: `value <= ${options.max}`,
			context: {
				...options.context,
				max: options.max,
				integerType: options.type,
			},
			docsPath:
				options.docsPath || "/primitives/validation#integer-overflow-error",
			cause: options.cause,
		});
		this.name = "IntegerOverflowError";
		this.max = options.max;
		this.integerType = options.type;
	}
}

/**
 * Error thrown when integer value is below minimum bound (e.g., negative for unsigned)
 *
 * @example
 * ```typescript
 * throw new IntegerUnderflowError(
 *   'Unsigned integer cannot be negative',
 *   {
 *     value: -1n,
 *     min: 0n,
 *     type: 'uint256',
 *   }
 * )
 * ```
 */
export class IntegerUnderflowError extends InvalidRangeError {
	/** Minimum allowed value */
	min: bigint | number;
	/** Integer type (e.g., 'uint8', 'int256') */
	integerType: string;

	constructor(
		message: string,
		options: {
			code?: string;
			value: bigint | number;
			min: bigint | number;
			type: string;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, {
			code: options.code || "INTEGER_UNDERFLOW",
			value: options.value,
			expected: `value >= ${options.min}`,
			context: {
				...options.context,
				min: options.min,
				integerType: options.type,
			},
			docsPath:
				options.docsPath || "/primitives/validation#integer-underflow-error",
			cause: options.cause,
		});
		this.name = "IntegerUnderflowError";
		this.min = options.min;
		this.integerType = options.type;
	}
}

/**
 * Error thrown when hex/byte data has invalid size
 *
 * @example
 * ```typescript
 * throw new InvalidSizeError(
 *   'Address must be 20 bytes',
 *   {
 *     actualSize: 10,
 *     expectedSize: 20,
 *     value: '0x1234...',
 *   }
 * )
 * ```
 */
export class InvalidSizeError extends InvalidRangeError {
	/** Actual size in bytes */
	actualSize: number;
	/** Expected size in bytes */
	expectedSize: number;

	constructor(
		message: string,
		options: {
			code?: string;
			value: unknown;
			actualSize: number;
			expectedSize: number;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, {
			code: options.code || "INVALID_SIZE",
			value: options.value,
			expected: `${options.expectedSize} bytes`,
			context: {
				...options.context,
				actualSize: options.actualSize,
				expectedSize: options.expectedSize,
			},
			docsPath: options.docsPath || "/primitives/validation#invalid-size-error",
			cause: options.cause,
		});
		this.name = "InvalidSizeError";
		this.actualSize = options.actualSize;
		this.expectedSize = options.expectedSize;
	}
}
