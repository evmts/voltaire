/**
 * Check if bytecode contains CBOR metadata
 *
 * Solidity compiler includes CBOR-encoded metadata at the end of bytecode.
 *
 * @param {import('./BytecodeType.js').BrandedBytecode} code - Bytecode to check
 * @returns {boolean} true if metadata is present
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([...bytecode, 0xa2, 0x64, ...metadata]);
 * Bytecode.hasMetadata(code); // true
 * ```
 */
export function hasMetadata(code: import("./BytecodeType.js").BrandedBytecode): boolean;
//# sourceMappingURL=hasMetadata.d.ts.map