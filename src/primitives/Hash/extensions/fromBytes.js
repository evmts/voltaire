import { InvalidLengthError } from "../../errors/ValidationError.js";
import { SIZE } from "./constants.js";

/**
 * Create Hash from Uint8Array
 *
 * @see https://voltaire.tevm.sh/primitives/hash for Hash documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - 32-byte array
 * @returns {import('./BrandedHash.ts').BrandedHash} Hash bytes
 * @throws {InvalidLengthError} If bytes is not 32 bytes
 * @example
 * ```javascript
 * import * as Hash from './primitives/Hash/index.js';
 * const hash = Hash.fromBytes(new Uint8Array(32));
 * ```
 */
export function fromBytes(bytes) {
	if (bytes.length !== SIZE) {
		throw new InvalidLengthError(
			`Hash must be ${SIZE} bytes, got ${bytes.length}`,
			{
				code: "HASH_INVALID_LENGTH",
				value: bytes,
				expected: `${SIZE} bytes`,
				context: { actualLength: bytes.length },
				docsPath: "/primitives/hash",
			},
		);
	}
	// Create copy to avoid mutation issues
	const copy = new Uint8Array(SIZE);
	copy.set(bytes, 0);
	return /** @type {import('./BrandedHash.ts').BrandedHash} */ (copy);
}
