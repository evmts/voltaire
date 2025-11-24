import * as Opcode from "../../../primitives/Opcode/index.js";

// Example: Logic and comparison opcodes

console.log("=== Comparison Opcodes ===");

// LT (0x10) - Less than
const ltInfo = Opcode.info(Opcode.LT);
console.log("\nLT (0x10):", {
	name: ltInfo?.name,
	hex: "0x10",
	gasCost: ltInfo?.gasCost,
	stackInputs: ltInfo?.stackInputs, // a, b
	stackOutputs: ltInfo?.stackOutputs, // a < b ? 1 : 0
	category: Opcode.getCategory(Opcode.LT),
});

// GT (0x11) - Greater than
const gtInfo = Opcode.info(Opcode.GT);
console.log("\nGT (0x11):", {
	name: gtInfo?.name,
	hex: "0x11",
	gasCost: gtInfo?.gasCost,
	stackInputs: gtInfo?.stackInputs,
	stackOutputs: gtInfo?.stackOutputs,
	category: Opcode.getCategory(Opcode.GT),
});

// EQ (0x14) - Equality
const eqInfo = Opcode.info(Opcode.EQ);
console.log("\nEQ (0x14):", {
	name: eqInfo?.name,
	hex: "0x14",
	gasCost: eqInfo?.gasCost,
	stackInputs: eqInfo?.stackInputs,
	stackOutputs: eqInfo?.stackOutputs,
	category: Opcode.getCategory(Opcode.EQ),
});

// ISZERO (0x15) - Is zero
const iszeroInfo = Opcode.info(Opcode.ISZERO);
console.log("\nISZERO (0x15):", {
	name: iszeroInfo?.name,
	hex: "0x15",
	gasCost: iszeroInfo?.gasCost,
	stackInputs: iszeroInfo?.stackInputs, // a
	stackOutputs: iszeroInfo?.stackOutputs, // a == 0 ? 1 : 0
	category: Opcode.getCategory(Opcode.ISZERO),
});

console.log("\n=== Signed Comparison ===");

// SLT (0x12) - Signed less than
const sltInfo = Opcode.info(Opcode.SLT);
console.log("\nSLT (0x12):", {
	name: sltInfo?.name,
	hex: "0x12",
	gasCost: sltInfo?.gasCost,
	stackInputs: sltInfo?.stackInputs,
	stackOutputs: sltInfo?.stackOutputs,
	category: Opcode.getCategory(Opcode.SLT),
});

// SGT (0x13) - Signed greater than
const sgtInfo = Opcode.info(Opcode.SGT);
console.log("\nSGT (0x13):", {
	name: sgtInfo?.name,
	hex: "0x13",
	gasCost: sgtInfo?.gasCost,
	stackInputs: sgtInfo?.stackInputs,
	stackOutputs: sgtInfo?.stackOutputs,
	category: Opcode.getCategory(Opcode.SGT),
});

console.log("\n=== Bitwise Logic Opcodes ===");

// AND (0x16) - Bitwise AND
const andInfo = Opcode.info(Opcode.AND);
console.log("\nAND (0x16):", {
	name: andInfo?.name,
	hex: "0x16",
	gasCost: andInfo?.gasCost,
	stackInputs: andInfo?.stackInputs,
	stackOutputs: andInfo?.stackOutputs,
	category: Opcode.getCategory(Opcode.AND),
});

// OR (0x17) - Bitwise OR
const orInfo = Opcode.info(Opcode.OR);
console.log("\nOR (0x17):", {
	name: orInfo?.name,
	hex: "0x17",
	gasCost: orInfo?.gasCost,
	stackInputs: orInfo?.stackInputs,
	stackOutputs: orInfo?.stackOutputs,
	category: Opcode.getCategory(Opcode.OR),
});

// XOR (0x18) - Bitwise XOR
const xorInfo = Opcode.info(Opcode.XOR);
console.log("\nXOR (0x18):", {
	name: xorInfo?.name,
	hex: "0x18",
	gasCost: xorInfo?.gasCost,
	stackInputs: xorInfo?.stackInputs,
	stackOutputs: xorInfo?.stackOutputs,
	category: Opcode.getCategory(Opcode.XOR),
});

// NOT (0x19) - Bitwise NOT
const notInfo = Opcode.info(Opcode.NOT);
console.log("\nNOT (0x19):", {
	name: notInfo?.name,
	hex: "0x19",
	gasCost: notInfo?.gasCost,
	stackInputs: notInfo?.stackInputs,
	stackOutputs: notInfo?.stackOutputs,
	category: Opcode.getCategory(Opcode.NOT),
});

console.log("\n=== Bit Manipulation ===");

// BYTE (0x1a) - Extract byte
const byteInfo = Opcode.info(Opcode.BYTE);
console.log("\nBYTE (0x1a):", {
	name: byteInfo?.name,
	hex: "0x1a",
	gasCost: byteInfo?.gasCost,
	stackInputs: byteInfo?.stackInputs, // i, x
	stackOutputs: byteInfo?.stackOutputs, // ith byte of x
	category: Opcode.getCategory(Opcode.BYTE),
});

// SHL (0x1b) - Shift left
const shlInfo = Opcode.info(Opcode.SHL);
console.log("\nSHL (0x1b):", {
	name: shlInfo?.name,
	hex: "0x1b",
	gasCost: shlInfo?.gasCost,
	stackInputs: shlInfo?.stackInputs, // shift, value
	stackOutputs: shlInfo?.stackOutputs, // value << shift
	category: Opcode.getCategory(Opcode.SHL),
});

// SHR (0x1c) - Shift right (logical)
const shrInfo = Opcode.info(Opcode.SHR);
console.log("\nSHR (0x1c):", {
	name: shrInfo?.name,
	hex: "0x1c",
	gasCost: shrInfo?.gasCost,
	stackInputs: shrInfo?.stackInputs,
	stackOutputs: shrInfo?.stackOutputs,
	category: Opcode.getCategory(Opcode.SHR),
});

// SAR (0x1d) - Shift right (arithmetic)
const sarInfo = Opcode.info(Opcode.SAR);
console.log("\nSAR (0x1d):", {
	name: sarInfo?.name,
	hex: "0x1d",
	gasCost: sarInfo?.gasCost,
	stackInputs: sarInfo?.stackInputs,
	stackOutputs: sarInfo?.stackOutputs,
	category: Opcode.getCategory(Opcode.SAR),
	description: "Arithmetic shift (preserves sign)",
});

console.log("\n=== Common Logic Patterns ===");
console.log(`
Comparison patterns:
- LT/GT: Unsigned comparison
- SLT/SGT: Signed comparison (for negative numbers)
- EQ: Equality check
- ISZERO: Boolean NOT, check if zero

Bitwise operations:
- AND: Masking bits (e.g., extract lower bits)
- OR: Setting bits
- XOR: Toggle bits, difference check
- NOT: Flip all bits (bitwise complement)

Shift operations:
- SHL: Multiply by powers of 2 (value << n = value * 2^n)
- SHR: Divide by powers of 2 (unsigned)
- SAR: Divide by powers of 2 (preserves sign for signed integers)

Common uses:
- AND 0xFF: Extract lowest byte
- SHL 1: Multiply by 2
- SHR 1: Divide by 2
- ISZERO ISZERO: Convert any non-zero value to 1
`);
