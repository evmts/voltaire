/**
 * WASM Keccak256 Hash Function
 *
 * WASM-accelerated Keccak256 implementation using unified wasm-loader.
 * Data-first API matching the Noble implementation.
 *
 * @example
 * ```typescript
 * import { Keccak256Wasm } from './keccak256.wasm.js';
 *
 * // Hash bytes
 * const hash = Keccak256Wasm.hash(data);
 *
 * // Hash string
 * const hash = Keccak256Wasm.hashString('hello');
 *
 * // Hash hex
 * const hash = Keccak256Wasm.hashHex('0x1234...');
 * ```
 */
import type { HashType } from "../primitives/Hash/index.js";
/**
 * Hash bytes using Keccak256
 * @param data - Input bytes to hash
 * @returns 32-byte Keccak256 hash
 */
export declare function hash(data: Uint8Array): HashType;
/**
 * Hash a UTF-8 string
 * @param str - String to hash
 * @returns 32-byte Keccak256 hash
 */
export declare function hashString(str: string): HashType;
/**
 * Hash a hex string
 * @param hex - Hex string to hash (with or without 0x prefix)
 * @returns 32-byte Keccak256 hash
 */
export declare function hashHex(hex: string): HashType;
/**
 * Hash multiple byte arrays in sequence
 * @param chunks - Array of byte arrays to hash
 * @returns 32-byte Keccak256 hash
 */
export declare function hashMultiple(chunks: Uint8Array[]): HashType;
/**
 * Compute function selector (first 4 bytes of hash)
 * @param signature - Function signature string (e.g., "transfer(address,uint256)")
 * @returns 4-byte function selector
 */
export declare function selector(signature: string): Uint8Array;
/**
 * Compute event topic (full 32-byte hash)
 * @param signature - Event signature string (e.g., "Transfer(address,address,uint256)")
 * @returns 32-byte event topic as HashType
 */
export declare function topic(signature: string): import("../primitives/Hash/HashType.js").HashType;
/**
 * Compute CREATE contract address
 * @param sender - Sender address (20 bytes)
 * @param nonce - Transaction nonce
 * @returns Contract address (20 bytes)
 */
export declare function contractAddress(sender: Uint8Array, nonce: bigint): Uint8Array;
/**
 * Compute CREATE2 contract address
 * @param sender - Sender address (20 bytes)
 * @param salt - Salt (32 bytes)
 * @param initCodeHash - Init code hash (32 bytes)
 * @returns Contract address (20 bytes)
 */
export declare function create2Address(sender: Uint8Array, salt: Uint8Array, initCodeHash: Uint8Array): Uint8Array;
/**
 * Initialize WASM module (must be called before using any functions)
 */
export declare function init(): Promise<void>;
/**
 * Check if WASM is initialized
 */
export declare function isReady(): boolean;
export declare const Keccak256Wasm: {
    hash: typeof hash;
    hashString: typeof hashString;
    hashHex: typeof hashHex;
    hashMultiple: typeof hashMultiple;
    selector: typeof selector;
    topic: typeof topic;
    contractAddress: typeof contractAddress;
    create2Address: typeof create2Address;
    init: typeof init;
    isReady: typeof isReady;
    DIGEST_SIZE: number;
    RATE: number;
    STATE_SIZE: number;
};
//# sourceMappingURL=keccak256.wasm.d.ts.map