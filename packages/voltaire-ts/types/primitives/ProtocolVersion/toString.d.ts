/**
 * Convert ProtocolVersion to string (identity function for branded type)
 *
 * @this {import('./ProtocolVersionType.js').ProtocolVersionType}
 * @returns {string} Protocol version as string
 *
 * @example
 * ```javascript
 * import * as ProtocolVersion from './primitives/ProtocolVersion/index.js';
 * const proto = ProtocolVersion.from("eth/67");
 * const str = ProtocolVersion._toString.call(proto); // "eth/67"
 * ```
 */
export function toString(this: import("./ProtocolVersionType.js").ProtocolVersionType): string;
//# sourceMappingURL=toString.d.ts.map