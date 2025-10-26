import { generateDocs } from "../../shared/docs-generator.js";

const docs = await generateDocs({
	category: "Transaction Parsing",
	description:
		"Benchmark comparing transaction parsing performance across guil, ethers, and viem. Tests parsing of legacy, EIP-1559, and EIP-7702 transactions from serialized hex strings.",
	implementationFiles: {
		guil: "./comparisons/transaction/parseTransaction/guil.ts",
		ethers: "./comparisons/transaction/parseTransaction/ethers.ts",
		viem: "./comparisons/transaction/parseTransaction/viem.ts",
	},
	benchmarkResultsPath:
		"./comparisons/transaction/parseTransaction/parseTransaction.bench.ts",
	includeBundle: true,
});

console.log(docs);
