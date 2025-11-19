/**
 * Checks if an OpStep has an error
 *
 * @param {import('./OpStepType.js').OpStepType} step - OpStep to check
 * @returns {boolean} True if step has an error
 * @example
 * ```javascript
 * import { hasError } from './hasError.js';
 * if (hasError(step)) {
 *   console.error(`Error at PC ${step.pc}: ${step.error}`);
 * }
 * ```
 */
export function hasError(step) {
	return step.error !== undefined && step.error !== "";
}
