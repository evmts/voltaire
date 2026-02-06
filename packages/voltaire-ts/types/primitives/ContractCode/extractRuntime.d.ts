/**
 * Extract runtime code from contract code
 *
 * Strips metadata to return pure runtime bytecode.
 * Alias for stripMetadata for semantic clarity.
 *
 * @param {import('./ContractCodeType.js').ContractCodeType} code - ContractCode
 * @returns {import('../RuntimeCode/RuntimeCodeType.js').RuntimeCodeType} RuntimeCode
 * @example
 * ```javascript
 * import * as ContractCode from './primitives/ContractCode/index.js';
 * const contract = ContractCode.from("0x6001600155a264...0033");
 * const runtime = ContractCode._extractRuntime(contract);
 * ```
 */
export function extractRuntime(code: import("./ContractCodeType.js").ContractCodeType): import("../RuntimeCode/RuntimeCodeType.js").RuntimeCodeType;
//# sourceMappingURL=extractRuntime.d.ts.map