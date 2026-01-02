import { NegativeBigIntError, SizeExceededError } from "./errors.js";

/**
 * Convert bigint to Bytes
 *
 * @param {bigint} value - BigInt to convert (must be non-negative)
 * @param {number} [size] - Optional byte size (pads or throws if too small)
 * @returns {import('./BytesType.js').BytesType} Bytes
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
	if (value < 0n) {
		throw new NegativeBigIntError(`BigInt must be non-negative. Got: ${value}`, {
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
		result[byteIndex] = Number.parseInt(hex.slice(hexIndex, hexIndex + 2), 16);
	}

	return /** @type {import('./BytesType.js').BytesType} */ (result);
}
