/**
 * Creates a Hash instance from a string or Uint8Array.
 * Canonical constructor for the Hash Class API.
 *
 * @param {string | Uint8Array} value
 * @returns {HashType}
 * @example
 * ```typescript
 * // Using constructor (recommended)
 * const hash = Hash("0x1234...");
 *
 * // Namespace API (for functional style)
 * import * as Hash from './Hash/index.js';
 * const hash = Hash.from("0x1234...");
 * ```
 */
export function Hash(value: string | Uint8Array): HashType;
export class Hash {
    /**
     * Creates a Hash instance from a string or Uint8Array.
     * Canonical constructor for the Hash Class API.
     *
     * @param {string | Uint8Array} value
     * @returns {HashType}
     * @example
     * ```typescript
     * // Using constructor (recommended)
     * const hash = Hash("0x1234...");
     *
     * // Namespace API (for functional style)
     * import * as Hash from './Hash/index.js';
     * const hash = Hash.from("0x1234...");
     * ```
     */
    constructor(value: string | Uint8Array);
    toBytes(this: import("./HashType.js").HashType): Uint8Array<ArrayBufferLike>;
    toString(this: import("./HashType.js").HashType): import("../Hex/HexType.js").HexType;
    equals(this: import("./HashType.js").HashType, other: HashType): boolean;
    isZero(this: import("./HashType.js").HashType): boolean;
    clone(this: import("./HashType.js").HashType): import("./HashType.js").HashType;
    slice(this: import("./HashType.js").HashType, start?: number, end?: number): Uint8Array<ArrayBufferLike>;
    format(this: import("./HashType.js").HashType): string;
}
export namespace Hash {
    /**
     * Alias for Hash() constructor.
     * Prefer using Hash() directly.
     * @param {string | Uint8Array} value
     * @returns {HashType}
     */
    export function from(value: string | Uint8Array): HashType;
    /**
     * @param {Uint8Array} value
     * @returns {HashType}
     */
    export function fromBytes(value: Uint8Array): HashType;
    /**
     * @param {string} value
     * @returns {HashType}
     */
    export function fromHex(value: string): HashType;
    export { isHash };
    export { isValidHex };
    export { assert };
    /**
     * @param {Uint8Array} value
     * @returns {HashType}
     */
    export function keccak256(value: Uint8Array): HashType;
    /**
     * @param {string} value
     * @returns {HashType}
     */
    export function keccak256String(value: string): HashType;
    /**
     * @param {string} value
     * @returns {HashType}
     */
    export function keccak256Hex(value: string): HashType;
    export function random(): import("./HashType.js").HashType;
    export { toBytes };
    export { toHex };
    export { toString };
    export { equals };
    export { isZero };
    /**
     * @param {HashType} value
     * @returns {HashType}
     */
    export function clone(value: HashType): HashType;
    /**
     * @param {HashType} value
     * @param {number} [start]
     * @param {number} [end]
     * @returns {Uint8Array}
     */
    export function slice(value: HashType, start?: number, end?: number): Uint8Array;
    export { format };
    /**
     * @param {...HashType} hashes
     * @returns {HashType}
     */
    export function concat(...hashes: HashType[]): HashType;
    /**
     * @param {HashType[]} hashes
     * @returns {HashType}
     */
    export function merkleRoot(hashes: HashType[]): HashType;
    export { _ZERO as ZERO };
    export { SIZE };
}
export * from "./constants.js";
export type HashType = import("./HashType.js").HashType;
export type HashLike = import("./HashType.js").HashLike;
import { isHash } from "./isHash.js";
import { isValidHex } from "./isValidHex.js";
import { assert } from "./assert.js";
import { toBytes } from "./toBytes.js";
import { toHex } from "./toHex.js";
import { toString } from "./toString.js";
import { equals } from "./equals.js";
import { isZero } from "./isZero.js";
import { format } from "./format.js";
declare const _ZERO: import("./HashType.js").HashType;
import { SIZE } from "./constants.js";
//# sourceMappingURL=Hash.d.ts.map