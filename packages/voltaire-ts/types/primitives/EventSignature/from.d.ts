/**
 * Create EventSignature from various input types
 *
 * @param {import('./EventSignatureType.js').EventSignatureLike} value - Input value
 * @returns {import('./EventSignatureType.js').EventSignatureType} 32-byte event signature
 * @throws {Error} If input is invalid
 * @example
 * ```javascript
 * import * as EventSignature from './primitives/EventSignature/index.js';
 * const sig = EventSignature.from('0xddf252ad...');
 * const sig2 = EventSignature.from(new Uint8Array(32));
 * ```
 */
export function from(value: import("./EventSignatureType.js").EventSignatureLike): import("./EventSignatureType.js").EventSignatureType;
//# sourceMappingURL=from.d.ts.map