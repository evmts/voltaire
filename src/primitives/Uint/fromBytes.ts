import type { Type } from "./Uint.js";

/**
 * Create Uint256 from bytes (big-endian)
 *
 * @param this - bytes to convert
 * @returns Uint256 value
 * @throws Error if bytes length exceeds 32
 *
 * @example
 * ```typescript
 * const bytes = new Uint8Array([0xff, 0x00]);
 * const value = Uint.fromBytes.call(bytes);
 * ```
 */
export function fromBytes(this: Uint8Array): Type {
	if (this.length > 32) {
		throw new Error(`Uint256 bytes cannot exceed 32 bytes, got ${this.length}`);
	}

	let value = 0n;
	for (let i = 0; i < this.length; i++) {
		value = (value << 8n) | BigInt(this[i] ?? 0);
	}

	return value as Type;
}
