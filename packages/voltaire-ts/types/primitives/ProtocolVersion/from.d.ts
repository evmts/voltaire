/**
 * Create ProtocolVersion from string
 *
 * @param {string} value - Protocol version string (e.g., "eth/67", "snap/1")
 * @returns {import('./ProtocolVersionType.js').ProtocolVersionType} Branded protocol version
 * @throws {InvalidFormatError} If value is not a valid protocol version format
 *
 * @example
 * ```javascript
 * import * as ProtocolVersion from './primitives/ProtocolVersion/index.js';
 * const eth67 = ProtocolVersion.from("eth/67");
 * const snap1 = ProtocolVersion.from("snap/1");
 * ```
 */
export function from(value: string): import("./ProtocolVersionType.js").ProtocolVersionType;
//# sourceMappingURL=from.d.ts.map