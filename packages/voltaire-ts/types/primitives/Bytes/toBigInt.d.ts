/**
 * Convert Bytes to bigint
 *
 * @param {import('./BytesType.js').BytesType} bytes - Bytes to convert
 * @returns {bigint} BigInt value
 *
 * @example
 * ```javascript
 * import * as Bytes from './primitives/Bytes/index.js';
 * Bytes.toBigInt(new Uint8Array([0xff]));       // 255n
 * Bytes.toBigInt(new Uint8Array([0x12, 0x34])); // 4660n
 * ```
 */
export function toBigInt(bytes: import("./BytesType.js").BytesType): bigint;
//# sourceMappingURL=toBigInt.d.ts.map