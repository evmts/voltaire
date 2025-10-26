import { generateDocs } from "../../shared/docs-generator.js";

export async function generateCreatePrivateKeySignerDocs(): Promise<string> {
	return generateDocs({
		category: "Create Private Key Signer",
		description:
			"Comparison of creating a signer from a private key across guil, ethers, and viem.",
		implementationFiles: {
			guil: "./comparisons/signers/createPrivateKeySigner/guil.ts",
			ethers: "./comparisons/signers/createPrivateKeySigner/ethers.ts",
			viem: "./comparisons/signers/createPrivateKeySigner/viem.ts",
		},
		benchmarkResultsPath:
			"./comparisons/signers/createPrivateKeySigner/createPrivateKeySigner.bench.ts",
		includeBundle: true,
	});
}

// Allow running directly to generate docs
if (import.meta.url === `file://${process.argv[1]}`) {
	const docs = await generateCreatePrivateKeySignerDocs();
	console.log(docs);
}
