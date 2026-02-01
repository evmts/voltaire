/**
 * Decode CBOR-encoded metadata
 *
 * Parses Solidity metadata format to extract compiler version and content hashes.
 *
 * @param {Uint8Array} raw - CBOR-encoded metadata
 * @returns {import('./MetadataType.js').Metadata} Metadata
 * @example
 * ```javascript
 * import * as Metadata from './primitives/Metadata/index.js';
 * const raw = new Uint8Array([0xa2, 0x64, ...]);
 * const meta = Metadata.decode(raw);
 * console.log(meta.solc); // "0.8.19"
 * ```
 */
export function decode(raw: Uint8Array): import("./MetadataType.js").Metadata;
//# sourceMappingURL=decode.d.ts.map