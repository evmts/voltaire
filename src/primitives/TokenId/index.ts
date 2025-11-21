export type { TokenIdType } from "./TokenIdType.js";
export * from "./errors.js";

import type { TokenIdType } from "./TokenIdType.js";
import { compare as _compare } from "./compare.js";
import { MAX, MIN } from "./constants.js";
import { equals as _equals } from "./equals.js";
import { from as _from } from "./from.js";
import { isValid as _isValid } from "./isValid.js";
import { toBigInt as _toBigInt } from "./toBigInt.js";
import { toHex as _toHex } from "./toHex.js";
import { toNumber as _toNumber } from "./toNumber.js";

// Re-export internal methods with underscore prefix
export { _compare, _equals, _from, _isValid, _toBigInt, _toHex, _toNumber };

// Public API wrappers (no conversion needed for branded bigint)
export const from = _from;
export const toNumber = _toNumber;
export const toBigInt = _toBigInt;
export const toHex = _toHex;
export const equals = _equals;
export const compare = _compare;
export const isValid = _isValid;

// Constants
export const constants = {
	MAX,
	MIN,
};

// ERC-721 interface selectors
export const ERC721_SELECTORS = {
	balanceOf: "0x70a08231", // balanceOf(address)
	ownerOf: "0x6352211e", // ownerOf(uint256)
	transferFrom: "0x23b872dd", // transferFrom(address,address,uint256)
	safeTransferFrom: "0x42842e0e", // safeTransferFrom(address,address,uint256)
	approve: "0x095ea7b3", // approve(address,uint256)
	setApprovalForAll: "0xa22cb465", // setApprovalForAll(address,bool)
	getApproved: "0x081812fc", // getApproved(uint256)
	isApprovedForAll: "0xe985e9c5", // isApprovedForAll(address,address)
} as const;
