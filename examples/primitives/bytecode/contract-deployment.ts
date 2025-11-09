/**
 * Contract Deployment Analysis Example
 *
 * Demonstrates:
 * - Analyzing contract creation bytecode
 * - Analyzing deployed runtime bytecode
 * - Comparing creation vs runtime code
 * - Extracting constructor arguments
 * - Verifying deployed contracts
 */

import { Bytecode } from "../../../src/primitives/Bytecode/index.js";

console.log("\n=== Contract Deployment Analysis Example ===\n");

// ============================================================
// Understanding Contract Bytecode
// ============================================================

console.log("--- Understanding Contract Bytecode ---\n");

console.log("Contract deployment involves two types of bytecode:");
console.log("1. Creation bytecode: Contains constructor + runtime code");
console.log("2. Runtime bytecode: Stored on-chain after deployment");
console.log();

// ============================================================
// Simple Contract Example
// ============================================================

console.log("--- Simple Contract Example ---\n");

// Example: Simple storage contract (pseudo-code)
// contract Storage {
//   uint256 value;
//   function set(uint256 x) public { value = x; }
//   function get() public view returns (uint256) { return value; }
// }

// Simplified creation bytecode (includes constructor + runtime code)
const creationCode = Bytecode.fromHex(
  "0x608060405234801561001057600080fd5b50610150806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c806360fe47b11461003b5780636d4ce63c14610057575b600080fd5b610055600480360381019061005091906100c3565b610075565b005b61005f61007f565b60405161006c91906100ff565b60405180910390f35b8060008190555050565b60008054905090565b600080fd5b6000819050919050565b6100a08161008d565b81146100ab57600080fd5b50565b6000813590506100bd81610097565b92915050565b6000602082840312156100d9576100d8610088565b5b60006100e7848285016100ae565b91505092915050565b6100f98161008d565b82525050565b600060208201905061011460008301846100f0565b92915050565b",
);

// Deployed runtime bytecode (what's stored on-chain)
const runtimeCode = Bytecode.fromHex(
  "0x608060405234801561001057600080fd5b50600436106100365760003560e01c806360fe47b11461003b5780636d4ce63c14610057575b600080fd5b610055600480360381019061005091906100c3565b610075565b005b61005f61007f565b60405161006c91906100ff565b60405180910390f35b8060008190555050565b60008054905090565b600080fd5b6000819050919050565b6100a08161008d565b81146100ab57600080fd5b50565b6000813590506100bd81610097565b92915050565b6000602082840312156100d9576100d8610088565b5b60006100e7848285016100ae565b91505092915050565b6100f98161008d565b82525050565b600060208201905061011460008301846100f0565b92915050565b",
);

console.log("Creation bytecode:");
console.log(`  Size: ${Bytecode.size(creationCode)} bytes`);
console.log(`  Valid: ${Bytecode.validate(creationCode)}`);
console.log(`  Hex: ${Bytecode.toHex(creationCode).substring(0, 60)}...`);
console.log();

console.log("Runtime bytecode:");
console.log(`  Size: ${Bytecode.size(runtimeCode)} bytes`);
console.log(`  Valid: ${Bytecode.validate(runtimeCode)}`);
console.log(`  Hex: ${Bytecode.toHex(runtimeCode).substring(0, 60)}...`);
console.log();

// ============================================================
// Analyzing Creation Bytecode
// ============================================================

console.log("--- Analyzing Creation Bytecode ---\n");

const creationAnalysis = Bytecode.analyze(creationCode);

console.log("Creation bytecode analysis:");
console.log(`  Valid: ${creationAnalysis.valid}`);
console.log(`  Instructions: ${creationAnalysis.instructions.length}`);
console.log(`  Jump destinations: ${creationAnalysis.jumpDestinations.size}`);
console.log(`  Has metadata: ${Bytecode.hasMetadata(creationCode)}`);
console.log();

// Show first few instructions
console.log("First 10 instructions:");
const creationDisasm = Bytecode.formatInstructions(creationCode);
creationDisasm.slice(0, 10).forEach((line) => {
  console.log(`  ${line}`);
});
console.log(`  ... and ${creationDisasm.length - 10} more`);
console.log();

// ============================================================
// Analyzing Runtime Bytecode
// ============================================================

console.log("--- Analyzing Runtime Bytecode ---\n");

const runtimeAnalysis = Bytecode.analyze(runtimeCode);

console.log("Runtime bytecode analysis:");
console.log(`  Valid: ${runtimeAnalysis.valid}`);
console.log(`  Instructions: ${runtimeAnalysis.instructions.length}`);
console.log(`  Jump destinations: ${runtimeAnalysis.jumpDestinations.size}`);
console.log(`  Has metadata: ${Bytecode.hasMetadata(runtimeCode)}`);
console.log();

// ============================================================
// Constructor with Arguments
// ============================================================

console.log("--- Constructor with Arguments ---\n");

// Example: contract with constructor parameter
// contract Token {
//   uint256 initialSupply;
//   constructor(uint256 _supply) { initialSupply = _supply; }
// }

// Creation bytecode + constructor argument (1000000)
const withArgs = Bytecode.fromHex(
  "0x608060405234801561001057600080fd5b506040516101503803806101508339818101604052810190610032919061007a565b806000819055505061009f565b600080fd5b6000819050919050565b61005781610044565b811461006257600080fd5b50565b6000815190506100748161004e565b92915050565b6000602082840312156100905761008f61003f565b5b600061009e84828501610065565b9150509190505056fe00000000000000000000000000000000000000000000000000000000000f4240",
);

console.log("Bytecode with constructor arguments:");
console.log(`  Total size: ${Bytecode.size(withArgs)} bytes`);
console.log(`  Hex: ${Bytecode.toHex(withArgs).substring(0, 60)}...`);
console.log();

// Extract constructor argument (last 32 bytes in this case)
const argData = withArgs.slice(-32);
let argValue = 0n;
for (const byte of argData) {
  argValue = (argValue << 8n) | BigInt(byte);
}

console.log("Constructor argument extraction:");
console.log(`  Raw bytes: 0x${Array.from(argData).map((b) => b.toString(16).padStart(2, "0")).join("")}`);
console.log(`  Decoded value: ${argValue}`);
console.log(`  Decimal: ${argValue.toString()}`);
console.log();

// ============================================================
// Verifying Deployed Contract
// ============================================================

console.log("--- Verifying Deployed Contract ---\n");

async function verifyDeployedContract(
  deployedCode: typeof Bytecode.prototype,
  expectedRuntimeCode: typeof Bytecode.prototype,
): Promise<{ verified: boolean; reason?: string }> {
  // Strip metadata from both (compiler metadata varies)
  const deployedStripped = Bytecode.stripMetadata(deployedCode);
  const expectedStripped = Bytecode.stripMetadata(expectedRuntimeCode);

  if (Bytecode.equals(deployedStripped, expectedStripped)) {
    return { verified: true };
  }

  // Check if sizes match (quick check)
  if (Bytecode.size(deployedStripped) !== Bytecode.size(expectedStripped)) {
    return {
      verified: false,
      reason: `Size mismatch: deployed=${Bytecode.size(deployedStripped)}, expected=${Bytecode.size(expectedStripped)}`,
    };
  }

  return { verified: false, reason: "Bytecode mismatch" };
}

// Simulate deployed vs expected
const deployed = Bytecode.fromHex(
  "0x608060405234801561001057600080fd5b50600436106100365760003560e01c806360fe47b11461003b5780636d4ce63c14610057575b600080fd5ba264697066733a221220aaaa640033",
);

const expected = Bytecode.fromHex(
  "0x608060405234801561001057600080fd5b50600436106100365760003560e01c806360fe47b11461003b5780636d4ce63c14610057575b600080fd5ba264697066733a221220bbbb640033",
);

const result = await verifyDeployedContract(deployed, expected);

console.log("Contract verification:");
console.log(`  Verified: ${result.verified}`);
if (result.reason) {
  console.log(`  Reason: ${result.reason}`);
}
console.log();

// ============================================================
// Comparing Creation vs Runtime
// ============================================================

console.log("--- Comparing Creation vs Runtime ---\n");

function compareCreationAndRuntime(
  creation: typeof Bytecode.prototype,
  runtime: typeof Bytecode.prototype,
) {
  const creationAnalysis = Bytecode.analyze(creation);
  const runtimeAnalysis = Bytecode.analyze(runtime);

  return {
    creation: {
      size: Bytecode.size(creation),
      instructions: creationAnalysis.instructions.length,
      jumpdests: creationAnalysis.jumpDestinations.size,
      hasMetadata: Bytecode.hasMetadata(creation),
    },
    runtime: {
      size: Bytecode.size(runtime),
      instructions: runtimeAnalysis.instructions.length,
      jumpdests: runtimeAnalysis.jumpDestinations.size,
      hasMetadata: Bytecode.hasMetadata(runtime),
    },
    comparison: {
      sizeRatio: Bytecode.size(creation) / Bytecode.size(runtime),
      instructionDiff:
        creationAnalysis.instructions.length - runtimeAnalysis.instructions.length,
    },
  };
}

const comparison = compareCreationAndRuntime(creationCode, runtimeCode);

console.log("Creation bytecode:");
console.log(`  Size: ${comparison.creation.size} bytes`);
console.log(`  Instructions: ${comparison.creation.instructions}`);
console.log(`  Jump destinations: ${comparison.creation.jumpdests}`);
console.log(`  Has metadata: ${comparison.creation.hasMetadata}`);
console.log();

console.log("Runtime bytecode:");
console.log(`  Size: ${comparison.runtime.size} bytes`);
console.log(`  Instructions: ${comparison.runtime.instructions}`);
console.log(`  Jump destinations: ${comparison.runtime.jumpdests}`);
console.log(`  Has metadata: ${comparison.runtime.hasMetadata}`);
console.log();

console.log("Comparison:");
console.log(`  Size ratio: ${comparison.comparison.sizeRatio.toFixed(2)}x`);
console.log(`  Instruction difference: ${comparison.comparison.instructionDiff}`);
console.log();

// ============================================================
// Finding Function Selectors
// ============================================================

console.log("--- Finding Function Selectors ---\n");

function findFunctionSelectors(code: typeof Bytecode.prototype): string[] {
  const instructions = Bytecode.parseInstructions(code);
  const selectors: string[] = [];

  // Look for PUSH4 instructions (function selectors are 4 bytes)
  for (const inst of instructions) {
    if (inst.opcode === 0x63 && inst.pushData && inst.pushData.length === 4) {
      const selector = Array.from(inst.pushData)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      selectors.push(`0x${selector}`);
    }
  }

  return selectors;
}

const selectors = findFunctionSelectors(runtimeCode);

console.log("Function selectors found in runtime code:");
if (selectors.length > 0) {
  selectors.forEach((selector, i) => {
    console.log(`  ${i + 1}. ${selector}`);
  });
} else {
  console.log("  No PUSH4 selectors found");
}
console.log();

// ============================================================
// Constructor Pattern Detection
// ============================================================

console.log("--- Constructor Pattern Detection ---\n");

function detectConstructor(creation: typeof Bytecode.prototype): {
  hasConstructor: boolean;
  pattern?: string;
} {
  const disassembly = Bytecode.formatInstructions(creation);

  // Look for common constructor patterns
  const hasCodecopy = disassembly.some((line) => line.includes("CODECOPY"));
  const hasReturn = disassembly.some((line) => line.includes("RETURN"));

  if (hasCodecopy && hasReturn) {
    return {
      hasConstructor: true,
      pattern: "Standard Solidity constructor (CODECOPY + RETURN)",
    };
  }

  return { hasConstructor: false };
}

const constructorInfo = detectConstructor(creationCode);

console.log("Constructor detection:");
console.log(`  Has constructor: ${constructorInfo.hasConstructor}`);
if (constructorInfo.pattern) {
  console.log(`  Pattern: ${constructorInfo.pattern}`);
}
console.log();

// ============================================================
// Size Optimization Analysis
// ============================================================

console.log("--- Size Optimization Analysis ---\n");

function analyzeSizeOptimization(code: typeof Bytecode.prototype) {
  const analysis = Bytecode.analyze(code);

  const pushInstructions = analysis.instructions.filter((i) => Bytecode.isPush(i.opcode));

  const totalSize = Bytecode.size(code);
  const metadataSize = Bytecode.hasMetadata(code)
    ? Bytecode.size(code) - Bytecode.size(Bytecode.stripMetadata(code))
    : 0;

  let pushDataSize = 0;
  for (const inst of pushInstructions) {
    if (inst.pushData) {
      pushDataSize += inst.pushData.length;
    }
  }

  return {
    totalSize,
    metadataSize,
    pushDataSize,
    instructionSize: totalSize - metadataSize - pushDataSize,
    pushInstructionCount: pushInstructions.length,
    totalInstructions: analysis.instructions.length,
  };
}

const sizeAnalysis = analyzeSizeOptimization(runtimeCode);

console.log("Runtime bytecode size breakdown:");
console.log(`  Total: ${sizeAnalysis.totalSize} bytes`);
console.log(`  Metadata: ${sizeAnalysis.metadataSize} bytes (${((sizeAnalysis.metadataSize / sizeAnalysis.totalSize) * 100).toFixed(1)}%)`);
console.log(`  PUSH data: ${sizeAnalysis.pushDataSize} bytes (${((sizeAnalysis.pushDataSize / sizeAnalysis.totalSize) * 100).toFixed(1)}%)`);
console.log(`  Instructions: ${sizeAnalysis.instructionSize} bytes (${((sizeAnalysis.instructionSize / sizeAnalysis.totalSize) * 100).toFixed(1)}%)`);
console.log();

console.log("Instruction breakdown:");
console.log(`  Total instructions: ${sizeAnalysis.totalInstructions}`);
console.log(`  PUSH instructions: ${sizeAnalysis.pushInstructionCount} (${((sizeAnalysis.pushInstructionCount / sizeAnalysis.totalInstructions) * 100).toFixed(1)}%)`);
console.log();

console.log("=== Example Complete ===\n");
