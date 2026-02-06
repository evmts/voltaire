/**
 * @module predicates
 * @description Opcode type predicates (pure)
 * @since 0.1.0
 */
import { Opcode } from "@tevm/voltaire/Opcode";

/**
 * Check if opcode is a DUP instruction
 */
export const isDup = Opcode.isDup;
export const _isDup = isDup;

/**
 * Check if opcode is a JUMP instruction
 */
export const isJump = Opcode.isJump;
export const _isJump = isJump;

/**
 * Check if opcode is JUMPDEST
 */
export const isJumpDestination = Opcode.isJumpDestination;
export const _isJumpDestination = isJumpDestination;

/**
 * Check if opcode is a LOG instruction
 */
export const isLog = Opcode.isLog;
export const _isLog = isLog;

/**
 * Check if opcode is a PUSH instruction
 */
export const isPush = Opcode.isPush;
export const _isPush = isPush;

/**
 * Check if opcode is a SWAP instruction
 */
export const isSwap = Opcode.isSwap;
export const _isSwap = isSwap;

/**
 * Check if opcode terminates execution
 */
export const isTerminating = Opcode.isTerminating;
export const _isTerminating = isTerminating;

/**
 * Check if opcode is a block terminator
 */
export const isTerminator = Opcode.isTerminator;
export const _isTerminator = isTerminator;

/**
 * Check if opcode is valid (known)
 */
export const isValid = Opcode.isValid;
export const _isValid = isValid;

/**
 * Check if opcode is a valid jump destination
 */
export const isValidJumpDest = Opcode.isValidJumpDest;
export const _isValidJumpDest = isValidJumpDest;

/**
 * Check if opcode value is a valid opcode
 */
export const isValidOpcode = Opcode.isValidOpcode;
export const _isValidOpcode = isValidOpcode;
