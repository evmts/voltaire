import { Hash } from "./hash.js";
import { validate } from "./validate.js";

/**
 * Factory: Verify authorization signature and recover authority
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @param {(data: Array<Uint8Array>) => Uint8Array} deps.rlpEncode - RLP encode function
 * @param {(signature: {r: Uint8Array, s: Uint8Array, v: number}, messageHash: Uint8Array) => Uint8Array} deps.recoverPublicKey - secp256k1 public key recovery
 * @param {(x: bigint, y: bigint) => import("../../Address/BrandedAddress/BrandedAddress.js").BrandedAddress} deps.addressFromPublicKey - Address derivation from public key
 * @returns {(auth: import("./BrandedAuthorization.js").BrandedAuthorization) => import("../../Address/BrandedAddress/BrandedAddress.js").BrandedAddress} Function that verifies authorization
 */
export function Verify({
	keccak256,
	rlpEncode,
	recoverPublicKey,
	addressFromPublicKey,
}) {
	const hash = Hash({ keccak256, rlpEncode });

	return function verify(auth) {
		// Validate structure first
		validate(auth);

		// Hash the unsigned portion
		const unsigned = {
			chainId: auth.chainId,
			address: auth.address,
			nonce: auth.nonce,
		};
		const messageHash = hash(unsigned);

		// Convert r and s bigints to Uint8Array
		const r = new Uint8Array(32);
		const s = new Uint8Array(32);
		let rVal = auth.r;
		let sVal = auth.s;
		for (let i = 31; i >= 0; i--) {
			r[i] = Number(rVal & 0xffn);
			s[i] = Number(sVal & 0xffn);
			rVal >>= 8n;
			sVal >>= 8n;
		}

		// Recover public key from signature
		const signature = { r, s, v: auth.yParity };
		const publicKey = recoverPublicKey(signature, messageHash);

		// Derive address from public key (64 bytes, extract x and y)
		let x = 0n;
		let y = 0n;
		for (let i = 0; i < 32; i++) {
			const xByte = publicKey[i];
			const yByte = publicKey[32 + i];
			if (xByte !== undefined && yByte !== undefined) {
				x = (x << 8n) | BigInt(xByte);
				y = (y << 8n) | BigInt(yByte);
			}
		}
		return addressFromPublicKey(x, y);
	};
}
