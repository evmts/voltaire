export type { GasEstimateType } from "./GasEstimateType.js";
import { compare as _compare } from "./compare.js";
import { equals as _equals } from "./equals.js";
import { from } from "./from.js";
import { toBigInt as _toBigInt } from "./toBigInt.js";
import { toGasLimit as _toGasLimit } from "./toGasLimit.js";
import { toHex as _toHex } from "./toHex.js";
import { toNumber as _toNumber } from "./toNumber.js";
import { withBuffer as _withBuffer } from "./withBuffer.js";
export { from };
export declare function toNumber(value: number | bigint | string): number;
export declare function toBigInt(value: number | bigint | string): bigint;
export declare function toHex(value: number | bigint | string): string;
export declare function equals(value1: number | bigint | string, value2: number | bigint | string): boolean;
export declare function compare(value1: number | bigint | string, value2: number | bigint | string): number;
export declare function withBuffer(estimate: number | bigint | string, percentageBuffer: number): import("./GasEstimateType.js").GasEstimateType;
export declare function toGasLimit(estimate: number | bigint | string): bigint;
export { _toNumber, _toBigInt, _toHex, _equals, _compare, _withBuffer, _toGasLimit, };
export declare const GasEstimate: {
    from: typeof from;
    toNumber: typeof toNumber;
    toBigInt: typeof toBigInt;
    toHex: typeof toHex;
    equals: typeof equals;
    compare: typeof compare;
    withBuffer: typeof withBuffer;
    toGasLimit: typeof toGasLimit;
};
//# sourceMappingURL=index.d.ts.map