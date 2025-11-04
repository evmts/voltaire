import type { BrandedHash } from "./BrandedHash.js";
import { SIZE } from "./BrandedHash.js";

/**
 * Create Hash from hex string
 *
 * @param hex - Hex string with optional 0x prefix
 * @returns Hash bytes
 * @throws If hex is invalid or wrong length
 *
 * @example
 * ```typescript
 * const hash = Hash.fromHex('0x1234...');
 * const hash2 = Hash.fromHex('1234...'); // 0x prefix optional
 * ```
 */
export function fromHex(hex: string): BrandedHash {
	const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
	if (normalized.length !== SIZE * 2) {
		throw new Error(
			`Hash hex must be ${SIZE * 2} characters, got ${normalized.length}`,
		);
	}
	if (!/^[0-9a-fA-F]+$/.test(normalized)) {
		throw new Error("Invalid hex string");
	}
	const bytes = new Uint8Array(SIZE);
	for (let i = 0; i < SIZE; i++) {
		bytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes as BrandedHash;
}
