export type { NonceType } from "./NonceType.js";
import { from } from "./from.js";
import { increment as _increment } from "./increment.js";
import { toBigInt as _toBigInt } from "./toBigInt.js";
import { toNumber as _toNumber } from "./toNumber.js";
export { from };
export declare function toNumber(nonce: number | bigint | string): number;
export declare function toBigInt(nonce: number | bigint | string): bigint;
export declare function increment(nonce: number | bigint | string): import("./NonceType.js").NonceType;
export { _toNumber, _toBigInt, _increment };
export declare const Nonce: typeof from & {
    from: typeof from;
    toNumber: typeof toNumber;
    toBigInt: typeof toBigInt;
    increment: typeof increment;
};
//# sourceMappingURL=index.d.ts.map