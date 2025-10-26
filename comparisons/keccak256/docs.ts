import { generateDocs } from "../shared/docs-generator.js";

export async function generateKeccak256Docs(): Promise<string> {
	return generateDocs({
		category: "Keccak256",
		description:
			"Comparison of keccak256 hashing implementations across guil, ethers, and viem.",
		implementationFiles: {
			guil: "./comparisons/keccak256/guil.ts",
			ethers: "./comparisons/keccak256/ethers.ts",
			viem: "./comparisons/keccak256/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/keccak256/keccak256.bench.ts",
		includeBundle: true,
	});
}

// Allow running directly to generate docs
if (import.meta.url === `file://${process.argv[1]}`) {
	const docs = await generateKeccak256Docs();
	console.log(docs);
}
