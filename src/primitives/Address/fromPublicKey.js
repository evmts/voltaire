import { InvalidAddressLengthError, InvalidValueError } from "./errors.js";

/**
 * Factory: Create Address from secp256k1 public key
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @returns {(xOrPublicKey: bigint | Uint8Array, y?: bigint) => import('./AddressType.js').AddressType} Function that creates Address from public key
 * @throws {InvalidAddressLengthError} If Uint8Array public key is not 64 bytes
 * @throws {InvalidValueError} If x is bigint but y is not provided as bigint
 *
 * @example
 * ```typescript
 * import { FromPublicKey } from '@tevm/voltaire/Address/BrandedAddress'
 * import { hash as keccak256 } from '@tevm/voltaire/crypto/Keccak256'
 *
 * const fromPublicKey = FromPublicKey({ keccak256 })
 * // From coordinates
 * const addr1 = fromPublicKey(xCoord, yCoord)
 * // From 64-byte public key
 * const addr2 = fromPublicKey(publicKeyBytes)
 * ```
 */
export function FromPublicKey({ keccak256 }) {
	return function fromPublicKey(xOrPublicKey, y) {
		let pubkey;

		// Handle Uint8Array input (64-byte public key)
		if (xOrPublicKey instanceof Uint8Array) {
			if (xOrPublicKey.length !== 64) {
				throw new InvalidAddressLengthError(
					`Invalid public key length: expected 64 bytes, got ${xOrPublicKey.length}`,
					{
						value: xOrPublicKey.length,
						expected: "64 bytes",
						code: -32602,
					},
				);
			}
			pubkey = xOrPublicKey;
		} else {
			// Handle bigint coordinates (x, y)
			if (typeof y !== "bigint") {
				throw new InvalidValueError(
					"When x is bigint, y coordinate must also be provided as bigint",
					{
						value: typeof y,
						expected: "bigint",
						code: -32602,
					},
				);
			}

			// Encode public key as 64 bytes (uncompressed, no prefix)
			pubkey = new Uint8Array(64);

			// Encode x coordinate (32 bytes, big-endian)
			let xVal = xOrPublicKey;
			for (let i = 31; i >= 0; i--) {
				pubkey[i] = Number(xVal & 0xffn);
				xVal >>= 8n;
			}

			// Encode y coordinate (32 bytes, big-endian)
			let yVal = y;
			for (let i = 63; i >= 32; i--) {
				pubkey[i] = Number(yVal & 0xffn);
				yVal >>= 8n;
			}
		}

		// Hash and take last 20 bytes
		const hash = keccak256(pubkey);
		return /** @type {import('./AddressType.js').AddressType} */ (
			hash.slice(12)
		);
	};
}
