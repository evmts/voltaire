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

const creationAnalysis = Bytecode.analyze(creationCode);
const creationDisasm = Bytecode.formatInstructions(creationCode);
creationDisasm.slice(0, 10).forEach((line) => {});

const runtimeAnalysis = Bytecode.analyze(runtimeCode);

// Example: contract with constructor parameter
// contract Token {
//   uint256 initialSupply;
//   constructor(uint256 _supply) { initialSupply = _supply; }
// }

// Creation bytecode + constructor argument (1000000)
const withArgs = Bytecode.fromHex(
	"0x608060405234801561001057600080fd5b506040516101503803806101508339818101604052810190610032919061007a565b806000819055505061009f565b600080fd5b6000819050919050565b61005781610044565b811461006257600080fd5b50565b6000815190506100748161004e565b92915050565b6000602082840312156100905761008f61003f565b5b600061009e84828501610065565b9150509190505056fe00000000000000000000000000000000000000000000000000000000000f4240",
);

// Extract constructor argument (last 32 bytes in this case)
const argData = withArgs.slice(-32);
let argValue = 0n;
for (const byte of argData) {
	argValue = (argValue << 8n) | BigInt(byte);
}

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
if (result.reason) {
}

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
				creationAnalysis.instructions.length -
				runtimeAnalysis.instructions.length,
		},
	};
}

const comparison = compareCreationAndRuntime(creationCode, runtimeCode);

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
if (selectors.length > 0) {
	selectors.forEach((selector, i) => {});
} else {
}

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
if (constructorInfo.pattern) {
}

function analyzeSizeOptimization(code: typeof Bytecode.prototype) {
	const analysis = Bytecode.analyze(code);

	const pushInstructions = analysis.instructions.filter((i) =>
		Bytecode.isPush(i.opcode),
	);

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
