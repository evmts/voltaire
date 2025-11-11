/**
 * EVM System Opcodes (0xf0-0xff)
 *
 * Contract creation and interaction opcodes.
 * These opcodes handle nested execution, call depth tracking,
 * gas forwarding, and account state modifications.
 */

export { create } from "./0xf0_CREATE.js";
export { call } from "./0xf1_CALL.js";
export { callcode } from "./0xf2_CALLCODE.js";
export { delegatecall } from "./0xf4_DELEGATECALL.js";
export { create2 } from "./0xf5_CREATE2.js";
export { staticcall } from "./0xfa_STATICCALL.js";
export { selfdestruct } from "./0xff_SELFDESTRUCT.js";
