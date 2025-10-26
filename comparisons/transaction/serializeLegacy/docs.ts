import { generateDocs } from "../../shared/docs-generator.js";

const docs = await generateDocs({
	category: "Transaction Serialization - Legacy (Type 0)",
	description:
		"Benchmark comparing legacy transaction serialization performance across guil, ethers, and viem. Legacy transactions use EIP-155 signature format with v = chainId * 2 + 35 + {0,1}.",
	implementationFiles: {
		guil: "./comparisons/transaction/serializeLegacy/guil.ts",
		ethers: "./comparisons/transaction/serializeLegacy/ethers.ts",
		viem: "./comparisons/transaction/serializeLegacy/viem.ts",
	},
	benchmarkResultsPath:
		"./comparisons/transaction/serializeLegacy/serializeLegacy.bench.ts",
	includeBundle: true,
});

console.log(docs);
