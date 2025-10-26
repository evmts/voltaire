import { generateDocs } from "../shared/docs-generator.js";

export async function generateHash32Docs(): Promise<string> {
	let markdown = "# Hash32/Bytes32 Branded Type Operations Benchmark\n\n";
	markdown +=
		"Comprehensive comparison of Hash32/Bytes32 branded type operations across guil (@tevm/primitives), ethers, and viem.\n\n";
	markdown += "## Overview\n\n";
	markdown +=
		"This benchmark suite tests Hash32/Bytes32 branded type operations including:\n";
	markdown += "- Type-safe hash construction from hex strings and Uint8Array\n";
	markdown += "- Conversion to Uint8Array and bigint\n";
	markdown += "- Conversion from bigint to Hash32\n";
	markdown += "- Hash generation utilities (fillHash32)\n";
	markdown += "- Type guards for validation\n\n";
	markdown += "## Type Safety Benefits\n\n";
	markdown +=
		"Guil provides branded `Hash32` and `Bytes32` types that prevent mixing incompatible types at compile time:\n\n";
	markdown += "```typescript\n";
	markdown += "// Guil - Type-safe branded types\n";
	markdown += 'import { Hash32, Address } from "@tevm/primitives";\n\n';
	markdown +=
		'const hash: Hash32 = Hash32("0x1234..."); // Validated at runtime\n';
	markdown +=
		'const addr: Address = Address("0xabcd..."); // Different type\n\n';
	markdown += "// ✅ Type error - prevents mixing hash and address\n";
	markdown += "// function processHash(h: Hash32) { ... }\n";
	markdown += "// processHash(addr); // TypeScript error!\n\n";
	markdown += "// Ethers and Viem - Plain strings (no type safety)\n";
	markdown += 'const hash = "0x1234..."; // Just a string\n';
	markdown += 'const addr = "0xabcd..."; // Also just a string\n';
	markdown += "// ❌ No compile-time protection\n";
	markdown += "// processHash(addr); // TypeScript allows this!\n";
	markdown += "```\n\n";

	// Constructor
	markdown += '## Hash32(value: "0x${string}" | Uint8Array): Hash32\n\n';
	markdown +=
		"Construct a validated Hash32 from a hex string or Uint8Array. Tests validation and conversion performance.\n\n";
	markdown +=
		"**Guil**: Branded type with runtime validation (exactly 32 bytes)\n";
	markdown +=
		"**Ethers**: Manual validation with getBytes/hexlify, no branded type\n";
	markdown +=
		"**Viem**: Hex type with manual length checking, no branded type\n\n";
	markdown += await generateDocs({
		category: "Hash32 Constructor",
		description: "Construct Hash32 from hex string or Uint8Array",
		implementationFiles: {
			guil: "./comparisons/hash32/constructor/guil.ts",
			ethers: "./comparisons/hash32/constructor/ethers.ts",
			viem: "./comparisons/hash32/constructor/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/hash32/constructor.bench.ts",
		includeBundle: false,
	});

	// hash32ToUint8Array
	markdown += "\n## hash32ToUint8Array(hash: Hash32): Uint8Array\n\n";
	markdown +=
		"Convert a Hash32 to Uint8Array. Tests hex-to-bytes conversion performance.\n\n";
	markdown += await generateDocs({
		category: "hash32ToUint8Array",
		description: "Convert Hash32 to Uint8Array",
		implementationFiles: {
			guil: "./comparisons/hash32/toUint8Array/guil.ts",
			ethers: "./comparisons/hash32/toUint8Array/ethers.ts",
			viem: "./comparisons/hash32/toUint8Array/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/hash32/toUint8Array.bench.ts",
		includeBundle: false,
	});

	// hash32ToBigInt
	markdown += "\n## hash32ToBigInt(hash: Hash32): bigint\n\n";
	markdown +=
		"Convert a Hash32 to bigint (interprets as big-endian unsigned integer). Tests hex-to-bigint conversion.\n\n";
	markdown += await generateDocs({
		category: "hash32ToBigInt",
		description: "Convert Hash32 to bigint",
		implementationFiles: {
			guil: "./comparisons/hash32/toBigInt/guil.ts",
			ethers: "./comparisons/hash32/toBigInt/ethers.ts",
			viem: "./comparisons/hash32/toBigInt/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/hash32/toBigInt.bench.ts",
		includeBundle: false,
	});

	// bigIntToHash32
	markdown += "\n## bigIntToHash32(value: bigint): Hash32\n\n";
	markdown +=
		"Convert a bigint to Hash32 (32-byte big-endian representation). Tests bigint-to-hex conversion with padding.\n\n";
	markdown += await generateDocs({
		category: "bigIntToHash32",
		description: "Convert bigint to Hash32",
		implementationFiles: {
			guil: "./comparisons/hash32/fromBigInt/guil.ts",
			ethers: "./comparisons/hash32/fromBigInt/ethers.ts",
			viem: "./comparisons/hash32/fromBigInt/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/hash32/fromBigInt.bench.ts",
		includeBundle: false,
	});

	// fillHash32
	markdown += "\n## fillHash32(byte: number): Hash32\n\n";
	markdown +=
		"Create a Hash32 filled with a specific byte value. Tests hash generation with repeated bytes.\n\n";
	markdown += await generateDocs({
		category: "fillHash32",
		description: "Create Hash32 filled with specific byte",
		implementationFiles: {
			guil: "./comparisons/hash32/fill/guil.ts",
			ethers: "./comparisons/hash32/fill/ethers.ts",
			viem: "./comparisons/hash32/fill/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/hash32/fill.bench.ts",
		includeBundle: false,
	});

	// Type guards
	markdown += "\n## isHash32(value: unknown): value is Hash32\n\n";
	markdown +=
		"Type guard to check if a value is valid Hash32 format. Tests validation performance.\n\n";
	markdown +=
		"**Note**: `isBytes32` is an alias for `isHash32` (same 32-byte format).\n\n";
	markdown += await generateDocs({
		category: "isHash32/isBytes32",
		description: "Validate Hash32/Bytes32 format",
		implementationFiles: {
			guil: "./comparisons/hash32/typeGuard/guil.ts",
			ethers: "./comparisons/hash32/typeGuard/ethers.ts",
			viem: "./comparisons/hash32/typeGuard/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/hash32/typeGuard.bench.ts",
		includeBundle: false,
	});

	markdown += "\n## Summary\n\n";
	markdown +=
		"These benchmarks provide comprehensive performance metrics for Hash32/Bytes32 operations.\n";
	markdown +=
		"The key differentiator is Guil's branded types which provide compile-time type safety.\n\n";
	markdown += "### Key Insights\n\n";
	markdown +=
		"- **Branded Types**: Guil provides Hash32/Bytes32 branded types that prevent mixing incompatible types\n";
	markdown +=
		"- **Runtime Validation**: All libraries validate hash format, but only Guil enforces types\n";
	markdown +=
		"- **Conversions**: Performance varies across hex↔bytes↔bigint conversions\n";
	markdown +=
		"- **Type Guards**: Validation performance is similar, but Guil provides type narrowing\n\n";
	markdown += "### Type Safety Comparison\n\n";
	markdown += "| Feature | Guil | Ethers | Viem |\n";
	markdown += "|---------|------|--------|------|\n";
	markdown +=
		"| Branded Types | ✅ Hash32, Bytes32 | ❌ Plain strings | ❌ Plain `Hex` type |\n";
	markdown +=
		"| Compile-time Safety | ✅ Prevents mixing types | ❌ No protection | ❌ Minimal protection |\n";
	markdown +=
		"| Runtime Validation | ✅ Constructor validates | ⚠️ Manual validation | ⚠️ Manual validation |\n";
	markdown +=
		"| Type Guards | ✅ Type narrowing | ⚠️ Boolean only | ⚠️ Boolean only |\n\n";

	return markdown;
}

// Allow running directly to generate docs
if (import.meta.url === `file://${process.argv[1]}`) {
	const docs = await generateHash32Docs();
	console.log(docs);
}
