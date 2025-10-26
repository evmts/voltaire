import { generateDocs } from "../shared/docs-generator.js";

export async function generateAbiDocs(): Promise<string> {
	let allDocs = "# ABI Encoding/Decoding Benchmarks\n\n";
	allDocs +=
		"Comprehensive comparison of ABI encoding and decoding implementations across guil (@tevm/primitives), ethers, and viem.\n\n";
	allDocs += "## Overview\n\n";
	allDocs +=
		"ABI (Application Binary Interface) encoding is fundamental to Ethereum smart contract interaction. This benchmark suite compares:\n\n";
	allDocs += "- **encodeAbiParameters**: Low-level parameter encoding\n";
	allDocs += "- **decodeAbiParameters**: Low-level parameter decoding\n";
	allDocs += "- **computeSelector**: Function selector generation\n";
	allDocs +=
		"- **encodeFunctionData**: High-level function call data encoding\n";
	allDocs +=
		"- **decodeFunctionData**: High-level function call data decoding\n";
	allDocs +=
		"- **encodePacked**: Non-standard packed encoding (similar to Solidity `abi.encodePacked`)\n\n";
	allDocs += "---\n\n";

	// Generate docs for each function
	const functions = [
		{
			name: "encodeAbiParameters",
			description:
				"Encodes ABI parameters into their binary representation. Tests both simple (single uint256) and complex (address, bytes32, arrays, strings) scenarios.",
		},
		{
			name: "decodeAbiParameters",
			description:
				"Decodes binary ABI data back into typed parameters. Tests both simple and complex parameter types.",
		},
		{
			name: "computeSelector",
			description:
				"Computes the 4-byte function selector from a function signature. Tests common ERC-20 function signatures.",
		},
		{
			name: "encodeFunctionData",
			description:
				"Encodes complete function call data (selector + parameters). Tests both simple transfers and complex multi-parameter functions like DEX swaps.",
		},
		{
			name: "decodeFunctionData",
			description:
				"Decodes function call data back into function arguments. Tests both simple and complex function calls.",
		},
		{
			name: "encodePacked",
			description:
				"Non-standard packed encoding without padding (similar to Solidity abi.encodePacked). Tests various type combinations.",
		},
	];

	for (const func of functions) {
		allDocs += `## ${func.name}\n\n`;
		allDocs += `${func.description}\n\n`;

		try {
			const funcDocs = await generateDocs({
				category: func.name,
				description: func.description,
				implementationFiles: {
					guil: `./comparisons/abi/${func.name}-guil.ts`,
					ethers: `./comparisons/abi/${func.name}-ethers.ts`,
					viem: `./comparisons/abi/${func.name}-viem.ts`,
				},
				benchmarkResultsPath: `./comparisons/abi/${func.name}.bench.ts`,
				includeBundle: false,
			});
			allDocs += funcDocs + "\n\n---\n\n";
		} catch (error) {
			allDocs += `*Documentation generation failed: ${error}*\n\n---\n\n`;
		}
	}

	return allDocs;
}

// Allow running directly to generate docs
if (import.meta.url === `file://${process.argv[1]}`) {
	const docs = await generateAbiDocs();
	console.log(docs);
}
