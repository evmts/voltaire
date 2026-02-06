/**
 * Creates an Ether value from bigint, number, or string
 * Supports decimal strings like "1.5" or "0.001"
 *
 * @param {bigint | number | string} value
 * @returns {Ether}
 */
export function from(value: bigint | number | string): Ether;
/**
 * Creates Ether from Wei value
 * Returns a string with proper decimal representation
 *
 * @param {Wei} wei
 * @returns {Ether}
 */
export function fromWei(wei: Wei): Ether;
/**
 * Creates Ether from Gwei value
 * Returns a string with proper decimal representation
 *
 * @param {Gwei} gwei
 * @returns {Ether}
 */
export function fromGwei(gwei: Gwei): Ether;
/**
 * Converts Ether to Wei
 * Supports decimal strings like "1.5" or "0.001"
 *
 * @param {Ether} ether
 * @returns {Wei}
 */
export function toWei(ether: Ether): Wei;
/**
 * Converts Ether to Gwei
 * Supports decimal strings like "1.5" or "0.001"
 *
 * @param {Ether} ether
 * @returns {Gwei}
 */
export function toGwei(ether: Ether): Gwei;
/**
 * Converts Ether to Uint256 (as Wei)
 * Parses decimal strings and returns the Wei value as Uint256
 *
 * @param {Ether} ether
 * @returns {Uint.Type}
 */
export function toU256(ether: Ether): Uint.Type;
export type Ether = import("./EtherType.js").EtherType;
/**
 * Ether constructor and namespace
 * @type {EtherConstructor}
 */
export const Ether: EtherConstructor;
export default Ether;
export type Wei = import("./Wei.js").Wei;
export type Gwei = import("./Gwei.js").Gwei;
export type EtherConstructorStatic = {
    from: typeof from;
    fromWei: typeof fromWei;
    fromGwei: typeof fromGwei;
    toWei: typeof toWei;
    toGwei: typeof toGwei;
    toU256: typeof toU256;
};
export type EtherConstructor = ((value: bigint | number | string) => Ether) & EtherConstructorStatic;
import * as Uint from "../Uint/index.js";
//# sourceMappingURL=Ether.d.ts.map