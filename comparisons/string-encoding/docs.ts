import { generateDocs } from "../shared/docs-generator.js";

export async function generateStringToBytesDocs(): Promise<string> {
	return generateDocs({
		category: "String Encoding: stringToBytes",
		description:
			"Comparison of stringToBytes implementations across guil, ethers, and viem. Converts UTF-8 strings to Uint8Array. Critical for message signing operations (EIP-191, EIP-712).",
		implementationFiles: {
			guil: "./comparisons/string-encoding/stringToBytes/guil.ts",
			ethers: "./comparisons/string-encoding/stringToBytes/ethers.ts",
			viem: "./comparisons/string-encoding/stringToBytes/viem.ts",
		},
		benchmarkResultsPath:
			"./comparisons/string-encoding/stringToBytes.bench.ts",
		includeBundle: true,
	});
}

export async function generateBytesToStringDocs(): Promise<string> {
	return generateDocs({
		category: "String Encoding: bytesToString",
		description:
			"Comparison of bytesToString implementations across guil, ethers, and viem. Converts Uint8Array to UTF-8 strings. Used in decoding signed messages.",
		implementationFiles: {
			guil: "./comparisons/string-encoding/bytesToString/guil.ts",
			ethers: "./comparisons/string-encoding/bytesToString/ethers.ts",
			viem: "./comparisons/string-encoding/bytesToString/viem.ts",
		},
		benchmarkResultsPath:
			"./comparisons/string-encoding/bytesToString.bench.ts",
		includeBundle: true,
	});
}

export async function generateStringToHexDocs(): Promise<string> {
	return generateDocs({
		category: "String Encoding: stringToHex",
		description:
			"Comparison of stringToHex implementations across guil, ethers, and viem. Converts UTF-8 strings directly to hex. Common in message signing workflows.",
		implementationFiles: {
			guil: "./comparisons/string-encoding/stringToHex/guil.ts",
			ethers: "./comparisons/string-encoding/stringToHex/ethers.ts",
			viem: "./comparisons/string-encoding/stringToHex/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/string-encoding/stringToHex.bench.ts",
		includeBundle: true,
	});
}

export async function generateHexToStringDocs(): Promise<string> {
	return generateDocs({
		category: "String Encoding: hexToString",
		description:
			"Comparison of hexToString implementations across guil, ethers, and viem. Converts hex-encoded data to UTF-8 strings. Used in decoding on-chain messages.",
		implementationFiles: {
			guil: "./comparisons/string-encoding/hexToString/guil.ts",
			ethers: "./comparisons/string-encoding/hexToString/ethers.ts",
			viem: "./comparisons/string-encoding/hexToString/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/string-encoding/hexToString.bench.ts",
		includeBundle: true,
	});
}

export async function generateAllStringEncodingDocs(): Promise<string> {
	const sections = [
		await generateStringToBytesDocs(),
		await generateBytesToStringDocs(),
		await generateStringToHexDocs(),
		await generateHexToStringDocs(),
	];

	return `# String Encoding Benchmark Suite\n\n${sections.join("\n\n---\n\n")}`;
}

// Allow running directly to generate docs
if (import.meta.url === `file://${process.argv[1]}`) {
	const docs = await generateAllStringEncodingDocs();
}
