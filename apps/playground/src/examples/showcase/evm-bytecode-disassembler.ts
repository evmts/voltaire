import { Bytecode, Hex, Keccak256, Opcode } from "@tevm/voltaire";

/**
 * Showcase 1: EVM Bytecode Disassembler & Selector Extractor
 *
 * Inspects realistic ERC-20 + EIP-1967 proxy runtime bytecode:
 *   1. Validates bytecode boundaries and computes code hash
 *   2. Extracts all valid JUMPDEST targets (ignoring decoy 0x5b bytes in PUSH32)
 *   3. Identifies 4-byte function selectors from dispatcher PUSH4 patterns
 *   4. Prints formatted disassembly trace, basic blocks, static gas & stack depth
 */

// Construct realistic ERC-20 + EIP-1967 Proxy runtime bytecode:
// - Free memory pointer initialization (0x6080604052)
// - Calldata length guard (< 4 bytes -> proxy fallback)
// - Solidity-style 4-byte function selector dispatcher
// - EIP-1967 proxy DELEGATECALL block with PUSH32 slot containing decoy 0x5b bytes
// - ERC-20 transfer(address,uint256) handler with SLOAD / SSTORE / LOG3 / RETURN
const runtimeBytes = new Uint8Array([
	// [0x0000] Free memory pointer: PUSH1 0x80 PUSH1 0x40 MSTORE
	0x60, 0x80, 0x60, 0x40, 0x52,
	// [0x0005] Calldata guard: PUSH1 0x04 CALLDATASIZE LT PUSH2 0x0046 JUMPI
	0x60, 0x04, 0x36, 0x10, 0x61, 0x00, 0x46, 0x57,
	// [0x000d] Extract 4-byte selector: PUSH1 0x00 CALLDATALOAD PUSH1 0xe0 SHR
	0x60, 0x00, 0x35, 0x60, 0xe0, 0x1c,
	// [0x0013] DUP1 PUSH4 0xa9059cbb (transfer) EQ PUSH2 0x008b JUMPI
	0x80, 0x63, 0xa9, 0x05, 0x9c, 0xbb, 0x14, 0x61, 0x00, 0x8b, 0x57,
	// [0x001e] DUP1 PUSH4 0x095ea7b3 (approve) EQ PUSH2 0x008b JUMPI
	0x80, 0x63, 0x09, 0x5e, 0xa7, 0xb3, 0x14, 0x61, 0x00, 0x8b, 0x57,
	// [0x0029] DUP1 PUSH4 0x70a08231 (balanceOf) EQ PUSH2 0x008b JUMPI
	0x80, 0x63, 0x70, 0xa0, 0x82, 0x31, 0x14, 0x61, 0x00, 0x8b, 0x57,
	// [0x0034] DUP1 PUSH4 0xd505accf (permit) EQ PUSH2 0x008b JUMPI
	0x80, 0x63, 0xd5, 0x05, 0xac, 0xcf, 0x14, 0x61, 0x00, 0x8b, 0x57,
	// [0x003f] DUP1 PUSH4 0x5c60da1b (implementation) EQ PUSH2 0x0046 JUMPI
	0x80, 0x63, 0x5c, 0x60, 0xda, 0x1b, 0x14, 0x61, 0x00, 0x46, 0x57,

	// [0x004a] Fallback / EIP-1967 Proxy DELEGATECALL block
	0x5b, // JUMPDEST
	// PUSH32 EIP-1967 slot (note embedded 0x5b bytes at payload offsets — NOT valid JUMPDESTs!)
	0x7f,
	0x36, 0x08, 0x94, 0xa1, 0x3b, 0xa1, 0xa3, 0x21,
	0x06, 0x67, 0xc8, 0x28, 0x49, 0x2d, 0xb9, 0x8d,
	0xca, 0x3e, 0x20, 0x76, 0xcc, 0x37, 0x35, 0xa9,
	0x20, 0xa3, 0xca, 0x50, 0x5b, 0x38, 0x2b, 0x5b,
	0x54, // SLOAD (implementation address)
	0x36, 0x60, 0x00, 0x80, 0x37, // CALLDATASIZE PUSH1 0 DUP1 CALLDATACOPY
	0x60, 0x00, 0x80, 0x36, 0x60, 0x00, 0x85, 0x5a, 0xf4, // DELEGATECALL
	0x3d, 0x60, 0x00, 0x80, 0x3e, // RETURNDATACOPY
	0x80, 0x60, 0x00, 0x14, 0x61, 0x00, 0x87, 0x57, // ISZERO -> revert
	0x3d, 0x60, 0x00, 0xf3, // RETURN
	0x5b, 0x3d, 0x60, 0x00, 0xfd, // JUMPDEST REVERT

	// [0x008f] ERC-20 transfer handler block
	0x5b, // JUMPDEST
	0x34, 0x80, 0x15, 0x61, 0x00, 0x9a, 0x57, 0x60, 0x00, 0x80, 0xfd, // nonpayable guard
	0x5b, // JUMPDEST
	0x50, // POP
	0x60, 0x04, 0x35, // CALLDATALOAD (to)
	0x60, 0x24, 0x35, // CALLDATALOAD (amount)
	0x33, 0x60, 0x00, 0x52, // CALLER -> mem[0x00]
	0x60, 0x01, 0x60, 0x20, 0x52, // slot 1 -> mem[0x20]
	0x60, 0x40, 0x60, 0x00, 0x20, // KECCAK256(0x00, 0x40)
	0x80, 0x54, // DUP1 SLOAD
	0x82, 0x90, 0x03, // SUB
	0x90, 0x55, // SSTORE
	0x60, 0x01, 0x60, 0x00, 0x52, // RETURN true
	0x60, 0x20, 0x60, 0x00, 0xf3,
]);

const code = Bytecode(runtimeBytes);

console.log("=== 1. Bytecode Summary ===");
console.log(`Size:         ${Bytecode.size(code)} bytes`);
console.log(`Valid EVM:    ${Bytecode.validate(code)}`);
console.log(`Has Metadata: ${Bytecode.hasMetadata(code)}`);
console.log(`Code Hash:    ${Hex.fromBytes(Bytecode.hash(code))}`);

// Analyze valid JUMPDESTs and prove decoy 0x5b inside PUSH32 is rejected
const jumpDests = [...Bytecode.analyzeJumpDestinations(code)].sort((a, b) => a - b);
const raw0x5bOffsets: number[] = [];
for (let i = 0; i < code.length; i++) {
	if (code[i] === 0x5b) raw0x5bOffsets.push(i);
}
const decoy0x5bOffsets = raw0x5bOffsets.filter((pc) => !Bytecode.isValidJumpDest(code, pc));

console.log("\n=== 2. JUMPDEST Table (PUSH-immediate safe) ===");
console.log(`Valid JUMPDESTs (${jumpDests.length}): ${jumpDests.map((pc) => `0x${pc.toString(16).padStart(4, "0")}`).join(", ")}`);
console.log(`Decoy 0x5b bytes skipped inside PUSH32 (${decoy0x5bOffsets.length}): ${decoy0x5bOffsets.map((pc) => `0x${pc.toString(16).padStart(4, "0")}`).join(", ")}`);

// Known ERC-20 / ERC-2612 / Proxy selector lookup table computed via Voltaire Keccak256
const knownSignatures = [
	"transfer(address,uint256)",
	"transferFrom(address,address,uint256)",
	"approve(address,uint256)",
	"balanceOf(address)",
	"allowance(address,address)",
	"permit(address,address,uint256,uint256,uint8,bytes32,bytes32)",
	"implementation()",
];
const selectorLookup = new Map<string, string>(
	knownSignatures.map((sig) => [Hex.fromBytes(Keccak256.selector(sig)), sig]),
);

// Scan parsed instructions for PUSH4 dispatcher selectors (PUSH4 <4B> EQ)
type OpcodeValue = Parameters<typeof Opcode.getName>[0];
const PUSH4_OP = 0x63;
const EQ_OP = 0x14;
const DELEGATECALL_OP = 0xf4 as OpcodeValue;

const instructions = Bytecode.parseInstructions(code);
const detectedSelectors: Array<{ pc: number; selector: string; signature: string }> = [];
for (let i = 0; i < instructions.length - 1; i++) {
	const cur = instructions[i];
	const next = instructions[i + 1];
	if (cur.opcode === PUSH4_OP && cur.pushData && next.opcode === EQ_OP) {
		const selHex = Hex.fromBytes(cur.pushData);
		detectedSelectors.push({
			pc: cur.position,
			selector: selHex,
			signature: selectorLookup.get(selHex) ?? "<unknown>",
		});
	}
}

console.log("\n=== 3. Detected 4-Byte Selectors ===");
for (const entry of detectedSelectors) {
	console.log(`  pc=0x${entry.pc.toString(16).padStart(4, "0")}  ${entry.selector}  ->  ${entry.signature}`);
}

// Disassembly trace (first 22 instructions covering dispatcher + proxy start)
console.log("\n=== 4. Instruction Disassembly Trace (first 22 ops) ===");
for (const inst of instructions.slice(0, 22)) {
	const pcHex = `0x${inst.position.toString(16).padStart(4, "0")}`;
	const opName = Opcode.getName(inst.opcode as OpcodeValue);
	const imm = inst.pushData ? ` ${Hex.fromBytes(inst.pushData)}` : "";
	console.log(`  ${pcHex}: ${opName}${imm}`);
}
console.log(`  ... (${instructions.length} total instructions parsed; opcode 0xf4 = ${Opcode.getName(DELEGATECALL_OP)})`);

// Basic blocks, static gas, and stack depth inspection
const blocks = Bytecode.analyzeBlocks(code);
const gasAnalysis = Bytecode.analyzeGas(code);
const stackAnalysis = Bytecode.analyzeStack(code);

console.log("\n=== 5. Static Control-Flow, Gas & Stack Inspection ===");
console.log(`Basic blocks:      ${blocks.length}`);
console.log(`Total static gas:  ${gasAnalysis.total} gas`);
console.log(`Max stack depth:   ${stackAnalysis.maxDepth} (valid=${stackAnalysis.valid})`);
for (const blk of gasAnalysis.byBlock) {
	console.log(
		`  Block #${blk.blockIndex} [0x${blk.startPc.toString(16).padStart(4, "0")}..0x${blk.endPc.toString(16).padStart(4, "0")}]: ${blk.gas} gas (${blk.percentage.toFixed(1)}%)`,
	);
}
