import { Hex } from "../Hex/index.js";
/**
 * Create RuntimeCode from hex string
 *
 * @param {string} hex - Hex string
 * @returns {import('./RuntimeCodeType.js').RuntimeCodeType} RuntimeCode
 * @throws {Error} If hex string is invalid
 * @example
 * ```javascript
 * import * as RuntimeCode from './primitives/RuntimeCode/index.js';
 * const code = RuntimeCode.fromHex("0x6001600155");
 * ```
 */
export function fromHex(hex) {
    const bytes = Hex.toBytes(Hex.from(hex));
    return /** @type {import('./RuntimeCodeType.js').RuntimeCodeType} */ (bytes);
}
