import { generateDocs } from "../shared/docs-generator.js";

export async function generateHashTypedDataDocs(): Promise<string> {
	return generateDocs({
		category: "EIP-712 hashTypedData",
		description:
			"Comparison of EIP-712 typed data hashing implementations across guil, ethers, and viem. Tests hashing of complete typed data structures including domain, types, and message.",
		implementationFiles: {
			guil: "./comparisons/eip712/hashTypedData.guil.ts",
			ethers: "./comparisons/eip712/hashTypedData.ethers.ts",
			viem: "./comparisons/eip712/hashTypedData.viem.ts",
		},
		benchmarkResultsPath: "./comparisons/eip712/hashTypedData.bench.ts",
		includeBundle: true,
	});
}

export async function generateHashDomainDocs(): Promise<string> {
	return generateDocs({
		category: "EIP-712 hashDomain",
		description:
			"Comparison of EIP-712 domain separator hashing implementations across guil, ethers, and viem. Tests hashing of domain parameters used in EIP-712 signatures.",
		implementationFiles: {
			guil: "./comparisons/eip712/hashDomain.guil.ts",
			ethers: "./comparisons/eip712/hashDomain.ethers.ts",
			viem: "./comparisons/eip712/hashDomain.viem.ts",
		},
		benchmarkResultsPath: "./comparisons/eip712/hashDomain.bench.ts",
		includeBundle: true,
	});
}

export async function generateEip712Docs(): Promise<string> {
	let markdown = "# EIP-712 Benchmarks\n\n";
	markdown +=
		"Comprehensive comparison of EIP-712 typed structured data hashing implementations across guil, ethers, and viem.\n\n";
	markdown +=
		"EIP-712 is a standard for hashing and signing typed structured data, commonly used for secure off-chain message signing in Ethereum applications.\n\n";
	markdown += "---\n\n";

	// Generate docs for hashTypedData
	const hashTypedDataDocs = await generateHashTypedDataDocs();
	markdown += hashTypedDataDocs;
	markdown += "\n\n---\n\n";

	// Generate docs for hashDomain
	const hashDomainDocs = await generateHashDomainDocs();
	markdown += hashDomainDocs;

	return markdown;
}

// Allow running directly to generate docs
if (import.meta.url === `file://${process.argv[1]}`) {
	const docs = await generateEip712Docs();
}
