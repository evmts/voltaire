import { Opcode } from "@tevm/voltaire";
// LT (0x10) - Less than
const ltInfo = Opcode.info(Opcode.LT);

// GT (0x11) - Greater than
const gtInfo = Opcode.info(Opcode.GT);

// EQ (0x14) - Equality
const eqInfo = Opcode.info(Opcode.EQ);

// ISZERO (0x15) - Is zero
const iszeroInfo = Opcode.info(Opcode.ISZERO);

// SLT (0x12) - Signed less than
const sltInfo = Opcode.info(Opcode.SLT);

// SGT (0x13) - Signed greater than
const sgtInfo = Opcode.info(Opcode.SGT);

// AND (0x16) - Bitwise AND
const andInfo = Opcode.info(Opcode.AND);

// OR (0x17) - Bitwise OR
const orInfo = Opcode.info(Opcode.OR);

// XOR (0x18) - Bitwise XOR
const xorInfo = Opcode.info(Opcode.XOR);

// NOT (0x19) - Bitwise NOT
const notInfo = Opcode.info(Opcode.NOT);

// BYTE (0x1a) - Extract byte
const byteInfo = Opcode.info(Opcode.BYTE);

// SHL (0x1b) - Shift left
const shlInfo = Opcode.info(Opcode.SHL);

// SHR (0x1c) - Shift right (logical)
const shrInfo = Opcode.info(Opcode.SHR);

// SAR (0x1d) - Shift right (arithmetic)
const sarInfo = Opcode.info(Opcode.SAR);
