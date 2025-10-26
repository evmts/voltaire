import { generateDocs } from "../shared/docs-generator.js";

export async function generateHexToBytesDocs(): Promise<string> {
	return generateDocs({
		category: "Hex: hexToBytes",
		description:
			"Comparison of hexToBytes implementations across guil, ethers, and viem. Converts hex strings (with 0x prefix) to Uint8Array.",
		implementationFiles: {
			guil: "./comparisons/hex/hexToBytes/guil.ts",
			ethers: "./comparisons/hex/hexToBytes/ethers.ts",
			viem: "./comparisons/hex/hexToBytes/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/hex/hexToBytes.bench.ts",
		includeBundle: true,
	});
}

export async function generateBytesToHexDocs(): Promise<string> {
	return generateDocs({
		category: "Hex: bytesToHex",
		description:
			"Comparison of bytesToHex implementations across guil, ethers, and viem. Converts Uint8Array to hex strings with 0x prefix.",
		implementationFiles: {
			guil: "./comparisons/hex/bytesToHex/guil.ts",
			ethers: "./comparisons/hex/bytesToHex/ethers.ts",
			viem: "./comparisons/hex/bytesToHex/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/hex/bytesToHex.bench.ts",
		includeBundle: true,
	});
}

export async function generateHexToU256Docs(): Promise<string> {
	return generateDocs({
		category: "Hex: hexToU256",
		description:
			"Comparison of hexToU256 implementations across guil, ethers, and viem. Converts hex strings to bigint values.",
		implementationFiles: {
			guil: "./comparisons/hex/hexToU256/guil.ts",
			ethers: "./comparisons/hex/hexToU256/ethers.ts",
			viem: "./comparisons/hex/hexToU256/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/hex/hexToU256.bench.ts",
		includeBundle: true,
	});
}

export async function generateU256ToHexDocs(): Promise<string> {
	return generateDocs({
		category: "Hex: u256ToHex",
		description:
			"Comparison of u256ToHex implementations across guil, ethers, and viem. Converts bigint values to hex strings with 0x prefix.",
		implementationFiles: {
			guil: "./comparisons/hex/u256ToHex/guil.ts",
			ethers: "./comparisons/hex/u256ToHex/ethers.ts",
			viem: "./comparisons/hex/u256ToHex/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/hex/u256ToHex.bench.ts",
		includeBundle: true,
	});
}

export async function generateAllHexDocs(): Promise<string> {
	const sections = [
		await generateHexToBytesDocs(),
		await generateBytesToHexDocs(),
		await generateHexToU256Docs(),
		await generateU256ToHexDocs(),
	];

	return `# Hex Utilities Benchmark Suite\n\n${sections.join("\n\n---\n\n")}`;
}

// Allow running directly to generate docs
if (import.meta.url === `file://${process.argv[1]}`) {
	const docs = await generateAllHexDocs();
}
