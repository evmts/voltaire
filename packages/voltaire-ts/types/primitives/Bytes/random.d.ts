/**
 * Generate random Bytes of specified size
 *
 * @param {number} size - Number of random bytes to generate
 * @returns {import('./BytesType.js').BytesType} Random bytes
 * @throws {NegativeNumberError} If size is negative
 * @throws {NonIntegerError} If size is not an integer
 *
 * @example
 * ```javascript
 * import * as Bytes from './primitives/Bytes/index.js';
 * const random32 = Bytes.random(32); // 32 random bytes
 * const random16 = Bytes.random(16); // 16 random bytes
 * ```
 */
export function random(size: number): import("./BytesType.js").BytesType;
//# sourceMappingURL=random.d.ts.map