import type { Address } from "../Address/index.js";
import type { Hash } from "../Hash/index.js";

/**
 * Compare two hashes for equality
 * @internal
 */
export function hashEquals(a: Hash, b: Hash): boolean {
	if (a.length !== b.length) {
		return false;
	}
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) {
			return false;
		}
	}
	return true;
}

/**
 * Compare two addresses for equality (byte-wise comparison)
 * @internal
 */
export function addressEquals(a: Address, b: Address): boolean {
	if (a.length !== b.length) {
		return false;
	}
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) {
			return false;
		}
	}
	return true;
}
