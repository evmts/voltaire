export { ENTRYPOINT_V06, ENTRYPOINT_V07 } from "./constants.js";
export type { EntryPointType } from "./EntryPointType.js";
import type { AddressType } from "../Address/AddressType.js";
import { equals as _equals } from "./equals.js";
import { from } from "./from.js";
import { toHex as _toHex } from "./toHex.js";
export { from };
export declare function toHex(entryPoint: number | bigint | string | Uint8Array | AddressType): string;
export declare function equals(entryPoint1: number | bigint | string | Uint8Array | AddressType, entryPoint2: number | bigint | string | Uint8Array | AddressType): boolean;
export { _toHex, _equals };
export declare const EntryPoint: {
    from: typeof from;
    toHex: typeof toHex;
    equals: typeof equals;
};
//# sourceMappingURL=index.d.ts.map