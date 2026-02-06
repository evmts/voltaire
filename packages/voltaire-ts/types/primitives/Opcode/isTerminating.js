// @ts-nocheck
import * as constants from "./constants.js";
/**
 * Check if opcode terminates execution
 *
 * @param {import('./OpcodeType.js').OpcodeType} opcode - Opcode to check
 * @returns {boolean} True if STOP, RETURN, REVERT, INVALID, or SELFDESTRUCT
 *
 * @example
 * ```typescript
 * Opcode.isTerminating(Opcode.RETURN); // true
 * Opcode.isTerminating(Opcode.ADD); // false
 * ```
 */
export function isTerminating(opcode) {
    return (opcode === constants.STOP ||
        opcode === constants.RETURN ||
        opcode === constants.REVERT ||
        opcode === constants.INVALID ||
        opcode === constants.SELFDESTRUCT);
}
