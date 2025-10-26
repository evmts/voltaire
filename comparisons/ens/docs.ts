import { generateDocs } from "../shared/docs-generator.js";

export async function generateEnsNamehashDocs(): Promise<string> {
	return generateDocs({
		category: "ENS Namehash",
		description:
			"Comparison of ENS namehash implementations across guil, ethers, and viem. Namehash converts human-readable ENS names into deterministic node identifiers.",
		implementationFiles: {
			guil: "./comparisons/ens/namehash/guil.ts",
			ethers: "./comparisons/ens/namehash/ethers.ts",
			viem: "./comparisons/ens/namehash/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/ens/namehash.bench.ts",
		includeBundle: false,
	});
}

export async function generateEnsLabelhashDocs(): Promise<string> {
	return generateDocs({
		category: "ENS Labelhash",
		description:
			"Comparison of ENS labelhash implementations across guil, ethers, and viem. Labelhash computes the keccak256 hash of a single ENS label.",
		implementationFiles: {
			guil: "./comparisons/ens/labelhash/guil.ts",
			ethers: "./comparisons/ens/labelhash/ethers.ts",
			viem: "./comparisons/ens/labelhash/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/ens/labelhash.bench.ts",
		includeBundle: false,
	});
}

export async function generateEnsNormalizeDocs(): Promise<string> {
	return generateDocs({
		category: "ENS Normalize",
		description:
			"Comparison of ENS name normalization implementations across guil, ethers, and viem. Normalization ensures ENS names conform to ENSIP-15 standards.",
		implementationFiles: {
			guil: "./comparisons/ens/normalize/guil.ts",
			ethers: "./comparisons/ens/normalize/ethers.ts",
			viem: "./comparisons/ens/normalize/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/ens/normalize.bench.ts",
		includeBundle: false,
	});
}

// Allow running directly to generate all docs
if (import.meta.url === `file://${process.argv[1]}`) {
	console.log("## ENS Namehash\n");
	console.log(await generateEnsNamehashDocs());
	console.log("\n## ENS Labelhash\n");
	console.log(await generateEnsLabelhashDocs());
	console.log("\n## ENS Normalize\n");
	console.log(await generateEnsNormalizeDocs());
}
