// @ts-nocheck
import * as Opcode from "../Opcode/index.js";
/**
 * Check if opcode terminates a block
 * @param {number} opcode
 * @returns {boolean}
 */
export function isTerminatorOpcode(opcode) {
    return (opcode === Opcode.STOP ||
        opcode === Opcode.RETURN ||
        opcode === Opcode.REVERT ||
        opcode === Opcode.INVALID ||
        opcode === Opcode.SELFDESTRUCT ||
        opcode === Opcode.JUMP ||
        opcode === Opcode.JUMPI);
}
