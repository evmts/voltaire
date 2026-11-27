/**
 * Keccak256 synchronous native implementation using Zig C ABI (Bun FFI / Node-API).
 * Matches the pure JS Keccak256 API 1:1 with zero async overhead.
 */
import { DIGEST_SIZE, RATE, STATE_SIZE } from "./constants.js";
import type { Keccak256Hash as Keccak256HashType } from "./Keccak256HashType.js";
/**
 * Hash raw bytes with Keccak-256 using native Zig FFI.
 */
export declare function hash(data: Uint8Array): Keccak256HashType;
/**
 * Synchronous hash alias (retained for backward compatibility).
 */
export declare function hashSync(data: Uint8Array): Keccak256HashType;
/**
 * Hash hex string (with or without 0x prefix) with Keccak-256 using native FFI.
 */
export declare function hashHex(hex: string): Keccak256HashType;
/**
 * Hash UTF-8 string with Keccak-256 using native FFI.
 */
export declare function hashString(str: string): Keccak256HashType;
/**
 * Universal constructor - accepts hex string, UTF-8 string, or Uint8Array.
 */
export declare function from(input: Uint8Array | string): Keccak256HashType;
/**
 * Hash multiple byte chunks sequentially.
 */
export declare function hashMultiple(chunks: readonly Uint8Array[]): Keccak256HashType;
/**
 * Compute 4-byte Ethereum function selector (first 4 bytes of keccak256(signature)).
 */
export declare function selector(signature: string): Uint8Array;
/**
 * Compute 32-byte Ethereum event topic hash.
 */
export declare function topic(signature: string): Keccak256HashType;
/**
 * Compute CREATE contract address from deployer address and nonce.
 */
export declare function contractAddress(sender: Uint8Array, nonce: bigint): Uint8Array;
/**
 * Compute CREATE2 contract address from sender, 32-byte salt, and 32-byte initCodeHash.
 */
export declare function create2Address(sender: Uint8Array, salt: Uint8Array, initCodeHash: Uint8Array): Uint8Array;
export { DIGEST_SIZE, RATE, STATE_SIZE };
/**
 * Synchronous Native Keccak256 namespace matching pure JS Keccak256 1:1.
 */
export declare const Keccak256Hash: typeof from & {
    from: typeof from;
    fromString: typeof hashString;
    fromHex: typeof hashHex;
    fromTopic: typeof topic;
    hash: typeof hash;
    hashString: typeof hashString;
    hashHex: typeof hashHex;
    hashMultiple: typeof hashMultiple;
    hashSync: typeof hashSync;
    selector: typeof selector;
    topic: typeof topic;
    contractAddress: typeof contractAddress;
    create2Address: typeof create2Address;
    DIGEST_SIZE: number;
    RATE: number;
    STATE_SIZE: number;
};
export declare const Keccak256: typeof from & {
    from: typeof from;
    fromString: typeof hashString;
    fromHex: typeof hashHex;
    fromTopic: typeof topic;
    hash: typeof hash;
    hashString: typeof hashString;
    hashHex: typeof hashHex;
    hashMultiple: typeof hashMultiple;
    hashSync: typeof hashSync;
    selector: typeof selector;
    topic: typeof topic;
    contractAddress: typeof contractAddress;
    create2Address: typeof create2Address;
    DIGEST_SIZE: number;
    RATE: number;
    STATE_SIZE: number;
};
//# sourceMappingURL=Keccak256.native.d.ts.map