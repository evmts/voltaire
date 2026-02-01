/**
 * @typedef {import('./Uint256Type.js').Uint256Type} Uint256Type
 * @typedef {import('./UintConstructor.js').UintConstructor} UintConstructor
 */
/**
 * Factory function for creating Uint instances
 *
 * @type {UintConstructor}
 */
export function Uint(value: any): import("./Uint256Type.js").Uint256Type;
export class Uint {
    /**
     * @typedef {import('./Uint256Type.js').Uint256Type} Uint256Type
     * @typedef {import('./UintConstructor.js').UintConstructor} UintConstructor
     */
    /**
     * Factory function for creating Uint instances
     *
     * @type {UintConstructor}
     */
    constructor(value: any);
    toHex: typeof toHex;
    toBigInt: typeof toBigInt;
    toNumber: typeof toNumber;
    toBytes: typeof toBytes;
    toAbiEncoded: typeof toAbiEncoded;
    toString: typeof toString;
    plus: typeof plus;
    minus: typeof minus;
    times: typeof times;
    dividedBy: typeof dividedBy;
    modulo: typeof modulo;
    toPower: typeof toPower;
    bitwiseAnd: typeof bitwiseAnd;
    bitwiseOr: typeof bitwiseOr;
    bitwiseXor: typeof bitwiseXor;
    bitwiseNot: typeof bitwiseNot;
    shiftLeft: typeof shiftLeft;
    shiftRight: typeof shiftRight;
    equals: typeof equals;
    notEquals: typeof notEquals;
    lessThan: typeof lessThan;
    lessThanOrEqual: typeof lessThanOrEqual;
    greaterThan: typeof greaterThan;
    greaterThanOrEqual: typeof greaterThanOrEqual;
    isZero: typeof isZero;
    minimum: typeof minimum;
    maximum: typeof maximum;
    bitLength: typeof bitLength;
    leadingZeros: typeof leadingZeros;
    popCount: typeof popCount;
}
export namespace Uint {
    export function from(value: string | number | bigint): import("./Uint256Type.js").Uint256Type;
    export function fromHex(value: string): import("./Uint256Type.js").Uint256Type;
    export function fromBigInt(value: bigint): import("./Uint256Type.js").Uint256Type;
    export function fromNumber(value: number | bigint): import("./Uint256Type.js").Uint256Type;
    export function fromBytes(value: Uint8Array<ArrayBufferLike>): import("./Uint256Type.js").Uint256Type;
    export function fromAbiEncoded(value: Uint8Array<ArrayBufferLike>): import("./Uint256Type.js").Uint256Type;
    export { tryFrom };
    export { isValid };
    export { toHex };
    export { toBigInt };
    export { toNumber };
    export { toBytes };
    export { toAbiEncoded };
    export { toString };
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
    export { SIZE };
    export { MAX };
    export { MIN };
    export { ZERO };
    export { ONE };
}
export * from "./constants.js";
export * from "./Uint256Type.js";
export type Uint256Type = import("./Uint256Type.js").Uint256Type;
export type UintConstructor = import("./UintConstructor.js").UintConstructor;
import { toHex } from "./toHex.js";
import { toBigInt } from "./toBigInt.js";
import { toNumber } from "./toNumber.js";
import { toBytes } from "./toBytes.js";
import { toAbiEncoded } from "./toAbiEncoded.js";
import { toString } from "./toString.js";
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
import { tryFrom } from "./tryFrom.js";
import { isValid } from "./isValid.js";
import { SIZE } from "./constants.js";
import { MAX } from "./constants.js";
import { MIN } from "./constants.js";
import { ZERO } from "./constants.js";
import { ONE } from "./constants.js";
import { from } from "./from.js";
import { fromHex } from "./fromHex.js";
import { fromBigInt } from "./fromBigInt.js";
import { fromNumber } from "./fromNumber.js";
import { fromBytes } from "./fromBytes.js";
import { fromAbiEncoded } from "./fromAbiEncoded.js";
export { from, fromHex, fromBigInt, fromNumber, fromBytes, fromAbiEncoded, tryFrom, isValid, toHex, toBigInt, toNumber, toBytes, toAbiEncoded, toString, plus, minus, times, dividedBy, modulo, toPower, bitwiseAnd, bitwiseOr, bitwiseXor, bitwiseNot, shiftLeft, shiftRight, equals, notEquals, lessThan, lessThanOrEqual, greaterThan, greaterThanOrEqual, isZero, minimum, maximum, bitLength, leadingZeros, popCount };
//# sourceMappingURL=Uint.d.ts.map