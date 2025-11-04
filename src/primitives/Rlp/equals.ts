import type { BrandedRlp } from "./BrandedRlp.js";

/**
 * Check if two RLP Data structures are equal
 *
 * @param data - First Data
 * @param other - Second Data
 * @returns True if equal
 *
 * @example
 * ```typescript
 * const a = { type: 'bytes', value: new Uint8Array([1, 2]) };
 * const b = { type: 'bytes', value: new Uint8Array([1, 2]) };
 * Rlp.equals(a, b); // => true
 * ```
 */
export function equals(data: BrandedRlp, other: BrandedRlp): boolean {
	if (data.type !== other.type) {
		return false;
	}

	if (data.type === "bytes" && other.type === "bytes") {
		if (data.value.length !== other.value.length) {
			return false;
		}
		for (let i = 0; i < data.value.length; i++) {
			if (data.value[i] !== other.value[i]) {
				return false;
			}
		}
		return true;
	}

	if (data.type === "list" && other.type === "list") {
		if (data.value.length !== other.value.length) {
			return false;
		}
		for (let i = 0; i < data.value.length; i++) {
			if (!equals(data.value[i]!, other.value[i]!)) {
				return false;
			}
		}
		return true;
	}

	return false;
}
