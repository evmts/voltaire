import { generateDocs } from "../shared/docs-generator.js";

export async function generateNumericDocs(): Promise<string> {
	const categories = [
		{
			name: "convertUnit",
			description:
				"Unified function to convert between any Ethereum units (wei, kwei, mwei, gwei, microether, milliether, ether). Takes value as bigint and returns bigint.",
			implementationFiles: {
				guil: "./comparisons/numeric/convertUnit-guil.ts",
				ethers: "./comparisons/numeric/convertUnit-ethers.ts",
				viem: "./comparisons/numeric/convertUnit-viem.ts",
			},
		},
		{
			name: "gweiToWei",
			description:
				"Converts gwei amounts to wei. Common for gas price calculations. Takes bigint gwei, returns bigint wei.",
			implementationFiles: {
				guil: "./comparisons/numeric/gweiToWei-guil.ts",
				ethers: "./comparisons/numeric/gweiToWei-ethers.ts",
				viem: "./comparisons/numeric/gweiToWei-viem.ts",
			},
		},
		{
			name: "weiToGwei",
			description:
				"Converts wei amounts to gwei. Common for displaying gas prices. Takes bigint wei, returns bigint gwei.",
			implementationFiles: {
				guil: "./comparisons/numeric/weiToGwei-guil.ts",
				ethers: "./comparisons/numeric/weiToGwei-ethers.ts",
				viem: "./comparisons/numeric/weiToGwei-viem.ts",
			},
		},
		{
			name: "etherToWei",
			description:
				"Converts ether amounts to wei. Takes bigint ether, returns bigint wei.",
			implementationFiles: {
				guil: "./comparisons/numeric/etherToWei-guil.ts",
				ethers: "./comparisons/numeric/etherToWei-ethers.ts",
				viem: "./comparisons/numeric/etherToWei-viem.ts",
			},
		},
		{
			name: "weiToEther",
			description:
				"Converts wei amounts to ether. Takes bigint wei, returns bigint ether.",
			implementationFiles: {
				guil: "./comparisons/numeric/weiToEther-guil.ts",
				ethers: "./comparisons/numeric/weiToEther-ethers.ts",
				viem: "./comparisons/numeric/weiToEther-viem.ts",
			},
		},
	];

	let docs = `# Numeric Conversion Benchmarks

This directory contains comprehensive benchmarks comparing numeric conversion implementations across guil, ethers, and viem.

## Overview

Numeric conversion functions provide bigint-to-bigint conversions between Ethereum units. Unlike the units API which handles string parsing/formatting, the numeric API works directly with bigint values for performance-critical operations.

### Key Differences from Units API

**Units API** (\`parseEther\`, \`formatEther\`, etc.):
- Converts between **strings** and **bigint**
- Handles decimal parsing and formatting
- User-facing: display and input parsing
- Example: \`parseEther("1.5")\` → \`1500000000000000000n\`

**Numeric API** (\`convertUnit\`, \`gweiToWei\`, etc.):
- Converts between **bigint** and **bigint**
- Pure arithmetic operations, no string parsing
- Performance-critical: internal calculations
- Example: \`gweiToWei(50n)\` → \`50000000000n\`

## Unit Hierarchy

\`\`\`
1 ether = 1000 milliether
1 milliether = 1000 microether
1 microether = 1000 gwei
1 gwei = 1000 mwei
1 mwei = 1000 kwei
1 kwei = 1000 wei
\`\`\`

## Functions Benchmarked

`;

	for (const category of categories) {
		docs += `### ${category.name}

${category.description}

**Test Coverage:**
- Standard values (1 ETH, 50 Gwei, various amounts)
- Edge cases (zero, very large values)
- All unit pairs (wei↔kwei↔mwei↔gwei↔microether↔milliether↔ether)
- Cross-unit conversions (e.g., kwei→gwei, microether→milliether)

**Implementation Files:**
- guil: \`${category.implementationFiles.guil}\`
- ethers: \`${category.implementationFiles.ethers}\`
- viem: \`${category.implementationFiles.viem}\`

`;
	}

	docs += `## API Comparison

### guil - Unified convertUnit

Guil provides a single \`convertUnit\` function that handles all conversions:

\`\`\`typescript
import { convertUnit, gweiToWei, weiToGwei, etherToWei, weiToEther } from 'guil/numeric';

// Unified API - single function for all conversions
convertUnit(50n, 'gwei', 'wei');      // 50000000000n
convertUnit(1n, 'ether', 'gwei');     // 1000000000n
convertUnit(1000n, 'kwei', 'mwei');   // 1n

// Convenience functions for common conversions
gweiToWei(50n);    // 50000000000n
weiToGwei(50000000000n);  // 50n
etherToWei(1n);    // 1000000000000000000n
weiToEther(1000000000000000000n);  // 1n
\`\`\`

**Benefits:**
- Single function learns all conversions
- Type-safe unit parameters
- Consistent API across all unit pairs
- Direct bigint operations (no string parsing)

### ethers - No Native Support

Ethers does not provide bigint-to-bigint unit conversion functions:

\`\`\`typescript
import { formatUnits, parseUnits } from 'ethers';

// ethers' formatUnits/parseUnits are designed for string↔bigint, not bigint↔bigint
// For bigint-to-bigint conversions, you must implement manually:

const UNITS = {
  wei: 1n,
  kwei: 1000n,
  mwei: 1000000n,
  gwei: 1000000000n,
  szabo: 1000000000000n,      // ethers uses szabo instead of microether
  finney: 1000000000000000n,  // ethers uses finney instead of milliether
  ether: 1000000000000000000n,
};

function convertUnit(value: bigint, fromUnit: string, toUnit: string): bigint {
  const fromValue = UNITS[fromUnit];
  const toValue = UNITS[toUnit];
  return (value * fromValue) / toValue;
}

function gweiToWei(gwei: bigint): bigint {
  return parseUnits(gwei.toString(), 'gwei');
}

function weiToGwei(wei: bigint): bigint {
  const str = formatUnits(wei, 'gwei');
  return BigInt(Math.floor(parseFloat(str)));
}
\`\`\`

**Tradeoffs:**
- No native bigint-to-bigint conversion API
- Must implement manually or use string intermediate
- Unit naming differs (szabo/finney vs microether/milliether)
- formatUnits/parseUnits are optimized for string conversion use case

### viem - No Native convertUnit

Viem provides dedicated functions for common conversions but no unified convertUnit:

\`\`\`typescript
import { formatGwei, parseGwei, formatEther, parseEther, formatUnits, parseUnits } from 'viem';

// Dedicated functions for common conversions (string-based)
parseGwei('50');    // 50000000000n
formatGwei(50000000000n);  // "50"

// For bigint-to-bigint generic conversions, must use format→parse or implement manually
function convertUnit(value: bigint, fromUnit: string, toUnit: string): bigint {
  const formatted = formatUnits(value, fromUnit);
  return parseUnits(formatted, toUnit);
}

// Or implement manually like ethers (shown above)
\`\`\`

**Tradeoffs:**
- No native bigint-to-bigint convertUnit function
- Dedicated functions still require string conversion
- More functions to learn (but tree-shakeable)
- Supports all unit names (wei, kwei, mwei, gwei, microether, milliether, ether)

## Examples

### convertUnit (guil only)

\`\`\`typescript
// All unit conversions with single function
convertUnit(1n, 'ether', 'wei');      // 1000000000000000000n
convertUnit(50n, 'gwei', 'wei');      // 50000000000n
convertUnit(1000n, 'mwei', 'gwei');   // 1n
convertUnit(1n, 'ether', 'gwei');     // 1000000000n

// Works for any unit pair
convertUnit(1000000n, 'kwei', 'ether');  // 0n (rounds down)
convertUnit(5n, 'milliether', 'microether');  // 5000n
\`\`\`

### gweiToWei

\`\`\`typescript
// guil - Direct bigint operation
gweiToWei(50n);     // 50000000000n
gweiToWei(100n);    // 100000000000n
gweiToWei(1n);      // 1000000000n

// ethers - Requires string conversion
parseUnits('50', 'gwei');  // 50000000000n

// viem - Requires string conversion
parseGwei('50');    // 50000000000n
\`\`\`

### weiToGwei

\`\`\`typescript
// guil - Direct bigint operation
weiToGwei(50000000000n);   // 50n
weiToGwei(100000000000n);  // 100n
weiToGwei(1000000000n);    // 1n

// ethers - Format then parse
const gwei = formatUnits(50000000000n, 'gwei');  // "50"
BigInt(Math.floor(parseFloat(gwei)));  // 50n

// viem - Format then parse
const gwei = formatGwei(50000000000n);  // "50"
BigInt(Math.floor(parseFloat(gwei)));  // 50n
\`\`\`

### etherToWei

\`\`\`typescript
// guil - Direct bigint operation
etherToWei(1n);      // 1000000000000000000n
etherToWei(5n);      // 5000000000000000000n
etherToWei(100n);    // 100000000000000000000n

// ethers - Requires string conversion
parseEther('1');     // 1000000000000000000n

// viem - Requires string conversion
parseEther('1');     // 1000000000000000000n
\`\`\`

### weiToEther

\`\`\`typescript
// guil - Direct bigint operation
weiToEther(1000000000000000000n);   // 1n
weiToEther(5000000000000000000n);   // 5n
weiToEther(100000000000000000000n); // 100n

// ethers - Format then parse
const ether = formatEther(1000000000000000000n);  // "1.0"
BigInt(Math.floor(parseFloat(ether)));  // 1n

// viem - Format then parse
const ether = formatEther(1000000000000000000n);  // "1"
BigInt(Math.floor(parseFloat(ether)));  // 1n
\`\`\`

## Performance Considerations

Numeric conversions are performance-critical because:

1. **High Frequency**: Called in tight loops for batch operations
2. **Gas Calculations**: Every transaction involves multiple unit conversions
3. **Real-time Updates**: Balance displays update continuously
4. **No String Overhead**: Pure bigint operations should be faster than string parsing

### Test Data Characteristics

Each benchmark tests:
- **Standard amounts**: 1 ETH, 50 Gwei (common gas price)
- **Large values**: 1 million ETH, 1000 Gwei (stress testing)
- **Edge cases**: Zero, smallest unit, maximum precision
- **All unit pairs**: Comprehensive coverage of unit hierarchy

### Performance Expectations

**guil numeric API:**
- Direct bigint arithmetic
- No string parsing overhead
- Unified function (better code splitting)

**ethers/viem:**
- Format→parse requires string intermediate
- String parsing adds overhead
- More function calls for unit conversions

## Implementation Notes

### guil

\`\`\`typescript
// Direct import from numeric module
import { convertUnit, gweiToWei, weiToGwei } from 'guil/numeric';

// All functions accept and return bigint
const wei = gweiToWei(50n);  // No string conversion needed
const gwei = weiToGwei(wei); // Pure arithmetic
\`\`\`

### ethers

\`\`\`typescript
// Uses existing formatUnits/parseUnits
import { formatUnits, parseUnits } from 'ethers';

// Bigint conversions require string intermediate
function gweiToWei(gwei: bigint): bigint {
  return parseUnits(gwei.toString(), 'gwei');
}

function convertUnit(value: bigint, from: string, to: string): bigint {
  const str = formatUnits(value, from);
  return parseUnits(str, to);
}
\`\`\`

### viem

\`\`\`typescript
// Uses existing format/parse functions
import { formatGwei, parseGwei, formatUnits, parseUnits } from 'viem';

// Common conversions have dedicated functions but still use strings
function gweiToWei(gwei: bigint): bigint {
  return parseGwei(gwei.toString());
}

// Generic conversions use format→parse pattern
function convertUnit(value: bigint, from: string, to: string): bigint {
  const str = formatUnits(value, from);
  return parseUnits(str, to);
}
\`\`\`

## Running Benchmarks

\`\`\`bash
# Run all numeric benchmarks
npm run bench:numeric

# Generate documentation
npm run docs:numeric
\`\`\`

## Related Documentation

- [Ethereum Units Overview](https://ethereum.org/en/developers/docs/intro-to-ether/)
- [Guil Units API](../units/) - String parsing/formatting API
- [BigInt Performance](https://v8.dev/features/bigint) - V8 bigint optimization
`;

	return docs;
}

// Allow running directly to generate docs
if (import.meta.url === `file://${process.argv[1]}`) {
	const docs = await generateNumericDocs();
}
