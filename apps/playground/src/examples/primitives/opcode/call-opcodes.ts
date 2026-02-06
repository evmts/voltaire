import { Opcode } from "@tevm/voltaire";
// CALL (0xf1) - Message call
const callInfo = Opcode.info(Opcode.CALL);

// DELEGATECALL (0xf4) - Message call preserving caller context
const delegatecallInfo = Opcode.info(Opcode.DELEGATECALL);

// STATICCALL (0xfa) - Static message call (no state changes)
const staticcallInfo = Opcode.info(Opcode.STATICCALL);

// CALLCODE (0xf2) - Message call with alternative account's code (deprecated)
const callcodeInfo = Opcode.info(Opcode.CALLCODE);

// CREATE (0xf0) - Create new contract
const createInfo = Opcode.info(Opcode.CREATE);

// CREATE2 (0xf5) - Create new contract with deterministic address
const create2Info = Opcode.info(Opcode.CREATE2);

// AUTH (0xf6) - Set authorized account
const authInfo = Opcode.info(Opcode.AUTH);

// AUTHCALL (0xf7) - Call as authorized account
const authcallInfo = Opcode.info(Opcode.AUTHCALL);
