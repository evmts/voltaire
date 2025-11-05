import { Secp256k1 } from "../../../crypto/Secp256k1/index.js";
import { fromPublicKey } from "../../Address/BrandedAddress/fromPublicKey.js";
import { hash } from "./hash.js";
import { validate } from "./validate.js";

/**
 * Verify authorization signature and recover authority
 *
 * @param {import("./BrandedAuthorization.js").BrandedAuthorization} auth - Authorization to verify
 * @returns {import("../../Address/BrandedAddress/BrandedAddress.js").BrandedAddress} Recovered signer address (authority)
 * @throws {import("./errors.js").ValidationError} if validation fails
 *
 * @example
 * ```typescript
 * const auth: Item = {...};
 * const authority = verify(auth);
 * console.log(`Authorized by: ${authority}`);
 * ```
 */
export function verify(auth) {
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
	const publicKey = Secp256k1.recoverPublicKey(signature, messageHash);

	// Derive address from public key
	return addressFromPublicKey(publicKey);
}

/**
 * Helper to derive address from public key
 * @param {Uint8Array} publicKey - Public key (64 bytes)
 * @returns {import("../../Address/BrandedAddress/BrandedAddress.js").BrandedAddress} Address
 */
function addressFromPublicKey(publicKey) {
	// Public key is 64 bytes (uncompressed, no prefix)
	// Extract x and y coordinates
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
	return fromPublicKey(x, y);
}
