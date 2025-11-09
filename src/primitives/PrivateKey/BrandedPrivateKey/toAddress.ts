import type { BrandedAddress } from "../../Address/BrandedAddress/BrandedAddress.js";
import { Hash } from "../../Hash/index.js";
import type { BrandedPrivateKey } from "./BrandedPrivateKey.js";
import { toPublicKey } from "./toPublicKey.js";

/**
 * Derive Ethereum address from private key
 *
 * @param this - Private key
 * @returns Ethereum address (20 bytes)
 *
 * @example
 * ```typescript
 * const address = PrivateKey._toAddress.call(pk);
 * ```
 */
export function toAddress(this: BrandedPrivateKey): BrandedAddress {
	const publicKey = toPublicKey.call(this);
	const hash = Hash.keccak256(publicKey);
	// Take last 20 bytes of keccak256(publicKey) - use native slice
	const addressBytes = new Uint8Array(hash.buffer, hash.byteOffset + 12, 20);
	return addressBytes as BrandedAddress;
}
