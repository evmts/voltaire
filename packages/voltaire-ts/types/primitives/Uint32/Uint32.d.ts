/**
 * @typedef {import('./Uint32Type.js').Uint32Type} Uint32Type
 */
/**
 * Create Uint32 from various input types (callable constructor)
 *
 * @param {number | bigint | string} value - Number, BigInt, or hex string
 * @returns {Uint32Type}
 *
 * @example
 * ```javascript
 * import { Uint32 } from '@tevm/voltaire';
 *
 * const a = Uint32(100000);
 * const b = Uint32("0x186a0");
 * ```
 */
export function Uint32(value: number | bigint | string): Uint32Type;
export namespace Uint32 {
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
export type Uint32Type = import("./Uint32Type.js").Uint32Type;
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
//# sourceMappingURL=Uint32.d.ts.map