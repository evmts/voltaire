/**
 * Keccak256 native implementation using FFI
 * Auto-detects Bun FFI or Node-API
 */
import type { Keccak256Hash as Keccak256HashType } from "./Keccak256HashType.js";
/**
 * Hash data with Keccak-256 using native implementation
 *
 * @param data - Data to hash
 * @returns 32-byte hash
 * @throws {Keccak256Error} If native operation fails
 */
export declare function hash(data: Uint8Array): Promise<Keccak256HashType>;
/**
 * Hash hex string with Keccak-256 using native implementation
 *
 * @param hex - Hex string to hash
 * @returns 32-byte hash
 * @throws {Keccak256Error} If native operation fails
 */
export declare function hashHex(hex: string): Promise<Keccak256HashType>;
/**
 * Hash UTF-8 string with Keccak-256 using native implementation
 *
 * @param str - String to hash
 * @returns 32-byte hash
 * @throws {Keccak256Error} If native operation fails
 */
export declare function hashString(str: string): Promise<Keccak256HashType>;
/**
 * Universal constructor - accepts hex, string, or bytes
 *
 * @param input - Hex string, UTF-8 string, or Uint8Array
 * @returns 32-byte hash
 * @throws {Keccak256Error} If native operation fails
 */
export declare function from(input: string | Uint8Array): Promise<Keccak256HashType>;
/**
 * Compute function selector (first 4 bytes of keccak256)
 *
 * @param signature - Function signature (e.g., "transfer(address,uint256)")
 * @returns First 4 bytes of hash as hex string
 */
export declare function selector(signature: string): Promise<string>;
/**
 * Compute event topic hash
 *
 * @param signature - Event signature (e.g., "Transfer(address,address,uint256)")
 * @returns 32-byte topic hash
 */
export declare function topic(signature: string): Promise<Keccak256HashType>;
/**
 * Synchronous hash (for backward compatibility)
 * @throws {Keccak256NativeNotLoadedError} If native library not loaded
 */
export declare function hashSync(data: Uint8Array): Keccak256HashType;
export { DIGEST_SIZE, RATE, STATE_SIZE } from "./constants.js";
/**
 * Native Keccak256 namespace object
 */
export declare const Keccak256Hash: typeof from & {
    from: typeof from;
    fromString: typeof hashString;
    fromHex: typeof hashHex;
    hash: typeof hash;
    hashString: typeof hashString;
    hashHex: typeof hashHex;
    hashSync: typeof hashSync;
    selector: typeof selector;
    topic: typeof topic;
    DIGEST_SIZE: number;
    RATE: number;
    STATE_SIZE: number;
};
export declare const Keccak256: typeof from & {
    from: typeof from;
    fromString: typeof hashString;
    fromHex: typeof hashHex;
    hash: typeof hash;
    hashString: typeof hashString;
    hashHex: typeof hashHex;
    hashSync: typeof hashSync;
    selector: typeof selector;
    topic: typeof topic;
    DIGEST_SIZE: number;
    RATE: number;
    STATE_SIZE: number;
};
//# sourceMappingURL=Keccak256.native.d.ts.map