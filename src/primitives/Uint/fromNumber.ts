import type { Type } from "./Uint.js";
import { from } from "./from.js";

/**
 * Create Uint256 from number
 *
 * @param this - number to convert
 * @returns Uint256 value
 * @throws Error if value is not an integer or out of range
 *
 * @example
 * ```typescript
 * const value = Uint.fromNumber.call(255);
 * ```
 */
export function fromNumber(this: number): Type {
	if (!Number.isInteger(this)) {
		throw new Error(`Uint256 value must be an integer: ${this}`);
	}
	return from(this);
}
