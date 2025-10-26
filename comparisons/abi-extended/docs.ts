import { generateDocs } from "../shared/docs-generator.js";

export async function generateAbiExtendedDocs(): Promise<string> {
	let allDocs = "# Extended ABI Parsing Utilities Benchmarks\n\n";
	allDocs +=
		"Comprehensive comparison of ABI parsing and developer productivity utilities across guil (@tevm/primitives), ethers, and viem.\n\n";
	allDocs += "## Overview\n\n";
	allDocs +=
		"These utilities are essential for developer productivity when working with smart contracts. They enable parsing human-readable ABI signatures, extracting items from ABIs, and generating function selectors - all without requiring raw JSON ABIs.\n\n";
	allDocs +=
		"**Note:** Most of these functions are not implemented in guil (@tevm/primitives) as they are parser/developer tools rather than core encoding/decoding primitives. The benchmarks show ethers and viem implementations, with guil using viem as a fallback.\n\n";
	allDocs += "### Functions Benchmarked\n\n";
	allDocs +=
		"1. **parseAbi** - Parse human-readable ABI strings to structured format\n";
	allDocs += "2. **parseAbiItem** - Parse single human-readable ABI item\n";
	allDocs += "3. **getAbiItem** - Extract specific item from ABI by name\n";
	allDocs +=
		"4. **toFunctionSelector** - Get 4-byte function selector from signature\n\n";
	allDocs += "---\n\n";

	// Generate docs for each function
	const functions = [
		{
			name: "parseAbi",
			description:
				"Parses an array of human-readable ABI signatures into structured ABI format. Essential for writing clean, maintainable smart contract interfaces without raw JSON. Tests ERC-20 function signatures including functions, events, and errors.",
		},
		{
			name: "parseAbiItem",
			description:
				"Parses a single human-readable ABI signature into its structured representation. Useful for dynamic ABI generation and testing. Tests functions, events, and custom errors individually.",
		},
		{
			name: "getAbiItem",
			description:
				"Extracts a specific item from an ABI by name. Essential for working with large ABIs where you need to access specific functions or events. Tests extracting both functions and events from an ERC-20 ABI.",
		},
		{
			name: "toFunctionSelector",
			description:
				"Computes the 4-byte function selector from a function signature. The selector is the first 4 bytes of the keccak256 hash of the signature. Fundamental for encoding function calls. Tests common ERC-20 function signatures. Note: Guil implements this as 'computeSelector'.",
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
					guil: `./comparisons/abi-extended/${func.name}-guil.ts`,
					ethers: `./comparisons/abi-extended/${func.name}-ethers.ts`,
					viem: `./comparisons/abi-extended/${func.name}-viem.ts`,
				},
				benchmarkResultsPath: `./comparisons/abi-extended/${func.name}.bench.ts`,
				includeBundle: false,
			});
			allDocs += `${funcDocs}\n\n---\n\n`;
		} catch (error) {
			allDocs += `*Documentation generation failed: ${error}*\n\n---\n\n`;
		}
	}

	return allDocs;
}

// Allow running directly to generate docs
if (import.meta.url === `file://${process.argv[1]}`) {
	const docs = await generateAbiExtendedDocs();
}
