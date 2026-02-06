/**
 * Create ErrorSignature from various input types
 *
 * @param {import('./ErrorSignatureType.js').ErrorSignatureLike} value - Input value
 * @returns {import('./ErrorSignatureType.js').ErrorSignatureType} 4-byte error signature
 * @throws {Error} If input is invalid
 * @example
 * ```javascript
 * import * as ErrorSignature from './primitives/ErrorSignature/index.js';
 * const sig = ErrorSignature.from('0xcf479181');
 * const sig2 = ErrorSignature.from(new Uint8Array([0xcf, 0x47, 0x91, 0x81]));
 * ```
 */
export function from(value: import("./ErrorSignatureType.js").ErrorSignatureLike): import("./ErrorSignatureType.js").ErrorSignatureType;
//# sourceMappingURL=from.d.ts.map