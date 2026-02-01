import type { AddressType as BrandedAddress } from "../Address/AddressType.js";
import { Hash } from "../Hash/index.js";
import type { PublicKeyType } from "./PublicKeyType.js";

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
export function toAddress(this: PublicKeyType): BrandedAddress {
	const hash = Hash.keccak256(this);
	// Take last 20 bytes of keccak256(publicKey) - use native slice
	const addressBytes = new Uint8Array(hash.buffer, hash.byteOffset + 12, 20);
	return addressBytes as BrandedAddress;
}
