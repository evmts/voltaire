/**
 * Create Bytes1 from number (0-255)
 *
 * @param {number} value - Number value (0-255)
 * @returns {import('./Bytes1Type.js').Bytes1Type} Bytes1
 * @throws {RangeError} If value is out of range
 *
 * @example
 * ```typescript
 * const bytes = Bytes1.fromNumber(42);
 * ```
 */
export function fromNumber(value) {
    if (value < 0 || value > 255) {
        throw new RangeError(`Bytes1 value must be 0-255, got ${value}`);
    }
    const bytes = new Uint8Array([value]);
    return /** @type {import('./Bytes1Type.js').Bytes1Type} */ (bytes);
}
