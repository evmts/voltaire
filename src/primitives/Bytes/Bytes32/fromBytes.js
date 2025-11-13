import { InvalidLengthError } from "../../errors/ValidationError.js";
import { SIZE } from "./constants.js";

/**
 * Create Bytes32 from raw bytes
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes32 for documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - Raw bytes (must be 32 bytes)
 * @returns {import('./BrandedBytes32.ts').BrandedBytes32} Bytes32
 * @throws {InvalidLengthError} If bytes is wrong length
 * @example
 * ```javascript
 * import * as Bytes32 from './primitives/Bytes/Bytes32/index.js';
 * const bytes = Bytes32.fromBytes(new Uint8Array(32));
 * ```
 */
export function fromBytes(bytes) {
	if (bytes.length !== SIZE) {
		throw new InvalidLengthError(
			`Bytes32 must be ${SIZE} bytes, got ${bytes.length}`,
			{
				code: "BYTES32_INVALID_LENGTH",
				value: bytes,
				expected: `${SIZE} bytes`,
				context: { actualLength: bytes.length },
				docsPath: "/primitives/bytes/bytes32",
			},
		);
	}
	return /** @type {import('./BrandedBytes32.ts').BrandedBytes32} */ (
		new Uint8Array(bytes)
	);
}
