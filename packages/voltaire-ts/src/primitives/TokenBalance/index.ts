export * from "./errors.js";
export type { TokenBalanceType } from "./TokenBalanceType.js";

import { compare as _compare } from "./compare.js";
import { DECIMALS, MAX, MIN } from "./constants.js";
import { equals as _equals } from "./equals.js";
import { format as _format } from "./format.js";
import { from as _from } from "./from.js";
import { fromBaseUnit as _fromBaseUnit } from "./fromBaseUnit.js";
import { toBaseUnit as _toBaseUnit } from "./toBaseUnit.js";
import { toBigInt as _toBigInt } from "./toBigInt.js";
import { toHex as _toHex } from "./toHex.js";
import { toNumber as _toNumber } from "./toNumber.js";

// Re-export internal methods with underscore prefix
export {
	_compare,
	_equals,
	_format,
	_from,
	_fromBaseUnit,
	_toBaseUnit,
	_toBigInt,
	_toHex,
	_toNumber,
};

// Public API wrappers (no conversion needed for branded bigint)
export const from = _from;
export const toNumber = _toNumber;
export const toBigInt = _toBigInt;
export const toHex = _toHex;
export const equals = _equals;
export const compare = _compare;
export const format = _format;
export const fromBaseUnit = _fromBaseUnit;
export const toBaseUnit = _toBaseUnit;

// Constants
export const constants = {
	MAX,
	MIN,
	DECIMALS,
};

// ERC-20 interface selectors
export const ERC20_SELECTORS = {
	balanceOf: "0x70a08231", // balanceOf(address)
	transfer: "0xa9059cbb", // transfer(address,uint256)
	approve: "0x095ea7b3", // approve(address,uint256)
	transferFrom: "0x23b872dd", // transferFrom(address,address,uint256)
	totalSupply: "0x18160ddd", // totalSupply()
	allowance: "0xdd62ed3e", // allowance(address,address)
} as const;
