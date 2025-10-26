import { generateDocs } from "../shared/docs-generator.js";

export async function generateBytesDocs(): Promise<string> {
	return generateDocs({
		category: "Bytes: Bytes Constructor",
		description:
			"Comparison of Bytes type constructors across guil, ethers, and viem. Creates branded Bytes type from hex strings or Uint8Array with validation. Tests various sizes (1 byte, 32 bytes, 1024 bytes).",
		implementationFiles: {
			guil: "./comparisons/bytes/Bytes/guil.ts",
			ethers: "./comparisons/bytes/Bytes/ethers.ts",
			viem: "./comparisons/bytes/Bytes/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/bytes/Bytes.bench.ts",
		includeBundle: true,
	});
}

export async function generateByteDocs(): Promise<string> {
	return generateDocs({
		category: "Bytes: Byte Constructor",
		description:
			"Comparison of Byte type constructors across guil, ethers, and viem. Creates branded Byte type (single byte) from hex strings or numbers (0-255) with validation.",
		implementationFiles: {
			guil: "./comparisons/bytes/Byte/guil.ts",
			ethers: "./comparisons/bytes/Byte/ethers.ts",
			viem: "./comparisons/bytes/Byte/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/bytes/Byte.bench.ts",
		includeBundle: true,
	});
}

export async function generateBytesToUint8ArrayDocs(): Promise<string> {
	return generateDocs({
		category: "Bytes: bytesToUint8Array",
		description:
			"Comparison of bytesToUint8Array implementations across guil, ethers, and viem. Converts hex-encoded Bytes to Uint8Array. Tests empty bytes, small (1 byte), medium (32 bytes), and large (1024 bytes) arrays.",
		implementationFiles: {
			guil: "./comparisons/bytes/bytesToUint8Array/guil.ts",
			ethers: "./comparisons/bytes/bytesToUint8Array/ethers.ts",
			viem: "./comparisons/bytes/bytesToUint8Array/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/bytes/bytesToUint8Array.bench.ts",
		includeBundle: true,
	});
}

export async function generateByteToNumberDocs(): Promise<string> {
	return generateDocs({
		category: "Bytes: byteToNumber",
		description:
			"Comparison of byteToNumber implementations across guil, ethers, and viem. Converts a single Byte to a number (0-255). Tests boundary values (0, 127, 128, 255).",
		implementationFiles: {
			guil: "./comparisons/bytes/byteToNumber/guil.ts",
			ethers: "./comparisons/bytes/byteToNumber/ethers.ts",
			viem: "./comparisons/bytes/byteToNumber/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/bytes/byteToNumber.bench.ts",
		includeBundle: true,
	});
}

export async function generateBytesLengthDocs(): Promise<string> {
	return generateDocs({
		category: "Bytes: bytesLength",
		description:
			"Comparison of bytesLength implementations across guil, ethers, and viem. Gets the length in bytes of a Bytes value. Tests empty, small, medium, and large byte arrays.",
		implementationFiles: {
			guil: "./comparisons/bytes/bytesLength/guil.ts",
			ethers: "./comparisons/bytes/bytesLength/ethers.ts",
			viem: "./comparisons/bytes/bytesLength/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/bytes/bytesLength.bench.ts",
		includeBundle: true,
	});
}

export async function generateConcatBytesDocs(): Promise<string> {
	return generateDocs({
		category: "Bytes: concatBytes",
		description:
			"Comparison of concatBytes implementations across guil, ethers, and viem. Concatenates multiple Bytes values into a single Bytes. Tests concatenating 2, 3, and 5 parts with varying sizes.",
		implementationFiles: {
			guil: "./comparisons/bytes/concatBytes/guil.ts",
			ethers: "./comparisons/bytes/concatBytes/ethers.ts",
			viem: "./comparisons/bytes/concatBytes/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/bytes/concatBytes.bench.ts",
		includeBundle: true,
	});
}

export async function generateSliceBytesDocs(): Promise<string> {
	return generateDocs({
		category: "Bytes: sliceBytes",
		description:
			"Comparison of sliceBytes implementations across guil, ethers, and viem. Extracts a portion of a Bytes value with start and optional end indices. Tests various slice ranges on 32-byte and 1024-byte arrays.",
		implementationFiles: {
			guil: "./comparisons/bytes/sliceBytes/guil.ts",
			ethers: "./comparisons/bytes/sliceBytes/ethers.ts",
			viem: "./comparisons/bytes/sliceBytes/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/bytes/sliceBytes.bench.ts",
		includeBundle: true,
	});
}

export async function generateTypeGuardsDocs(): Promise<string> {
	return generateDocs({
		category: "Bytes: Type Guards (isBytes, isByte)",
		description:
			"Comparison of type guard implementations across guil, ethers, and viem. Validates if values are valid Bytes or Byte format. Tests both valid and invalid inputs including edge cases.",
		implementationFiles: {
			guil: "./comparisons/bytes/typeGuards/guil.ts",
			ethers: "./comparisons/bytes/typeGuards/ethers.ts",
			viem: "./comparisons/bytes/typeGuards/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/bytes/typeGuards.bench.ts",
		includeBundle: true,
	});
}

export async function generateAllBytesDocs(): Promise<string> {
	const sections = [
		await generateBytesDocs(),
		await generateByteDocs(),
		await generateBytesToUint8ArrayDocs(),
		await generateByteToNumberDocs(),
		await generateBytesLengthDocs(),
		await generateConcatBytesDocs(),
		await generateSliceBytesDocs(),
		await generateTypeGuardsDocs(),
	];

	return `# Bytes Branded Types Benchmark Suite

This benchmark suite compares the performance of Bytes branded type operations across guil (@tevm/primitives), ethers, and viem.

## Type Safety Approach

**Guil (@tevm/primitives)** uses branded types for compile-time type safety:
- \`Bytes\` type enforces even-length hex strings at compile time
- \`Byte\` type represents single bytes with validation
- Type guards (\`isBytes\`, \`isByte\`) provide runtime validation
- All operations maintain type safety through the branded type system

**Ethers** uses utility functions without branded types:
- \`hexlify()\`, \`getBytes()\`, \`concat()\`, \`dataSlice()\`, etc.
- Runtime validation but no compile-time type enforcement
- More flexible but less type-safe approach

**Viem** uses utility functions with TypeScript refinements:
- \`toHex()\`, \`hexToBytes()\`, \`concat()\`, \`slice()\`, etc.
- Strong TypeScript types but not branded
- Focus on performance and developer experience

${sections.join("\n\n---\n\n")}`;
}

// Allow running directly to generate docs
if (import.meta.url === `file://${process.argv[1]}`) {
	const docs = await generateAllBytesDocs();
	console.log(docs);
}
