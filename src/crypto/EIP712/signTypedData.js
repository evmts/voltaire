import { secp256k1 } from "@noble/curves/secp256k1.js";
import { Eip712Error } from "./errors.js";
import { hashTypedData } from "./hashTypedData.js";

/**
 * Sign typed data with private key
 *
 * @param {import('./BrandedEIP712.js').TypedData} typedData - Typed data to sign
 * @param {Uint8Array} privateKey - 32-byte private key
 * @returns {import('./BrandedEIP712.js').Signature} ECDSA signature
 *
 * @example
 * ```typescript
 * const signature = EIP712.signTypedData(typedData, privateKey);
 * ```
 */
export function signTypedData(typedData, privateKey) {
	if (privateKey.length !== 32) {
		throw new Eip712Error("Private key must be 32 bytes");
	}

	const hash = hashTypedData(typedData);
	// console.log("[signTypedData] hash:", Buffer.from(hash).toString('hex'));

	// Sign with prehash:false (we already have the hash) and format:'recovered' to get recovery bit
	const sigBytes = secp256k1.sign(hash, privateKey, {
		prehash: false,
		format: "recovered",
	});

	// sigBytes is 65 bytes: r (32) || s (32) || recovery_byte (1)
	const r = sigBytes.slice(0, 32);
	const s = sigBytes.slice(32, 64);

	// Convert recovery byte to Ethereum v (27 or 28)
	const recoveryByte = sigBytes[64];
	if (recoveryByte === undefined) {
		throw new Eip712Error("Invalid signature: missing recovery byte");
	}
	const v = 27 + (recoveryByte & 1);

	return { r, s, v };
}
