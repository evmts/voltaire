import { generateDocs } from "../../shared/docs-generator.js";

const docs = await generateDocs({
	category: "Transaction Serialization - EIP-7702 (Type 4)",
	description:
		"Benchmark comparing EIP-7702 transaction serialization performance across guil and viem. EIP-7702 introduces authorization lists for account abstraction. Note: Ethers v6 does not support EIP-7702 yet.",
	implementationFiles: {
		guil: "./comparisons/transaction/serializeEip7702/guil.ts",
		ethers: "./comparisons/transaction/serializeEip7702/ethers.ts",
		viem: "./comparisons/transaction/serializeEip7702/viem.ts",
	},
	benchmarkResultsPath:
		"./comparisons/transaction/serializeEip7702/serializeEip7702.bench.ts",
	includeBundle: true,
});

console.log(docs);
