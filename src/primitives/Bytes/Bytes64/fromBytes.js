import { InvalidLengthError } from "../../errors/ValidationError.js";
import { SIZE } from "./constants.js";

/**
 * Create Bytes64 from raw bytes
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes64 for documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - Raw bytes (must be 64 bytes)
 * @returns {import('./BrandedBytes64.ts').BrandedBytes64} Bytes64
 * @throws {InvalidLengthError} If bytes is wrong length
 * @example
 * ```javascript
 * import * as Bytes64 from './primitives/Bytes/Bytes64/index.js';
 * const bytes = Bytes64.fromBytes(new Uint8Array(64));
 * ```
 */
export function fromBytes(bytes) {
	if (bytes.length !== SIZE) {
		throw new InvalidLengthError(
			`Bytes64 must be ${SIZE} bytes, got ${bytes.length}`,
			{
				code: "BYTES64_INVALID_LENGTH",
				value: bytes,
				expected: `${SIZE} bytes`,
				context: { actualLength: bytes.length },
				docsPath: "/primitives/bytes/bytes64",
			},
		);
	}
	return /** @type {import('./BrandedBytes64.ts').BrandedBytes64} */ (
		new Uint8Array(bytes)
	);
}
