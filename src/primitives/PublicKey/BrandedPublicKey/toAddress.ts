import { Hash } from "../../Hash/index.js";
import type { BrandedPublicKey } from "./BrandedPublicKey.js";
import type { BrandedAddress } from "../../Address/BrandedAddress/BrandedAddress.js";

/**
 * Derive Ethereum address from public key
 *
 * @param this - Public key
 * @returns Ethereum address (20 bytes)
 *
 * @example
 * ```typescript
 * const address = PublicKey._toAddress.call(pk);
 * ```
 */
export function toAddress(this: BrandedPublicKey): BrandedAddress {
	const hash = Hash.keccak256(this);
	// Take last 20 bytes of keccak256(publicKey) - use native slice
	const addressBytes = new Uint8Array(hash.buffer, hash.byteOffset + 12, 20);
	return addressBytes as BrandedAddress;
}
