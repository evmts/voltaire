/**
 * Standalone Keccak256 WASM Implementation
 *
 * Minimal 3KB WASM module containing only Zig stdlib keccak256.
 * Used for bundle size comparison vs noble curves implementation.
 *
 * @example
 * ```typescript
 * import * as Keccak256Standalone from './keccak256.standalone.js';
 *
 * await Keccak256Standalone.init();
 * const hash = Keccak256Standalone.hash(data);
 * ```
 */
import type { HashType } from "../primitives/Hash/index.js";
/**
 * Initialize standalone keccak256 WASM module
 */
export declare function init(): Promise<void>;
/**
 * Hash bytes using standalone keccak256 WASM
 */
export declare function hash(data: Uint8Array): HashType;
/**
 * Hash UTF-8 string
 */
export declare function hashString(str: string): HashType;
/**
 * Hash hex string
 */
export declare function hashHex(hex: string): HashType;
/**
 * Check if WASM is initialized
 */
export declare function isReady(): boolean;
export declare const Keccak256Standalone: {
    hash: typeof hash;
    hashString: typeof hashString;
    hashHex: typeof hashHex;
    init: typeof init;
    isReady: typeof isReady;
};
//# sourceMappingURL=keccak256.standalone.d.ts.map