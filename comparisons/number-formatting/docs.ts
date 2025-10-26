import { generateDocs } from "../shared/docs-generator.js";

export async function generateToQuantityDocs(): Promise<string> {
	return generateDocs({
		category: "Number Formatting: toQuantity",
		description:
			"Comparison of toQuantity implementations across guil, ethers, and viem. Formats a number for JSON-RPC by stripping leading zeros. Used for encoding numeric values in Ethereum JSON-RPC calls where leading zeros should be omitted.",
		implementationFiles: {
			guil: "./comparisons/number-formatting/toQuantity/guil.ts",
			ethers: "./comparisons/number-formatting/toQuantity/ethers.ts",
			viem: "./comparisons/number-formatting/toQuantity/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/number-formatting/toQuantity.bench.ts",
		includeBundle: true,
	});
}

export async function generateToBeHexDocs(): Promise<string> {
	return generateDocs({
		category: "Number Formatting: toBeHex",
		description:
			"Comparison of toBeHex implementations across guil, ethers, and viem. Converts BigInt to big-endian hex string with optional padding to a specific width. Essential for encoding numbers as fixed-width hex strings in smart contracts and transaction data.",
		implementationFiles: {
			guil: "./comparisons/number-formatting/toBeHex/guil.ts",
			ethers: "./comparisons/number-formatting/toBeHex/ethers.ts",
			viem: "./comparisons/number-formatting/toBeHex/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/number-formatting/toBeHex.bench.ts",
		includeBundle: true,
	});
}

export async function generateToBeArrayDocs(): Promise<string> {
	return generateDocs({
		category: "Number Formatting: toBeArray",
		description:
			"Comparison of toBeArray implementations across guil, ethers, and viem. Converts BigInt to big-endian byte array (Uint8Array). Used for encoding numeric values as raw bytes for cryptographic operations and EVM data structures.",
		implementationFiles: {
			guil: "./comparisons/number-formatting/toBeArray/guil.ts",
			ethers: "./comparisons/number-formatting/toBeArray/ethers.ts",
			viem: "./comparisons/number-formatting/toBeArray/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/number-formatting/toBeArray.bench.ts",
		includeBundle: true,
	});
}

export async function generateMaskDocs(): Promise<string> {
	return generateDocs({
		category: "Number Formatting: mask",
		description:
			"Comparison of mask implementations across guil, ethers, and viem. Applies a bitmask to extract specific bits from a value. Used for bit manipulation, address masking, and extracting specific bit ranges from larger values.",
		implementationFiles: {
			guil: "./comparisons/number-formatting/mask/guil.ts",
			ethers: "./comparisons/number-formatting/mask/ethers.ts",
			viem: "./comparisons/number-formatting/mask/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/number-formatting/mask.bench.ts",
		includeBundle: true,
	});
}

export async function generateAllNumberFormattingDocs(): Promise<string> {
	const sections = [
		await generateToQuantityDocs(),
		await generateToBeHexDocs(),
		await generateToBeArrayDocs(),
		await generateMaskDocs(),
	];

	return `# Number Formatting Benchmark Suite

This benchmark suite compares the performance of number formatting utilities across guil (@tevm/primitives), ethers, and viem.

## Number Formatting Approaches

**Guil (@tevm/primitives)** uses native JavaScript bigint operations:
- Leverages \`toString(16)\` for hex conversion
- Simple string padding for fixed-width formats
- Manual byte array construction for binary formats
- Direct bitwise operations for masking
- Minimal overhead with native JavaScript primitives

**Ethers** provides comprehensive utility functions:
- \`toQuantity()\` for JSON-RPC number formatting
- \`toBeHex(value, width)\` for big-endian hex with padding
- \`toBeArray()\` for big-endian byte arrays
- \`mask(value, bits)\` for bitmask operations
- Well-tested utilities with consistent behavior

**Viem** offers modern functional utilities:
- \`numberToHex()\` for JSON-RPC formatting
- \`toHex(value, { size })\` for sized hex strings
- \`toBytes()\` for byte array conversion
- Manual bitwise operations for masking
- Performance-focused implementations

## Use Cases

### toQuantity
Format numbers for Ethereum JSON-RPC calls where leading zeros must be stripped:
- Block numbers, transaction indices
- Gas limits, nonces
- Chain IDs, network IDs

### toBeHex
Convert numbers to fixed-width hex strings:
- 32-byte padded values for storage slots
- Address padding for CREATE2 calculations
- Fixed-size numeric encoding in ABI

### toBeArray
Convert numbers to byte arrays:
- Cryptographic operations requiring raw bytes
- Merkle tree construction
- EVM memory/storage operations

### mask
Extract specific bit ranges:
- Address extraction from packed data
- Type identification from combined values
- Bit field operations in smart contracts

${sections.join("\n\n---\n\n")}`;
}

// Allow running directly to generate docs
if (import.meta.url === `file://${process.argv[1]}`) {
	const docs = await generateAllNumberFormattingDocs();
}
