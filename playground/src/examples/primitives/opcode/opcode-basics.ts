import * as Opcode from "../../../primitives/Opcode/index.js";
// Common EVM opcodes (hex values)
const add = Opcode.ADD; // 0x01
const mul = Opcode.MUL; // 0x02
const push1 = Opcode.PUSH1; // 0x60
const sstore = Opcode.SSTORE; // 0x55
const call = Opcode.CALL; // 0xf1
// Get detailed opcode info
const addInfo = Opcode.info(Opcode.ADD);

const callInfo = Opcode.info(Opcode.CALL);
