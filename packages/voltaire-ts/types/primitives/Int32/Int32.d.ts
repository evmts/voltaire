/**
 * @typedef {import('./Int32Type.js').BrandedInt32} BrandedInt32
 */
/**
 * Create Int32 from various input types (callable constructor)
 *
 * @param {number | bigint | string} value - Number, BigInt, or hex string
 * @returns {BrandedInt32}
 *
 * @example
 * ```javascript
 * import { Int32 } from '@tevm/voltaire';
 *
 * const a = Int32(-100000);
 * const b = Int32("0xfffe7960");
 * ```
 */
export function Int32(value: number | bigint | string): BrandedInt32;
export namespace Int32 {
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
    export { clone };
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
    export { MAX };
    export { MIN };
    export { ZERO };
    export { ONE };
    export { MINUS_ONE };
    export { SIZE };
}
export type BrandedInt32 = import("./Int32Type.js").BrandedInt32;
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
import { clone } from "./clone.js";
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
import { MAX } from "./constants.js";
import { MIN } from "./constants.js";
import { ZERO } from "./constants.js";
import { ONE } from "./constants.js";
import { MINUS_ONE } from "./constants.js";
import { SIZE } from "./constants.js";
//# sourceMappingURL=Int32.d.ts.map