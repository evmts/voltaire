// Export type definition
export type { PublicKeyType } from "./PublicKeyType.js";

// Import crypto dependencies
import { verify as secp256k1Verify } from "../../crypto/Secp256k1/verify.js";

import { compress as _compress } from "./compress.js";
import { decompress as _decompress } from "./decompress.js";
// Import all functions
import { from } from "./from.js";
import { fromPrivateKey } from "./fromPrivateKey.js";
import { isCompressed as _isCompressed } from "./isCompressed.js";
import { toAddress as _toAddress } from "./toAddress.js";
import { toHex as _toHex } from "./toHex.js";
import { Verify } from "./verify.js";

// Export constructors
export { from, fromPrivateKey };

// Export factories (tree-shakeable)
export { Verify };

// Instantiate with crypto dependencies
const _verify = Verify({ secp256k1Verify });

// Export public wrapper functions
export function toHex(publicKey: string): string {
	return _toHex.call(from(publicKey));
}

export function toAddress(publicKey: string) {
	return _toAddress.call(from(publicKey));
}

export function verify(
	publicKey: string,
	hash: import("../Hash/BrandedHash.js").BrandedHash,
	signature: import("../Signature/SignatureType.js").SignatureType,
): boolean {
	return _verify(from(publicKey), hash, signature as unknown as import("../../crypto/Secp256k1/SignatureType.js").Secp256k1SignatureType);
}

/**
 * Compress a public key from 64 bytes (uncompressed) to 33 bytes (compressed)
 *
 * Compressed format: prefix (1 byte) + x-coordinate (32 bytes)
 * Prefix is 0x02 if y is even, 0x03 if y is odd
 *
 * Compressed keys are preferred for storage and transmission due to smaller size.
 * Uncompressed keys are needed by some legacy systems.
 *
 * @param publicKey - Public key (hex string or 64 bytes)
 * @returns Compressed public key (33 bytes)
 *
 * @example
 * ```typescript
 * import * as PublicKey from './primitives/PublicKey/index.js';
 *
 * const compressed = PublicKey.compress("0x1234...");
 * console.log(compressed.length); // 33
 * ```
 */
export function compress(publicKey: string | Uint8Array): Uint8Array {
	const pk = typeof publicKey === "string" ? from(publicKey) : publicKey;
	return _compress(pk);
}

/**
 * Decompress a public key from 33 bytes (compressed) to 64 bytes (uncompressed)
 *
 * Solves the curve equation y² = x³ + 7 mod p and chooses y based on prefix parity.
 *
 * @param compressed - Compressed public key (33 bytes with 0x02/0x03 prefix)
 * @returns Uncompressed public key (64 bytes)
 * @throws {Error} If compressed format is invalid
 *
 * @example
 * ```typescript
 * import * as PublicKey from './primitives/PublicKey/index.js';
 *
 * const uncompressed = PublicKey.decompress(compressed);
 * console.log(uncompressed.length); // 64
 * ```
 */
export function decompress(
	compressed: Uint8Array,
): import("./PublicKeyType.js").PublicKeyType {
	return _decompress(compressed);
}

/**
 * Check if a public key is in compressed format
 *
 * Returns true for 33 bytes with 0x02/0x03 prefix, false otherwise
 *
 * @param bytes - Public key bytes
 * @returns True if compressed format
 *
 * @example
 * ```typescript
 * import * as PublicKey from './primitives/PublicKey/index.js';
 *
 * const isComp = PublicKey.isCompressed(bytes);
 * ```
 */
export function isCompressed(bytes: Uint8Array): boolean {
	return _isCompressed(bytes);
}

// Export internal functions (tree-shakeable)
export { _toHex, _toAddress, _verify, _compress, _decompress, _isCompressed };

// Export as namespace (convenience)
export const PublicKey = {
	from,
	fromPrivateKey,
	toHex,
	toAddress,
	verify,
	compress,
	decompress,
	isCompressed,
};
