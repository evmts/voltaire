/**
 * @typedef {import('./Int8Type.js').BrandedInt8} BrandedInt8
 */
/**
 * Create Int8 from various input types (callable constructor)
 *
 * @param {number | bigint | string} value - Number, BigInt, or hex string
 * @returns {BrandedInt8}
 *
 * @example
 * ```javascript
 * import { Int8 } from '@tevm/voltaire';
 *
 * const a = Int8(-42);
 * const b = Int8("0xd6");
 * ```
 */
export function Int8(value: number | bigint | string): BrandedInt8;
export namespace Int8 {
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
    export { INT8_MAX as MAX };
    export { INT8_MIN as MIN };
}
export type BrandedInt8 = import("./Int8Type.js").BrandedInt8;
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
import { INT8_MAX } from "./Int8Type.js";
import { INT8_MIN } from "./Int8Type.js";
//# sourceMappingURL=Int8.d.ts.map