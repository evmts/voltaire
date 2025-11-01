import type { Unsized, Sized } from "./Hex.js";
import { InvalidLengthError } from "./errors.js";

/**
 * Assert hex has specific size
 *
 * @param size - Expected byte size
 * @returns Sized hex string
 * @throws {InvalidLengthError} If size doesn't match
 *
 * @example
 * ```typescript
 * const hex: Hex = '0x1234';
 * const sized = Hex.assertSize.call(hex, 2); // Hex.Sized<2>
 * ```
 */
export function assertSize<TSize extends number>(
	this: Unsized,
	size: TSize,
): Sized<TSize> {
	if ((this.length - 2) / 2 !== size) {
		throw new InvalidLengthError(`Expected ${size} bytes, got ${(this.length - 2) / 2}`);
	}
	return this as Sized<TSize>;
}
