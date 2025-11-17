import { Hash } from "../../Hash/index.js";
import type { AddressType as BrandedAddress } from "../Address/AddressType.js";
import type { PrivateKeyType } from "../PrivateKeyType.js";
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
export function toAddress(this: PrivateKeyType): BrandedAddress {
	const publicKey = toPublicKey.call(this);
	const hash = Hash.keccak256(publicKey);
	// Take last 20 bytes of keccak256(publicKey) - use native slice
	const addressBytes = new Uint8Array(hash.buffer, hash.byteOffset + 12, 20);
	return addressBytes as BrandedAddress;
}
