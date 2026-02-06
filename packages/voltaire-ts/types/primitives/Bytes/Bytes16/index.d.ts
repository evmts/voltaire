export type { Bytes16Like, Bytes16Type } from "./Bytes16Type.js";
import type { Bytes16Like, Bytes16Type } from "./Bytes16Type.js";
export { SIZE } from "./Bytes16Type.js";
export { ZERO } from "./constants.js";
import { clone } from "./clone.js";
import { compare } from "./compare.js";
import { equals } from "./equals.js";
import { from } from "./from.js";
import { fromBytes } from "./fromBytes.js";
import { fromHex } from "./fromHex.js";
import { isZero } from "./isZero.js";
import { size } from "./size.js";
import { toHex } from "./toHex.js";
import { toUint8Array } from "./toUint8Array.js";
import { zero } from "./zero.js";
export { from, fromBytes, fromHex, toHex, toUint8Array, equals, compare, clone, size, zero, isZero, };
export declare function Bytes16(value: Bytes16Like): Bytes16Type;
export declare namespace Bytes16 {
    var from: typeof import("./from.js").from;
    var fromBytes: typeof import("./fromBytes.js").fromBytes;
    var fromHex: typeof import("./fromHex.js").fromHex;
    var zero: typeof import("./zero.js").zero;
    var random: () => Bytes16Type;
    var toHex: typeof import("./toHex.js").toHex;
    var toUint8Array: typeof import("./toUint8Array.js").toUint8Array;
    var equals: typeof import("./equals.js").equals;
    var compare: typeof import("./compare.js").compare;
    var clone: typeof import("./clone.js").clone;
    var size: typeof import("./size.js").size;
    var isZero: typeof import("./isZero.js").isZero;
    var SIZE: number;
    var ZERO: Bytes16Type;
}
//# sourceMappingURL=index.d.ts.map