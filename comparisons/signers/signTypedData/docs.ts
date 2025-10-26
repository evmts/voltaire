import { generateDocs } from "../../shared/docs-generator.js";

export async function generateSignTypedDataDocs(): Promise<string> {
	return generateDocs({
		category: "Sign Typed Data (EIP-712)",
		description:
			"Comparison of signing structured typed data using EIP-712 across guil, ethers, and viem.",
		implementationFiles: {
			guil: "./comparisons/signers/signTypedData/guil.ts",
			ethers: "./comparisons/signers/signTypedData/ethers.ts",
			viem: "./comparisons/signers/signTypedData/viem.ts",
		},
		benchmarkResultsPath:
			"./comparisons/signers/signTypedData/signTypedData.bench.ts",
		includeBundle: true,
	});
}

// Allow running directly to generate docs
if (import.meta.url === `file://${process.argv[1]}`) {
	const docs = await generateSignTypedDataDocs();
	console.log(docs);
}
