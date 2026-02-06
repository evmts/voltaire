/**
 * @typedef {import('./Uint128Type.js').Uint128Type} Uint128Type
 */
/**
 * Create Uint128 from various input types (callable constructor)
 *
 * @param {number | bigint | string} value - Number, BigInt, or hex string
 * @returns {Uint128Type}
 *
 * @example
 * ```javascript
 * import { Uint128 } from '@tevm/voltaire';
 *
 * const a = Uint128(1000000000000000000000000n);
 * const b = Uint128("0xd3c21bcecceda1000000");
 * ```
 */
export function Uint128(value: number | bigint | string): Uint128Type;
export namespace Uint128 {
    export { from };
    export { fromHex };
    export { fromBigInt };
    export { fromNumber };
    export { fromBytes };
    export { fromAbiEncoded };
    export { tryFrom };
    export { isValid };
    export { toHex };
    export { toBigInt };
    export { toNumber };
    export { toBytes };
    export { toAbiEncoded };
    export { toString };
    export { clone };
    export { plus };
    export { minus };
    export { times };
    export { dividedBy };
    export { modulo };
    export { toPower };
    export { bitwiseAnd };
    export { bitwiseOr };
    export { bitwiseXor };
    export { bitwiseNot };
    export { shiftLeft };
    export { shiftRight };
    export { equals };
    export { notEquals };
    export { lessThan };
    export { lessThanOrEqual };
    export { greaterThan };
    export { greaterThanOrEqual };
    export { isZero };
    export { minimum };
    export { maximum };
    export { bitLength };
    export { leadingZeros };
    export { popCount };
    export { sum };
    export { product };
    export { min };
    export { max };
    export { gcd };
    export { lcm };
    export { isPowerOf2 };
    export { MAX };
    export { MIN };
    export { ZERO };
    export { ONE };
    export { SIZE };
}
export type Uint128Type = import("./Uint128Type.js").Uint128Type;
import { from } from "./from.js";
import { fromHex } from "./fromHex.js";
import { fromBigInt } from "./fromBigInt.js";
import { fromNumber } from "./fromNumber.js";
import { fromBytes } from "./fromBytes.js";
import { fromAbiEncoded } from "./fromAbiEncoded.js";
import { tryFrom } from "./tryFrom.js";
import { isValid } from "./isValid.js";
import { toHex } from "./toHex.js";
import { toBigInt } from "./toBigInt.js";
import { toNumber } from "./toNumber.js";
import { toBytes } from "./toBytes.js";
import { toAbiEncoded } from "./toAbiEncoded.js";
import { toString } from "./toString.js";
import { clone } from "./clone.js";
import { plus } from "./plus.js";
import { minus } from "./minus.js";
import { times } from "./times.js";
import { dividedBy } from "./dividedBy.js";
import { modulo } from "./modulo.js";
import { toPower } from "./toPower.js";
import { bitwiseAnd } from "./bitwiseAnd.js";
import { bitwiseOr } from "./bitwiseOr.js";
import { bitwiseXor } from "./bitwiseXor.js";
import { bitwiseNot } from "./bitwiseNot.js";
import { shiftLeft } from "./shiftLeft.js";
import { shiftRight } from "./shiftRight.js";
import { equals } from "./equals.js";
import { notEquals } from "./notEquals.js";
import { lessThan } from "./lessThan.js";
import { lessThanOrEqual } from "./lessThanOrEqual.js";
import { greaterThan } from "./greaterThan.js";
import { greaterThanOrEqual } from "./greaterThanOrEqual.js";
import { isZero } from "./isZero.js";
import { minimum } from "./minimum.js";
import { maximum } from "./maximum.js";
import { bitLength } from "./bitLength.js";
import { leadingZeros } from "./leadingZeros.js";
import { popCount } from "./popCount.js";
import { sum } from "./sum.js";
import { product } from "./product.js";
import { min } from "./min.js";
import { max } from "./max.js";
import { gcd } from "./gcd.js";
import { lcm } from "./lcm.js";
import { isPowerOf2 } from "./isPowerOf2.js";
import { MAX } from "./constants.js";
import { MIN } from "./constants.js";
import { ZERO } from "./constants.js";
import { ONE } from "./constants.js";
import { SIZE } from "./constants.js";
//# sourceMappingURL=Uint128.d.ts.map