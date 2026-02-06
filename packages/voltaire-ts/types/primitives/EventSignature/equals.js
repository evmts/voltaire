/**
 * Check if two EventSignatures are equal
 *
 * @param {import('./EventSignatureType.js').EventSignatureType} a - First signature
 * @param {import('./EventSignatureType.js').EventSignatureType} b - Second signature
 * @returns {boolean} True if equal
 * @throws {never}
 * @example
 * ```javascript
 * import * as EventSignature from './primitives/EventSignature/index.js';
 * const equal = EventSignature.equals(sig1, sig2);
 * ```
 */
export function equals(a, b) {
    return a.length === b.length && a.every((byte, index) => byte === b[index]);
}
