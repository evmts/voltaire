/**
 * Strip CBOR metadata from contract code
 *
 * Returns runtime code without the Solidity compiler metadata.
 *
 * @param {import('./ContractCodeType.js').ContractCodeType} code - ContractCode with metadata
 * @returns {import('../RuntimeCode/RuntimeCodeType.js').RuntimeCodeType} RuntimeCode without metadata
 * @example
 * ```javascript
 * import * as ContractCode from './primitives/ContractCode/index.js';
 * const withMeta = ContractCode.from("0x6001600155a264...0033");
 * const runtime = ContractCode._stripMetadata(withMeta);
 * ```
 */
export function stripMetadata(code: import("./ContractCodeType.js").ContractCodeType): import("../RuntimeCode/RuntimeCodeType.js").RuntimeCodeType;
//# sourceMappingURL=stripMetadata.d.ts.map