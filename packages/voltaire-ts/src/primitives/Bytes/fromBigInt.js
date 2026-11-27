import { parseHexByte } from "../Hex/parseHexByte.js";
import {
	InvalidBytesFormatError,
	NegativeBigIntError,
	SizeExceededError,
} from "./errors.js";

/**
 * Convert bigint to Bytes
 *
 * @param {bigint} value - BigInt to convert (must be non-negative)
 * @param {number} [size] - Optional byte size (pads or throws if too small)
 * @returns {import('./BytesType.js').BytesType} Bytes
 * @throws {InvalidBytesFormatError} If value is not a bigint or size is invalid
 * @throws {NegativeBigIntError} If value is negative
 * @throws {SizeExceededError} If value doesn't fit in size
 *
 * @example
 * ```javascript
 * import * as Bytes from './primitives/Bytes/index.js';
 * Bytes.fromBigInt(255n);      // Uint8Array([0xff])
 * Bytes.fromBigInt(255n, 2);   // Uint8Array([0x00, 0xff])
 * Bytes.fromBigInt(0x1234n);   // Uint8Array([0x12, 0x34])
 * ```
 */
export function fromBigInt(value, size) {
	if (typeof value !== "bigint") {
		throw new InvalidBytesFormatError(`Expected bigint, got ${typeof value}`, {
			value,
			expected: "non-negative bigint",
		});
	}
	if (value < 0n) {
		throw new NegativeBigIntError(
			`BigInt must be non-negative. Got: ${value}`,
			{
				value,
			},
		);
	}
	if (size !== undefined && (!Number.isInteger(size) || size < 0)) {
		throw new InvalidBytesFormatError(`Invalid size parameter: ${size}`, {
			value: size,
			expected: "non-negative integer",
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
			`BigInt requires ${minBytes} bytes but size is ${targetSize}.`,
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
		result[byteIndex] = parseHexByte(hex, hexIndex);
	}

	return /** @type {import('./BytesType.js').BytesType} */ (result);
}
