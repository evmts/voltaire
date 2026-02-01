/**
 * Type guard for Signature
 *
 * @see https://voltaire.tevm.sh/primitives/signature for Signature documentation
 * @since 0.1.42
 * @param {unknown} value - Value to check
 * @returns {value is import('./SignatureType.js').SignatureType} True if value is a SignatureType
 * @throws {never}
 * @example
 * ```typescript
 * import { isSignature } from '@tevm/voltaire';
 * if (isSignature(value)) {
 *   console.log(value.algorithm);
 * }
 * ```
 */
export function isSignature(value: unknown): value is import("./SignatureType.js").SignatureType;
//# sourceMappingURL=isSignature.d.ts.map