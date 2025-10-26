import { generateDocs } from "../../shared/docs-generator.js";

const docs = await generateDocs({
	category: "Transaction Hashing",
	description:
		"Benchmark comparing transaction hashing performance across guil, ethers, and viem. Tests computing Keccak256 hash of serialized transactions for all transaction types.",
	implementationFiles: {
		guil: "./comparisons/transaction/hashTransaction/guil.ts",
		ethers: "./comparisons/transaction/hashTransaction/ethers.ts",
		viem: "./comparisons/transaction/hashTransaction/viem.ts",
	},
	benchmarkResultsPath:
		"./comparisons/transaction/hashTransaction/hashTransaction.bench.ts",
	includeBundle: true,
});
