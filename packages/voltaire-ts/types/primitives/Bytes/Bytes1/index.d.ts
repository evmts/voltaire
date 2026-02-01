export type { Bytes1Type } from "./Bytes1Type.js";
import type { Bytes1Type } from "./Bytes1Type.js";
import { clone } from "./clone.js";
import { compare } from "./compare.js";
import { equals } from "./equals.js";
import { from } from "./from.js";
import { fromHex } from "./fromHex.js";
import { fromNumber } from "./fromNumber.js";
import { size } from "./size.js";
import { toBytes } from "./toBytes.js";
import { toHex } from "./toHex.js";
import { toNumber } from "./toNumber.js";
export { from, fromHex, fromNumber, toHex, toNumber, toBytes, equals, compare, size, clone, };
export declare function Bytes1(value: Uint8Array | string | number[]): Bytes1Type;
export declare namespace Bytes1 {
    var from: typeof import("./from.js").from;
    var fromHex: typeof import("./fromHex.js").fromHex;
    var fromNumber: typeof import("./fromNumber.js").fromNumber;
    var toHex: typeof import("./toHex.js").toHex;
    var toNumber: typeof import("./toNumber.js").toNumber;
    var toBytes: typeof import("./toBytes.js").toBytes;
    var equals: typeof import("./equals.js").equals;
    var compare: typeof import("./compare.js").compare;
    var size: typeof import("./size.js").size;
    var clone: typeof import("./clone.js").clone;
}
//# sourceMappingURL=index.d.ts.map