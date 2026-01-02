import { InvalidLengthError } from "../errors/index.js";

/**
 * Create Int64 from bytes (big-endian, two's complement)
 *
 * @param {Uint8Array} bytes - Bytes to convert (up to 8 bytes)
 * @returns {import('./Int64Type.js').BrandedInt64} Int64 value
 * @throws {InvalidLengthError} If bytes length exceeds 8
 */
export function fromBytes(bytes) {
	if (bytes.length > 8) {
		throw new InvalidLengthError(
			`Int64 bytes cannot exceed 8 bytes, got ${bytes.length}`,
			{
				value: bytes,
				expected: "8 bytes or fewer",
				docsPath: "/primitives/int64#from-bytes",
			},
		);
	}

	// Read as unsigned first
	let value = 0n;
	for (let i = 0; i < bytes.length; i++) {
		value = (value << 8n) | BigInt(bytes[i] ?? 0);
	}

	// Sign extend if necessary
	if (bytes.length > 0) {
		const signBit = BigInt(bytes.length * 8 - 1);
		if (value & (1n << signBit)) {
			// Negative number - extend sign
			const mask = -1n << (BigInt(bytes.length) * 8n);
			value = value | mask;
		}
	}

	return /** @type {import('./Int64Type.js').BrandedInt64} */ (value);
}
