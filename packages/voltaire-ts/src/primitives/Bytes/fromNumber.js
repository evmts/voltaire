import {
	NegativeNumberError,
	NonIntegerError,
	SizeExceededError,
	UnsafeIntegerError,
} from "./errors.js";

/**
 * Convert number to Bytes
 *
 * @param {number} value - Number to convert (must be safe integer, non-negative)
 * @param {number} [size] - Optional byte size (pads or throws if too small)
 * @returns {import('./BytesType.js').BytesType} Bytes
 * @throws {NegativeNumberError} If value is negative
 * @throws {UnsafeIntegerError} If value exceeds MAX_SAFE_INTEGER
 * @throws {NonIntegerError} If value is not an integer
 * @throws {SizeExceededError} If number requires more bytes than size allows
 *
 * @example
 * ```javascript
 * import * as Bytes from './primitives/Bytes/index.js';
 * Bytes.fromNumber(255);     // Uint8Array([0xff])
 * Bytes.fromNumber(255, 2);  // Uint8Array([0x00, 0xff])
 * Bytes.fromNumber(0x1234);  // Uint8Array([0x12, 0x34])
 * ```
 */
export function fromNumber(value, size) {
	if (value < 0) {
		throw new NegativeNumberError(
			`Number must be non-negative. Got: ${value}`,
			{
				value,
			},
		);
	}
	if (value > Number.MAX_SAFE_INTEGER) {
		throw new UnsafeIntegerError(
			`Number exceeds MAX_SAFE_INTEGER (${Number.MAX_SAFE_INTEGER}). Use Bytes.fromBigInt() for larger values.`,
			{ value },
		);
	}
	if (!Number.isInteger(value)) {
		throw new NonIntegerError(`Number must be an integer. Got: ${value}`, {
			value,
		});
	}

	// Calculate minimum bytes needed
	let hex = value.toString(16);
	if (hex.length % 2 !== 0) {
		hex = `0${hex}`;
	}
	const minBytes = hex.length / 2;

	const targetSize = size !== undefined ? size : minBytes;

	if (minBytes > targetSize) {
		throw new SizeExceededError(
			`Number ${value} requires ${minBytes} bytes but size is ${targetSize}.`,
			{
				value,
				expected: `${targetSize} bytes`,
				context: { requiredBytes: minBytes, targetSize },
			},
		);
	}

	const result = new Uint8Array(targetSize);
	// Fill from the end
	for (let i = 0; i < minBytes; i++) {
		const byteIndex = targetSize - 1 - i;
		const hexIndex = hex.length - 2 - i * 2;
		result[byteIndex] = Number.parseInt(hex.slice(hexIndex, hexIndex + 2), 16);
	}

	return /** @type {import('./BytesType.js').BytesType} */ (result);
}
