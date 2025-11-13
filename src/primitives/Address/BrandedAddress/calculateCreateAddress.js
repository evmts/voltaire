import { InvalidValueError } from "./errors.js";

/**
 * Encode bigint as minimal RLP bytes (no leading zeros)
 * @param {bigint} num
 * @returns {Uint8Array}
 */
function encodeNonce(num) {
	if (num === 0n) {
		return new Uint8Array(0);
	}

	// Count bytes needed
	let n = num;
	let byteCount = 0;
	while (n > 0n) {
		byteCount++;
		n >>= 8n;
	}

	// Encode big-endian
	const bytes = new Uint8Array(byteCount);
	n = num;
	for (let i = byteCount - 1; i >= 0; i--) {
		bytes[i] = Number(n & 0xffn);
		n >>= 8n;
	}

	return bytes;
}

/**
 * Factory for CREATE contract address calculation with injected dependencies
 *
 * @param {Object} deps - Dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @param {(items: any[]) => Uint8Array} deps.rlpEncode - RLP encode function
 * @returns {(address: import('./BrandedAddress.js').BrandedAddress, nonce: bigint) => import('./BrandedAddress.js').BrandedAddress}
 *
 * @example
 * ```typescript
 * import { hash } from '../../../crypto/Keccak256/hash.js'
 * import { encode } from '../../Rlp/BrandedRlp/encode.js'
 * const calculateCreateAddress = CalculateCreateAddress({
 *   keccak256: hash,
 *   rlpEncode: encode
 * })
 * const contractAddr = calculateCreateAddress(deployerAddr, 5n);
 * ```
 */
export function CalculateCreateAddress({ keccak256, rlpEncode }) {
	/**
	 * Calculate CREATE contract address
	 *
	 * address = keccak256(rlp([sender, nonce]))[12:32]
	 *
	 * @param {import('./BrandedAddress.js').BrandedAddress} address - Sender address
	 * @param {bigint} nonce - Transaction nonce
	 * @returns {import('./BrandedAddress.js').BrandedAddress} Calculated contract address
	 * @throws {InvalidValueError} If nonce is negative
	 *
	 * @example
	 * ```typescript
	 * const contractAddr = calculateCreateAddress(deployerAddr, 5n);
	 * ```
	 */
	return function calculateCreateAddress(address, nonce) {
		if (nonce < 0n) {
			throw new InvalidValueError("Nonce cannot be negative", {
				value: nonce,
			});
		}

		// RLP encode [address, nonce]
		const nonceBytes = encodeNonce(nonce);
		const encoded = rlpEncode([address, nonceBytes]);

		// Hash and take last 20 bytes
		const hash = keccak256(encoded);
		return /** @type {import('./BrandedAddress.js').BrandedAddress} */ (
			hash.slice(12)
		);
	};
}
