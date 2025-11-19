export type { OpStepType } from "./OpStepType.js";
export { from as _from } from "./from.js";
export { hasError as _hasError } from "./hasError.js";

import type { OpStepType } from "./OpStepType.js";
import { from as _from } from "./from.js";
import { hasError as _hasError } from "./hasError.js";

/**
 * Creates an OpStep from raw data
 *
 * @see https://voltaire.tevm.sh/primitives/op-step for OpStep documentation
 * @since 0.0.0
 * @param data - OpStep data
 * @returns OpStep instance
 * @example
 * ```typescript
 * import { OpStep } from './primitives/OpStep/index.js';
 * const step = OpStep.from({ pc: 0, op: 0x60, gas: 1000000n, gasCost: 3n, depth: 0 });
 * ```
 */
export function from(
	data: Omit<OpStepType, typeof import("../../brand.js").brand>,
): OpStepType {
	return _from(data);
}

/**
 * Checks if an OpStep has an error
 *
 * @param step - OpStep to check
 * @returns True if step has an error
 * @example
 * ```typescript
 * import { OpStep } from './primitives/OpStep/index.js';
 * if (OpStep.hasError(step)) {
 *   console.error(`Error: ${step.error}`);
 * }
 * ```
 */
export function hasError(step: OpStepType): boolean {
	return _hasError(step);
}
