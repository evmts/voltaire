export type { GasRefundType } from "./GasRefundType.js";
import { cappedRefund as _cappedRefund } from "./cappedRefund.js";
import { equals as _equals } from "./equals.js";
import { from } from "./from.js";
import { toBigInt as _toBigInt } from "./toBigInt.js";
import { toHex as _toHex } from "./toHex.js";
import { toNumber as _toNumber } from "./toNumber.js";
export { from };
export declare function toNumber(value: number | bigint | string): number;
export declare function toBigInt(value: number | bigint | string): bigint;
export declare function toHex(value: number | bigint | string): string;
export declare function equals(value1: number | bigint | string, value2: number | bigint | string): boolean;
export declare function cappedRefund(refund: number | bigint | string, gasUsed: bigint): import("./GasRefundType.js").GasRefundType;
export { _toNumber, _toBigInt, _toHex, _equals, _cappedRefund };
export declare const GasRefund: {
    from: typeof from;
    toNumber: typeof toNumber;
    toBigInt: typeof toBigInt;
    toHex: typeof toHex;
    equals: typeof equals;
    cappedRefund: typeof cappedRefund;
};
//# sourceMappingURL=index.d.ts.map