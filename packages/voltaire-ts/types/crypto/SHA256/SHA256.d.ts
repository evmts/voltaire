export * from "./constants.js";
/**
 * SHA256Hash - Type-safe SHA256 hash namespace
 *
 * Pure TypeScript SHA256 implementation using @noble/hashes.
 * All methods return branded SHA256Hash type.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @example
 * ```javascript
 * import { SHA256Hash } from './crypto/SHA256/index.js';
 *
 * // Preferred: Type-safe constructors
 * const hash1 = SHA256Hash.from("0x1234");        // Hex string
 * const hash2 = SHA256Hash.fromString("hello");   // UTF-8 string
 * const hash3 = SHA256Hash.from(uint8array);      // Bytes
 *
 * // Also available: legacy method names
 * const hash4 = SHA256Hash.hash(data);
 * const hash5 = SHA256Hash.hashString('hello');
 * const hash6 = SHA256Hash.hashHex('0x1234');
 * ```
 */
export const SHA256Hash: typeof from & {
    from: typeof from;
    fromString: typeof hashString;
    fromHex: typeof hashHex;
    hash: typeof hash;
    hashString: typeof hashString;
    hashHex: typeof hashHex;
    toHex: typeof toHex;
    create: typeof create;
    OUTPUT_SIZE: number;
    BLOCK_SIZE: number;
};
/**
 * @deprecated Use SHA256Hash instead
 * SHA256 alias maintained for backward compatibility
 */
export const SHA256: typeof from & {
    from: typeof from;
    fromString: typeof hashString;
    fromHex: typeof hashHex;
    hash: typeof hash;
    hashString: typeof hashString;
    hashHex: typeof hashHex;
    toHex: typeof toHex;
    create: typeof create;
    OUTPUT_SIZE: number;
    BLOCK_SIZE: number;
};
import { from } from "./from.js";
import { hash } from "./hash.js";
import { hashString } from "./hashString.js";
import { hashHex } from "./hashHex.js";
import { toHex } from "./toHex.js";
import { create } from "./create.js";
export { from, hash, hashString, hashHex, toHex, create };
//# sourceMappingURL=SHA256.d.ts.map