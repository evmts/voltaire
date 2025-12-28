import { Opcode } from "voltaire";
// JUMP (0x56) - Unconditional jump
const jumpInfo = Opcode.info(Opcode.JUMP);

// JUMPI (0x57) - Conditional jump
const jumpiInfo = Opcode.info(Opcode.JUMPI);

// JUMPDEST (0x5b) - Jump destination marker
const jumpdestInfo = Opcode.info(Opcode.JUMPDEST);

// STOP (0x00) - Halts execution
const stopInfo = Opcode.info(Opcode.STOP);

// RETURN (0xf3) - Halts execution with output
const returnInfo = Opcode.info(Opcode.RETURN);

// REVERT (0xfd) - Halts execution and reverts state
const revertInfo = Opcode.info(Opcode.REVERT);

// SELFDESTRUCT (0xff) - Destroy contract
const selfdestructInfo = Opcode.info(Opcode.SELFDESTRUCT);

// INVALID (0xfe) - Invalid opcode
const invalidInfo = Opcode.info(Opcode.INVALID);
// Example bytecode with JUMPDEST
const bytecode = new Uint8Array([
	Opcode.PUSH1,
	0x05, // PUSH1 0x05
	Opcode.JUMP, // JUMP
	Opcode.INVALID, // Should skip this
	Opcode.INVALID, // Should skip this
	Opcode.JUMPDEST, // Valid jump destination at offset 5
	Opcode.STOP, // Stop execution
]);
const dests = Opcode.jumpDests(bytecode);
