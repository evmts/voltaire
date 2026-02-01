export * from "./errors.js";
export type { MultiTokenIdType } from "./MultiTokenIdType.js";
import { compare as _compare } from "./compare.js";
import { equals as _equals } from "./equals.js";
import { from as _from } from "./from.js";
import { isValidFungible as _isValidFungible } from "./isValidFungible.js";
import { isValidNonFungible as _isValidNonFungible } from "./isValidNonFungible.js";
import { toBigInt as _toBigInt } from "./toBigInt.js";
import { toHex as _toHex } from "./toHex.js";
import { toNumber as _toNumber } from "./toNumber.js";
export { _compare, _equals, _from, _isValidFungible, _isValidNonFungible, _toBigInt, _toHex, _toNumber, };
export declare const from: typeof _from;
export declare const toNumber: typeof _toNumber;
export declare const toBigInt: typeof _toBigInt;
export declare const toHex: typeof _toHex;
export declare const equals: typeof _equals;
export declare const compare: typeof _compare;
export declare const isValidFungible: typeof _isValidFungible;
export declare const isValidNonFungible: typeof _isValidNonFungible;
export declare const constants: {
    MAX: bigint;
    MIN: bigint;
    FUNGIBLE_THRESHOLD: bigint;
};
export declare const ERC1155_SELECTORS: {
    readonly balanceOf: "0x00fdd58e";
    readonly balanceOfBatch: "0x4e1273f4";
    readonly safeTransferFrom: "0xf242432a";
    readonly safeBatchTransferFrom: "0x2eb2c2d6";
    readonly setApprovalForAll: "0xa22cb465";
    readonly isApprovedForAll: "0xe985e9c5";
    readonly uri: "0x0e89341c";
};
//# sourceMappingURL=index.d.ts.map