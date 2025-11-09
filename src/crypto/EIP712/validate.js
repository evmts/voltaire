import * as OxTypedData from "ox/TypedData";

/**
 * Validate typed data structure
 *
 * @param {import('./BrandedEIP712.js').TypedData} typedData - Typed data to validate
 * @throws {Error} If structure is invalid
 *
 * @example
 * ```typescript
 * EIP712.validate(typedData); // throws if invalid
 * ```
 */
export function validate(typedData) {
	// @ts-expect-error - ox TypedData types are incompatible but functionality works
	OxTypedData.assert(typedData);
}
