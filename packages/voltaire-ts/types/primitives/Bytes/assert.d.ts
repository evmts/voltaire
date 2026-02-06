/**
 * Assert that value is valid Bytes, throw if not
 *
 * @param {unknown} value - Value to check
 * @returns {import('./BytesType.js').BytesType} The validated bytes
 * @throws {InvalidBytesFormatError} If value is not valid Bytes
 *
 * @example
 * ```javascript
 * import * as Bytes from './primitives/Bytes/index.js';
 * const bytes = Bytes.assert(new Uint8Array([1, 2, 3])); // returns bytes
 * Bytes.assert("not bytes"); // throws InvalidBytesFormatError
 * ```
 */
export function assert(value: unknown): import("./BytesType.js").BytesType;
//# sourceMappingURL=assert.d.ts.map