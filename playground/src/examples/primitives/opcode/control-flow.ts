import * as Opcode from "../../../primitives/Opcode/index.js";

// Example: Control flow opcodes - JUMP, JUMPI, JUMPDEST, STOP, RETURN, REVERT

console.log("=== Jump Opcodes ===");

// JUMP (0x56) - Unconditional jump
const jumpInfo = Opcode.info(Opcode.JUMP);
console.log("\nJUMP (0x56):", {
	name: jumpInfo?.name,
	hex: "0x56",
	gasCost: jumpInfo?.gasCost,
	stackInputs: jumpInfo?.stackInputs, // destination
	stackOutputs: jumpInfo?.stackOutputs, // none
	category: Opcode.getCategory(Opcode.JUMP),
	isJump: Opcode.isJump(Opcode.JUMP),
});

// JUMPI (0x57) - Conditional jump
const jumpiInfo = Opcode.info(Opcode.JUMPI);
console.log("\nJUMPI (0x57):", {
	name: jumpiInfo?.name,
	hex: "0x57",
	gasCost: jumpiInfo?.gasCost,
	stackInputs: jumpiInfo?.stackInputs, // destination, condition
	stackOutputs: jumpiInfo?.stackOutputs, // none
	category: Opcode.getCategory(Opcode.JUMPI),
	isJump: Opcode.isJump(Opcode.JUMPI),
});

// JUMPDEST (0x5b) - Jump destination marker
const jumpdestInfo = Opcode.info(Opcode.JUMPDEST);
console.log("\nJUMPDEST (0x5b):", {
	name: jumpdestInfo?.name,
	hex: "0x5b",
	gasCost: jumpdestInfo?.gasCost,
	stackInputs: jumpdestInfo?.stackInputs,
	stackOutputs: jumpdestInfo?.stackOutputs,
	category: Opcode.getCategory(Opcode.JUMPDEST),
	isJumpDestination: Opcode.isJumpDestination(Opcode.JUMPDEST),
});

console.log("\n=== Terminator Opcodes ===");

// STOP (0x00) - Halts execution
const stopInfo = Opcode.info(Opcode.STOP);
console.log("\nSTOP (0x00):", {
	name: stopInfo?.name,
	hex: "0x00",
	gasCost: stopInfo?.gasCost,
	stackInputs: stopInfo?.stackInputs,
	stackOutputs: stopInfo?.stackOutputs,
	category: Opcode.getCategory(Opcode.STOP),
	isTerminator: Opcode.isTerminator(Opcode.STOP),
});

// RETURN (0xf3) - Halts execution with output
const returnInfo = Opcode.info(Opcode.RETURN);
console.log("\nRETURN (0xf3):", {
	name: returnInfo?.name,
	hex: "0xf3",
	gasCost: returnInfo?.gasCost,
	stackInputs: returnInfo?.stackInputs, // offset, length
	stackOutputs: returnInfo?.stackOutputs,
	category: Opcode.getCategory(Opcode.RETURN),
	isTerminator: Opcode.isTerminator(Opcode.RETURN),
});

// REVERT (0xfd) - Halts execution and reverts state
const revertInfo = Opcode.info(Opcode.REVERT);
console.log("\nREVERT (0xfd):", {
	name: revertInfo?.name,
	hex: "0xfd",
	gasCost: revertInfo?.gasCost,
	stackInputs: revertInfo?.stackInputs, // offset, length
	stackOutputs: revertInfo?.stackOutputs,
	category: Opcode.getCategory(Opcode.REVERT),
	isTerminator: Opcode.isTerminator(Opcode.REVERT),
});

// SELFDESTRUCT (0xff) - Destroy contract
const selfdestructInfo = Opcode.info(Opcode.SELFDESTRUCT);
console.log("\nSELFDESTRUCT (0xff):", {
	name: selfdestructInfo?.name,
	hex: "0xff",
	gasCost: `${selfdestructInfo?.gasCost} (base)`,
	stackInputs: selfdestructInfo?.stackInputs, // beneficiary address
	stackOutputs: selfdestructInfo?.stackOutputs,
	category: Opcode.getCategory(Opcode.SELFDESTRUCT),
	isTerminator: Opcode.isTerminator(Opcode.SELFDESTRUCT),
});

// INVALID (0xfe) - Invalid opcode
const invalidInfo = Opcode.info(Opcode.INVALID);
console.log("\nINVALID (0xfe):", {
	name: invalidInfo?.name,
	hex: "0xfe",
	gasCost: "All remaining gas",
	stackInputs: invalidInfo?.stackInputs,
	stackOutputs: invalidInfo?.stackOutputs,
	category: Opcode.getCategory(Opcode.INVALID),
	isTerminator: Opcode.isTerminator(Opcode.INVALID),
});

console.log("\n=== Control Flow Checks ===");
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

console.log(
	"\nBytecode:",
	Array.from(bytecode)
		.map((b) => `0x${b.toString(16).padStart(2, "0")}`)
		.join(" "),
);
console.log("\nValid jump destinations:");
const dests = Opcode.jumpDests(bytecode);
console.log("Jump destinations:", Array.from(dests));
console.log(
	`Offset 5 is valid JUMPDEST: ${Opcode.isValidJumpDest(bytecode, 5)}`,
);
console.log(
	`Offset 3 is valid JUMPDEST: ${Opcode.isValidJumpDest(bytecode, 3)}`,
);
