/**
 * Bytecode Analysis Example
 *
 * Demonstrates:
 * - Complete bytecode analysis (analyze method)
 * - Jump destination analysis
 * - Instruction parsing with PUSH data
 * - Opcode utilities (isPush, getPushSize, isTerminator)
 * - Extracting PUSH values
 */

import { Bytecode } from "../../../src/primitives/Bytecode/index.js";

console.log("\n=== Bytecode Analysis Example ===\n");

// ============================================================
// Complete Analysis
// ============================================================

console.log("--- Complete Analysis ---\n");

const code = Bytecode.fromHex("0x60016002015b60ff5b00");
console.log(`Bytecode: ${Bytecode.toHex(code)}`);

const analysis = Bytecode.analyze(code);

console.log(`Valid: ${analysis.valid}`);
console.log(`Instruction count: ${analysis.instructions.length}`);
console.log(`Jump destinations: ${analysis.jumpDestinations.size}`);
console.log();

// Print each instruction
console.log("Instructions:");
analysis.instructions.forEach((inst) => {
  const hex = `0x${inst.opcode.toString(16).padStart(2, "0")}`;
  let line = `  ${inst.position}: ${hex}`;

  if (inst.pushData) {
    const data = Array.from(inst.pushData)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    line += ` (PUSH data: 0x${data})`;
  }

  console.log(line);
});
console.log();

// Print jump destinations
console.log("Valid JUMPDEST positions:");
analysis.jumpDestinations.forEach((pos) => {
  console.log(`  Position ${pos}`);
});
console.log();

// ============================================================
// Jump Destination Analysis
// ============================================================

console.log("--- Jump Destination Analysis ---\n");

// Bytecode with JUMPDEST that could be confused with PUSH data
const trickCode = Bytecode.fromHex("0x605b5b");
console.log(`Tricky bytecode: ${Bytecode.toHex(trickCode)}`);

const jumpdests = Bytecode.analyzeJumpDestinations(trickCode);

console.log("Analysis:");
console.log(`  Position 0: 0x60 (PUSH1 opcode) - ${jumpdests.has(0) ? "JUMPDEST" : "not JUMPDEST"}`);
console.log(`  Position 1: 0x5b (PUSH1 data) - ${jumpdests.has(1) ? "JUMPDEST" : "not JUMPDEST"}`);
console.log(`  Position 2: 0x5b (actual JUMPDEST) - ${jumpdests.has(2) ? "JUMPDEST" : "not JUMPDEST"}`);
console.log();

// Check specific positions
console.log("Using isValidJumpDest:");
console.log(`  isValidJumpDest(0): ${Bytecode.isValidJumpDest(trickCode, 0)}`);
console.log(`  isValidJumpDest(1): ${Bytecode.isValidJumpDest(trickCode, 1)}`);
console.log(`  isValidJumpDest(2): ${Bytecode.isValidJumpDest(trickCode, 2)}`);
console.log();

// ============================================================
// Instruction Parsing
// ============================================================

console.log("--- Instruction Parsing ---\n");

const complexCode = Bytecode.fromHex("0x608060405234801561001057600080fd5b50");
console.log(`Complex bytecode: ${Bytecode.toHex(complexCode)}`);

const instructions = Bytecode.parseInstructions(complexCode);

console.log(`\nParsed ${instructions.length} instructions:\n`);
instructions.slice(0, 10).forEach((inst) => {
  const hex = `0x${inst.opcode.toString(16).padStart(2, "0")}`;
  let line = `  [${inst.position.toString().padStart(2)}] ${hex}`;

  if (inst.pushData) {
    const size = inst.pushData.length;
    const data = Array.from(inst.pushData)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    line += ` PUSH${size} 0x${data}`;
  }

  console.log(line);
});

if (instructions.length > 10) {
  console.log(`  ... and ${instructions.length - 10} more`);
}
console.log();

// ============================================================
// Opcode Utilities
// ============================================================

console.log("--- Opcode Utilities ---\n");

const opcodes = [
  { value: 0x60, name: "PUSH1" },
  { value: 0x61, name: "PUSH2" },
  { value: 0x7f, name: "PUSH32" },
  { value: 0x5b, name: "JUMPDEST" },
  { value: 0x00, name: "STOP" },
  { value: 0xf3, name: "RETURN" },
  { value: 0xfd, name: "REVERT" },
  { value: 0xfe, name: "INVALID" },
];

console.log("Opcode classifications:");
opcodes.forEach(({ value, name }) => {
  const isPush = Bytecode.isPush(value);
  const pushSize = Bytecode.getPushSize(value);
  const isTerminator = Bytecode.isTerminator(value);

  console.log(`  ${name} (0x${value.toString(16).padStart(2, "0")}):`);
  console.log(`    isPush: ${isPush}`);
  console.log(`    pushSize: ${pushSize}`);
  console.log(`    isTerminator: ${isTerminator}`);
});
console.log();

// ============================================================
// Extracting PUSH Values
// ============================================================

console.log("--- Extracting PUSH Values ---\n");

function extractPushValues(code: typeof Bytecode.prototype): bigint[] {
  const instructions = Bytecode.parseInstructions(code);
  const values: bigint[] = [];

  for (const inst of instructions) {
    if (inst.pushData) {
      let value = 0n;
      for (const byte of inst.pushData) {
        value = (value << 8n) | BigInt(byte);
      }
      values.push(value);
    }
  }

  return values;
}

const pushCode = Bytecode.fromHex("0x60ff61123463abcdef");
console.log(`Bytecode: ${Bytecode.toHex(pushCode)}`);

const pushValues = extractPushValues(pushCode);
console.log("\nExtracted PUSH values:");
pushValues.forEach((value, i) => {
  console.log(`  PUSH ${i + 1}: ${value} (0x${value.toString(16)})`);
});
console.log();

// ============================================================
// Finding Terminators
// ============================================================

console.log("--- Finding Terminators ---\n");

function findTerminators(code: typeof Bytecode.prototype): number[] {
  const instructions = Bytecode.parseInstructions(code);
  const positions: number[] = [];

  for (const inst of instructions) {
    if (Bytecode.isTerminator(inst.opcode)) {
      positions.push(inst.position);
    }
  }

  return positions;
}

const terminatorCode = Bytecode.fromHex("0x600160020100600360040200f3");
console.log(`Code: ${Bytecode.toHex(terminatorCode)}`);

const terminators = findTerminators(terminatorCode);
console.log(`\nTerminator positions: ${terminators.join(", ")}`);

terminators.forEach((pos) => {
  const instructions = Bytecode.parseInstructions(terminatorCode);
  const inst = instructions.find((i) => i.position === pos);
  if (inst) {
    const name =
      inst.opcode === 0x00 ? "STOP" : inst.opcode === 0xf3 ? "RETURN" : "REVERT";
    console.log(`  Position ${pos}: ${name} (0x${inst.opcode.toString(16)})`);
  }
});
console.log();

// ============================================================
// Counting Instruction Types
// ============================================================

console.log("--- Counting Instruction Types ---\n");

function analyzeInstructionTypes(code: typeof Bytecode.prototype) {
  const analysis = Bytecode.analyze(code);

  const pushCount = analysis.instructions.filter((i) => Bytecode.isPush(i.opcode)).length;

  const terminatorCount = analysis.instructions.filter((i) =>
    Bytecode.isTerminator(i.opcode),
  ).length;

  const jumpdestCount = analysis.jumpDestinations.size;

  return {
    total: analysis.instructions.length,
    push: pushCount,
    terminators: terminatorCount,
    jumpdests: jumpdestCount,
    other: analysis.instructions.length - pushCount - terminatorCount - jumpdestCount,
  };
}

const statsCode = Bytecode.fromHex(
  "0x608060405234801561001057600080fd5b5060043610610041",
);

console.log(`Bytecode: ${Bytecode.toHex(statsCode).substring(0, 40)}...`);

const stats = analyzeInstructionTypes(statsCode);
console.log("\nInstruction type breakdown:");
console.log(`  Total instructions: ${stats.total}`);
console.log(`  PUSH instructions: ${stats.push}`);
console.log(`  Terminators: ${stats.terminators}`);
console.log(`  JUMPDESTs: ${stats.jumpdests}`);
console.log(`  Other: ${stats.other}`);
console.log();

// ============================================================
// Finding PUSH Instructions
// ============================================================

console.log("--- Finding PUSH Instructions ---\n");

function findPushInstructions(code: typeof Bytecode.prototype) {
  const instructions = Bytecode.parseInstructions(code);
  return instructions.filter((inst) => Bytecode.isPush(inst.opcode));
}

const pushFindCode = Bytecode.fromHex("0x600160025b60ff5b00");
console.log(`Code: ${Bytecode.toHex(pushFindCode)}`);

const pushes = findPushInstructions(pushFindCode);
console.log(`\nFound ${pushes.length} PUSH instructions:`);

pushes.forEach((inst) => {
  const size = Bytecode.getPushSize(inst.opcode);
  const data = inst.pushData
    ? Array.from(inst.pushData)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
    : "";
  console.log(`  Position ${inst.position}: PUSH${size} 0x${data}`);
});
console.log();

// ============================================================
// Analyzing Contract Structure
// ============================================================

console.log("--- Analyzing Contract Structure ---\n");

function analyzeContract(code: typeof Bytecode.prototype) {
  const analysis = Bytecode.analyze(code);

  return {
    valid: analysis.valid,
    size: Bytecode.size(code),
    instructionCount: analysis.instructions.length,
    jumpDestCount: analysis.jumpDestinations.size,
    hasMetadata: Bytecode.hasMetadata(code),
    pushCount: analysis.instructions.filter((i) => Bytecode.isPush(i.opcode)).length,
    terminatorCount: analysis.instructions.filter((i) =>
      Bytecode.isTerminator(i.opcode),
    ).length,
  };
}

const contractCode = Bytecode.fromHex(
  "0x608060405234801561001057600080fd5b50600436106100415760003560e01c8063",
);

const contractInfo = analyzeContract(contractCode);

console.log("Contract analysis:");
console.log(`  Valid: ${contractInfo.valid}`);
console.log(`  Size: ${contractInfo.size} bytes`);
console.log(`  Instructions: ${contractInfo.instructionCount}`);
console.log(`  Jump destinations: ${contractInfo.jumpDestCount}`);
console.log(`  Has metadata: ${contractInfo.hasMetadata}`);
console.log(`  PUSH instructions: ${contractInfo.pushCount}`);
console.log(`  Terminators: ${contractInfo.terminatorCount}`);
console.log();

console.log("=== Example Complete ===\n");
