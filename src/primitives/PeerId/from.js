import { InvalidFormatError } from "../errors/ValidationError.js";

/**
 * Create PeerId from string
 *
 * @param {string} value - Peer ID string (enode URL or node ID)
 * @returns {import('./PeerIdType.js').PeerIdType} Branded peer ID
 * @throws {InvalidFormatError} If value is not a valid peer ID
 *
 * @example
 * ```javascript
 * import * as PeerId from './primitives/PeerId/index.js';
 * const peerId = PeerId.from("enode://pubkey@192.168.1.1:30303");
 * ```
 */
export function from(value) {
	if (typeof value !== "string") {
		throw new InvalidFormatError(
			`Peer ID must be a string, got ${typeof value}`,
			{
				value,
				expected: "String (enode URL or node ID)",
				code: "PEER_ID_INVALID_TYPE",
				docsPath: "/primitives/peer-id/from#error-handling",
			},
		);
	}

	if (value.length === 0) {
		throw new InvalidFormatError("Peer ID cannot be empty", {
			value,
			expected: "Non-empty string",
			code: "PEER_ID_EMPTY",
			docsPath: "/primitives/peer-id/from#error-handling",
		});
	}

	return /** @type {import('./PeerIdType.js').PeerIdType} */ (value);
}
