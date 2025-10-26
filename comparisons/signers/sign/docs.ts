import { generateDocs } from "../../shared/docs-generator.js";

export async function generateSignDocs(): Promise<string> {
	return generateDocs({
		category: "Sign Transaction",
		description:
			"Comparison of signing EIP-1559 transactions across guil, ethers, and viem. Measures cryptographic signing performance.",
		implementationFiles: {
			guil: "./comparisons/signers/sign/guil.ts",
			ethers: "./comparisons/signers/sign/ethers.ts",
			viem: "./comparisons/signers/sign/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/signers/sign/sign.bench.ts",
		includeBundle: true,
	});
}

// Allow running directly to generate docs
if (import.meta.url === `file://${process.argv[1]}`) {
	const docs = await generateSignDocs();
	console.log(docs);
}
