export type { GasLimitType } from "./GasLimitType.js";
export type { GasPriceType } from "./GasPriceType.js";
export { DEFAULT_LIMIT, ERC20_TRANSFER, SIMPLE_TRANSFER, } from "./gasLimitConstants.js";
import { gasLimitFrom } from "./gasLimitFrom.js";
import { gasLimitToBigInt as _gasLimitToBigInt } from "./gasLimitToBigInt.js";
import { gasLimitToNumber as _gasLimitToNumber } from "./gasLimitToNumber.js";
import { gasPriceFrom } from "./gasPriceFrom.js";
import { gasPriceFromGwei } from "./gasPriceFromGwei.js";
import { gasPriceToBigInt as _gasPriceToBigInt } from "./gasPriceToBigInt.js";
import { gasPriceToGwei as _gasPriceToGwei } from "./gasPriceToGwei.js";
export { gasLimitFrom };
export declare function gasLimitToBigInt(value: number | bigint | string): bigint;
export declare function gasLimitToNumber(value: number | bigint | string): number;
export { _gasLimitToBigInt, _gasLimitToNumber };
export { gasPriceFrom, gasPriceFromGwei };
export declare function gasPriceToBigInt(value: number | bigint | string): bigint;
export declare function gasPriceToGwei(value: number | bigint | string): bigint;
export { _gasPriceToBigInt, _gasPriceToGwei };
export declare const GasLimit: {
    from: typeof gasLimitFrom;
    toBigInt: typeof gasLimitToBigInt;
    toNumber: typeof gasLimitToNumber;
};
export declare const GasPrice: {
    from: typeof gasPriceFrom;
    fromGwei: typeof gasPriceFromGwei;
    toBigInt: typeof gasPriceToBigInt;
    toGwei: typeof gasPriceToGwei;
};
//# sourceMappingURL=index.d.ts.map