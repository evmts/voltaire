import { generateDocs } from "../../shared/docs-generator.js";

const docs = await generateDocs({
	category: "Transaction Type Detection",
	description:
		"Benchmark comparing transaction type detection performance across guil, ethers, and viem. Tests detecting transaction type (legacy, EIP-1559, EIP-7702) from serialized hex strings.",
	implementationFiles: {
		guil: "./comparisons/transaction/detectTransactionType/guil.ts",
		ethers: "./comparisons/transaction/detectTransactionType/ethers.ts",
		viem: "./comparisons/transaction/detectTransactionType/viem.ts",
	},
	benchmarkResultsPath:
		"./comparisons/transaction/detectTransactionType/detectTransactionType.bench.ts",
	includeBundle: true,
});

console.log(docs);
