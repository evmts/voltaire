/**
 * Convert number to Bytes
 *
 * @param {number} value - Number to convert (must be safe integer, non-negative)
 * @param {number} [size] - Optional byte size (pads or throws if too small)
 * @returns {import('./BytesType.js').BytesType} Bytes
 * @throws {Error} If value is negative, not an integer, or exceeds MAX_SAFE_INTEGER
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
		throw new Error(`Number must be non-negative. Got: ${value}`);
	}
	if (value > Number.MAX_SAFE_INTEGER) {
		throw new Error(
			`Number exceeds MAX_SAFE_INTEGER (${Number.MAX_SAFE_INTEGER}). Use Bytes.fromBigInt() for larger values.`,
		);
	}
	if (!Number.isInteger(value)) {
		throw new Error(`Number must be an integer. Got: ${value}`);
	}

	// Calculate minimum bytes needed
	let hex = value.toString(16);
	if (hex.length % 2 !== 0) {
		hex = `0${hex}`;
	}
	const minBytes = hex.length / 2;

	const targetSize = size !== undefined ? size : minBytes;

	if (minBytes > targetSize) {
		throw new Error(
			`Number ${value} requires ${minBytes} bytes but size is ${targetSize}.`,
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
