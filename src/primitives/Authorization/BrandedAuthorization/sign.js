import { Secp256k1 } from "../../../crypto/Secp256k1/index.js";
import { fromPublicKey } from "../../Address/BrandedAddress/fromPublicKey.js";
import { equals } from "./equals.js";
import { hash } from "./hash.js";

/**
 * Create signed authorization from unsigned
 *
 * @param {{chainId: bigint, address: import("../../Address/BrandedAddress/BrandedAddress.js").BrandedAddress, nonce: bigint}} unsigned - Unsigned authorization
 * @param {Uint8Array} privateKey - Private key (32 bytes) for signing
 * @returns {import("./BrandedAuthorization.js").BrandedAuthorization} Signed authorization
 *
 * @example
 * ```typescript
 * const unsigned: Unsigned = { chainId: 1n, address, nonce: 0n };
 * const auth = sign(unsigned, privateKey);
 * ```
 */
export function sign(unsigned, privateKey) {
	// Hash the unsigned authorization
	const messageHash = hash(unsigned);

	// Sign with secp256k1
	const sig = Secp256k1.sign(messageHash, privateKey);

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
		const recovered = Secp256k1.recoverPublicKey({ r, s, v: 0 }, messageHash);
		const recoveredAddress = addressFromPublicKey(recovered);
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
