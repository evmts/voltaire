/**
 * Creates a Gwei value from bigint, number, or string
 *
 * @param {bigint | number | string} value
 * @returns {Gwei}
 */
export function from(value: bigint | number | string): Gwei;
/**
 * Creates Gwei from Wei value
 *
 * @param {Wei} wei
 * @returns {Gwei}
 */
export function fromWei(wei: Wei): Gwei;
/**
 * Creates Gwei from Ether value
 * Supports decimal strings like "1.5" or "0.001"
 *
 * @param {Ether} ether
 * @returns {Gwei}
 */
export function fromEther(ether: Ether): Gwei;
/**
 * Converts Gwei to Wei
 *
 * @param {Gwei} gwei
 * @returns {Wei}
 */
export function toWei(gwei: Gwei): Wei;
/**
 * Converts Gwei to Ether
 * Returns a string with proper decimal representation
 *
 * @param {Gwei} gwei
 * @returns {Ether}
 */
export function toEther(gwei: Gwei): Ether;
/**
 * Converts Gwei to Uint256
 *
 * @param {Gwei} gwei
 * @returns {Uint.Type}
 */
export function toU256(gwei: Gwei): Uint.Type;
export type Gwei = import("./GweiType.js").GweiType;
/**
 * Gwei constructor and namespace
 * @type {GweiConstructor}
 */
export const Gwei: GweiConstructor;
export default Gwei;
export type Wei = import("./Wei.js").Wei;
export type Ether = import("./Ether.js").Ether;
export type GweiConstructorStatic = {
    from: typeof from;
    fromWei: typeof fromWei;
    fromEther: typeof fromEther;
    toWei: typeof toWei;
    toEther: typeof toEther;
    toU256: typeof toU256;
};
export type GweiConstructor = ((value: bigint | number | string) => Gwei) & GweiConstructorStatic;
import * as Uint from "../Uint/index.js";
//# sourceMappingURL=Gwei.d.ts.map