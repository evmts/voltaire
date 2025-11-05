// @ts-nocheck
import { SIZE } from "./constants.js";
import { hash } from "./hash.js";
import { hashString } from "./hashString.js";

export { SIZE };
export { hash };
export { hashString };

/**
 * RIPEMD160 Hash Function
 *
 * Legacy hash function used primarily in Bitcoin for address generation.
 * RIPEMD160 produces 20-byte (160-bit) hashes.
 *
 * @example
 * ```typescript
 * import { Ripemd160 } from './Ripemd160.js';
 *
 * // Hash bytes
 * const hash = Ripemd160.hash(data);
 *
 * // Hash string
 * const hash2 = Ripemd160.hashString("hello");
 * ```
 */
export function Ripemd160() {
	throw new Error(
		"Ripemd160 is not a constructor. Use Ripemd160.hash() or Ripemd160.hashString() instead.",
	);
}

Ripemd160.hash = hash;
Ripemd160.hashString = hashString;
Ripemd160.SIZE = SIZE;
