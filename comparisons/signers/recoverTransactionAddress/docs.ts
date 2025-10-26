import { generateDocs } from "../../shared/docs-generator.js";

export async function generateRecoverTransactionAddressDocs(): Promise<string> {
	return generateDocs({
		category: "Recover Transaction Address",
		description:
			"Comparison of recovering the signer address from a signed transaction across guil, ethers, and viem. Tests signature recovery and address derivation performance.",
		implementationFiles: {
			guil: "./comparisons/signers/recoverTransactionAddress/guil.ts",
			ethers: "./comparisons/signers/recoverTransactionAddress/ethers.ts",
			viem: "./comparisons/signers/recoverTransactionAddress/viem.ts",
		},
		benchmarkResultsPath:
			"./comparisons/signers/recoverTransactionAddress/recoverTransactionAddress.bench.ts",
		includeBundle: true,
	});
}

// Allow running directly to generate docs
if (import.meta.url === `file://${process.argv[1]}`) {
	const docs = await generateRecoverTransactionAddressDocs();
	console.log(docs);
}
