import { generateDocs } from "../shared/docs-generator.js";

export async function generateRlpEncodeDocs(): Promise<string> {
	return generateDocs({
		category: "RLP Encode",
		description:
			"Comparison of RLP encode implementations for encoding various data types (strings, numbers, byte arrays) across guil, ethers, and viem.",
		implementationFiles: {
			guil: "./comparisons/rlp/encode/guil.ts",
			ethers: "./comparisons/rlp/encode/ethers.ts",
			viem: "./comparisons/rlp/encode/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/rlp/encode/encode.bench.ts",
		includeBundle: true,
	});
}

export async function generateRlpDecodeDocs(): Promise<string> {
	return generateDocs({
		category: "RLP Decode",
		description:
			"Comparison of RLP decode implementations for decoding RLP-encoded byte arrays back to their original data structures across guil, ethers, and viem.",
		implementationFiles: {
			guil: "./comparisons/rlp/decode/guil.ts",
			ethers: "./comparisons/rlp/decode/ethers.ts",
			viem: "./comparisons/rlp/decode/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/rlp/decode/decode.bench.ts",
		includeBundle: true,
	});
}

export async function generateRlpEncodeListDocs(): Promise<string> {
	return generateDocs({
		category: "RLP EncodeList",
		description:
			"Comparison of RLP list encoding implementations for encoding arrays and nested arrays across guil, ethers, and viem.",
		implementationFiles: {
			guil: "./comparisons/rlp/encodeList/guil.ts",
			ethers: "./comparisons/rlp/encodeList/ethers.ts",
			viem: "./comparisons/rlp/encodeList/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/rlp/encodeList/encodeList.bench.ts",
		includeBundle: true,
	});
}

export async function generateRlpEncodeUintDocs(): Promise<string> {
	return generateDocs({
		category: "RLP EncodeUint",
		description:
			"Comparison of RLP unsigned integer encoding implementations for encoding numbers and bigints across guil, ethers, and viem.",
		implementationFiles: {
			guil: "./comparisons/rlp/encodeUint/guil.ts",
			ethers: "./comparisons/rlp/encodeUint/ethers.ts",
			viem: "./comparisons/rlp/encodeUint/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/rlp/encodeUint/encodeUint.bench.ts",
		includeBundle: true,
	});
}

export async function generateRlpToHexDocs(): Promise<string> {
	return generateDocs({
		category: "RLP ToHex",
		description:
			"Comparison of RLP encoding to hex string implementations. Encodes data to RLP format and returns as hex string across guil, ethers, and viem.",
		implementationFiles: {
			guil: "./comparisons/rlp/toHex/guil.ts",
			ethers: "./comparisons/rlp/toHex/ethers.ts",
			viem: "./comparisons/rlp/toHex/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/rlp/toHex/toHex.bench.ts",
		includeBundle: true,
	});
}

export async function generateRlpFromHexDocs(): Promise<string> {
	return generateDocs({
		category: "RLP FromHex",
		description:
			"Comparison of RLP decoding from hex string implementations. Decodes RLP-encoded hex strings back to data structures across guil, ethers, and viem.",
		implementationFiles: {
			guil: "./comparisons/rlp/fromHex/guil.ts",
			ethers: "./comparisons/rlp/fromHex/ethers.ts",
			viem: "./comparisons/rlp/fromHex/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/rlp/fromHex/fromHex.bench.ts",
		includeBundle: true,
	});
}

// Allow running directly to generate all docs
if (import.meta.url === `file://${process.argv[1]}`) {
}
