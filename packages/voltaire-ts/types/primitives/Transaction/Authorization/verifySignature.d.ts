/**
 * Verify authorization signature.
 *
 * Validates that the signature (r, s, yParity) is valid for the
 * authorization's signing hash by recovering and verifying the public key.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param {import('./BrandedAuthorization.js').BrandedAuthorization} auth - Authorization to verify
 * @returns {boolean} True if signature is valid
 * @throws {never} Never throws - returns false on error
 * @example
 * ```javascript
 * import { verifySignature } from './primitives/Transaction/Authorization/verifySignature.js';
 * const isValid = verifySignature(auth);
 * ```
 */
export function verifySignature(auth: import("./BrandedAuthorization.js").BrandedAuthorization): boolean;
//# sourceMappingURL=verifySignature.d.ts.map