import { Hash } from "../Hash/index.js";
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
export function toAddress() {
    const hash = Hash.keccak256(this);
    // Take last 20 bytes of keccak256(publicKey) - use native slice
    const addressBytes = new Uint8Array(hash.buffer, hash.byteOffset + 12, 20);
    return addressBytes;
}
