/**
 * Check if contract code contains CBOR metadata
 *
 * Solidity compiler includes CBOR-encoded metadata at the end of deployed bytecode.
 * The metadata section starts with 0xa2 (CBOR map) and ends with 0x00 0x33 (length).
 *
 * @param {import('./ContractCodeType.js').ContractCodeType} code - ContractCode to check
 * @returns {boolean} true if metadata is present
 * @example
 * ```javascript
 * import * as ContractCode from './primitives/ContractCode/index.js';
 * const code = ContractCode.from("0x6001600155a264...0033");
 * ContractCode._hasMetadata(code); // true
 * ```
 */
export function hasMetadata(code: import("./ContractCodeType.js").ContractCodeType): boolean;
//# sourceMappingURL=hasMetadata.d.ts.map