// @ts-check
/** @import { Parameter } from "./Parameter.js" */
/** @import { ParametersToPrimitiveTypes } from "./Parameter.js" */
import { decodeValue } from "./decodeValue.js";
/**
 * @template {readonly Parameter[]} TParams
 * @param {TParams} params
 * @param {Uint8Array} data
 * @returns {ParametersToPrimitiveTypes<TParams>}
 */
export function decodeParameters(params, data) {
    /** @type {unknown[]} */
    const result = [];
    let offset = 0;
    for (const param of params) {
        const { value, newOffset } = decodeValue(param.type, data, offset, param.components);
        result.push(value);
        offset = newOffset;
    }
    return /** @type {ParametersToPrimitiveTypes<TParams>} */ (result);
}
