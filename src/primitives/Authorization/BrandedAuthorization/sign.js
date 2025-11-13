import { equals } from "./equals.js";
import { Hash } from "./hash.js";

/**
 * Factory: Create signed authorization from unsigned
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @param {(data: Array<Uint8Array>) => Uint8Array} deps.rlpEncode - RLP encode function
 * @param {(messageHash: Uint8Array, privateKey: Uint8Array) => {r: Uint8Array, s: Uint8Array, v: number}} deps.sign - secp256k1 sign function
 * @param {(signature: {r: Uint8Array, s: Uint8Array, v: number}, messageHash: Uint8Array) => Uint8Array} deps.recoverPublicKey - secp256k1 public key recovery
 * @param {(x: bigint, y: bigint) => import("../../Address/BrandedAddress/BrandedAddress.js").BrandedAddress} deps.addressFromPublicKey - Address derivation from public key
 * @returns {(unsigned: {chainId: bigint, address: import("../../Address/BrandedAddress/BrandedAddress.js").BrandedAddress, nonce: bigint}, privateKey: Uint8Array) => import("./BrandedAuthorization.js").BrandedAuthorization} Function that signs authorization
 */
export function Sign({
	keccak256,
	rlpEncode,
	sign: secp256k1Sign,
	recoverPublicKey,
	addressFromPublicKey,
}) {
	const hash = Hash({ keccak256, rlpEncode });

	return function sign(unsigned, privateKey) {
		// Hash the unsigned authorization
		const messageHash = hash(unsigned);

		// Sign with secp256k1
		const sig = secp256k1Sign(messageHash, privateKey);

		// Extract r, s, yParity from signature
		// Signature is { r, s, v }
		const r = sig.r;
		const s = sig.s;

		// Convert r and s to bigint
		let rBigint = 0n;
		let sBigint = 0n;
		for (let i = 0; i < 32; i++) {
			const rByte = r[i];
			const sByte = s[i];
			if (rByte !== undefined && sByte !== undefined) {
				rBigint = (rBigint << 8n) | BigInt(rByte);
				sBigint = (sBigint << 8n) | BigInt(sByte);
			}
		}

		// Recover yParity by trying both values
		let yParity = 0;
		try {
			const recovered = recoverPublicKey({ r, s, v: 0 }, messageHash);
			// Derive address from recovered public key
			let x = 0n;
			let y = 0n;
			for (let i = 0; i < 32; i++) {
				const xByte = recovered[i];
				const yByte = recovered[32 + i];
				if (xByte !== undefined && yByte !== undefined) {
					x = (x << 8n) | BigInt(xByte);
					y = (y << 8n) | BigInt(yByte);
				}
			}
			const recoveredAddress = addressFromPublicKey(x, y);
			if (!equals(recoveredAddress, unsigned.address)) {
				yParity = 1;
			}
		} catch {
			yParity = 1;
		}

		return {
			chainId: unsigned.chainId,
			address: unsigned.address,
			nonce: unsigned.nonce,
			yParity,
			r: rBigint,
			s: sBigint,
		};
	};
}
