export * from "./errors.js";
export type { TokenBalanceType } from "./TokenBalanceType.js";
import { compare as _compare } from "./compare.js";
import { equals as _equals } from "./equals.js";
import { format as _format } from "./format.js";
import { from as _from } from "./from.js";
import { fromBaseUnit as _fromBaseUnit } from "./fromBaseUnit.js";
import { toBaseUnit as _toBaseUnit } from "./toBaseUnit.js";
import { toBigInt as _toBigInt } from "./toBigInt.js";
import { toHex as _toHex } from "./toHex.js";
import { toNumber as _toNumber } from "./toNumber.js";
export { _compare, _equals, _format, _from, _fromBaseUnit, _toBaseUnit, _toBigInt, _toHex, _toNumber, };
export declare const from: typeof _from;
export declare const toNumber: typeof _toNumber;
export declare const toBigInt: typeof _toBigInt;
export declare const toHex: typeof _toHex;
export declare const equals: typeof _equals;
export declare const compare: typeof _compare;
export declare const format: typeof _format;
export declare const fromBaseUnit: typeof _fromBaseUnit;
export declare const toBaseUnit: typeof _toBaseUnit;
export declare const constants: {
    MAX: bigint;
    MIN: bigint;
    DECIMALS: {
        ETH: number;
        WETH: number;
        USDC: number;
        USDT: number;
        DAI: number;
        WBTC: number;
    };
};
export declare const ERC20_SELECTORS: {
    readonly balanceOf: "0x70a08231";
    readonly transfer: "0xa9059cbb";
    readonly approve: "0x095ea7b3";
    readonly transferFrom: "0x23b872dd";
    readonly totalSupply: "0x18160ddd";
    readonly allowance: "0xdd62ed3e";
};
//# sourceMappingURL=index.d.ts.map