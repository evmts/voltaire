import { Opcode } from "@tevm/voltaire";

// Opcode information and lookup

// Get info for common opcodes
console.log("ADD opcode info:");
const addInfo = Opcode.info(Opcode.ADD);
console.log("  Name:", addInfo?.name);
console.log("  Gas cost:", addInfo?.gasCost);
console.log("  Stack inputs:", addInfo?.stackInputs);
console.log("  Stack outputs:", addInfo?.stackOutputs);

// Check opcode categories
console.log("\nOpcode categories:");
console.log("ADD category:", Opcode.getCategory(Opcode.ADD));
console.log("SSTORE category:", Opcode.getCategory(Opcode.SSTORE));
console.log("CALL category:", Opcode.getCategory(Opcode.CALL));
console.log("KECCAK256 category:", Opcode.getCategory(Opcode.KECCAK256));

// Check opcode types
console.log("\nOpcode type checks:");
console.log("Is PUSH1 a push?", Opcode.isPush(Opcode.PUSH1));
console.log("Is DUP1 a dup?", Opcode.isDup(Opcode.DUP1));
console.log("Is SWAP1 a swap?", Opcode.isSwap(Opcode.SWAP1));
console.log("Is RETURN terminating?", Opcode.isTerminating(Opcode.RETURN));
console.log("Is JUMP a jump?", Opcode.isJump(Opcode.JUMP));

// PUSH byte counts
console.log("\nPUSH byte counts:");
console.log("PUSH0 bytes:", Opcode.pushBytes(Opcode.PUSH0));
console.log("PUSH1 bytes:", Opcode.pushBytes(Opcode.PUSH1));
console.log("PUSH32 bytes:", Opcode.pushBytes(Opcode.PUSH32));

// Stack effects
console.log("\nStack effects:");
const callEffect = Opcode.getStackEffect(Opcode.CALL);
console.log("CALL: pop", callEffect?.pop, "push", callEffect?.push);
const dup2Effect = Opcode.getStackEffect(Opcode.DUP2);
console.log("DUP2: pop", dup2Effect?.pop, "push", dup2Effect?.push);

// Parse and disassemble bytecode
const bytecode = new Uint8Array([0x60, 0x80, 0x60, 0x40, 0x52, 0x00]);
const disassembled = Opcode.disassemble(bytecode);
console.log("\nDisassembled bytecode:");
for (const line of disassembled) {
  console.log(" ", line);
}

// Opcode descriptions
console.log("\nOpcode descriptions:");
console.log("SSTORE:", Opcode.getDescription(Opcode.SSTORE));
console.log("CREATE2:", Opcode.getDescription(Opcode.CREATE2));
