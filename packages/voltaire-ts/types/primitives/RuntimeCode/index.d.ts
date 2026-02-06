import { equals as _equals } from "./equals.js";
import { from } from "./from.js";
import { fromHex } from "./fromHex.js";
import { toHex as _toHex } from "./toHex.js";
export type * from "./RuntimeCodeType.js";
export { _equals, _toHex };
export { from, fromHex };
export declare function equals(a: import("./RuntimeCodeType.js").RuntimeCodeType | string | Uint8Array, b: import("./RuntimeCodeType.js").RuntimeCodeType | string | Uint8Array): boolean;
export declare function toHex(value: import("./RuntimeCodeType.js").RuntimeCodeType | string | Uint8Array): import("../Hex/HexType.js").HexType;
//# sourceMappingURL=index.d.ts.map