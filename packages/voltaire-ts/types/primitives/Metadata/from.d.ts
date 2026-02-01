/**
 * Create Metadata from raw CBOR bytes
 *
 * @see https://voltaire.tevm.sh/primitives/metadata for Metadata documentation
 * @since 0.0.0
 * @param {Uint8Array} raw - CBOR-encoded metadata bytes
 * @returns {import('./MetadataType.js').Metadata} Metadata
 * @example
 * ```javascript
 * import * as Metadata from './primitives/Metadata/index.js';
 * const meta = Metadata.from(new Uint8Array([0xa2, 0x64, ...]));
 * ```
 */
export function from(raw: Uint8Array): import("./MetadataType.js").Metadata;
//# sourceMappingURL=from.d.ts.map