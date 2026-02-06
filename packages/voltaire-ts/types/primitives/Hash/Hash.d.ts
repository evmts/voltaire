/**
 * @typedef {import(./HashType.js').HashType} HashType
 */
/**
 * Creates a Hash instance from a string or Uint8Array.
 * Canonical constructor for the Hash Class API.
 *
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
export function Hash(value: any): any;
export class Hash {
    /**
     * @typedef {import(./HashType.js').HashType} HashType
     */
    /**
     * Creates a Hash instance from a string or Uint8Array.
     * Canonical constructor for the Hash Class API.
     *
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
    constructor(value: any);
    toBytes(): any;
    toString(): string;
    equals(other: any): any;
    isZero(): any;
    clone(): any;
    slice(start: any, end: any): any;
    format(): any;
}
export namespace Hash {
    /**
     * Alias for Hash() constructor.
     * Prefer using Hash() directly.
     */
    export function from(value: any): any;
    export function fromBytes(value: any): any;
    export function fromHex(value: any): any;
    export let isHash: any;
    export let isValidHex: any;
    export let assert: any;
    export function keccak256(value: any): any;
    export function keccak256String(value: any): any;
    export function keccak256Hex(value: any): any;
    export function random(): any;
    export let toBytes: any;
    export let toHex: any;
    export let toString: () => string;
    export let equals: any;
    export let isZero: any;
    export function clone(value: any): any;
    export function slice(value: any, start: any, end: any): any;
    export let format: any;
    export function concat(...hashes: any[]): any;
    export function merkleRoot(hashes: any): any;
    export { _ZERO as ZERO };
    export let SIZE: any;
}
export * from "./constants.js";
declare const _ZERO: any;
//# sourceMappingURL=Hash.d.ts.map