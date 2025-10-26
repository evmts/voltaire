import { generateDocs } from "../shared/docs-generator.js";

export async function generateAddressDocs(): Promise<string> {
	let markdown = "# Address Utility Functions Benchmark\n\n";
	markdown +=
		"Comprehensive comparison of Ethereum address operations across guil (@tevm/primitives), ethers, and viem.\n\n";
	markdown += "## Overview\n\n";
	markdown +=
		"This benchmark suite tests all major address utility functions including:\n";
	markdown += "- Address parsing and formatting\n";
	markdown += "- EIP-55 checksum implementation\n";
	markdown += "- Address comparison operations\n";
	markdown += "- Contract address calculation (CREATE and CREATE2)\n\n";

	// fromHex
	markdown += "## fromHex(hex: string): Address\n\n";
	markdown +=
		"Parse a hex string into an Address object. Tests validation and conversion performance.\n\n";
	markdown += await generateDocs({
		category: "fromHex",
		description: "Convert hex string to Address",
		implementationFiles: {
			guil: "./comparisons/address/fromHex/guil.ts",
			ethers: "./comparisons/address/fromHex/ethers.ts",
			viem: "./comparisons/address/fromHex/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/address/fromHex.bench.ts",
		includeBundle: false,
	});

	// toHex
	markdown += "\n## toHex(address: Address): string\n\n";
	markdown += "Convert an Address to lowercase hex string with 0x prefix.\n\n";
	markdown += await generateDocs({
		category: "toHex",
		description: "Convert Address to hex string",
		implementationFiles: {
			guil: "./comparisons/address/toHex/guil.ts",
			ethers: "./comparisons/address/toHex/ethers.ts",
			viem: "./comparisons/address/toHex/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/address/toHex.bench.ts",
		includeBundle: false,
	});

	// toChecksumHex
	markdown += "\n## toChecksumHex(address: Address): string\n\n";
	markdown +=
		"Convert an Address to EIP-55 checksummed hex string. Tests checksum algorithm performance.\n\n";
	markdown += await generateDocs({
		category: "toChecksumHex",
		description: "Convert Address to checksummed hex (EIP-55)",
		implementationFiles: {
			guil: "./comparisons/address/toChecksumHex/guil.ts",
			ethers: "./comparisons/address/toChecksumHex/ethers.ts",
			viem: "./comparisons/address/toChecksumHex/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/address/toChecksumHex.bench.ts",
		includeBundle: false,
	});

	// isZero
	markdown += "\n## isZero(address: Address): boolean\n\n";
	markdown +=
		"Check if an address is the zero address (0x0000...0000). Tests comparison efficiency.\n\n";
	markdown += await generateDocs({
		category: "isZero",
		description: "Check if address is zero address",
		implementationFiles: {
			guil: "./comparisons/address/isZero/guil.ts",
			ethers: "./comparisons/address/isZero/ethers.ts",
			viem: "./comparisons/address/isZero/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/address/isZero.bench.ts",
		includeBundle: false,
	});

	// equals
	markdown += "\n## equals(a: Address, b: Address): boolean\n\n";
	markdown +=
		"Compare two addresses for equality. Tests byte-by-byte comparison performance.\n\n";
	markdown += await generateDocs({
		category: "equals",
		description: "Compare two addresses for equality",
		implementationFiles: {
			guil: "./comparisons/address/equals/guil.ts",
			ethers: "./comparisons/address/equals/ethers.ts",
			viem: "./comparisons/address/equals/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/address/equals.bench.ts",
		includeBundle: false,
	});

	// calculateCreateAddress
	markdown +=
		"\n## calculateCreateAddress(sender: Address, nonce: bigint): Address\n\n";
	markdown +=
		"Calculate contract address using CREATE opcode formula: keccak256(rlp([sender, nonce])). Tests RLP encoding and hashing.\n\n";
	markdown += await generateDocs({
		category: "calculateCreateAddress",
		description: "Calculate CREATE contract address",
		implementationFiles: {
			guil: "./comparisons/address/calculateCreateAddress/guil.ts",
			ethers: "./comparisons/address/calculateCreateAddress/ethers.ts",
			viem: "./comparisons/address/calculateCreateAddress/viem.ts",
		},
		benchmarkResultsPath:
			"./comparisons/address/calculateCreateAddress.bench.ts",
		includeBundle: false,
	});

	// calculateCreate2Address
	markdown +=
		"\n## calculateCreate2Address(deployer: Address, salt: Uint8Array, initCodeHash: Uint8Array): Address\n\n";
	markdown +=
		"Calculate contract address using CREATE2 opcode formula: keccak256(0xff ++ deployer ++ salt ++ initCodeHash). Tests deterministic address generation.\n\n";
	markdown += await generateDocs({
		category: "calculateCreate2Address",
		description: "Calculate CREATE2 contract address",
		implementationFiles: {
			guil: "./comparisons/address/calculateCreate2Address/guil.ts",
			ethers: "./comparisons/address/calculateCreate2Address/ethers.ts",
			viem: "./comparisons/address/calculateCreate2Address/viem.ts",
		},
		benchmarkResultsPath:
			"./comparisons/address/calculateCreate2Address.bench.ts",
		includeBundle: false,
	});

	markdown += "\n## Summary\n\n";
	markdown +=
		"These benchmarks provide comprehensive performance metrics for all address operations.\n";
	markdown +=
		"Results help developers choose the right library for their specific use case.\n\n";
	markdown += "### Key Insights\n\n";
	markdown +=
		"- **fromHex/toHex**: Measures raw parsing and formatting performance\n";
	markdown +=
		"- **toChecksumHex**: Tests EIP-55 checksum algorithm efficiency\n";
	markdown +=
		"- **isZero/equals**: Compares byte-level comparison strategies\n";
	markdown +=
		"- **CREATE/CREATE2**: Tests complex operations involving RLP encoding and hashing\n\n";

	return markdown;
}

// Allow running directly to generate docs
if (import.meta.url === `file://${process.argv[1]}`) {
	const docs = await generateAddressDocs();
	console.log(docs);
}
