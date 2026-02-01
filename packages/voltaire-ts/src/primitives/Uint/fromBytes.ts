import { UintInvalidLengthError } from "./errors.js";
import type { Uint256Type } from "./Uint256Type.js";

/**
 * Create Uint256 from bytes (big-endian)
 *
 * @param bytes - bytes to convert
 * @returns Uint256 value
 * @throws {UintInvalidLengthError} If bytes length exceeds 32
 *
 * @example
 * ```typescript
 * const bytes = new Uint8Array([0xff, 0x00]);
 * const value = Uint.fromBytes(bytes);
 * ```
 */
export function fromBytes(bytes: Uint8Array): Uint256Type {
	if (bytes.length > 32) {
		throw new UintInvalidLengthError(
			`Uint256 bytes cannot exceed 32 bytes, got ${bytes.length}`,
			{
				value: bytes,
				expected: "<= 32 bytes",
				actualLength: bytes.length,
			},
		);
	}

	let value = 0n;
	for (let i = 0; i < bytes.length; i++) {
		value = (value << 8n) | BigInt(bytes[i] ?? 0);
	}

	return value as Uint256Type;
}
