/**
 * @typedef {import('./Int16Type.js').BrandedInt16} BrandedInt16
 */
/**
 * Create Int16 from various input types (callable constructor)
 *
 * @param {number | bigint | string} value - Number, BigInt, or hex string
 * @returns {BrandedInt16}
 *
 * @example
 * ```javascript
 * import { Int16 } from '@tevm/voltaire';
 *
 * const a = Int16(-1000);
 * const b = Int16("0xfc18");
 * ```
 */
export function Int16(value: number | bigint | string): BrandedInt16;
export namespace Int16 {
    export { from };
    export { fromHex };
    export { fromBigint };
    export { fromNumber };
    export { fromBytes };
    export let isValid: typeof util.isValid;
    export let toHex: typeof conv.toHex;
    export let toBigint: typeof conv.toBigint;
    export let toNumber: typeof conv.toNumber;
    export let toBytes: typeof conv.toBytes;
    export let toString: typeof conv.toString;
    export let plus: typeof arith.plus;
    export let minus: typeof arith.minus;
    export let times: typeof arith.times;
    export let dividedBy: typeof arith.dividedBy;
    export let modulo: typeof arith.modulo;
    export let abs: typeof arith.abs;
    export let negate: typeof arith.negate;
    export let and: typeof bit.and;
    export let or: typeof bit.or;
    export let xor: typeof bit.xor;
    export let not: typeof bit.not;
    export let shiftLeft: typeof bit.shiftLeft;
    export let shiftRight: typeof bit.shiftRight;
    export let equals: typeof cmp.equals;
    export let lessThan: typeof cmp.lessThan;
    export let greaterThan: typeof cmp.greaterThan;
    export let isZero: typeof cmp.isZero;
    export let isNegative: typeof cmp.isNegative;
    export let isPositive: typeof cmp.isPositive;
    export let minimum: typeof cmp.minimum;
    export let maximum: typeof cmp.maximum;
    export let sign: typeof cmp.sign;
    export let bitLength: typeof util.bitLength;
    export let leadingZeros: typeof util.leadingZeros;
    export let popCount: typeof util.popCount;
    export { INT16_MAX as MAX };
    export { INT16_MIN as MIN };
}
export type BrandedInt16 = import("./Int16Type.js").BrandedInt16;
import { from } from "./from.js";
import { fromHex } from "./from.js";
import { fromBigint } from "./from.js";
import { fromNumber } from "./from.js";
import { fromBytes } from "./from.js";
import * as util from "./utilities.js";
import * as conv from "./conversions.js";
import * as arith from "./arithmetic.js";
import * as bit from "./bitwise.js";
import * as cmp from "./comparison.js";
import { INT16_MAX } from "./Int16Type.js";
import { INT16_MIN } from "./Int16Type.js";
//# sourceMappingURL=Int16.d.ts.map