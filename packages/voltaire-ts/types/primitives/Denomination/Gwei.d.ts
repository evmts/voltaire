/**
 * Creates a whole Gwei value from bigint, number, or string
 *
 * @param {bigint | number | string} value - Non-negative whole gwei amount
 * @returns {Gwei}
 * @throws {Error} If value is negative, fractional, or not a Uint256
 */
export function from(value: bigint | number | string): Gwei;
/**
 * Creates Gwei from Wei value
 *
 * Gwei here is a whole number, so the Wei amount must be a multiple of
 * 10^9. Use `BrandedGwei.fromWei` for fractional gwei.
 *
 * @param {Wei} wei
 * @returns {Gwei}
 * @throws {Error} If wei is not a whole number of gwei
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
 * @throws {Error} If gwei is not a non-negative whole bigint or the result exceeds the Uint256 maximum
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
/**
 * Whole-gwei amount stored as a bigint. The decimal-string `GweiType`
 * belongs to the `BrandedGwei` namespace (`gwei-index.js`), which supports
 * fractional gwei.
 */
export type Gwei = import("./Gwei.js").Gwei;
/**
 * Gwei constructor and namespace
 * @type {GweiConstructor}
 */
export const Gwei: GweiConstructor;
export default Gwei;
/**
 * Whole-gwei amount stored as a bigint. The decimal-string `GweiType`
 * belongs to the `BrandedGwei` namespace (`gwei-index.js`), which supports
 * fractional gwei.
 */
export type Wei = import("./Wei.js").Wei;
/**
 * Whole-gwei amount stored as a bigint. The decimal-string `GweiType`
 * belongs to the `BrandedGwei` namespace (`gwei-index.js`), which supports
 * fractional gwei.
 */
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