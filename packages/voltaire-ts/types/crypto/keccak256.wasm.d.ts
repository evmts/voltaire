/**
 * WASM Keccak256 Hash Function (Standalone 3.1 kB Micro-WASM)
 *
 * Instantiates the standalone `keccak256.wasm` (3.1 kB, zero imports) directly
 * without loading the unified `primitives.wasm` monolith.
 * Auto-initializes synchronously in Node/Bun on first call; in browsers, call
 * `await Keccak256Wasm.init()` before hashing.
 *
 * @example
 * ```typescript
 * import { Keccak256Wasm } from './keccak256.wasm.js';
 *
 * // Node/Bun: works synchronously out of the box (auto-loads 3.1 kB micro-WASM)
 * // Browser: await Keccak256Wasm.init();
 * const hash = Keccak256Wasm.hash(data);
 * const strHash = Keccak256Wasm.hashString('hello');
 * const hexHash = Keccak256Wasm.hashHex('0x1234');
 * ```
 */
import type { HashType } from "../primitives/Hash/index.js";
export type Keccak256WasmInput = string | URL | Uint8Array | ArrayBuffer;
/**
 * Hash bytes using standalone 3.1 kB Keccak256 micro-WASM.
 * @param data - Input bytes to hash
 * @returns 32-byte Keccak256 hash
 */
export declare function hash(data: Uint8Array): HashType;
/**
 * Hash a UTF-8 string using standalone Keccak256 micro-WASM.
 * @param str - String to hash
 * @returns 32-byte Keccak256 hash
 */
export declare function hashString(str: string): HashType;
/**
 * Hash a hex string using standalone Keccak256 micro-WASM.
 * @param hex - Hex string to hash (with or without 0x prefix)
 * @returns 32-byte Keccak256 hash
 */
export declare function hashHex(hex: string): HashType;
/**
 * Hash multiple byte arrays in sequence using standalone Keccak256 micro-WASM.
 * @param chunks - Array of byte arrays to hash
 * @returns 32-byte Keccak256 hash
 */
export declare function hashMultiple(chunks: readonly Uint8Array[]): HashType;
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
export declare function topic(signature: string): HashType;
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
 * Initialize standalone 3.1 kB Keccak256 micro-WASM asynchronously.
 * Required before hashing in browsers; optional in Node/Bun (auto-inits synchronously).
 */
export declare function init(wasmInput?: Keccak256WasmInput): Promise<void>;
/**
 * Initialize standalone 3.1 kB Keccak256 micro-WASM synchronously.
 * Supported in Node/Bun or anywhere when passed raw WASM bytes.
 */
export declare function initSync(wasmInput?: Keccak256WasmInput): void;
/**
 * Check if the standalone Keccak256 micro-WASM is initialized.
 */
export declare function isReady(): boolean;
/**
 * Unload the standalone Keccak256 micro-WASM instance (primarily for testing).
 */
export declare function reset(): void;
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
    initSync: typeof initSync;
    isReady: typeof isReady;
    reset: typeof reset;
    DIGEST_SIZE: number;
    RATE: number;
    STATE_SIZE: number;
};
//# sourceMappingURL=keccak256.wasm.d.ts.map