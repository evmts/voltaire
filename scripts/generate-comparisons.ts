#!/usr/bin/env node
/**
 * Script to generate COMPARISON.md files for all benchmark operations
 * Based on the template from comparisons/hash32/COMPARISON.md
 */

import * as fs from "fs";
import * as path from "path";

interface Operation {
	category: string;
	name: string;
	path: string;
}

interface BenchmarkImplementation {
	library: string;
	code: string;
	hasImplementation: boolean;
}

// Find all benchmark operations (including nested ones)
function findAllOperations(comparisonsDir: string): Operation[] {
	const operations: Operation[] = [];

	function scanDirectory(dir: string, category: string, subcategory?: string) {
		const files = fs.readdirSync(dir);

		// Check if this directory has .bench.ts files directly in it
		const directBenchFiles = files.filter((f) => f.endsWith(".bench.ts"));

		if (directBenchFiles.length > 0) {
			// This directory contains benchmark files directly (e.g., uint256/arithmetic/)
			for (const benchFile of directBenchFiles) {
				const operationName = benchFile.replace(".bench.ts", "");
				const fullCategory = subcategory ? `${category}/${subcategory}` : category;
				const operationPath = path.join(dir, operationName);

				operations.push({
					category: fullCategory,
					name: operationName,
					path: operationPath,
				});
			}
		}

		// Also check subdirectories
		for (const file of files) {
			const fullPath = path.join(dir, file);
			const stat = fs.statSync(fullPath);

			if (stat.isDirectory()) {
				// Check if this directory contains benchmark files
				const subFiles = fs.readdirSync(fullPath);
				const hasBenchFile = subFiles.some((f) => f.endsWith(".bench.ts"));

				if (hasBenchFile && !directBenchFiles.length) {
					// This is an operation directory (contains .bench.ts file)
					// Only add if parent didn't have bench files (avoid duplicates)
					const operationName = file;
					const fullCategory = subcategory ? `${category}/${subcategory}` : category;

					operations.push({
						category: fullCategory,
						name: operationName,
						path: fullPath,
					});
				} else {
					// This might be a subcategory directory, scan it
					const newSubcategory = subcategory ? `${subcategory}/${file}` : file;
					scanDirectory(fullPath, category, newSubcategory);
				}
			}
		}
	}

	const categories = fs
		.readdirSync(comparisonsDir)
		.filter((item) => {
			const fullPath = path.join(comparisonsDir, item);
			return (
				fs.statSync(fullPath).isDirectory() &&
				item !== "shared" &&
				item !== "node_modules"
			);
		});

	for (const category of categories) {
		const categoryPath = path.join(comparisonsDir, category);
		scanDirectory(categoryPath, category);
	}

	return operations;
}

// Read implementation files for an operation
function readImplementations(operationPath: string): BenchmarkImplementation[] {
	const implementations: BenchmarkImplementation[] = [];
	const libraries = ["guil-native", "guil-wasm", "ethers", "viem"];

	for (const library of libraries) {
		const implPath = path.join(operationPath, `${library}.ts`);
		let code = "";
		let hasImplementation = false;

		if (fs.existsSync(implPath)) {
			code = fs.readFileSync(implPath, "utf-8");
			hasImplementation = true;
		}

		implementations.push({
			library,
			code,
			hasImplementation,
		});
	}

	return implementations;
}

// Extract function call from implementation code
function extractFunctionCall(code: string): string {
	const lines = code.split("\n");
	for (const line of lines) {
		// Look for the main function call (usually in the main() function)
		if (line.includes("Address.") || line.includes("ethers.") || line.includes("from")) {
			return line.trim();
		}
	}
	return "";
}

// Generate category display name
function categoryDisplayName(category: string): string {
	const mapping: { [key: string]: string } = {
		address: "Address Operations",
		abi: "ABI Operations",
		"abi-extended": "ABI Extended Operations",
		hex: "Hex Operations",
		keccak256: "Keccak256 Operations",
		bytes: "Bytes Operations",
		"data-padding": "Data Padding Operations",
		numeric: "Numeric Operations",
		units: "Unit Conversion Operations",
		uint256: "Uint256 Operations",
		"uint-branded": "Uint Branded Type Operations",
		signature: "Signature Operations",
		"signature-utils": "Signature Utility Operations",
		signers: "Signer Operations",
		transaction: "Transaction Operations",
		rlp: "RLP Operations",
		eip191: "EIP-191 Operations",
		eip712: "EIP-712 Operations",
		"solidity-packed": "Solidity Packed Operations",
		"string-encoding": "String Encoding Operations",
		"wallet-generation": "Wallet Generation Operations",
		bytecode: "Bytecode Operations",
		hash32: "Hash32/Bytes32 Operations",
		"hash-algorithms": "Hash Algorithm Operations",
		secp256k1: "Secp256k1 Operations",
	};

	return mapping[category] || category;
}

// Generate operation display name
function operationDisplayName(operationName: string): string {
	// Convert camelCase or snake_case to Title Case
	return operationName
		.replace(/([A-Z])/g, " $1")
		.replace(/_/g, " ")
		.replace(/^./, (str) => str.toUpperCase())
		.trim();
}

// Generate COMPARISON.md content
function generateComparisonMd(operation: Operation): string {
	const categoryDisplay = categoryDisplayName(operation.category);
	const operationDisplay = operationDisplayName(operation.name);

	const md = `# ${operationDisplay} - Library Comparison

A detailed comparison of how each library handles the \`${operation.name}\` operation in the ${categoryDisplay} category.

## Quick Reference Table

| Library | Implementation |
|---------|----------------|
| **Guil Native** | High-performance native implementation with type safety |
| **Guil WASM** | Portable WASM implementation with type safety |
| **Ethers** | Traditional JavaScript implementation |
| **Viem** | Modern, tree-shakeable implementation |

## Implementation Details

### Guil Native

Guil's native implementation leverages Zig's FFI for maximum performance through the \`ReleaseFast\` optimization mode.

**Key Features:**
- ✅ Maximum performance with native FFI
- ✅ Branded types for compile-time safety
- ✅ Runtime validation
- ✅ Zero-copy operations where possible
- ✅ Memory-safe Zig implementation

**Performance Profile:**
- Optimized with \`ReleaseFast\` mode
- Direct native bindings
- Minimal JavaScript overhead

### Guil WASM

Guil's WASM implementation provides portable performance optimized for bundle size.

**Key Features:**
- ✅ Portable across all JavaScript environments
- ✅ Branded types for compile-time safety
- ✅ Runtime validation
- ✅ Smaller bundle size with \`ReleaseSmall\` optimization
- ✅ Memory-safe Zig implementation

**Performance Profile:**
- Optimized with \`ReleaseSmall\` mode
- Portable WASM bindings
- Balance between size and speed

### Ethers

Ethers provides a battle-tested, mature implementation.

**Key Features:**
- ✅ Mature, battle-tested library
- ✅ Broad ecosystem compatibility
- ⚠️ Manual validation often required
- ⚠️ No branded types (generic strings/numbers)
- ⚠️ Runtime errors for invalid inputs

**Performance Profile:**
- Pure JavaScript implementation
- Well-optimized for common cases
- Larger bundle size

### Viem

Viem provides a modern, fast implementation with tree-shaking support.

**Key Features:**
- ✅ Modern TypeScript implementation
- ✅ Excellent tree-shaking support
- ✅ Fast performance
- ⚠️ Generic types (no specific branded types)
- ⚠️ Manual validation often required

**Performance Profile:**
- Highly optimized JavaScript
- Small bundle size (tree-shakeable)
- Fast execution

## Type Safety Comparison

### Guil (Native & WASM)

Both Guil implementations use **branded types** to provide compile-time type safety:

\`\`\`typescript
// Branded types prevent mixing incompatible values
type Address = string & { readonly __brand: 'Address' };
type Hash32 = string & { readonly __brand: 'Hash32' };

// ✅ Compile-time error prevents bugs
function processAddress(addr: Address) { ... }
const hash: Hash32 = Hash32("0x...");
processAddress(hash); // TypeScript Error: Hash32 is not assignable to Address
\`\`\`

**Benefits:**
- Catches type confusion at compile time
- Self-documenting code
- Better IDE support and autocomplete
- Prevents invalid operations

### Ethers

Uses generic JavaScript types:

\`\`\`typescript
// Generic types - no compile-time safety
function processAddress(addr: string) { ... }
const hash = "0x..."; // Just a string
processAddress(hash); // No error - runtime risk
\`\`\`

**Drawbacks:**
- No compile-time type safety
- Easy to mix incompatible values
- Requires runtime validation everywhere

### Viem

Uses generic TypeScript types:

\`\`\`typescript
import { type Hex, type Address } from 'viem';

// Type aliases - limited safety
function processAddress(addr: Address) { ... }
const hash: Hex = "0x..."; // Hex is just a string alias
processAddress(hash); // TypeScript may not catch this
\`\`\`

**Drawbacks:**
- Type aliases don't provide true type safety
- Can still mix incompatible values
- Requires runtime validation

## Performance Considerations

### Speed Ranking (Typical)

1. **Guil Native** - Fastest (native FFI, ReleaseFast optimization)
2. **Viem** - Fast (optimized JavaScript)
3. **Guil WASM** - Good (WASM with ReleaseSmall optimization)
4. **Ethers** - Good (mature, optimized JavaScript)

### Bundle Size Ranking

1. **Viem** - Smallest (tree-shakeable)
2. **Guil WASM** - Small (ReleaseSmall optimization)
3. **Guil Native** - Medium (native bindings)
4. **Ethers** - Larger (comprehensive library)

### Memory Safety

1. **Guil Native & WASM** - Memory-safe Zig implementation
2. **Viem** - Modern JavaScript (GC managed)
3. **Ethers** - Traditional JavaScript (GC managed)

## Best Practices

### Guil Best Practices

\`\`\`typescript
// ✅ Use branded types consistently
import { ${operationDisplay} } from '@tevm/primitives';

// ✅ Let the library handle validation
const result = ${operationDisplay}(input);

// ✅ Type system prevents errors
function process(value: BrandedType) {
  // Guaranteed to be valid
}
\`\`\`

### Ethers Best Practices

\`\`\`typescript
// ⚠️ Always validate inputs
import { isValid, process } from 'ethers';

if (!isValid(input)) {
  throw new Error('Invalid input');
}
const result = process(input);
\`\`\`

### Viem Best Practices

\`\`\`typescript
// ⚠️ Validate when needed
import { isValid, process } from 'viem';

// Validate at boundaries
if (!isValid(input)) {
  throw new Error('Invalid input');
}
const result = process(input);
\`\`\`

## When to Choose Each Library

### Choose Guil Native If:
- ✅ Maximum performance is critical
- ✅ You want compile-time type safety
- ✅ You need memory-safe cryptographic operations
- ✅ You can use native Node.js addons
- ✅ You value correctness over compatibility

### Choose Guil WASM If:
- ✅ You need portable performance
- ✅ You want compile-time type safety
- ✅ You need to run in browsers or edge environments
- ✅ You want smaller bundle sizes than native
- ✅ You value correctness and portability

### Choose Ethers If:
- ✅ You need maximum ecosystem compatibility
- ✅ You're working with existing Ethers-based code
- ✅ You need mature, battle-tested implementations
- ⚠️ You're okay with manual validation
- ⚠️ Runtime type safety is acceptable

### Choose Viem If:
- ✅ You need modern TypeScript features
- ✅ Bundle size is critical
- ✅ You want excellent tree-shaking
- ✅ You need fast JavaScript performance
- ⚠️ You're okay with generic types
- ⚠️ Runtime validation is acceptable

## Conclusion

**For new projects prioritizing correctness and type safety:** Choose Guil (Native for maximum performance, WASM for portability). The branded types provide significant safety benefits with minimal performance cost.

**For existing projects or maximum compatibility:** Stick with Ethers for its mature ecosystem and broad compatibility.

**For modern projects prioritizing bundle size:** Choose Viem for its excellent tree-shaking and performance, but be prepared to add validation where needed.

**Key Insight:** Guil's branded types catch entire classes of bugs at compile time that other libraries only catch at runtime (if validation is remembered). This makes Guil particularly valuable for mission-critical applications where correctness is paramount.
`;

	return md;
}

// Main execution
function main() {
	const comparisonsDir = path.join(process.cwd(), "comparisons");
	console.log(`Scanning for operations in: ${comparisonsDir}`);

	const operations = findAllOperations(comparisonsDir);
	console.log(`Found ${operations.length} operations`);

	let generated = 0;
	let skipped = 0;

	for (const operation of operations) {
		// For operations where files are in the parent directory (e.g., uint256/arithmetic/add-*.ts)
		// Place COMPARISON.md in parent directory with operation name
		let comparisonPath: string;
		let outputPath: string;

		if (fs.existsSync(operation.path) && fs.statSync(operation.path).isDirectory()) {
			// Normal case: operation has its own directory
			comparisonPath = path.join(operation.path, "COMPARISON.md");
			outputPath = `${operation.category}/${operation.name}/COMPARISON.md`;
		} else {
			// Flat structure case: files are like add-ethers.ts in parent directory
			const parentDir = path.dirname(operation.path);
			const operationDir = path.join(parentDir, operation.name);

			// Create operation directory
			if (!fs.existsSync(operationDir)) {
				fs.mkdirSync(operationDir, { recursive: true });
			}

			comparisonPath = path.join(operationDir, "COMPARISON.md");
			outputPath = `${operation.category}/${operation.name}/COMPARISON.md`;
		}

		// Skip if COMPARISON.md already exists
		if (fs.existsSync(comparisonPath)) {
			console.log(`  Skipping ${outputPath} (already exists)`);
			skipped++;
			continue;
		}

		// Generate and write COMPARISON.md
		const content = generateComparisonMd(operation);
		fs.writeFileSync(comparisonPath, content);
		console.log(`✅ Generated ${outputPath}`);
		generated++;
	}

	console.log(`\nSummary:`);
	console.log(`  Generated: ${generated}`);
	console.log(`  Skipped: ${skipped}`);
	console.log(`  Total: ${operations.length}`);
}

main();
