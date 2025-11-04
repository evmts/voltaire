import type { BrandedHash } from "./BrandedHash.js";
import { isHash } from "./isHash.js";

/**
 * Assert value is a Hash, throws if not
 *
 * @param value - Value to assert
 * @param message - Optional error message
 * @throws If value is not a Hash
 *
 * @example
 * ```typescript
 * Hash.assert(value); // throws if not Hash
 * ```
 */
export function assert(
	value: unknown,
	message?: string,
): asserts value is BrandedHash {
	if (!isHash(value)) {
		throw new Error(message ?? "Value is not a Hash");
	}
}
