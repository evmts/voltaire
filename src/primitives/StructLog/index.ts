export type { StructLogType } from "./StructLogType.js";
export { from as _from } from "./from.js";
export { toOpStep as _toOpStep } from "./toOpStep.js";

import type { OpStepType } from "../OpStep/OpStepType.js";
import type { StructLogType } from "./StructLogType.js";
import { from as _from } from "./from.js";
import { toOpStep as _toOpStep } from "./toOpStep.js";

/**
 * Creates a StructLog from raw data
 *
 * @see https://voltaire.tevm.sh/primitives/struct-log for StructLog documentation
 * @since 0.0.0
 * @param data - StructLog data
 * @returns StructLog instance
 * @example
 * ```typescript
 * import { StructLog } from './primitives/StructLog/index.js';
 * const log = StructLog.from({ pc: 0, op: "PUSH1", gas: 1000000n, gasCost: 3n, depth: 0, stack: [] });
 * ```
 */
export function from(
	data: Omit<StructLogType, typeof import("../../brand.js").brand>,
): StructLogType {
	return _from(data);
}

/**
 * Converts a StructLog to an OpStep
 *
 * @param log - StructLog to convert
 * @returns OpStep instance
 * @example
 * ```typescript
 * import { StructLog } from './primitives/StructLog/index.js';
 * const step = StructLog.toOpStep(log);
 * ```
 */
export function toOpStep(log: StructLogType): OpStepType {
	return _toOpStep(log);
}
