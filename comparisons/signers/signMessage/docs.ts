import { generateDocs } from "../../shared/docs-generator.js";

export async function generateSignMessageDocs(): Promise<string> {
	return generateDocs({
		category: "Sign Message (EIP-191)",
		description:
			"Comparison of signing messages using EIP-191 personal message format across guil, ethers, and viem.",
		implementationFiles: {
			guil: "./comparisons/signers/signMessage/guil.ts",
			ethers: "./comparisons/signers/signMessage/ethers.ts",
			viem: "./comparisons/signers/signMessage/viem.ts",
		},
		benchmarkResultsPath:
			"./comparisons/signers/signMessage/signMessage.bench.ts",
		includeBundle: true,
	});
}

// Allow running directly to generate docs
if (import.meta.url === `file://${process.argv[1]}`) {
	const docs = await generateSignMessageDocs();
	console.log(docs);
}
