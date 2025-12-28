import { Bytecode, GasConstants, Opcode } from "@tevm/voltaire";

// Calculate gas for simple bytecode
const code = Bytecode("0x6001600201"); // PUSH1 1, PUSH1 2, ADD
const instructions = Bytecode.parseInstructions(code);
let totalGas = 0n;
for (const inst of instructions) {
	const gas = Opcode.getGasCost(inst.opcode);
	if (gas !== undefined) {
		totalGas += BigInt(gas);
	}
}
