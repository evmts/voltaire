/**
 * @param {Uint8Array} data
 * @param {number} offset
 * @returns {bigint}
 */
export function decodeUint256(data: Uint8Array, offset: number): bigint;
/**
 * @param {Parameter["type"]} type
 * @param {Uint8Array} data
 * @param {number} offset
 * @param {readonly Parameter[]=} components
 * @returns {{ value: unknown; newOffset: number }}
 */
export function decodeValue(type: Parameter["type"], data: Uint8Array, offset: number, components?: readonly Parameter[] | undefined): {
    value: unknown;
    newOffset: number;
};
import type { Parameter } from "./Parameter.js";
//# sourceMappingURL=decodeValue.d.ts.map