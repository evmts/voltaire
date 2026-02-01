/**
 * DecodedData Benchmarks - mitata format
 * Decoded ABI data container operations
 */

import { bench, run } from "mitata";
import * as DecodedData from "./index.js";

// ============================================================================
// Test Data
// ============================================================================

// Single value decoded
const singleValue = 1000000000000000000n;
const singleTypes = ["uint256"] as const;

// Multiple values decoded
const multipleValues = [
	"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
	1000000000000000000n,
	true,
] as const;
const multipleTypes = ["address", "uint256", "bool"] as const;

// Array decoded
const arrayValues = [[1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n]] as const;
const arrayTypes = ["uint256[]"] as const;

// String decoded
const stringValues = ["Hello, World! This is a test string."] as const;
const stringTypes = ["string"] as const;

// Complex tuple decoded
const tupleValues = [
	{
		maker: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
		amount: 1000000000000000000n,
		active: true,
	},
] as const;
const tupleTypes = ["(address maker, uint256 amount, bool active)"] as const;

// Large decoded (many values)
const largeValues: bigint[] = [];
for (let i = 0; i < 20; i++) {
	largeValues.push(BigInt(i) * 1000000000000000000n);
}
const largeTypes = Array(20).fill("uint256") as string[];

// Empty decoded
const emptyValues = [] as const;
const emptyTypes = [] as const;

// Pre-created instances
const singleInstance = DecodedData.from(singleValue, singleTypes);
const multipleInstance = DecodedData.from(multipleValues, multipleTypes);
const arrayInstance = DecodedData.from(arrayValues, arrayTypes);
const stringInstance = DecodedData.from(stringValues, stringTypes);
const largeInstance = DecodedData.from(largeValues, largeTypes);
const emptyInstance = DecodedData.from(emptyValues, emptyTypes);

// ============================================================================
// DecodedData.from - construction
// ============================================================================

bench("DecodedData.from - single uint256 - voltaire", () => {
	DecodedData.from(singleValue, singleTypes);
});

bench("DecodedData.from - multiple (address,uint256,bool) - voltaire", () => {
	DecodedData.from(multipleValues, multipleTypes);
});

bench("DecodedData.from - array (uint256[]) - voltaire", () => {
	DecodedData.from(arrayValues, arrayTypes);
});

bench("DecodedData.from - string - voltaire", () => {
	DecodedData.from(stringValues, stringTypes);
});

bench("DecodedData.from - tuple - voltaire", () => {
	DecodedData.from(tupleValues, tupleTypes);
});

bench("DecodedData.from - large (20 values) - voltaire", () => {
	DecodedData.from(largeValues, largeTypes);
});

bench("DecodedData.from - empty - voltaire", () => {
	DecodedData.from(emptyValues, emptyTypes);
});

await run();

// ============================================================================
// Access patterns
// ============================================================================

bench("DecodedData access - .values - voltaire", () => {
	const _ = multipleInstance.values;
});

bench("DecodedData access - .types - voltaire", () => {
	const _ = multipleInstance.types;
});

bench("DecodedData access - indexed value - voltaire", () => {
	const _ = multipleInstance.values[0];
});

await run();

// ============================================================================
// Construction patterns (common use cases)
// ============================================================================

// Simulating decoding transfer return
bench("pattern: transfer return (bool) - voltaire", () => {
	DecodedData.from([true], ["bool"]);
});

// Simulating decoding balanceOf return
bench("pattern: balanceOf return (uint256) - voltaire", () => {
	DecodedData.from([1000000000000000000n], ["uint256"]);
});

// Simulating decoding getReserves return
bench("pattern: getReserves return (uint112,uint112,uint32) - voltaire", () => {
	DecodedData.from(
		[1000000000000000000n, 2000000000000000000n, 1700000000],
		["uint112", "uint112", "uint32"],
	);
});

await run();

// ============================================================================
// Batch operations
// ============================================================================

bench("batch from - 5 simple values - voltaire", () => {
	DecodedData.from(1n, ["uint256"]);
	DecodedData.from(2n, ["uint256"]);
	DecodedData.from(3n, ["uint256"]);
	DecodedData.from(4n, ["uint256"]);
	DecodedData.from(5n, ["uint256"]);
});

bench("batch from - 5 multi values - voltaire", () => {
	for (let i = 0; i < 5; i++) {
		DecodedData.from(
			["0x742d35Cc6634C0532925a3b844Bc9e7595f251e3", BigInt(i), true],
			["address", "uint256", "bool"],
		);
	}
});

await run();
