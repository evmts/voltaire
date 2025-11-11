// @ts-nocheck
import { CryptoError } from "../../primitives/errors/CryptoError.js";
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
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {CryptoError} When called as constructor
 * @example
 * ```javascript
 * import { Ripemd160 } from './crypto/Ripemd160/index.js';
 *
 * // Hash bytes
 * const hash = Ripemd160.hash(new Uint8Array([1, 2, 3]));
 * console.log(hash.length); // 20
 *
 * // Hash string
 * const hash2 = Ripemd160.hashString("hello");
 * console.log(hash2.length); // 20
 * ```
 */
export function Ripemd160() {
	throw new CryptoError(
		"Ripemd160 is not a constructor. Use Ripemd160.hash() or Ripemd160.hashString() instead.",
		{
			code: "RIPEMD160_NOT_A_CONSTRUCTOR",
			docsPath: "/crypto/ripemd160#error-handling",
		},
	);
}

Ripemd160.hash = hash;
Ripemd160.hashString = hashString;
Ripemd160.SIZE = SIZE;
