export * from "./errors.js";
export type { TokenIdType } from "./TokenIdType.js";
import { compare as _compare } from "./compare.js";
import { equals as _equals } from "./equals.js";
import { from as _from } from "./from.js";
import { isValid as _isValid } from "./isValid.js";
import { toBigInt as _toBigInt } from "./toBigInt.js";
import { toHex as _toHex } from "./toHex.js";
import { toNumber as _toNumber } from "./toNumber.js";
export { _compare, _equals, _from, _isValid, _toBigInt, _toHex, _toNumber };
export declare const from: typeof _from;
export declare const toNumber: typeof _toNumber;
export declare const toBigInt: typeof _toBigInt;
export declare const toHex: typeof _toHex;
export declare const equals: typeof _equals;
export declare const compare: typeof _compare;
export declare const isValid: typeof _isValid;
export declare const constants: {
    MAX: bigint;
    MIN: bigint;
};
export declare const ERC721_SELECTORS: {
    readonly balanceOf: "0x70a08231";
    readonly ownerOf: "0x6352211e";
    readonly transferFrom: "0x23b872dd";
    readonly safeTransferFrom: "0x42842e0e";
    readonly approve: "0x095ea7b3";
    readonly setApprovalForAll: "0xa22cb465";
    readonly getApproved: "0x081812fc";
    readonly isApprovedForAll: "0xe985e9c5";
};
//# sourceMappingURL=index.d.ts.map