export type { PublicKeyType } from "./PublicKeyType.js";
import type { Secp256k1SignatureType } from "../../crypto/Secp256k1/SignatureType.js";
import { compress as _compress } from "./compress.js";
import { decompress as _decompress } from "./decompress.js";
import { from } from "./from.js";
import { fromPrivateKey } from "./fromPrivateKey.js";
import { isCompressed as _isCompressed } from "./isCompressed.js";
import { toAddress as _toAddress } from "./toAddress.js";
import { toHex as _toHex } from "./toHex.js";
import { Verify } from "./verify.js";
export { from, fromPrivateKey };
export { Verify };
declare const _verify: (publicKey: import("./PublicKeyType.js").PublicKeyType, hash: import("../Hash/BrandedHash.js").BrandedHash, signature: import("../../crypto/Secp256k1/SignatureType.js").Secp256k1SignatureType) => boolean;
export declare function toHex(publicKey: string): string;
export declare function toAddress(publicKey: string): import("../Address/AddressType.js").AddressType;
export declare function verify(publicKey: string, hash: import("../Hash/BrandedHash.js").BrandedHash, signature: import("../Signature/SignatureType.js").SignatureType): boolean;
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
export declare function compress(publicKey: string | Uint8Array): Uint8Array;
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
export declare function decompress(compressed: Uint8Array): import("./PublicKeyType.js").PublicKeyType;
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
export declare function isCompressed(bytes: Uint8Array): boolean;
export { _toHex, _toAddress, _verify, _compress, _decompress, _isCompressed };
export declare const PublicKey: {
    from: typeof from;
    fromPrivateKey: typeof fromPrivateKey;
    toHex: typeof toHex;
    toAddress: typeof toAddress;
    verify: typeof verify;
    compress: typeof compress;
    decompress: typeof decompress;
    isCompressed: typeof isCompressed;
};
//# sourceMappingURL=index.d.ts.map