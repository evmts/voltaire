import { generateDocs } from "../shared/docs-generator.js";

export async function generateSolidityPackedDocs(): Promise<string> {
	let allDocs = "# Solidity Packed Hashing Benchmarks\n\n";
	allDocs +=
		"Comprehensive comparison of Solidity packed hashing implementations across guil (@tevm/primitives), ethers, and viem.\n\n";
	allDocs += "## Overview\n\n";
	allDocs +=
		"Solidity packed hashing combines `abi.encodePacked()` with cryptographic hash functions. These utilities are essential for:\n\n";
	allDocs +=
		"- **CREATE2 Address Calculation**: Deterministic contract deployment addresses\n";
	allDocs +=
		"- **Merkle Tree Construction**: Efficient verification of large datasets\n";
	allDocs +=
		"- **Signature Verification**: Hash messages before signing/verification\n";
	allDocs +=
		"- **Cross-Chain Message Hashing**: Consistent message identification\n\n";
	allDocs +=
		"**Key Difference**: Ethers provides these as single convenience functions, while viem and guil require manual composition of `encodePacked()` and hash functions. This benchmark measures the performance difference between convenience and flexibility.\n\n";
	allDocs += "---\n\n";

	// Generate docs for each function
	const functions = [
		{
			name: "solidityPackedKeccak256",
			description:
				"Computes keccak256(abi.encodePacked(...)) in a single operation. Ethers provides this as a dedicated function, while viem and guil require manual composition. Used extensively in CREATE2 address calculation and Merkle tree construction.",
		},
		{
			name: "solidityPackedSha256",
			description:
				"Computes sha256(abi.encodePacked(...)) in a single operation. Ethers provides this as a dedicated function, while viem uses native sha256(), and guil uses @noble/hashes. Common in cross-chain bridges and Bitcoin-compatible signature schemes.",
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
					guil: `./comparisons/solidity-packed/${func.name}/guil.ts`,
					ethers: `./comparisons/solidity-packed/${func.name}/ethers.ts`,
					viem: `./comparisons/solidity-packed/${func.name}/viem.ts`,
				},
				benchmarkResultsPath: `./comparisons/solidity-packed/${func.name}/${func.name}.bench.ts`,
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
	const docs = await generateSolidityPackedDocs();
}
