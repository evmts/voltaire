/**
 * Creates a Wei value from bigint, number, or string
 *
 * @param {bigint | number | string} value
 * @returns {Wei}
 */
export function from(value: bigint | number | string): Wei;
/**
 * Creates Wei from Gwei value
 *
 * @param {Gwei} gwei
 * @returns {Wei}
 */
export function fromGwei(gwei: Gwei): Wei;
/**
 * Creates Wei from Ether value
 * Supports decimal strings like "1.5" or "0.001"
 *
 * @param {Ether} ether
 * @returns {Wei}
 */
export function fromEther(ether: Ether): Wei;
/**
 * Converts Wei to Gwei
 *
 * @param {Wei} wei
 * @returns {Gwei}
 */
export function toGwei(wei: Wei): Gwei;
/**
 * Converts Wei to Ether
 * Returns a string with proper decimal representation
 *
 * @param {Wei} wei
 * @returns {Ether}
 */
export function toEther(wei: Wei): Ether;
/**
 * Converts Wei to Uint256
 *
 * @param {Wei} wei
 * @returns {Uint.Type}
 */
export function toU256(wei: Wei): Uint.Type;
export type Wei = import("./WeiType.js").WeiType;
/**
 * Wei constructor and namespace
 * @type {WeiConstructor}
 */
export const Wei: WeiConstructor;
export default Wei;
export type Gwei = import("./Gwei.js").Gwei;
export type Ether = import("./Ether.js").Ether;
export type WeiConstructorStatic = {
    from: typeof from;
    fromGwei: typeof fromGwei;
    fromEther: typeof fromEther;
    toGwei: typeof toGwei;
    toEther: typeof toEther;
    toU256: typeof toU256;
};
export type WeiConstructor = ((value: bigint | number | string) => Wei) & WeiConstructorStatic;
import * as Uint from "../Uint/index.js";
//# sourceMappingURL=Wei.d.ts.map