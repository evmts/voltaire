import { generateDocs } from "../shared/docs-generator.js";

export async function generateDataPaddingDocs(): Promise<string> {
	return generateDocs({
		category: "Data Padding",
		description:
			"Comparison of data padding and trimming utilities across guil, ethers, and viem. Includes operations for padding left/right, trimming zeros, and getting byte sizes.",
		implementationFiles: {
			padLeft: {
				guil: "./comparisons/data-padding/padLeft/guil.ts",
				ethers: "./comparisons/data-padding/padLeft/ethers.ts",
				viem: "./comparisons/data-padding/padLeft/viem.ts",
			},
			padRight: {
				guil: "./comparisons/data-padding/padRight/guil.ts",
				ethers: "./comparisons/data-padding/padRight/ethers.ts",
				viem: "./comparisons/data-padding/padRight/viem.ts",
			},
			trim: {
				guil: "./comparisons/data-padding/trim/guil.ts",
				ethers: "./comparisons/data-padding/trim/ethers.ts",
				viem: "./comparisons/data-padding/trim/viem.ts",
			},
			trimRight: {
				guil: "./comparisons/data-padding/trimRight/guil.ts",
				ethers: "./comparisons/data-padding/trimRight/ethers.ts",
				viem: "./comparisons/data-padding/trimRight/viem.ts",
			},
			size: {
				guil: "./comparisons/data-padding/size/guil.ts",
				ethers: "./comparisons/data-padding/size/ethers.ts",
				viem: "./comparisons/data-padding/size/viem.ts",
			},
		},
		benchmarkResultsPath: "./comparisons/data-padding/",
		includeBundle: true,
	});
}

// Allow running directly to generate docs
if (import.meta.url === `file://${process.argv[1]}`) {
	const docs = await generateDataPaddingDocs();
	console.log(docs);
}
