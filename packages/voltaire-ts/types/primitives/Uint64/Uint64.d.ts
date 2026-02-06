/**
 * @typedef {import('./Uint64Type.js').Uint64Type} Uint64Type
 */
/**
 * Create Uint64 from various input types (callable constructor)
 *
 * @param {number | bigint | string} value - Number, BigInt, or hex string
 * @returns {Uint64Type}
 *
 * @example
 * ```javascript
 * import { Uint64 } from '@tevm/voltaire';
 *
 * const a = Uint64(1000000000000n);
 * const b = Uint64("0xe8d4a51000");
 * ```
 */
export function Uint64(value: number | bigint | string): Uint64Type;
export namespace Uint64 {
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
export type Uint64Type = import("./Uint64Type.js").Uint64Type;
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
//# sourceMappingURL=Uint64.d.ts.map