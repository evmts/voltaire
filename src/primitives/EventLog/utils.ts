import type { BrandedAddress } from "../Address/index.js";
import { Hash, type BrandedHash } from "../Hash/index.js";

/**
 * Compare two hashes for equality
 * @internal
 */
export function hashEquals(a: BrandedHash, b: Hash): boolean {
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
export function addressEquals(a: BrandedAddress, b: BrandedAddress): boolean {
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
