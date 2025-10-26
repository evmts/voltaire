import { generateDocs } from "../../shared/docs-generator.js";

export async function generateGetAddressDocs(): Promise<string> {
	return generateDocs({
		category: "Get Address",
		description:
			"Comparison of retrieving the Ethereum address from a signer across guil, ethers, and viem.",
		implementationFiles: {
			guil: "./comparisons/signers/getAddress/guil.ts",
			ethers: "./comparisons/signers/getAddress/ethers.ts",
			viem: "./comparisons/signers/getAddress/viem.ts",
		},
		benchmarkResultsPath:
			"./comparisons/signers/getAddress/getAddress.bench.ts",
		includeBundle: true,
	});
}

// Allow running directly to generate docs
if (import.meta.url === `file://${process.argv[1]}`) {
	const docs = await generateGetAddressDocs();
	console.log(docs);
}
