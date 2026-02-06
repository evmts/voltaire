import { fromHex } from "./fromHex.js";
/**
 * Create ContractCode from various input types
 *
 * @see https://voltaire.tevm.sh/primitives/contract-code for ContractCode documentation
 * @since 0.0.0
 * @param {string | Uint8Array} value - Hex string or Uint8Array
 * @returns {import('./ContractCodeType.js').ContractCodeType} ContractCode
 * @throws {never}
 * @example
 * ```javascript
 * import * as ContractCode from './primitives/ContractCode/index.js';
 * const code1 = ContractCode.from("0x6001600155");
 * const code2 = ContractCode.from(new Uint8Array([0x60, 0x01, 0x60, 0x01, 0x55]));
 * ```
 */
export function from(value) {
    if (typeof value === "string") {
        return fromHex(value);
    }
    return /** @type {import('./ContractCodeType.js').ContractCodeType} */ (value);
}
