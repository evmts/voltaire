import { generateDocs } from "../shared/docs-generator.js";

export async function generateIsUintDocs(): Promise<string> {
	return generateDocs({
		category: "Uint Branded Types: isUint",
		description:
			"Comparison of type guard implementations for Uint branded types. Guil provides compile-time type safety with runtime validation, while ethers and viem rely on manual runtime checks. Tests include valid Uint values at all bit width boundaries (u8, u16, u32, u64, u128, u256), invalid values with leading zeros, and various non-string types.",
		implementationFiles: {
			guil: "./comparisons/uint-branded/isUint/guil.ts",
			ethers: "./comparisons/uint-branded/isUint/ethers.ts",
			viem: "./comparisons/uint-branded/isUint/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/uint-branded/isUint.bench.ts",
		includeBundle: true,
	});
}

export async function generateUintToBigIntDocs(): Promise<string> {
	return generateDocs({
		category: "Uint Branded Types: uintToBigInt",
		description:
			"Comparison of Uint to bigint conversion implementations. Guil uses branded Uint types that guarantee valid hex format at compile-time, while ethers and viem work directly with hex strings and perform conversion at runtime. Tests include conversions at all standard bit width boundaries (u8, u16, u32, u64, u128, u256).",
		implementationFiles: {
			guil: "./comparisons/uint-branded/uintToBigInt/guil.ts",
			ethers: "./comparisons/uint-branded/uintToBigInt/ethers.ts",
			viem: "./comparisons/uint-branded/uintToBigInt/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/uint-branded/uintToBigInt.bench.ts",
		includeBundle: true,
	});
}

export async function generateConstantsDocs(): Promise<string> {
	return generateDocs({
		category: "Uint Branded Types: Constants",
		description:
			"Comparison of predefined constant access patterns. Guil provides branded Uint constants (UINT_ZERO, UINT_ONE, UINT_MAX_U8, UINT_MAX_U16, UINT_MAX_U32, UINT_MAX_U64, UINT_MAX_U128, UINT_MAX_U256) with compile-time type safety, while ethers and viem use plain bigint constants. This benchmark measures the overhead of branded types versus raw bigint values.",
		implementationFiles: {
			guil: "./comparisons/uint-branded/constants/guil.ts",
			ethers: "./comparisons/uint-branded/constants/ethers.ts",
			viem: "./comparisons/uint-branded/constants/viem.ts",
		},
		benchmarkResultsPath: "./comparisons/uint-branded/constants.bench.ts",
		includeBundle: true,
	});
}

export async function generateAllUintBrandedDocs(): Promise<string> {
	const sections = [
		await generateIsUintDocs(),
		await generateUintToBigIntDocs(),
		await generateConstantsDocs(),
	];

	return `# Uint Branded Types Benchmark Suite

## Overview

Guil provides a branded Uint type system that ensures type safety at compile-time while maintaining runtime validation. This suite compares:

- **Type Guards**: Runtime validation of Uint format
- **Conversions**: Converting between Uint and bigint
- **Constants**: Predefined values at standard bit widths

### Type Safety Philosophy

**Guil's Approach**: Uses TypeScript's branded types to create compile-time guarantees:
\`\`\`typescript
type Uint = \`0x\${string}\` & { readonly __brand: 'Uint' };
\`\`\`

This ensures:
- No leading zeros (except "0x0")
- Lowercase hex characters only
- Valid hex format at compile-time
- Type errors caught during development

**ethers/viem Approach**: Plain strings or bigints with runtime validation:
\`\`\`typescript
// Runtime validation only, no compile-time guarantees
function isValidUint(value: string): boolean {
  return /^0x(0|[1-9a-f][0-9a-f]*)$/.test(value);
}
\`\`\`

### Performance Implications

- **Branded types** have zero runtime cost for type assertions
- **Type guards** perform identical regex validation across all implementations
- **Conversions** are equivalent (all use native BigInt constructor)
- **Constants** may show slight differences due to type wrapping

${sections.join("\n\n---\n\n")}`;
}

// Allow running directly to generate docs
if (import.meta.url === `file://${process.argv[1]}`) {
	const docs = await generateAllUintBrandedDocs();
}
