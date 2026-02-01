/**
 * Extract runtime code from init code at specified offset
 *
 * Init code contains constructor logic followed by runtime code.
 * This extracts the runtime portion starting at the given offset.
 *
 * @param {import('./InitCodeType.js').InitCodeType} code - InitCode
 * @param {number} offset - Byte offset where runtime code starts
 * @returns {import('../RuntimeCode/RuntimeCodeType.js').RuntimeCodeType} RuntimeCode
 * @example
 * ```javascript
 * import * as InitCode from './primitives/InitCode/index.js';
 * const init = InitCode.from("0x608060405234801561001057600080fd5b50...");
 * // Assume constructor is 100 bytes
 * const runtime = InitCode._extractRuntime(init, 100);
 * ```
 */
export function extractRuntime(code, offset) {
	return /** @type {import('../RuntimeCode/RuntimeCodeType.js').RuntimeCodeType} */ (
		code.slice(offset)
	);
}
