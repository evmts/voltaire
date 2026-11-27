/**
 * RIPEMD160 synchronous native implementation using Zig C ABI (Bun FFI / Node-API).
 * Drop-in 1:1 replacement for pure JS Ripemd160.
 */
import { HEX_SIZE, SIZE } from "../../crypto/Ripemd160/constants.js";
import type { Ripemd160Hash as Ripemd160HashType } from "../../crypto/Ripemd160/Ripemd160HashType.js";
/**
 * Compute RIPEMD-160 hash (20 bytes) via native Zig FFI.
 */
export declare function hash(data: Uint8Array | string): Ripemd160HashType;
/**
 * Compute RIPEMD-160 hash of a UTF-8 string.
 */
export declare function hashString(str: string): Ripemd160HashType;
/**
 * Compute RIPEMD-160 hash of a hex string (with or without 0x prefix).
 */
export declare function hashHex(hex: string): Ripemd160HashType;
/**
 * Universal constructor matching pure JS Ripemd160.from.
 */
export declare function from(input: Uint8Array | string): Ripemd160HashType;
export { HEX_SIZE, SIZE };
export declare const Ripemd160Hash: typeof from & {
    from: typeof from;
    fromString: typeof hashString;
    fromHex: typeof hashHex;
    hash: typeof hash;
    hashString: typeof hashString;
    hashHex: typeof hashHex;
    SIZE: number;
    HEX_SIZE: number;
};
export declare const Ripemd160: typeof from & {
    from: typeof from;
    fromString: typeof hashString;
    fromHex: typeof hashHex;
    hash: typeof hash;
    hashString: typeof hashString;
    hashHex: typeof hashHex;
    SIZE: number;
    HEX_SIZE: number;
};
//# sourceMappingURL=Ripemd160.native.d.ts.map