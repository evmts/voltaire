/**
 * @typedef {import('./Uint256Type.js').Uint256Type} Uint256Type
 * @typedef {import('./UintConstructor.js').UintConstructor} UintConstructor
 */
/**
 * Factory function for creating Uint instances
 *
 * @param {bigint | number | string} value
 * @returns {Uint256Type}
 */
export function Uint(value: bigint | number | string): Uint256Type;
export class Uint {
    /**
     * @typedef {import('./Uint256Type.js').Uint256Type} Uint256Type
     * @typedef {import('./UintConstructor.js').UintConstructor} UintConstructor
     */
    /**
     * Factory function for creating Uint instances
     *
     * @param {bigint | number | string} value
     * @returns {Uint256Type}
     */
    constructor(value: bigint | number | string);
    toHex: (thisArg: any, ...argArray: any[]) => any;
    toBigInt: (thisArg: any, ...argArray: any[]) => any;
    toNumber: (thisArg: any, ...argArray: any[]) => any;
    toBytes: (thisArg: any, ...argArray: any[]) => any;
    toAbiEncoded: (thisArg: any, ...argArray: any[]) => any;
    toString: (thisArg: any, ...argArray: any[]) => any;
    plus: (thisArg: any, ...argArray: any[]) => any;
    minus: (thisArg: any, ...argArray: any[]) => any;
    times: (thisArg: any, ...argArray: any[]) => any;
    plusChecked: (thisArg: any, ...argArray: any[]) => any;
    minusChecked: (thisArg: any, ...argArray: any[]) => any;
    timesChecked: (thisArg: any, ...argArray: any[]) => any;
    plusWrapping: (thisArg: any, ...argArray: any[]) => any;
    minusWrapping: (thisArg: any, ...argArray: any[]) => any;
    timesWrapping: (thisArg: any, ...argArray: any[]) => any;
    dividedBy: (thisArg: any, ...argArray: any[]) => any;
    modulo: (thisArg: any, ...argArray: any[]) => any;
    toPower: (thisArg: any, ...argArray: any[]) => any;
    bitwiseAnd: (thisArg: any, ...argArray: any[]) => any;
    bitwiseOr: (thisArg: any, ...argArray: any[]) => any;
    bitwiseXor: (thisArg: any, ...argArray: any[]) => any;
    bitwiseNot: (thisArg: any, ...argArray: any[]) => any;
    shiftLeft: (thisArg: any, ...argArray: any[]) => any;
    shiftRight: (thisArg: any, ...argArray: any[]) => any;
    equals: (thisArg: any, ...argArray: any[]) => any;
    notEquals: (thisArg: any, ...argArray: any[]) => any;
    lessThan: (thisArg: any, ...argArray: any[]) => any;
    lessThanOrEqual: (thisArg: any, ...argArray: any[]) => any;
    greaterThan: (thisArg: any, ...argArray: any[]) => any;
    greaterThanOrEqual: (thisArg: any, ...argArray: any[]) => any;
    isZero: (thisArg: any, ...argArray: any[]) => any;
    minimum: (thisArg: any, ...argArray: any[]) => any;
    maximum: (thisArg: any, ...argArray: any[]) => any;
    bitLength: (thisArg: any, ...argArray: any[]) => any;
    leadingZeros: (thisArg: any, ...argArray: any[]) => any;
    popCount: (thisArg: any, ...argArray: any[]) => any;
}
export namespace Uint {
    /** @param {bigint | number | string} value */
    export function from(value: bigint | number | string): import("./Uint256Type.js").Uint256Type;
    /** @param {string} value */
    export function fromHex(value: string): import("./Uint256Type.js").Uint256Type;
    /** @param {bigint} value */
    export function fromBigInt(value: bigint): import("./Uint256Type.js").Uint256Type;
    /** @param {number} value */
    export function fromNumber(value: number): import("./Uint256Type.js").Uint256Type;
    /** @param {Uint8Array} value */
    export function fromBytes(value: Uint8Array): import("./Uint256Type.js").Uint256Type;
    /** @param {Uint8Array} value */
    export function fromAbiEncoded(value: Uint8Array): import("./Uint256Type.js").Uint256Type;
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
    export { plusChecked };
    export { minusChecked };
    export { timesChecked };
    export { plusWrapping };
    export { minusWrapping };
    export { timesWrapping };
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
import { tryFrom } from "./tryFrom.js";
import { isValid } from "./isValid.js";
import { toHex } from "./toHex.js";
import { toBigInt } from "./toBigInt.js";
import { toNumber } from "./toNumber.js";
import { toBytes } from "./toBytes.js";
import { toAbiEncoded } from "./toAbiEncoded.js";
import { toString } from "./toString.js";
import { plus } from "./plus.js";
import { minus } from "./minus.js";
import { times } from "./times.js";
import { plusChecked } from "./plusChecked.js";
import { minusChecked } from "./minusChecked.js";
import { timesChecked } from "./timesChecked.js";
import { plusWrapping } from "./plusWrapping.js";
import { minusWrapping } from "./minusWrapping.js";
import { timesWrapping } from "./timesWrapping.js";
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
import { SIZE } from "./constants.js";
import { MAX } from "./constants.js";
import { MIN } from "./constants.js";
import { ZERO } from "./constants.js";
import { ONE } from "./constants.js";
import { from } from "./from.js";
import { fromAbiEncoded } from "./fromAbiEncoded.js";
import { fromBigInt } from "./fromBigInt.js";
import { fromBytes } from "./fromBytes.js";
import { fromHex } from "./fromHex.js";
import { fromNumber } from "./fromNumber.js";
export { bitLength, bitwiseAnd, bitwiseNot, bitwiseOr, bitwiseXor, dividedBy, equals, from, fromAbiEncoded, fromBigInt, fromBytes, fromHex, fromNumber, greaterThan, greaterThanOrEqual, isValid, isZero, leadingZeros, lessThan, lessThanOrEqual, maximum, minimum, minus, minusChecked, minusWrapping, modulo, notEquals, plus, plusChecked, plusWrapping, popCount, shiftLeft, shiftRight, times, timesChecked, timesWrapping, toAbiEncoded, toBigInt, toBytes, toHex, toNumber, toPower, toString, tryFrom };
//# sourceMappingURL=Uint.d.ts.map