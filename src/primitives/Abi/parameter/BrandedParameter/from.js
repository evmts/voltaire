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
	// Cast to branded type (brand is compile-time only)
	return /** @type {import('./BrandedParameter.js').BrandedParameter} */ (
		param
	);
}
