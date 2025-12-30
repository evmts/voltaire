import { Opcode } from "@tevm/voltaire";

// Get opcode info
const addInfo = Opcode.info(Opcode.ADD);
console.log("ADD opcode info:", addInfo);

// Get stack effects
const callEffect = Opcode.getStackEffect(Opcode.CALL);
console.log("CALL stack effect:", callEffect);

const dup2Effect = Opcode.getStackEffect(Opcode.DUP2);
console.log("DUP2 stack effect:", dup2Effect);

// Parse and disassemble bytecode
const bytecode = new Uint8Array([0x60, 0x80, 0x60, 0x40, 0x52, 0x00]);
console.log("\nDisassembled bytecode:");
const disassembled = Opcode.disassemble(bytecode);
for (const line of disassembled) {
	console.log(`  ${line}`);
}
