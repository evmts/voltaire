import { InvalidLengthError } from "../../errors/ValidationError.js";
import { SIZE } from "./constants.js";

/**
 * Create Hash from raw bytes
 *
 * @see https://voltaire.tevm.sh/primitives/hash for Hash documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - Raw bytes (must be 32 bytes)
 * @returns {import('./BrandedHash.js').BrandedHash} Hash bytes
 * @throws {InvalidLengthError} If bytes is wrong length
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
	return /** @type {import('./BrandedHash.ts').BrandedHash} */ (
		new Uint8Array(bytes)
	);
}
