// Export GasLimit constants
export { DEFAULT_LIMIT, ERC20_TRANSFER, SIMPLE_TRANSFER, } from "./gasLimitConstants.js";
// Import GasLimit functions
import { gasLimitFrom } from "./gasLimitFrom.js";
import { gasLimitToBigInt as _gasLimitToBigInt } from "./gasLimitToBigInt.js";
import { gasLimitToNumber as _gasLimitToNumber } from "./gasLimitToNumber.js";
// Import GasPrice functions
import { gasPriceFrom } from "./gasPriceFrom.js";
import { gasPriceFromGwei } from "./gasPriceFromGwei.js";
import { gasPriceToBigInt as _gasPriceToBigInt } from "./gasPriceToBigInt.js";
import { gasPriceToGwei as _gasPriceToGwei } from "./gasPriceToGwei.js";
// Export GasLimit constructors
export { gasLimitFrom };
// Export GasLimit public wrapper functions
export function gasLimitToBigInt(value) {
    return _gasLimitToBigInt.call(gasLimitFrom(value));
}
export function gasLimitToNumber(value) {
    return _gasLimitToNumber.call(gasLimitFrom(value));
}
// Export GasLimit internal functions (tree-shakeable)
export { _gasLimitToBigInt, _gasLimitToNumber };
// Export GasPrice constructors
export { gasPriceFrom, gasPriceFromGwei };
// Export GasPrice public wrapper functions
export function gasPriceToBigInt(value) {
    return _gasPriceToBigInt.call(gasPriceFrom(value));
}
export function gasPriceToGwei(value) {
    return _gasPriceToGwei.call(gasPriceFrom(value));
}
// Export GasPrice internal functions (tree-shakeable)
export { _gasPriceToBigInt, _gasPriceToGwei };
// Export as namespace (convenience)
export const GasLimit = {
    from: gasLimitFrom,
    toBigInt: gasLimitToBigInt,
    toNumber: gasLimitToNumber,
};
export const GasPrice = {
    from: gasPriceFrom,
    fromGwei: gasPriceFromGwei,
    toBigInt: gasPriceToBigInt,
    toGwei: gasPriceToGwei,
};
