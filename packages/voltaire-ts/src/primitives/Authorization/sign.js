import { Hash } from "./hash.js";

/**
 * Factory: Create signed authorization from unsigned
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @param {(data: Array<Uint8Array>) => Uint8Array} deps.rlpEncode - RLP encode function
 * @param {(messageHash: Uint8Array, privateKey: Uint8Array) => {r: Uint8Array, s: Uint8Array, v: number, yParity?: number}} deps.sign - secp256k1 sign function
 * @returns {(unsigned: {chainId: bigint, address: import("../Address/AddressType.js").AddressType, nonce: bigint}, privateKey: Uint8Array) => import("./AuthorizationType.js").AuthorizationType} Function that signs authorization
 */
export function Sign({ keccak256, rlpEncode, sign: secp256k1Sign }) {
	const hash = Hash({ keccak256, rlpEncode });

	return function sign(unsigned, privateKey) {
		// Hash the unsigned authorization
		const messageHash = hash(unsigned);

		// Sign with secp256k1
		const sig = secp256k1Sign(messageHash, privateKey);

		// Extract r, s from signature
		const r = sig.r;
		const s = sig.s;

		// Derive yParity from the signature's recovery value.
		// secp256k1Sign returns sig.v = 27 + recoveryBit (recoveryBit found by
		// trying all candidates), so yParity = v - 27. Prefer sig.yParity if present.
		const yParity = sig.yParity ?? sig.v - 27;

		return {
			chainId: unsigned.chainId,
			address: unsigned.address,
			nonce: unsigned.nonce,
			yParity,
			r,
			s,
		};
	};
}
