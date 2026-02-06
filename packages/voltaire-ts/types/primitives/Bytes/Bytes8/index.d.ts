export type { Bytes8Type } from "./Bytes8Type.js";
import type { Bytes8Type } from "./Bytes8Type.js";
import { clone } from "./clone.js";
import { compare } from "./compare.js";
import { equals } from "./equals.js";
import { from } from "./from.js";
import { fromHex } from "./fromHex.js";
import { size } from "./size.js";
import { toBytes } from "./toBytes.js";
import { toHex } from "./toHex.js";
export { from, fromHex, toHex, toBytes, equals, compare, size, clone };
export declare function Bytes8(value: Uint8Array | string | number[]): Bytes8Type;
export declare namespace Bytes8 {
    var from: typeof import("./from.js").from;
    var fromHex: typeof import("./fromHex.js").fromHex;
    var toHex: typeof import("./toHex.js").toHex;
    var toBytes: typeof import("./toBytes.js").toBytes;
    var equals: typeof import("./equals.js").equals;
    var compare: typeof import("./compare.js").compare;
    var size: typeof import("./size.js").size;
    var clone: typeof import("./clone.js").clone;
}
//# sourceMappingURL=index.d.ts.map