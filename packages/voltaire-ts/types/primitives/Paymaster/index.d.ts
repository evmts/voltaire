export type { PaymasterType } from "./PaymasterType.js";
import type { AddressType } from "../Address/AddressType.js";
import { equals as _equals } from "./equals.js";
import { from } from "./from.js";
import { toHex as _toHex } from "./toHex.js";
export { from };
export declare function toHex(paymaster: number | bigint | string | Uint8Array | AddressType): string;
export declare function equals(paymaster1: number | bigint | string | Uint8Array | AddressType, paymaster2: number | bigint | string | Uint8Array | AddressType): boolean;
export { _toHex, _equals };
export declare const Paymaster: {
    from: typeof from;
    toHex: typeof toHex;
    equals: typeof equals;
};
//# sourceMappingURL=index.d.ts.map