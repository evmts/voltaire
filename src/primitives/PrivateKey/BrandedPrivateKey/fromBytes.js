import { InvalidLengthError } from "../../errors/ValidationError.js";

/**
 * Create PrivateKey from raw bytes
 *
 * @param {Uint8Array} bytes - Raw bytes (must be 32 bytes)
 * @returns {import('./BrandedPrivateKey.js').BrandedPrivateKey} Private key
 * @throws {InvalidLengthError} If bytes is not 32 bytes
 *
 * @example
 * ```javascript
 * import * as PrivateKey from './primitives/PrivateKey/index.js';
 * const bytes = new Uint8Array(32);
 * const privateKey = PrivateKey.fromBytes(bytes);
 * ```
 */
export function fromBytes(bytes) {
	if (bytes.length !== 32) {
		throw new InvalidLengthError(
			`Private key must be 32 bytes, got ${bytes.length}`,
			{
				code: "PRIVATE_KEY_INVALID_LENGTH",
				value: bytes,
				expected: "32 bytes",
				context: { actualLength: bytes.length },
				docsPath: "/primitives/private-key",
			},
		);
	}
	return /** @type {import('./BrandedPrivateKey.js').BrandedPrivateKey} */ (
		new Uint8Array(bytes)
	);
}
