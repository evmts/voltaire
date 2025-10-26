import { generateDocs } from "../../shared/docs-generator.js";

const docs = await generateDocs({
	category: "Transaction Serialization - EIP-1559 (Type 2)",
	description:
		"Benchmark comparing EIP-1559 transaction serialization performance across guil, ethers, and viem. EIP-1559 transactions introduce maxPriorityFeePerGas and maxFeePerGas fields, along with optional access lists.",
	implementationFiles: {
		guil: "./comparisons/transaction/serializeEip1559/guil.ts",
		ethers: "./comparisons/transaction/serializeEip1559/ethers.ts",
		viem: "./comparisons/transaction/serializeEip1559/viem.ts",
	},
	benchmarkResultsPath:
		"./comparisons/transaction/serializeEip1559/serializeEip1559.bench.ts",
	includeBundle: true,
});

console.log(docs);
