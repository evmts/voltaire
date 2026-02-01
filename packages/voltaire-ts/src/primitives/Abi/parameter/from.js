/**
 * Create ParameterType from parameter definition
 *
 * @param {import('./ParameterType.js').ParameterType | {type: string, name?: string, internalType?: string, indexed?: boolean, components?: readonly any[]}} param - Parameter definition
 * @returns {import('./ParameterType.js').ParameterType} Branded parameter
 *
 * @example
 * ```typescript
 * import * as Parameter from './parameter/index.js';
 * const param = Parameter.from({ type: 'uint256', name: 'amount' });
 * ```
 */
export function from(param) {
	// Cast to branded type (brand is compile-time only)
	return /** @type {import('./ParameterType.js').ParameterType} */ (param);
}
