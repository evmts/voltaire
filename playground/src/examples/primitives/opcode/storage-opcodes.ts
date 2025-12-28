import { Opcode } from "voltaire";
// SLOAD (0x54) - Load from storage
const sloadInfo = Opcode.info(Opcode.SLOAD);

// SSTORE (0x55) - Store to storage
const sstoreInfo = Opcode.info(Opcode.SSTORE);

// TLOAD (0x5c) - Load from transient storage
const tloadInfo = Opcode.info(Opcode.TLOAD);

// TSTORE (0x5d) - Store to transient storage
const tstoreInfo = Opcode.info(Opcode.TSTORE);
