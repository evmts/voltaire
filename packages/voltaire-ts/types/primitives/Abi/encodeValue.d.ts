/**
 * @param {bigint} value
 * @returns {Uint8Array}
 */
export function encodeUint256(value: bigint): Uint8Array;
/**
 * @param {Parameter["type"]} type
 * @param {unknown} value
 * @param {readonly Parameter[]=} components
 * @returns {{ encoded: Uint8Array; isDynamic: boolean }}
 */
export function encodeValue(type: Parameter["type"], value: unknown, components?: readonly Parameter[] | undefined): {
    encoded: Uint8Array;
    isDynamic: boolean;
};
import type { Parameter } from "./Parameter.js";
//# sourceMappingURL=encodeValue.d.ts.map