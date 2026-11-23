/**
 * @param {Uint8Array} data
 * @param {number} offset
 * @returns {bigint}
 */
export function decodeUint256(data: Uint8Array, offset: number): bigint;
/**
 * Create the budget for decoding `data`.
 *
 * `remainingBytes` equals the payload length: a canonical encoding stores
 * every `bytes`, `string` and `bytesN` value in its own payload bytes, so the
 * copies made while decoding never exceed the payload. Aliased tails that
 * would copy more than the payload holds are rejected.
 *
 * @param {Uint8Array} data - Whole payload being decoded
 * @returns {DecodeBudget}
 */
export function createDecodeBudget(data: Uint8Array): DecodeBudget;
/**
 * @param {Parameter["type"]} type
 * @param {Uint8Array} data
 * @param {number} offset
 * @param {readonly Parameter[]=} components
 * @param {DecodeBudget} [budget] - Shared budget; defaults to a fresh budget for `data`
 * @returns {{ value: unknown; newOffset: number }}
 */
export function decodeValue(type: Parameter["type"], data: Uint8Array, offset: number, components?: readonly Parameter[] | undefined, budget?: DecodeBudget): {
    value: unknown;
    newOffset: number;
};
/**
 * Work allowance for one decode call, shared by every top-level parameter
 * and every nested value. Mutated as values are produced.
 */
export type DecodeBudget = {
    remainingElements: number;
    remainingBytes: number;
};
import type { Parameter } from "./Parameter.js";
//# sourceMappingURL=decodeValue.d.ts.map