// Backward compatibility - re-export from parent directory
export type { GasLimitType as BrandedGasLimit } from "../GasLimitType.js";

export {
	SIMPLE_TRANSFER,
	ERC20_TRANSFER,
	DEFAULT_LIMIT,
} from "../gasLimitConstants.js";

import { gasLimitFrom as from } from "../gasLimitFrom.js";
import { gasLimitToBigInt as _toBigInt } from "../gasLimitToBigInt.js";
import { gasLimitToNumber as _toNumber } from "../gasLimitToNumber.js";

export { from };

export function toBigInt(value: number | bigint | string): bigint {
	return _toBigInt.call(from(value));
}

export function toNumber(value: number | bigint | string): number {
	return _toNumber.call(from(value));
}

export { _toBigInt, _toNumber };

export const GasLimit = {
	from,
	toBigInt,
	toNumber,
};
