import { MAGIC_BYTE } from "./constants.js";

/**
 * Factory: Calculate signing hash for authorization
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @param {(data: Array<Uint8Array>) => Uint8Array} deps.rlpEncode - RLP encode function
 * @returns {(unsigned: {chainId: bigint, address: import("../../Address/BrandedAddress/BrandedAddress.js").BrandedAddress, nonce: bigint}) => import("../../Hash/index.js").BrandedHash} Function that hashes unsigned authorization
 */
export function Hash({ keccak256, rlpEncode }) {
	return function hash(unsigned) {
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
		const rlpEncoded = rlpEncode(fields);

		// Prepend MAGIC_BYTE (0x05)
		const data = new Uint8Array(1 + rlpEncoded.length);
		data[0] = MAGIC_BYTE;
		data.set(rlpEncoded, 1);

		// keccak256 hash
		return keccak256(data);
	};
}
