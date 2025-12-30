import { Bytecode, Opcode } from "@tevm/voltaire";

// Calculate gas for simple bytecode
const code = Bytecode("0x6001600201"); // PUSH1 1, PUSH1 2, ADD
console.log("Bytecode: PUSH1 1, PUSH1 2, ADD");
console.log("Raw:", Bytecode.toHex(code));

const instructions = Bytecode.parseInstructions(code);
let totalGas = 0n;
console.log("\nGas breakdown:");
for (const inst of instructions) {
	const gas = Opcode.getGasCost(inst.opcode);
	const name = Opcode.getName(inst.opcode);
	if (gas !== undefined) {
		console.log(`  ${name}: ${gas} gas`);
		totalGas += BigInt(gas);
	}
}
console.log(`\nTotal gas: ${totalGas}`);
