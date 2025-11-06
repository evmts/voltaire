// @ts-nocheck
import { INFO_TABLE } from "./infoTable.js";

/**
 * Get stack effect for an opcode
 *
 * @param {import('./BrandedOpcode.js').BrandedOpcode} opcode - Opcode to query
 * @returns {{ pop: number; push: number } | undefined} Stack items consumed and produced
 *
 * @example
 * ```typescript
 * const effect = Opcode.getStackEffect(Opcode.ADD);
 * // { pop: 2, push: 1 }
 *
 * const effect2 = Opcode.getStackEffect(Opcode.DUP1);
 * // { pop: 1, push: 2 }
 * ```
 */
export function getStackEffect(opcode) {
	const info = INFO_TABLE.get(opcode);
	if (!info) return undefined;
	return { pop: info.stackInputs, push: info.stackOutputs };
}
