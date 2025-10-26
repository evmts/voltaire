/**
 * Uint256 Benchmark Documentation Generator
 *
 * Generates comprehensive documentation comparing Uint256 operations
 * across guil, ethers, and viem implementations.
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";

const DOCS_PATH = join(import.meta.dirname, "README.md");

interface BenchmarkCategory {
	name: string;
	description: string;
	operations: {
		name: string;
		description: string;
		guilExample: string;
		ethersExample: string;
		viemExample: string;
	}[];
}

const categories: BenchmarkCategory[] = [
	{
		name: "Conversions",
		description:
			"Converting between different representations of 256-bit unsigned integers",
		operations: [
			{
				name: "fromBigInt",
				description: "Convert native bigint to Uint256 with range validation",
				guilExample: `import { fromBigInt } from '@tevm/primitives/uint256';

const value = fromBigInt(42n);
// Returns: Uint256 branded type with overflow protection`,
				ethersExample: `import { toBeHex } from 'ethers';

const value = toBeHex(42n);
// Returns: hex string`,
				viemExample: `import { toHex } from 'viem';

const value = toHex(42n);
// Returns: hex string`,
			},
			{
				name: "toBigInt",
				description: "Convert Uint256 to native bigint",
				guilExample: `import { toBigInt } from '@tevm/primitives/uint256';
import type { Uint256 } from '@tevm/primitives/uint256';

const value: Uint256 = '0x2a' as Uint256;
const bigInt = toBigInt(value);
// Returns: 42n`,
				ethersExample: `import { toBigInt } from 'ethers';

const value = '0x2a';
const bigInt = toBigInt(value);
// Returns: 42n`,
				viemExample: `import { hexToBigInt } from 'viem';

const value = '0x2a';
const bigInt = hexToBigInt(value);
// Returns: 42n`,
			},
			{
				name: "fromHex",
				description: "Convert hex string to Uint256 with validation",
				guilExample: `import { fromHex } from '@tevm/primitives/uint256';

const value = fromHex('0x2a');
// Returns: Uint256 branded type with validation`,
				ethersExample: `import { toBigInt, toBeHex } from 'ethers';

const value = '0x2a';
const validated = toBeHex(toBigInt(value));
// Ethers validates through conversion`,
				viemExample: `import { hexToBigInt, toHex } from 'viem';

const value = '0x2a';
const validated = toHex(hexToBigInt(value));
// Viem validates through conversion`,
			},
			{
				name: "toHex",
				description: "Convert Uint256 to hex string",
				guilExample: `import { toHex } from '@tevm/primitives/uint256';
import type { Uint256 } from '@tevm/primitives/uint256';

const value: Uint256 = '0x2a' as Uint256;
const hex = toHex(value);
// Returns: '0x2a' (already hex, returns as-is)`,
				ethersExample: `import { toBigInt, toBeHex } from 'ethers';

const value = '0x2a';
const hex = toBeHex(toBigInt(value));
// Returns: '0x2a'`,
				viemExample: `import { hexToBigInt, toHex } from 'viem';

const value = '0x2a';
const hex = toHex(hexToBigInt(value));
// Returns: '0x2a'`,
			},
			{
				name: "fromBytes",
				description: "Convert byte array to Uint256 (big-endian)",
				guilExample: `import { fromBytes } from '@tevm/primitives/uint256';

const bytes = new Uint8Array([0, 0, 0, 42]);
const value = fromBytes(bytes);
// Returns: Uint256 branded type`,
				ethersExample: `import { hexlify } from 'ethers';

const bytes = new Uint8Array([0, 0, 0, 42]);
const value = hexlify(bytes);
// Returns: hex string`,
				viemExample: `import { bytesToHex } from 'viem';

const bytes = new Uint8Array([0, 0, 0, 42]);
const value = bytesToHex(bytes);
// Returns: hex string`,
			},
			{
				name: "toBytes",
				description: "Convert Uint256 to 32-byte array (big-endian)",
				guilExample: `import { toBytes } from '@tevm/primitives/uint256';
import type { Uint256 } from '@tevm/primitives/uint256';

const value: Uint256 = '0x2a' as Uint256;
const bytes = toBytes(value);
// Returns: 32-byte Uint8Array (zero-padded)`,
				ethersExample: `import { toBeArray } from 'ethers';

const value = '0x2a';
const bytes = toBeArray(value);
// Returns: Uint8Array`,
				viemExample: `import { hexToBytes } from 'viem';

const value = '0x2a';
const bytes = hexToBytes(value, { size: 32 });
// Returns: 32-byte Uint8Array`,
			},
		],
	},
	{
		name: "Arithmetic",
		description:
			"Safe arithmetic operations with overflow/underflow protection",
		operations: [
			{
				name: "add",
				description: "Addition with overflow detection",
				guilExample: `import { add, fromBigInt } from '@tevm/primitives/uint256';

const a = fromBigInt(42n);
const b = fromBigInt(100n);
const result = add(a, b);
// Returns: Uint256, throws on overflow`,
				ethersExample: `// Ethers uses native bigint operators
const a = 42n;
const b = 100n;
const result = a + b;
// Returns: bigint, no overflow check`,
				viemExample: `// Viem uses native bigint operators
const a = 42n;
const b = 100n;
const result = a + b;
// Returns: bigint, no overflow check`,
			},
			{
				name: "sub",
				description: "Subtraction with underflow detection",
				guilExample: `import { sub, fromBigInt } from '@tevm/primitives/uint256';

const a = fromBigInt(100n);
const b = fromBigInt(42n);
const result = sub(a, b);
// Returns: Uint256, throws on underflow`,
				ethersExample: `// Ethers uses native bigint operators
const a = 100n;
const b = 42n;
const result = a - b;
// Returns: bigint, no underflow check`,
				viemExample: `// Viem uses native bigint operators
const a = 100n;
const b = 42n;
const result = a - b;
// Returns: bigint, no underflow check`,
			},
			{
				name: "mul",
				description: "Multiplication with overflow detection",
				guilExample: `import { mul, fromBigInt } from '@tevm/primitives/uint256';

const a = fromBigInt(42n);
const b = fromBigInt(100n);
const result = mul(a, b);
// Returns: Uint256, throws on overflow`,
				ethersExample: `// Ethers uses native bigint operators
const a = 42n;
const b = 100n;
const result = a * b;
// Returns: bigint, no overflow check`,
				viemExample: `// Viem uses native bigint operators
const a = 42n;
const b = 100n;
const result = a * b;
// Returns: bigint, no overflow check`,
			},
			{
				name: "div",
				description: "Integer division with zero check",
				guilExample: `import { div, fromBigInt } from '@tevm/primitives/uint256';

const a = fromBigInt(100n);
const b = fromBigInt(2n);
const result = div(a, b);
// Returns: Uint256, throws on division by zero`,
				ethersExample: `// Ethers uses native bigint operators
const a = 100n;
const b = 2n;
const result = a / b;
// Returns: bigint, throws on division by zero`,
				viemExample: `// Viem uses native bigint operators
const a = 100n;
const b = 2n;
const result = a / b;
// Returns: bigint, throws on division by zero`,
			},
			{
				name: "mod",
				description: "Modulo operation with zero check",
				guilExample: `import { mod, fromBigInt } from '@tevm/primitives/uint256';

const a = fromBigInt(100n);
const b = fromBigInt(7n);
const result = mod(a, b);
// Returns: Uint256, throws on modulo by zero`,
				ethersExample: `// Ethers uses native bigint operators
const a = 100n;
const b = 7n;
const result = a % b;
// Returns: bigint, throws on modulo by zero`,
				viemExample: `// Viem uses native bigint operators
const a = 100n;
const b = 7n;
const result = a % b;
// Returns: bigint, throws on modulo by zero`,
			},
			{
				name: "pow",
				description: "Exponentiation with overflow detection",
				guilExample: `import { pow, fromBigInt } from '@tevm/primitives/uint256';

const base = fromBigInt(2n);
const exponent = fromBigInt(10n);
const result = pow(base, exponent);
// Returns: Uint256, throws on overflow`,
				ethersExample: `// Ethers uses native bigint operators
const base = 2n;
const exponent = 10n;
const result = base ** exponent;
// Returns: bigint, no overflow check`,
				viemExample: `// Viem uses native bigint operators
const base = 2n;
const exponent = 10n;
const result = base ** exponent;
// Returns: bigint, no overflow check`,
			},
		],
	},
	{
		name: "Comparison",
		description: "Value comparison operations",
		operations: [
			{
				name: "compare",
				description: "Three-way comparison (-1, 0, 1)",
				guilExample: `import { compare, fromBigInt } from '@tevm/primitives/uint256';

const a = fromBigInt(42n);
const b = fromBigInt(100n);
const result = compare(a, b);
// Returns: -1 (a < b)`,
				ethersExample: `// Ethers uses native bigint operators
const a = 42n;
const b = 100n;
const result = a < b ? -1 : a > b ? 1 : 0;
// Returns: -1 (a < b)`,
				viemExample: `// Viem uses native bigint operators
const a = 42n;
const b = 100n;
const result = a < b ? -1 : a > b ? 1 : 0;
// Returns: -1 (a < b)`,
			},
			{
				name: "eq",
				description: "Equality comparison",
				guilExample: `import { eq, fromBigInt } from '@tevm/primitives/uint256';

const a = fromBigInt(42n);
const b = fromBigInt(42n);
const result = eq(a, b);
// Returns: true`,
				ethersExample: `// Ethers uses native bigint operators
const a = 42n;
const b = 42n;
const result = a === b;
// Returns: true`,
				viemExample: `// Viem uses native bigint operators
const a = 42n;
const b = 42n;
const result = a === b;
// Returns: true`,
			},
			{
				name: "lt",
				description: "Less than comparison",
				guilExample: `import { lt, fromBigInt } from '@tevm/primitives/uint256';

const a = fromBigInt(42n);
const b = fromBigInt(100n);
const result = lt(a, b);
// Returns: true`,
				ethersExample: `// Ethers uses native bigint operators
const a = 42n;
const b = 100n;
const result = a < b;
// Returns: true`,
				viemExample: `// Viem uses native bigint operators
const a = 42n;
const b = 100n;
const result = a < b;
// Returns: true`,
			},
			{
				name: "gt",
				description: "Greater than comparison",
				guilExample: `import { gt, fromBigInt } from '@tevm/primitives/uint256';

const a = fromBigInt(100n);
const b = fromBigInt(42n);
const result = gt(a, b);
// Returns: true`,
				ethersExample: `// Ethers uses native bigint operators
const a = 100n;
const b = 42n;
const result = a > b;
// Returns: true`,
				viemExample: `// Viem uses native bigint operators
const a = 100n;
const b = 42n;
const result = a > b;
// Returns: true`,
			},
			{
				name: "lte",
				description: "Less than or equal comparison",
				guilExample: `import { lte, fromBigInt } from '@tevm/primitives/uint256';

const a = fromBigInt(42n);
const b = fromBigInt(100n);
const result = lte(a, b);
// Returns: true`,
				ethersExample: `// Ethers uses native bigint operators
const a = 42n;
const b = 100n;
const result = a <= b;
// Returns: true`,
				viemExample: `// Viem uses native bigint operators
const a = 42n;
const b = 100n;
const result = a <= b;
// Returns: true`,
			},
			{
				name: "gte",
				description: "Greater than or equal comparison",
				guilExample: `import { gte, fromBigInt } from '@tevm/primitives/uint256';

const a = fromBigInt(100n);
const b = fromBigInt(42n);
const result = gte(a, b);
// Returns: true`,
				ethersExample: `// Ethers uses native bigint operators
const a = 100n;
const b = 42n;
const result = a >= b;
// Returns: true`,
				viemExample: `// Viem uses native bigint operators
const a = 100n;
const b = 42n;
const result = a >= b;
// Returns: true`,
			},
			{
				name: "min",
				description: "Return minimum of two values",
				guilExample: `import { min, fromBigInt } from '@tevm/primitives/uint256';

const a = fromBigInt(42n);
const b = fromBigInt(100n);
const result = min(a, b);
// Returns: Uint256 representing 42n`,
				ethersExample: `// Ethers uses native bigint operators
const a = 42n;
const b = 100n;
const result = a < b ? a : b;
// Returns: 42n`,
				viemExample: `// Viem uses native bigint operators
const a = 42n;
const b = 100n;
const result = a < b ? a : b;
// Returns: 42n`,
			},
			{
				name: "max",
				description: "Return maximum of two values",
				guilExample: `import { max, fromBigInt } from '@tevm/primitives/uint256';

const a = fromBigInt(42n);
const b = fromBigInt(100n);
const result = max(a, b);
// Returns: Uint256 representing 100n`,
				ethersExample: `// Ethers uses native bigint operators
const a = 42n;
const b = 100n;
const result = a > b ? a : b;
// Returns: 100n`,
				viemExample: `// Viem uses native bigint operators
const a = 42n;
const b = 100n;
const result = a > b ? a : b;
// Returns: 100n`,
			},
		],
	},
	{
		name: "Bitwise",
		description: "Bitwise operations on 256-bit values",
		operations: [
			{
				name: "and",
				description: "Bitwise AND operation",
				guilExample: `import { and, fromBigInt } from '@tevm/primitives/uint256';

const a = fromBigInt(0xffn);
const b = fromBigInt(0x0fn);
const result = and(a, b);
// Returns: Uint256 representing 0x0f`,
				ethersExample: `// Ethers uses native bigint operators
const a = 0xffn;
const b = 0x0fn;
const result = a & b;
// Returns: 0x0fn`,
				viemExample: `// Viem uses native bigint operators
const a = 0xffn;
const b = 0x0fn;
const result = a & b;
// Returns: 0x0fn`,
			},
			{
				name: "or",
				description: "Bitwise OR operation",
				guilExample: `import { or, fromBigInt } from '@tevm/primitives/uint256';

const a = fromBigInt(0xf0n);
const b = fromBigInt(0x0fn);
const result = or(a, b);
// Returns: Uint256 representing 0xff`,
				ethersExample: `// Ethers uses native bigint operators
const a = 0xf0n;
const b = 0x0fn;
const result = a | b;
// Returns: 0xffn`,
				viemExample: `// Viem uses native bigint operators
const a = 0xf0n;
const b = 0x0fn;
const result = a | b;
// Returns: 0xffn`,
			},
			{
				name: "xor",
				description: "Bitwise XOR operation",
				guilExample: `import { xor, fromBigInt } from '@tevm/primitives/uint256';

const a = fromBigInt(0xffn);
const b = fromBigInt(0x0fn);
const result = xor(a, b);
// Returns: Uint256 representing 0xf0`,
				ethersExample: `// Ethers uses native bigint operators
const a = 0xffn;
const b = 0x0fn;
const result = a ^ b;
// Returns: 0xf0n`,
				viemExample: `// Viem uses native bigint operators
const a = 0xffn;
const b = 0x0fn;
const result = a ^ b;
// Returns: 0xf0n`,
			},
			{
				name: "not",
				description: "Bitwise NOT operation (within 256-bit range)",
				guilExample: `import { not, fromBigInt } from '@tevm/primitives/uint256';

const a = fromBigInt(0n);
const result = not(a);
// Returns: Uint256 representing MAX_UINT256`,
				ethersExample: `// Ethers uses XOR with MAX_UINT256
const MAX_UINT256 = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;
const a = 0n;
const result = MAX_UINT256 ^ a;
// Returns: MAX_UINT256`,
				viemExample: `// Viem uses XOR with MAX_UINT256
const MAX_UINT256 = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;
const a = 0n;
const result = MAX_UINT256 ^ a;
// Returns: MAX_UINT256`,
			},
			{
				name: "shl",
				description: "Left shift operation with overflow detection",
				guilExample: `import { shl, fromBigInt } from '@tevm/primitives/uint256';

const value = fromBigInt(0x1n);
const result = shl(value, 8);
// Returns: Uint256 representing 0x100, throws on overflow`,
				ethersExample: `// Ethers uses native bigint operators
const value = 0x1n;
const result = value << 8n;
// Returns: 0x100n, no overflow check`,
				viemExample: `// Viem uses native bigint operators
const value = 0x1n;
const result = value << 8n;
// Returns: 0x100n, no overflow check`,
			},
			{
				name: "shr",
				description: "Right shift operation",
				guilExample: `import { shr, fromBigInt } from '@tevm/primitives/uint256';

const value = fromBigInt(0x100n);
const result = shr(value, 8);
// Returns: Uint256 representing 0x1`,
				ethersExample: `// Ethers uses native bigint operators
const value = 0x100n;
const result = value >> 8n;
// Returns: 0x1n`,
				viemExample: `// Viem uses native bigint operators
const value = 0x100n;
const result = value >> 8n;
// Returns: 0x1n`,
			},
		],
	},
];

function generateDocs(): string {
	let docs = `# Uint256 Operations Benchmark

Comprehensive comparison of 256-bit unsigned integer operations across three TypeScript/JavaScript libraries:
- **guil** (@tevm/primitives) - Type-safe branded Uint256 with overflow protection
- **ethers** - Uses native bigint with utility functions
- **viem** - Uses native bigint with utility functions

## Key Differences

### Type Safety
- **guil**: Branded type \`Uint256\` provides compile-time type safety and prevents mixing with regular hex strings
- **ethers/viem**: Use plain bigint and hex strings - no type-level protection

### Safety Features
- **guil**: Built-in overflow/underflow detection for all arithmetic operations
- **ethers/viem**: Native bigint has no bounds checking - can exceed uint256 range

### API Design
- **guil**: Rich API with explicit functions for all operations
- **ethers/viem**: Minimal API - relies on native bigint operators

## Benchmark Categories

`;

	for (const category of categories) {
		docs += `### ${category.name}\n\n`;
		docs += `${category.description}\n\n`;

		for (const op of category.operations) {
			docs += `#### ${op.name}\n\n`;
			docs += `${op.description}\n\n`;

			docs += "**guil (@tevm/primitives)**\n\n";
			docs += "```typescript\n";
			docs += op.guilExample;
			docs += "\n```\n\n";

			docs += "**ethers**\n\n";
			docs += "```typescript\n";
			docs += op.ethersExample;
			docs += "\n```\n\n";

			docs += "**viem**\n\n";
			docs += "```typescript\n";
			docs += op.viemExample;
			docs += "\n```\n\n";

			docs += "---\n\n";
		}
	}

	docs += `## Running Benchmarks

### Run All Benchmarks
\`\`\`bash
# Run all uint256 benchmarks
bun run vitest bench comparisons/uint256

# Run specific category
bun run vitest bench comparisons/uint256/conversions
bun run vitest bench comparisons/uint256/arithmetic
bun run vitest bench comparisons/uint256/comparison
bun run vitest bench comparisons/uint256/bitwise
\`\`\`

### Run Individual Benchmarks
\`\`\`bash
# Conversion benchmarks
bun run vitest bench comparisons/uint256/conversions/fromBigInt.bench.ts
bun run vitest bench comparisons/uint256/conversions/toBigInt.bench.ts
bun run vitest bench comparisons/uint256/conversions/fromHex.bench.ts
bun run vitest bench comparisons/uint256/conversions/toHex.bench.ts
bun run vitest bench comparisons/uint256/conversions/fromBytes.bench.ts
bun run vitest bench comparisons/uint256/conversions/toBytes.bench.ts

# Arithmetic benchmarks
bun run vitest bench comparisons/uint256/arithmetic/add.bench.ts
bun run vitest bench comparisons/uint256/arithmetic/sub.bench.ts
bun run vitest bench comparisons/uint256/arithmetic/mul.bench.ts
bun run vitest bench comparisons/uint256/arithmetic/div.bench.ts
bun run vitest bench comparisons/uint256/arithmetic/mod.bench.ts
bun run vitest bench comparisons/uint256/arithmetic/pow.bench.ts

# Comparison benchmarks
bun run vitest bench comparisons/uint256/comparison/compare.bench.ts
bun run vitest bench comparisons/uint256/comparison/eq.bench.ts
bun run vitest bench comparisons/uint256/comparison/lt.bench.ts
bun run vitest bench comparisons/uint256/comparison/gt.bench.ts
bun run vitest bench comparisons/uint256/comparison/lte.bench.ts
bun run vitest bench comparisons/uint256/comparison/gte.bench.ts
bun run vitest bench comparisons/uint256/comparison/min.bench.ts
bun run vitest bench comparisons/uint256/comparison/max.bench.ts

# Bitwise benchmarks
bun run vitest bench comparisons/uint256/bitwise/and.bench.ts
bun run vitest bench comparisons/uint256/bitwise/or.bench.ts
bun run vitest bench comparisons/uint256/bitwise/xor.bench.ts
bun run vitest bench comparisons/uint256/bitwise/not.bench.ts
bun run vitest bench comparisons/uint256/bitwise/shl.bench.ts
bun run vitest bench comparisons/uint256/bitwise/shr.bench.ts
\`\`\`

## Implementation Notes

### guil (@tevm/primitives)
- Branded type system prevents mixing Uint256 with plain strings
- All operations validate inputs and check for overflow/underflow
- Returns Uint256 branded type from all operations
- Throws descriptive errors on invalid operations

### ethers
- Uses native bigint for all numeric operations
- Provides utility functions for conversions (toBeHex, toBigInt, etc.)
- No bounds checking - can exceed uint256 range
- Minimal API surface - relies on language features

### viem
- Uses native bigint for all numeric operations
- Provides utility functions for conversions (toHex, hexToBigInt, etc.)
- No bounds checking - can exceed uint256 range
- Minimal API surface - relies on language features

## When to Use Each

**Use guil when:**
- You need type safety and want to prevent bugs at compile time
- You want overflow/underflow protection
- You're building mission-critical applications handling user funds
- You prefer explicit APIs over operators

**Use ethers/viem when:**
- You want minimal abstractions over native bigint
- Performance is critical (native operators are fastest)
- You're comfortable managing bounds checking yourself
- You prefer concise code using language operators

## Architecture

\`\`\`
comparisons/uint256/
├── conversions/          # Conversion operations
│   ├── fromBigInt-*.ts
│   ├── toBigInt-*.ts
│   ├── fromHex-*.ts
│   ├── toHex-*.ts
│   ├── fromBytes-*.ts
│   └── toBytes-*.ts
├── arithmetic/           # Arithmetic operations
│   ├── add-*.ts
│   ├── sub-*.ts
│   ├── mul-*.ts
│   ├── div-*.ts
│   ├── mod-*.ts
│   └── pow-*.ts
├── comparison/           # Comparison operations
│   ├── compare-*.ts
│   ├── eq-*.ts
│   ├── lt-*.ts
│   ├── gt-*.ts
│   ├── lte-*.ts
│   ├── gte-*.ts
│   ├── min-*.ts
│   └── max-*.ts
├── bitwise/              # Bitwise operations
│   ├── and-*.ts
│   ├── or-*.ts
│   ├── xor-*.ts
│   ├── not-*.ts
│   ├── shl-*.ts
│   └── shr-*.ts
└── docs.ts               # This documentation generator
\`\`\`

## Related Documentation

- [Uint256 API Documentation](../../src/primitives/uint-utils/README.md)
- [Ethers Documentation](https://docs.ethers.org/)
- [Viem Documentation](https://viem.sh/)
`;

	return docs;
}

// Generate and write documentation
const docs = generateDocs();
writeFileSync(DOCS_PATH, docs);

console.log(`Documentation generated at ${DOCS_PATH}`);
