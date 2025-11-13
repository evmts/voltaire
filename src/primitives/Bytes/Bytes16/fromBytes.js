import { InvalidLengthError } from "../../errors/ValidationError.js";
import { SIZE } from "./constants.js";

/**
 * Create Bytes16 from raw bytes
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes16 for documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - Raw bytes (must be 16 bytes)
 * @returns {import('./BrandedBytes16.ts').BrandedBytes16} Bytes16
 * @throws {InvalidLengthError} If bytes is wrong length
 * @example
 * ```javascript
 * import * as Bytes16 from './primitives/Bytes/Bytes16/index.js';
 * const bytes = Bytes16.fromBytes(new Uint8Array(16));
 * ```
 */
export function fromBytes(bytes) {
	if (bytes.length !== SIZE) {
		throw new InvalidLengthError(
			`Bytes16 must be ${SIZE} bytes, got ${bytes.length}`,
			{
				code: "BYTES16_INVALID_LENGTH",
				value: bytes,
				expected: `${SIZE} bytes`,
				context: { actualLength: bytes.length },
				docsPath: "/primitives/bytes/bytes16",
			},
		);
	}
	return /** @type {import('./BrandedBytes16.ts').BrandedBytes16} */ (
		new Uint8Array(bytes)
	);
}
