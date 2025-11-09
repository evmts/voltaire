/**
 * Disassembly Example
 *
 * Demonstrates:
 * - Formatting bytecode as human-readable instructions
 * - Formatting individual instructions
 * - Creating disassembly output
 * - Analyzing bytecode with formatted output
 */

import { Bytecode } from "../../../src/primitives/Bytecode/index.js";

console.log("\n=== Disassembly Example ===\n");

// ============================================================
// Basic Disassembly
// ============================================================

console.log("--- Basic Disassembly ---\n");

const simpleCode = Bytecode.fromHex("0x60016002015b00");
console.log(`Bytecode: ${Bytecode.toHex(simpleCode)}\n`);

const disassembly = Bytecode.formatInstructions(simpleCode);

console.log("Disassembly:");
disassembly.forEach((line) => {
  console.log(`  ${line}`);
});
console.log();

// ============================================================
// Complex Bytecode Disassembly
// ============================================================

console.log("--- Complex Bytecode Disassembly ---\n");

// Solidity constructor prefix pattern
const constructorCode = Bytecode.fromHex(
  "0x608060405234801561001057600080fd5b50",
);

console.log(`Bytecode: ${Bytecode.toHex(constructorCode)}\n`);

const constructorDisasm = Bytecode.formatInstructions(constructorCode);

console.log("Disassembly:");
constructorDisasm.forEach((line) => {
  console.log(`  ${line}`);
});
console.log();

// ============================================================
// Formatting Individual Instructions
// ============================================================

console.log("--- Formatting Individual Instructions ---\n");

const instructions = Bytecode.parseInstructions(simpleCode);

console.log("Individual instruction formatting:");
instructions.forEach((inst) => {
  const formatted = Bytecode.formatInstruction(inst);
  console.log(`  ${formatted}`);
});
console.log();

// ============================================================
// Annotated Disassembly
// ============================================================

console.log("--- Annotated Disassembly ---\n");

function annotatedDisassembly(code: typeof Bytecode.prototype): string[] {
  const analysis = Bytecode.analyze(code);
  const lines: string[] = [];

  analysis.instructions.forEach((inst) => {
    let line = Bytecode.formatInstruction(inst);

    // Add annotations
    const annotations: string[] = [];

    if (analysis.jumpDestinations.has(inst.position)) {
      annotations.push("JUMP TARGET");
    }

    if (Bytecode.isTerminator(inst.opcode)) {
      annotations.push("TERMINATOR");
    }

    if (annotations.length > 0) {
      line += ` ; ${annotations.join(", ")}`;
    }

    lines.push(line);
  });

  return lines;
}

const annotatedCode = Bytecode.fromHex("0x600560565b60016002015b00");
console.log(`Bytecode: ${Bytecode.toHex(annotatedCode)}\n`);

const annotated = annotatedDisassembly(annotatedCode);

console.log("Annotated disassembly:");
annotated.forEach((line) => {
  console.log(`  ${line}`);
});
console.log();

// ============================================================
// Side-by-Side Comparison
// ============================================================

console.log("--- Side-by-Side Comparison ---\n");

function sideBySide(code: typeof Bytecode.prototype): void {
  const instructions = Bytecode.parseInstructions(code);

  console.log("Pos  | Hex        | Disassembly");
  console.log("-----|------------|---------------------------");

  instructions.forEach((inst) => {
    const pos = inst.position.toString().padStart(4, " ");
    const opcodeHex = `0x${inst.opcode.toString(16).padStart(2, "0")}`;

    let hex = opcodeHex;
    if (inst.pushData) {
      const data = Array.from(inst.pushData)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      hex += ` ${data}`;
    }

    const hexPadded = hex.padEnd(10, " ");
    const disasm = Bytecode.formatInstruction(inst).split(": ")[1] || "";

    console.log(`${pos} | ${hexPadded} | ${disasm}`);
  });
}

console.log("Simple bytecode:");
sideBySide(simpleCode);
console.log();

// ============================================================
// Disassembly with PUSH Values
// ============================================================

console.log("--- Disassembly with PUSH Values ---\n");

const pushCode = Bytecode.fromHex(
  "0x60ff61123463abcdef01627fffffff5b00",
);
console.log(`Bytecode: ${Bytecode.toHex(pushCode)}\n`);

function disassemblyWithValues(code: typeof Bytecode.prototype): void {
  const instructions = Bytecode.parseInstructions(code);

  instructions.forEach((inst) => {
    const formatted = Bytecode.formatInstruction(inst);
    console.log(`  ${formatted}`);

    if (inst.pushData) {
      let value = 0n;
      for (const byte of inst.pushData) {
        value = (value << 8n) | BigInt(byte);
      }
      console.log(`    -> Decimal: ${value}`);
      console.log(`    -> Hex: 0x${value.toString(16)}`);
    }
  });
}

disassemblyWithValues(pushCode);
console.log();

// ============================================================
// Disassembly with Jump Analysis
// ============================================================

console.log("--- Disassembly with Jump Analysis ---\n");

const jumpCode = Bytecode.fromHex(
  "0x6005565b60016002015b600a575b00",
);
console.log(`Bytecode: ${Bytecode.toHex(jumpCode)}\n`);

function disassemblyWithJumps(code: typeof Bytecode.prototype): void {
  const analysis = Bytecode.analyze(code);
  const jumpdests = analysis.jumpDestinations;

  console.log("Valid JUMPDEST positions:", Array.from(jumpdests).join(", "));
  console.log();

  console.log("Disassembly:");
  analysis.instructions.forEach((inst) => {
    let prefix = "  ";

    // Mark jump destinations
    if (jumpdests.has(inst.position)) {
      prefix = "→ ";
    }

    const formatted = Bytecode.formatInstruction(inst);
    console.log(`${prefix}${formatted}`);

    // Annotate JUMP/JUMPI with target validation
    if (inst.opcode === 0x56 || inst.opcode === 0x57) {
      console.log(`    (Jump instruction)`);
    }
  });
}

disassemblyWithJumps(jumpCode);
console.log();

// ============================================================
// Grouped Disassembly
// ============================================================

console.log("--- Grouped Disassembly ---\n");

function groupedDisassembly(code: typeof Bytecode.prototype): void {
  const analysis = Bytecode.analyze(code);
  let currentBlock = 0;

  console.log(`Block ${currentBlock}:`);

  analysis.instructions.forEach((inst, i) => {
    // Start new block at JUMPDEST
    if (analysis.jumpDestinations.has(inst.position) && i > 0) {
      currentBlock++;
      console.log();
      console.log(`Block ${currentBlock}:`);
    }

    const formatted = Bytecode.formatInstruction(inst);
    console.log(`  ${formatted}`);

    // End block at terminator or jump
    if (
      Bytecode.isTerminator(inst.opcode) ||
      inst.opcode === 0x56 ||
      inst.opcode === 0x57
    ) {
      if (i < analysis.instructions.length - 1) {
        // Don't print extra newline at end
        console.log();
      }
    }
  });
}

const blockedCode = Bytecode.fromHex(
  "0x600160020100600360045b60ff5b00",
);
console.log(`Bytecode: ${Bytecode.toHex(blockedCode)}\n`);

groupedDisassembly(blockedCode);
console.log();

// ============================================================
// Compact Disassembly
// ============================================================

console.log("--- Compact Disassembly ---\n");

function compactDisassembly(code: typeof Bytecode.prototype): string {
  const instructions = Bytecode.parseInstructions(code);

  return instructions
    .map((inst) => {
      const formatted = Bytecode.formatInstruction(inst);
      // Extract just the opcode and data part
      const parts = formatted.split(": ");
      return parts[1] || formatted;
    })
    .join(" ; ");
}

const compactCode = Bytecode.fromHex("0x60016002015b00");
const compact = compactDisassembly(compactCode);

console.log(`Bytecode: ${Bytecode.toHex(compactCode)}`);
console.log(`Compact: ${compact}`);
console.log();

// ============================================================
// Disassembly Statistics
// ============================================================

console.log("--- Disassembly Statistics ---\n");

function disassemblyStats(code: typeof Bytecode.prototype): void {
  const analysis = Bytecode.analyze(code);

  console.log("Bytecode statistics:");
  console.log(`  Size: ${Bytecode.size(code)} bytes`);
  console.log(`  Instructions: ${analysis.instructions.length}`);
  console.log(`  Valid: ${analysis.valid}`);
  console.log();

  console.log("Disassembly:");
  const disasm = Bytecode.formatInstructions(code);
  disasm.forEach((line) => {
    console.log(`  ${line}`);
  });
}

const statsCode = Bytecode.fromHex("0x608060405234801561001057600080fd5b");
disassemblyStats(statsCode);
console.log();

// ============================================================
// Export Disassembly
// ============================================================

console.log("--- Export Disassembly ---\n");

function exportDisassembly(code: typeof Bytecode.prototype): string {
  const lines: string[] = [];

  lines.push("; Bytecode disassembly");
  lines.push(`;   Size: ${Bytecode.size(code)} bytes`);
  lines.push(`;   Hex: ${Bytecode.toHex(code)}`);
  lines.push("");

  const disasm = Bytecode.formatInstructions(code);
  lines.push(...disasm);

  return lines.join("\n");
}

const exportCode = Bytecode.fromHex("0x60016002015b00");
const exported = exportDisassembly(exportCode);

console.log("Exported disassembly:");
console.log(exported);
console.log();

console.log("=== Example Complete ===\n");
