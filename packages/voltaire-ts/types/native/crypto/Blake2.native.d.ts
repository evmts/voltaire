/**
 * BLAKE2b synchronous native implementation using Zig C ABI (Bun FFI / Node-API).
 * Supports RFC 7693 variable digest lengths (1..=64 bytes) via `blake2Hash`.
 */
import { type Blake2Hash as Blake2HashType, SIZE } from "../../crypto/Blake2/Blake2HashType.js";
/**
 * Compute BLAKE2b hash with variable digest length (1..=64 bytes, default 64).
 */
export declare function hash(data: Uint8Array | string, outputLength?: number): Blake2HashType;
/**
 * Compute BLAKE2b hash of a UTF-8 string.
 */
export declare function hashString(str: string, outputLength?: number): Blake2HashType;
/**
 * Universal constructor matching pure JS Blake2.from.
 */
export declare function from(input: Uint8Array | string, outputLength?: number): Blake2HashType;
export { SIZE };
export declare const Blake2Hash: typeof from & {
    from: typeof from;
    fromString: typeof hashString;
    hash: typeof hash;
    hashString: typeof hashString;
    SIZE: number;
};
export declare const Blake2: typeof from & {
    from: typeof from;
    fromString: typeof hashString;
    hash: typeof hash;
    hashString: typeof hashString;
    SIZE: number;
};
export default Blake2Hash;
//# sourceMappingURL=Blake2.native.d.ts.map