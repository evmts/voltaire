/**
 * SHA256 synchronous native implementation using Zig C ABI (Bun FFI / Node-API).
 * Drop-in 1:1 replacement for pure JS SHA256.
 */
import { BLOCK_SIZE, OUTPUT_SIZE } from "../../crypto/SHA256/constants.js";
import type { SHA256Hash as SHA256HashType } from "../../crypto/SHA256/SHA256HashType.js";
import { toHex } from "../../crypto/SHA256/toHex.js";
/**
 * Compute SHA-256 hash of raw bytes via native Zig FFI.
 */
export declare function hash(data: Uint8Array): SHA256HashType;
/**
 * Compute SHA-256 hash of a UTF-8 string via native Zig FFI.
 */
export declare function hashString(str: string): SHA256HashType;
/**
 * Compute SHA-256 hash of a hex string (with or without 0x prefix) via native Zig FFI.
 */
export declare function hashHex(hex: string): SHA256HashType;
/**
 * Universal constructor matching pure JS SHA256.from.
 */
export declare function from(input: Uint8Array | string): SHA256HashType;
/**
 * Streaming SHA-256 hasher backed by native Zig FFI on finalize.
 */
export declare function create(): {
    update: (data: Uint8Array) => void;
    digest: () => Uint8Array;
};
export { BLOCK_SIZE, OUTPUT_SIZE, toHex };
export declare const SHA256Hash: typeof from & {
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
export declare const SHA256: typeof from & {
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
//# sourceMappingURL=SHA256.native.d.ts.map