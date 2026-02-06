/**
 * @typedef {import('./Uint16Type.js').Uint16Type} Uint16Type
 */
/**
 * Create Uint16 from various input types (callable constructor)
 *
 * @param {number | bigint | string} value - Number, BigInt, or hex string
 * @returns {Uint16Type}
 *
 * @example
 * ```javascript
 * import { Uint16 } from '@tevm/voltaire';
 *
 * const a = Uint16(1000);
 * const b = Uint16("0x03e8");
 * ```
 */
export function Uint16(value: number | bigint | string): Uint16Type;
export namespace Uint16 {
    export { from };
    export { fromHex };
    export { fromBigint };
    export { fromNumber };
    export { fromBytes };
    export { isValid };
    export { toHex };
    export { toBigint };
    export { toNumber };
    export { toBytes };
    export { toString };
    export { plus };
    export { minus };
    export { times };
    export { dividedBy };
    export { modulo };
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
    export { minimum };
    export { maximum };
    export { bitLength };
    export { leadingZeros };
    export { popCount };
    export { MAX };
    export { MIN };
    export { ZERO };
    export { ONE };
    export { SIZE };
}
export type Uint16Type = import("./Uint16Type.js").Uint16Type;
import { from } from "./from.js";
import { fromHex } from "./fromHex.js";
import { fromBigint } from "./fromBigint.js";
import { fromNumber } from "./fromNumber.js";
import { fromBytes } from "./fromBytes.js";
import { isValid } from "./isValid.js";
import { toHex } from "./toHex.js";
import { toBigint } from "./toBigint.js";
import { toNumber } from "./toNumber.js";
import { toBytes } from "./toBytes.js";
import { toString } from "./toString.js";
import { plus } from "./plus.js";
import { minus } from "./minus.js";
import { times } from "./times.js";
import { dividedBy } from "./dividedBy.js";
import { modulo } from "./modulo.js";
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
import { minimum } from "./minimum.js";
import { maximum } from "./maximum.js";
import { bitLength } from "./bitLength.js";
import { leadingZeros } from "./leadingZeros.js";
import { popCount } from "./popCount.js";
import { MAX } from "./constants.js";
import { MIN } from "./constants.js";
import { ZERO } from "./constants.js";
import { ONE } from "./constants.js";
import { SIZE } from "./constants.js";
//# sourceMappingURL=Uint16.d.ts.map