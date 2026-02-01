import { equals as _equals } from "./equals.js";
import { extractRuntime as _extractRuntime } from "./extractRuntime.js";
import { from } from "./from.js";
import { fromHex } from "./fromHex.js";
import { hasMetadata as _hasMetadata } from "./hasMetadata.js";
import { stripMetadata as _stripMetadata } from "./stripMetadata.js";
import { toHex as _toHex } from "./toHex.js";
export type * from "./ContractCodeType.js";
export { _equals, _extractRuntime, _hasMetadata, _stripMetadata, _toHex };
export { from, fromHex };
export declare function equals(a: import("./ContractCodeType.js").ContractCodeType | string | Uint8Array, b: import("./ContractCodeType.js").ContractCodeType | string | Uint8Array): boolean;
export declare function toHex(value: import("./ContractCodeType.js").ContractCodeType | string | Uint8Array): import("../Hex/HexType.js").HexType;
export declare function hasMetadata(value: import("./ContractCodeType.js").ContractCodeType | string | Uint8Array): boolean;
export declare function stripMetadata(value: import("./ContractCodeType.js").ContractCodeType | string | Uint8Array): import("../RuntimeCode/RuntimeCodeType.js").RuntimeCodeType;
export declare function extractRuntime(value: import("./ContractCodeType.js").ContractCodeType | string | Uint8Array): import("../RuntimeCode/RuntimeCodeType.js").RuntimeCodeType;
//# sourceMappingURL=index.d.ts.map