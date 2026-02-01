import { InvalidLengthError, InvalidRangeError } from "../errors/index.js";
import { isValidPrivateKey } from "../../crypto/Secp256k1/isValidPrivateKey.js";

/**
 * Create PrivateKey from raw bytes
 *
 * @param {Uint8Array} bytes - Raw bytes (must be 32 bytes)
 * @returns {import('./PrivateKeyType.js').PrivateKeyType} Private key
 * @throws {InvalidLengthError} If bytes is not 32 bytes
 * @throws {InvalidRangeError} If private key is out of range [1, n-1]
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
	if (!isValidPrivateKey(bytes)) {
		throw new InvalidRangeError("Private key must be in range [1, n-1]", {
			code: "PRIVATE_KEY_INVALID_RANGE",
			value: bytes,
			expected: "Private key in range [1, n-1]",
			docsPath: "/primitives/private-key",
		});
	}
	return /** @type {import('./PrivateKeyType.js').PrivateKeyType} */ (
		new Uint8Array(bytes)
	);
}
