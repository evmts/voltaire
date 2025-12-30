import { Opcode } from "@tevm/voltaire";

// Get opcode info
const addInfo = Opcode.info(Opcode.ADD);

// Get stack effects
const callEffect = Opcode.getStackEffect(Opcode.CALL);

const dup2Effect = Opcode.getStackEffect(Opcode.DUP2);

// Parse and disassemble bytecode
const bytecode = new Uint8Array([0x60, 0x80, 0x60, 0x40, 0x52, 0x00]);
const disassembled = Opcode.disassemble(bytecode);
for (const line of disassembled) {
}
