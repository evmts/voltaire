/**
 * Extract metadata from contract bytecode
 *
 * Solidity appends CBOR metadata at the end: bytecode + metadata + 0x00 + length
 *
 * @param {Uint8Array} bytecode - Contract bytecode with metadata
 * @returns {import('./MetadataType.js').Metadata | null} Metadata or null if not found
 * @example
 * ```javascript
 * import * as Metadata from './primitives/Metadata/index.js';
 * const bytecode = new Uint8Array([...code, 0xa2, 0x64, ...metadata, 0x00, 0x33]);
 * const meta = Metadata.fromBytecode(bytecode);
 * ```
 */
export function fromBytecode(bytecode: Uint8Array): import("./MetadataType.js").Metadata | null;
//# sourceMappingURL=fromBytecode.d.ts.map