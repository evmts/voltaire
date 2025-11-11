/**
 * EVM Comparison Opcode Handlers
 *
 * Opcodes 0x10-0x15: LT, GT, SLT, SGT, EQ, ISZERO
 */

export { handle as LT } from "./0x10_LT.js";
export { handle as GT } from "./0x11_GT.js";
export { handle as SLT } from "./0x12_SLT.js";
export { handle as SGT } from "./0x13_SGT.js";
export { handle as EQ } from "./0x14_EQ.js";
export { handle as ISZERO } from "./0x15_ISZERO.js";

// Utility for signed conversion
export { toSigned256 } from "./toSigned256.js";
