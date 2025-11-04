/**
 * EVM Opcode constants
 */

import type { Opcode } from "./BrandedBytecode.js";

/** JUMPDEST opcode */
export const JUMPDEST: Opcode = 0x5b;

/** PUSH1 opcode */
export const PUSH1: Opcode = 0x60;

/** PUSH32 opcode */
export const PUSH32: Opcode = 0x7f;

/** STOP opcode */
export const STOP: Opcode = 0x00;

/** RETURN opcode */
export const RETURN: Opcode = 0xf3;

/** REVERT opcode */
export const REVERT: Opcode = 0xfd;

/** INVALID opcode */
export const INVALID: Opcode = 0xfe;
