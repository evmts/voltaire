// @ts-nocheck
export { SIZE } from "./Blake2HashType.js";
import { SIZE } from "./Blake2HashType.js";
import { from } from "./from.js";
import { hash } from "./hash.js";
import { hashString } from "./hashString.js";
// Export individual functions
export { from, hash, hashString };
/**
 * Blake2Hash - Type-safe BLAKE2b hash namespace
 *
 * Pure TypeScript BLAKE2b implementation using @noble/hashes.
 * All methods return branded Blake2Hash type.
 * Supports variable output lengths (1-64 bytes, default 64).
 *
 * @example
 * ```typescript
 * import { Blake2Hash } from './Blake2.js';
 *
 * // Preferred: Type-safe constructors
 * const hash1 = Blake2Hash.from("hello");              // String, 64 bytes
 * const hash2 = Blake2Hash.fromString("hello", 32);    // String, 32 bytes
 * const hash3 = Blake2Hash.from(uint8array);           // Bytes, 64 bytes
 * const hash4 = Blake2Hash.from(uint8array, 48);       // Bytes, 48 bytes
 *
 * // Also available: legacy method names
 * const hash5 = Blake2Hash.hash(data, 32);
 * const hash6 = Blake2Hash.hashString('hello', 32);
 * ```
 */
export const Blake2Hash = Object.assign(from, {
    // Primary API (type-safe constructors)
    from,
    fromString: hashString,
    // Legacy API (kept for compatibility)
    hash,
    hashString,
    // Constants
    SIZE,
});
/**
 * @deprecated Use Blake2Hash instead
 * Blake2 alias maintained for backward compatibility
 */
export const Blake2 = Blake2Hash;
export default Blake2Hash;
