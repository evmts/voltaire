/**
 * @typedef {import('./Int256Type.js').BrandedInt256} BrandedInt256
 */
/**
 * Create Int256 from various input types (callable constructor)
 *
 * @param {number | bigint | string} value - Number, BigInt, or hex string
 * @returns {BrandedInt256}
 *
 * @example
 * ```javascript
 * import { Int256 } from '@tevm/voltaire';
 *
 * const a = Int256(-1000000000000000000000000000000n);
 * const b = Int256("0xff..."); // 256-bit hex
 * ```
 */
export function Int256(value: number | bigint | string): BrandedInt256;
export namespace Int256 {
    export { from };
    export { fromHex };
    export { fromBigInt };
    export { fromNumber };
    export { fromBytes };
    export { isValid };
    export { toHex };
    export { toBigInt };
    export { toNumber };
    export { toBytes };
    export { toString };
    export { plus };
    export { minus };
    export { times };
    export { dividedBy };
    export { modulo };
    export { abs };
    export { negate };
    export { bitwiseAnd };
    export { bitwiseOr };
    export { bitwiseXor };
    export { bitwiseNot };
    export { shiftLeft };
    export { shiftRight };
    export { equals };
    export { lessThan };
    export { greaterThan };
    export { isZero };
    export { isNegative };
    export { isPositive };
    export { minimum };
    export { maximum };
    export { sign };
    export { bitLength };
    export { leadingZeros };
    export { popCount };
    export { MAX };
    export { MIN };
    export { ZERO };
    export { ONE };
    export { NEG_ONE };
    export { SIZE };
    export { BITS };
    export { MODULO };
}
export type BrandedInt256 = import("./Int256Type.js").BrandedInt256;
import { from } from "./from.js";
import { fromHex } from "./fromHex.js";
import { fromBigInt } from "./fromBigInt.js";
import { fromNumber } from "./fromNumber.js";
import { fromBytes } from "./fromBytes.js";
import { isValid } from "./isValid.js";
import { toHex } from "./toHex.js";
import { toBigInt } from "./toBigInt.js";
import { toNumber } from "./toNumber.js";
import { toBytes } from "./toBytes.js";
import { toString } from "./toString.js";
import { plus } from "./plus.js";
import { minus } from "./minus.js";
import { times } from "./times.js";
import { dividedBy } from "./dividedBy.js";
import { modulo } from "./modulo.js";
import { abs } from "./abs.js";
import { negate } from "./negate.js";
import { bitwiseAnd } from "./bitwiseAnd.js";
import { bitwiseOr } from "./bitwiseOr.js";
import { bitwiseXor } from "./bitwiseXor.js";
import { bitwiseNot } from "./bitwiseNot.js";
import { shiftLeft } from "./shiftLeft.js";
import { shiftRight } from "./shiftRight.js";
import { equals } from "./equals.js";
import { lessThan } from "./lessThan.js";
import { greaterThan } from "./greaterThan.js";
import { isZero } from "./isZero.js";
import { isNegative } from "./isNegative.js";
import { isPositive } from "./isPositive.js";
import { minimum } from "./minimum.js";
import { maximum } from "./maximum.js";
import { sign } from "./sign.js";
import { bitLength } from "./bitLength.js";
import { leadingZeros } from "./leadingZeros.js";
import { popCount } from "./popCount.js";
import { MAX } from "./constants.js";
import { MIN } from "./constants.js";
import { ZERO } from "./constants.js";
import { ONE } from "./constants.js";
import { NEG_ONE } from "./constants.js";
import { SIZE } from "./constants.js";
import { BITS } from "./constants.js";
import { MODULO } from "./constants.js";
//# sourceMappingURL=Int256.d.ts.map