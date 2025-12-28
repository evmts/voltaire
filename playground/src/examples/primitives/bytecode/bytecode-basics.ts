import { Bytecode } from "@tevm/voltaire";
// Example: Bytecode basics

// Create bytecode from hex (simple PUSH1 0x01, STOP)
const simple = Bytecode.fromHex("0x600100");
const instructions = simple.parseInstructions();
for (const inst of instructions) {
}
const analysis = simple.analyze();

// Constructor bytecode that returns runtime code
// PUSH1 0x03, PUSH1 0x0c, PUSH1 0x00, CODECOPY, PUSH1 0x03, PUSH1 0x00, RETURN
// Runtime code: PUSH1 0x01, STOP
const constructorCode = Bytecode.fromHex("0x6003600c60003960036000f3600100");

// Extract runtime bytecode
const runtime = constructorCode.extractRuntime();

// Bytecode with metadata (common in Solidity contracts)
const withMetadata = Bytecode.fromHex(
	"0x6080604052600080fda264697066735822122000112233445566778899aabbccddeeff00112233445566778899aabbccddeeff64736f6c634300081a0033",
);

const stripped = withMetadata.stripMetadata();
const code1 = Bytecode.fromHex("0x600100");
const code2 = Bytecode.fromHex("0x600100");
const code3 = Bytecode.fromHex("0x600200");
