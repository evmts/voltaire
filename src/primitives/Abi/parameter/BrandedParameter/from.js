/**
 * Create BrandedParameter from parameter definition
 *
 * @param {import('./BrandedParameter.js').BrandedParameter | {type: string, name?: string, internalType?: string, indexed?: boolean, components?: readonly any[]}} param - Parameter definition
 * @returns {import('./BrandedParameter.js').BrandedParameter} Branded parameter
 *
 * @example
 * ```typescript
 * import * as Parameter from './BrandedParameter/index.js';
 * const param = Parameter.from({ type: 'uint256', name: 'amount' });
 * ```
 */
export function from(param) {
	// Already branded, return as-is
	if (param && typeof param === "object" && "__tag" in param) {
		return /** @type {import('./BrandedParameter.js').BrandedParameter} */ (
			param
		);
	}

	// Brand the parameter object
	return /** @type {import('./BrandedParameter.js').BrandedParameter} */ ({
		...param,
		__tag: "AbiParameter",
	});
}
