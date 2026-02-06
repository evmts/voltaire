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
export function isSignature(value) {
	const val = /** @type {any} */ (value);
	return (
		value instanceof Uint8Array &&
		"algorithm" in val &&
		(val.algorithm === "secp256k1" ||
			val.algorithm === "p256" ||
			val.algorithm === "ed25519")
	);
}
