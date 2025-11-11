import * as OxTypedData from "ox/TypedData";

/**
 * Validate typed data structure against EIP-712 specification.
 *
 * Checks domain, types, primaryType, and message structure.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./BrandedEIP712.js').TypedData} typedData - Typed data to validate
 * @returns {void}
 * @throws {Error} If structure is invalid or missing required fields
 * @example
 * ```javascript
 * import * as EIP712 from './crypto/EIP712/index.js';
 * EIP712.validate(typedData); // Throws if invalid
 * ```
 */
export function validate(typedData) {
	// @ts-expect-error - ox TypedData types are incompatible but functionality works
	OxTypedData.assert(typedData);
}
