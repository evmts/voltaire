import { generateDocs } from "../shared/docs-generator.js";

export async function generateEip191Docs(): Promise<string> {
	return generateDocs({
		category: "EIP-191 Personal Message Hashing",
		description:
			"Comparison of EIP-191 personal message hashing implementations across guil, ethers, and viem. EIP-191 defines the standard format for signed messages: `\\x19Ethereum Signed Message:\\n${message.length}${message}`. This benchmark tests both string and Uint8Array message inputs.",
		implementationFiles: {
			guil: "./comparisons/eip191/guil.ts",
			ethers: "./comparisons/eip191/ethers.ts",
			viem: "./comparisons/eip191/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/eip191/hashMessage.bench.ts",
		includeBundle: true,
	});
}

// Allow running directly to generate docs
if (import.meta.url === `file://${process.argv[1]}`) {
	const docs = await generateEip191Docs();
}
