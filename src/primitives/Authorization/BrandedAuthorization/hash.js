import { Keccak256 } from "../../../crypto/Keccak256/index.js";
import { encode } from "../../Rlp/BrandedRlp/encode.js";
import { MAGIC_BYTE } from "./constants.js";

/**
 * Calculate signing hash for authorization
 *
 * Hash = keccak256(MAGIC || rlp([chain_id, address, nonce]))
 *
 * @see https://voltaire.tevm.sh/primitives/authorization
 * @since 0.0.0
 * @param {{chainId: bigint, address: import("../../Address/BrandedAddress/BrandedAddress.js").BrandedAddress, nonce: bigint}} unsigned - Unsigned authorization
 * @returns {import("../../Hash/index.js").BrandedHash} Hash to sign
 * @throws {never}
 * @example
 * ```javascript
 * import * as Authorization from './primitives/Authorization/index.js';
 * const unsigned = { chainId: 1n, address: '0x742d35Cc...', nonce: 0n };
 * const sigHash = Authorization.hash(unsigned);
 * // Now sign sigHash with private key
 * ```
 */
export function hash(unsigned) {
	// Helper to encode bigint compact (remove leading zeros)
	/**
	 * @param {bigint} value
	 * @returns {Uint8Array}
	 */
	function encodeBigintCompact(value) {
		if (value === 0n) return new Uint8Array(0);
		let byteLength = 0;
		let temp = value;
		while (temp > 0n) {
			byteLength++;
			temp >>= 8n;
		}
		const bytes = new Uint8Array(byteLength);
		let val = value;
		for (let i = byteLength - 1; i >= 0; i--) {
			bytes[i] = Number(val & 0xffn);
			val >>= 8n;
		}
		return bytes;
	}

	// RLP encode [chainId, address, nonce]
	const fields = [
		encodeBigintCompact(unsigned.chainId),
		unsigned.address,
		encodeBigintCompact(unsigned.nonce),
	];
	const rlpEncoded = encode(fields);

	// Prepend MAGIC_BYTE (0x05)
	const data = new Uint8Array(1 + rlpEncoded.length);
	data[0] = MAGIC_BYTE;
	data.set(rlpEncoded, 1);

	// keccak256 hash
	return Keccak256.hash(data);
}
