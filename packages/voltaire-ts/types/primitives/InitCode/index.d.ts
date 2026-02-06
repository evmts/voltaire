import { equals as _equals } from "./equals.js";
import { estimateGas as _estimateGas } from "./estimateGas.js";
import { extractRuntime as _extractRuntime } from "./extractRuntime.js";
import { from } from "./from.js";
import { fromHex } from "./fromHex.js";
import { toHex as _toHex } from "./toHex.js";
export type * from "./InitCodeType.js";
export { _equals, _estimateGas, _extractRuntime, _toHex };
export { from, fromHex };
export declare function equals(a: import("./InitCodeType.js").InitCodeType | string | Uint8Array, b: import("./InitCodeType.js").InitCodeType | string | Uint8Array): boolean;
export declare function toHex(value: import("./InitCodeType.js").InitCodeType | string | Uint8Array): import("../Hex/HexType.js").HexType;
export declare function extractRuntime(value: import("./InitCodeType.js").InitCodeType | string | Uint8Array, offset: number): import("../RuntimeCode/RuntimeCodeType.js").RuntimeCodeType;
export declare function estimateGas(value: import("./InitCodeType.js").InitCodeType | string | Uint8Array): bigint;
//# sourceMappingURL=index.d.ts.map