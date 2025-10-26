import { generateDocs } from "../shared/docs-generator.js";

/**
 * Generate documentation for analyzeJumpDestinations
 */
export async function generateAnalyzeJumpDestinationsDocs(): Promise<string> {
	return generateDocs({
		category: "analyzeJumpDestinations - Bytecode Analysis",
		description:
			"Analyzes EVM bytecode to find all valid JUMPDEST instructions. This function is critical for EVM execution as it identifies valid jump targets while correctly handling JUMPDEST opcodes that appear within PUSH instruction data (which are not valid jump destinations).\n\n**Note:** This is a guil-exclusive feature. Neither ethers nor viem provide low-level bytecode analysis utilities.",
		implementationFiles: {
			guil: "./comparisons/bytecode/analyzeJumpDestinations/guil.ts",
			ethers: "./comparisons/bytecode/analyzeJumpDestinations/ethers.ts",
			viem: "./comparisons/bytecode/analyzeJumpDestinations/viem.ts",
		},
		benchmarkResultsPath:
			"./comparisons/bytecode/analyzeJumpDestinations/analyzeJumpDestinations.bench.ts",
		includeBundle: false,
	});
}

/**
 * Generate documentation for validateBytecode
 */
export async function generateValidateBytecodeDocs(): Promise<string> {
	return generateDocs({
		category: "validateBytecode - Bytecode Validation",
		description:
			"Validates the structural integrity of EVM bytecode by ensuring PUSH instructions have sufficient data. This prevents execution of truncated or malformed bytecode that could cause unexpected behavior.\n\n**Note:** This is a guil-exclusive feature. Neither ethers nor viem provide low-level bytecode validation utilities.",
		implementationFiles: {
			guil: "./comparisons/bytecode/validateBytecode/guil.ts",
			ethers: "./comparisons/bytecode/validateBytecode/ethers.ts",
			viem: "./comparisons/bytecode/validateBytecode/viem.ts",
		},
		benchmarkResultsPath:
			"./comparisons/bytecode/validateBytecode/validateBytecode.bench.ts",
		includeBundle: false,
	});
}

/**
 * Generate documentation for isBytecodeBoundary
 */
export async function generateIsBytecodeBoundaryDocs(): Promise<string> {
	return generateDocs({
		category: "isBytecodeBoundary - Bytecode Position Checking",
		description:
			"Determines if a specific position in bytecode is at an opcode boundary (not in the middle of PUSH instruction data). This is essential for correctly parsing and analyzing bytecode, especially when implementing debuggers or disassemblers.\n\n**Note:** This is a guil-exclusive feature. Neither ethers nor viem provide low-level bytecode boundary checking utilities.",
		implementationFiles: {
			guil: "./comparisons/bytecode/isBytecodeBoundary/guil.ts",
			ethers: "./comparisons/bytecode/isBytecodeBoundary/ethers.ts",
			viem: "./comparisons/bytecode/isBytecodeBoundary/viem.ts",
		},
		benchmarkResultsPath:
			"./comparisons/bytecode/isBytecodeBoundary/isBytecodeBoundary.bench.ts",
		includeBundle: false,
	});
}

/**
 * Generate documentation for isValidJumpDest
 */
export async function generateIsValidJumpDestDocs(): Promise<string> {
	return generateDocs({
		category: "isValidJumpDest - JUMPDEST Validation",
		description:
			"Checks if a specific position in bytecode is a valid JUMPDEST instruction. This combines boundary checking with opcode validation to determine if a JUMP/JUMPI instruction can safely target a specific position. Critical for EVM execution safety.\n\n**Note:** This is a guil-exclusive feature. Neither ethers nor viem provide low-level JUMPDEST validation utilities.",
		implementationFiles: {
			guil: "./comparisons/bytecode/isValidJumpDest/guil.ts",
			ethers: "./comparisons/bytecode/isValidJumpDest/ethers.ts",
			viem: "./comparisons/bytecode/isValidJumpDest/viem.ts",
		},
		benchmarkResultsPath:
			"./comparisons/bytecode/isValidJumpDest/isValidJumpDest.bench.ts",
		includeBundle: false,
	});
}

/**
 * Generate comprehensive documentation for all bytecode functions
 */
export async function generateAllBytecodeDocs(): Promise<string> {
	const docs = [
		"# EVM Bytecode Analysis - Comprehensive Documentation\n",
		"This document provides comprehensive documentation for all EVM bytecode analysis functions in guil.\n",
		"These are advanced utilities for working with raw EVM bytecode, useful for building debuggers, disassemblers, and execution engines.\n\n",
		"## Overview\n",
		"**Important:** All bytecode analysis functions are guil-exclusive features. Neither ethers nor viem provide these low-level utilities, as they focus on higher-level interactions with the Ethereum network.\n\n",
		"---\n\n",
	];

	// Add each function's documentation
	docs.push("## analyzeJumpDestinations\n\n");
	docs.push(await generateAnalyzeJumpDestinationsDocs());
	docs.push("\n\n---\n\n");

	docs.push("## validateBytecode\n\n");
	docs.push(await generateValidateBytecodeDocs());
	docs.push("\n\n---\n\n");

	docs.push("## isBytecodeBoundary\n\n");
	docs.push(await generateIsBytecodeBoundaryDocs());
	docs.push("\n\n---\n\n");

	docs.push("## isValidJumpDest\n\n");
	docs.push(await generateIsValidJumpDestDocs());
	docs.push("\n\n---\n\n");

	docs.push("## Use Cases\n\n");
	docs.push("These bytecode analysis functions are essential for:\n\n");
	docs.push(
		"- **EVM Execution Engines**: Validating jump targets before execution\n",
	);
	docs.push(
		"- **Debuggers**: Identifying instruction boundaries for breakpoints\n",
	);
	docs.push(
		"- **Disassemblers**: Converting bytecode to human-readable assembly\n",
	);
	docs.push(
		"- **Security Analysis**: Detecting malformed or potentially malicious bytecode\n",
	);
	docs.push("- **Gas Estimation**: Accurately analyzing execution paths\n\n");

	docs.push("## Why guil?\n\n");
	docs.push(
		"While ethers and viem are excellent for interacting with the Ethereum network, they don't provide low-level bytecode analysis utilities. Guil fills this gap by offering:\n\n",
	);
	docs.push(
		"- **Comprehensive bytecode analysis**: All functions needed for EVM execution\n",
	);
	docs.push(
		"- **Correct PUSH handling**: Properly skips PUSH instruction data\n",
	);
	docs.push(
		"- **Performance**: Optimized single-pass algorithms for large bytecode\n",
	);
	docs.push(
		"- **Type safety**: Full TypeScript support with proper type definitions\n\n",
	);

	return docs.join("");
}

// Allow running directly to generate docs
if (import.meta.url === `file://${process.argv[1]}`) {
	const docs = await generateAllBytecodeDocs();
}
