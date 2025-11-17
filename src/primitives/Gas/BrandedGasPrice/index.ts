// Backward compatibility - re-export from parent directory
export type { GasPriceType as BrandedGasPrice } from "../GasPriceType.js";

import { gasPriceFrom as from } from "../gasPriceFrom.js";
import { gasPriceFromGwei as fromGwei } from "../gasPriceFromGwei.js";
import { gasPriceToBigInt as _toBigInt } from "../gasPriceToBigInt.js";
import { gasPriceToGwei as _toGwei } from "../gasPriceToGwei.js";

export { from, fromGwei };

export function toBigInt(value: number | bigint | string): bigint {
	return _toBigInt.call(from(value));
}

export function toGwei(value: number | bigint | string): bigint {
	return _toGwei.call(from(value));
}

export { _toBigInt, _toGwei };

export const GasPrice = {
	from,
	fromGwei,
	toBigInt,
	toGwei,
};
