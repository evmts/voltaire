/**
 * Compare two ProtocolVersions for equality
 *
 * @this {import('./ProtocolVersionType.js').ProtocolVersionType}
 * @param {import('./ProtocolVersionType.js').ProtocolVersionType} other - Protocol version to compare
 * @returns {boolean} True if equal
 *
 * @example
 * ```javascript
 * import * as ProtocolVersion from './primitives/ProtocolVersion/index.js';
 * const a = ProtocolVersion.from("eth/67");
 * const b = ProtocolVersion.from("eth/67");
 * const equal = ProtocolVersion._equals.call(a, b); // true
 * ```
 */
export function equals(other) {
	return this === other;
}
