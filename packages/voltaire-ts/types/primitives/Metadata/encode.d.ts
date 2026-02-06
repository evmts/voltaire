/**
 * Encode metadata to CBOR format
 *
 * Creates CBOR-encoded metadata following Solidity format.
 *
 * @param {import('./MetadataType.js').Metadata} metadata - Metadata to encode
 * @returns {Uint8Array} CBOR-encoded bytes
 * @example
 * ```javascript
 * import * as Metadata from './primitives/Metadata/index.js';
 * const meta = {
 *   raw: new Uint8Array(),
 *   solc: "0.8.19",
 *   ipfs: "0x1234...",
 * };
 * const encoded = Metadata.encode(meta);
 * ```
 */
export function encode(metadata: import("./MetadataType.js").Metadata): Uint8Array;
//# sourceMappingURL=encode.d.ts.map