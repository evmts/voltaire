/**
 * EVM Bitwise Opcode Handlers
 *
 * Opcodes 0x16-0x1d: AND, OR, XOR, NOT, BYTE, SHL, SHR, SAR
 */

export { handle as AND } from "./0x16_AND.js";
export { handle as OR } from "./0x17_OR.js";
export { handle as XOR } from "./0x18_XOR.js";
export { handle as NOT } from "./0x19_NOT.js";
export { handle as BYTE } from "./0x1a_BYTE.js";
export { handle as SHL } from "./0x1b_SHL.js";
export { handle as SHR } from "./0x1c_SHR.js";
export { handle as SAR } from "./0x1d_SAR.js";
