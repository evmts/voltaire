/**
 * Converts a StructLog to an OpStep
 * Parses hex strings back to typed values
 *
 * @param {import('./StructLogType.js').StructLogType} log - StructLog to convert
 * @returns {import('../OpStep/OpStepType.js').OpStepType} OpStep instance
 * @example
 * ```javascript
 * import { toOpStep } from './toOpStep.js';
 * const step = toOpStep(structLog);
 * ```
 */
export function toOpStep(log: import("./StructLogType.js").StructLogType): import("../OpStep/OpStepType.js").OpStepType;
//# sourceMappingURL=toOpStep.d.ts.map