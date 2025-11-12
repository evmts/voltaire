// @ts-nocheck
import { derivePublicKey } from "../../../crypto/Secp256k1/derivePublicKey.js";
import { InvalidValueError } from "./errors.js";
import { fromPublicKey } from "./fromPublicKey.js";

/**
 * Create Address from secp256k1 private key
 *
 * @param {import('../../../primitives/PrivateKey/BrandedPrivateKey/BrandedPrivateKey.js').BrandedPrivateKey} privateKey - 32-byte private key
 * @returns {import('./BrandedAddress.js').BrandedAddress} Address derived from private key
 * @throws {InvalidValueError} If private key value is invalid
 *
 * @example
 * ```typescript
 * import * as PrivateKey from './primitives/PrivateKey/index.js';
 * const privateKey = PrivateKey.from(new Uint8Array(32));
 * const addr = Address.fromPrivateKey(privateKey);
 * ```
 */
export function fromPrivateKey(privateKey) {
	// Derive 64-byte uncompressed public key
	let pubkey;
	try {
		pubkey = derivePublicKey(privateKey);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new InvalidValueError(`Invalid private key: ${message}`, {
			value: privateKey,
			cause: error instanceof Error ? error : undefined,
		});
	}

	// Extract x and y coordinates (32 bytes each, big-endian)
	let x = 0n;
	let y = 0n;

	for (let i = 0; i < 32; i++) {
		x = (x << 8n) | BigInt(pubkey[i] ?? 0);
		y = (y << 8n) | BigInt(pubkey[i + 32] ?? 0);
	}

	// Call fromPublicKey to derive address
	return fromPublicKey(x, y);
}
