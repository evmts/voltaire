import type { Data } from "./Rlp.js";

/**
 * Check if two RLP Data structures are equal (this: pattern)
 *
 * @param this - First Data
 * @param other - Second Data
 * @returns True if equal
 *
 * @example
 * ```typescript
 * const a = { type: 'bytes', value: new Uint8Array([1, 2]) };
 * const b = { type: 'bytes', value: new Uint8Array([1, 2]) };
 * Rlp.equals.call(a, b); // => true
 * ```
 */
export function equals(this: Data, other: Data): boolean {
	if (this.type !== other.type) {
		return false;
	}

	if (this.type === "bytes" && other.type === "bytes") {
		if (this.value.length !== other.value.length) {
			return false;
		}
		for (let i = 0; i < this.value.length; i++) {
			if (this.value[i] !== other.value[i]) {
				return false;
			}
		}
		return true;
	}

	if (this.type === "list" && other.type === "list") {
		if (this.value.length !== other.value.length) {
			return false;
		}
		for (let i = 0; i < this.value.length; i++) {
			if (!equals.call(this.value[i]!, other.value[i]!)) {
				return false;
			}
		}
		return true;
	}

	return false;
}
