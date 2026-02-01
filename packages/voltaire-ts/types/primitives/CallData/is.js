import { brand } from "../../brand.js";
import { MIN_SIZE } from "./constants.js";
/**
 * Type guard to check if value is CallData
 *
 * @param {unknown} value - Value to check
 * @returns {value is import('./CallDataType.js').CallDataType} True if value is CallData
 *
 * @example
 * ```javascript
 * if (CallData.is(value)) {
 *   // value is CallDataType here (type narrowed)
 *   const selector = CallData.getSelector(value);
 * }
 * ```
 */
export function is(value) {
    return (value instanceof Uint8Array &&
        /** @type {any} */ (value)[brand] === "CallData" &&
        value.length >= MIN_SIZE);
}
