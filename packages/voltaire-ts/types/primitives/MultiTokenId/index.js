export * from "./errors.js";
import { compare as _compare } from "./compare.js";
import { FUNGIBLE_THRESHOLD, MAX, MIN } from "./constants.js";
import { equals as _equals } from "./equals.js";
import { from as _from } from "./from.js";
import { isValidFungible as _isValidFungible } from "./isValidFungible.js";
import { isValidNonFungible as _isValidNonFungible } from "./isValidNonFungible.js";
import { toBigInt as _toBigInt } from "./toBigInt.js";
import { toHex as _toHex } from "./toHex.js";
import { toNumber as _toNumber } from "./toNumber.js";
// Re-export internal methods with underscore prefix
export { _compare, _equals, _from, _isValidFungible, _isValidNonFungible, _toBigInt, _toHex, _toNumber, };
// Public API wrappers (no conversion needed for branded bigint)
export const from = _from;
export const toNumber = _toNumber;
export const toBigInt = _toBigInt;
export const toHex = _toHex;
export const equals = _equals;
export const compare = _compare;
export const isValidFungible = _isValidFungible;
export const isValidNonFungible = _isValidNonFungible;
// Constants
export const constants = {
    MAX,
    MIN,
    FUNGIBLE_THRESHOLD,
};
// ERC-1155 interface selectors
export const ERC1155_SELECTORS = {
    balanceOf: "0x00fdd58e", // balanceOf(address,uint256)
    balanceOfBatch: "0x4e1273f4", // balanceOfBatch(address[],uint256[])
    safeTransferFrom: "0xf242432a", // safeTransferFrom(address,address,uint256,uint256,bytes)
    safeBatchTransferFrom: "0x2eb2c2d6", // safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)
    setApprovalForAll: "0xa22cb465", // setApprovalForAll(address,bool)
    isApprovedForAll: "0xe985e9c5", // isApprovedForAll(address,address)
    uri: "0x0e89341c", // uri(uint256)
};
