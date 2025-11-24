import * as Hardfork from "../../../primitives/Hardfork/index.js";

// Hardfork comparison operations

console.log("=== HARDFORK COMPARISON ===\n");

// Create some hardforks for comparison
const frontier = Hardfork.FRONTIER;
const london = Hardfork.LONDON;
const merge = Hardfork.MERGE;
const shanghai = Hardfork.SHANGHAI;
const cancun = Hardfork.CANCUN;

// Basic equality
console.log("Equality:");
console.log("  London == London:", Hardfork.isEqual(london, london));
console.log("  London == Merge:", Hardfork.isEqual(london, merge));
console.log(
	"  Merge == Paris:",
	Hardfork.isEqual(merge, Hardfork.fromString("paris")!),
);

// Greater than
console.log("\nGreater than (>):");
console.log("  Cancun > Shanghai:", Hardfork.isAfter(cancun, shanghai));
console.log("  Shanghai > Cancun:", Hardfork.isAfter(shanghai, cancun));
console.log("  London > Frontier:", Hardfork.isAfter(london, frontier));

// Greater than or equal
console.log("\nGreater than or equal (>=):");
console.log("  Cancun >= Shanghai:", Hardfork.isAtLeast(cancun, shanghai));
console.log("  Cancun >= Cancun:", Hardfork.isAtLeast(cancun, cancun));
console.log("  Shanghai >= Cancun:", Hardfork.isAtLeast(shanghai, cancun));

// Less than
console.log("\nLess than (<):");
console.log("  London < Merge:", Hardfork.isBefore(london, merge));
console.log("  Merge < London:", Hardfork.isBefore(merge, london));
console.log("  Frontier < Cancun:", Hardfork.isBefore(frontier, cancun));

// Less than or equal
console.log("\nLess than or equal (<=):");
console.log("  London <= Merge:", !Hardfork.isAfter(london, merge));
console.log("  London <= London:", !Hardfork.isAfter(london, london));
console.log("  Merge <= London:", !Hardfork.isAfter(merge, london));

// Compare function (returns -1, 0, or 1)
console.log("\nCompare function:");
console.log("  compare(London, Merge):", Hardfork.compare(london, merge));
console.log("  compare(Merge, London):", Hardfork.compare(merge, london));
console.log("  compare(Cancun, Cancun):", Hardfork.compare(cancun, cancun));

// Semantic checks
console.log("\nSemantic checks:");
console.log("  London isAtLeast London:", Hardfork.isAtLeast(london, london));
console.log("  Cancun isAtLeast London:", Hardfork.isAtLeast(cancun, london));
console.log("  London isAtLeast Cancun:", Hardfork.isAtLeast(london, cancun));

console.log(
	"\n  Shanghai isBefore Cancun:",
	Hardfork.isBefore(shanghai, cancun),
);
console.log("  Cancun isBefore Shanghai:", Hardfork.isBefore(cancun, shanghai));

console.log("\n  Cancun isAfter Shanghai:", Hardfork.isAfter(cancun, shanghai));
console.log("  Shanghai isAfter Cancun:", Hardfork.isAfter(shanghai, cancun));

console.log("\n  Merge isEqual Merge:", Hardfork.isEqual(merge, merge));
console.log(
	"  Merge isEqual Paris:",
	Hardfork.isEqual(merge, Hardfork.fromString("paris")!),
);

// Min and max
console.log("\nMin/Max operations:");
console.log("  min(London, Merge):", Hardfork.min([london, merge]));
console.log("  max(London, Merge):", Hardfork.max([london, merge]));
console.log("  min(Cancun, Shanghai):", Hardfork.min([cancun, shanghai]));
console.log("  max(Cancun, Shanghai):", Hardfork.max([cancun, shanghai]));

// Range operations
console.log("\nRange operations:");
const londonToCancun = Hardfork.range(london, cancun);
console.log("  range(London, Cancun):", londonToCancun);
console.log(`  Total forks in range: ${londonToCancun.length}`);

const mergeToShanghai = Hardfork.range(merge, shanghai);
console.log("\n  range(Merge, Shanghai):", mergeToShanghai);
console.log(`  Total forks in range: ${mergeToShanghai.length}`);

// Practical example: Feature compatibility
console.log("\n=== FEATURE COMPATIBILITY CHECK ===\n");

function checkCompatibility(
	targetFork: string,
	requiredFeatures: {
		name: string;
		check: (f: string) => boolean;
	}[],
) {
	console.log(`Target fork: ${targetFork}`);
	console.log("Required features:");

	let compatible = true;
	for (const { name, check } of requiredFeatures) {
		const supported = check(targetFork);
		console.log(`  ${name}: ${supported ? "✓" : "✗"}`);
		if (!supported) compatible = false;
	}

	console.log(`\nCompatible: ${compatible ? "Yes" : "No"}\n`);
	return compatible;
}

// Check if fork supports EIP-1559 transactions
checkCompatibility(Hardfork.CANCUN, [
	{ name: "EIP-1559 (Fee market)", check: (f) => Hardfork.hasEIP1559(f) },
	{ name: "PUSH0 opcode", check: (f) => Hardfork.hasEIP3855(f) },
]);

// Check if fork supports blob transactions
checkCompatibility(Hardfork.SHANGHAI, [
	{ name: "Blob transactions", check: (f) => Hardfork.hasEIP4844(f) },
	{
		name: "Transient storage",
		check: (f) => Hardfork.hasEIP1153(f),
	},
]);

// Version selection example
console.log("=== VERSION SELECTION ===\n");

const userFork = Hardfork.fromString("london");
const requiredFork = Hardfork.SHANGHAI;

if (userFork && Hardfork.isAtLeast(userFork, requiredFork)) {
	console.log(
		`User fork (${Hardfork.toString(userFork)}) meets requirement (${Hardfork.toString(requiredFork)})`,
	);
} else {
	console.log(
		`User fork (${userFork ? Hardfork.toString(userFork) : "unknown"}) does not meet requirement (${Hardfork.toString(requiredFork)})`,
	);
	console.log(`Please upgrade to ${Hardfork.toString(requiredFork)} or later`);
}

// Sorting hardforks
console.log("\n=== SORTING HARDFORKS ===\n");

const unsorted = [
	Hardfork.CANCUN,
	Hardfork.FRONTIER,
	Hardfork.LONDON,
	Hardfork.MERGE,
	Hardfork.SHANGHAI,
];

const sorted = [...unsorted].sort(Hardfork.compare);

console.log("Unsorted:", unsorted.map(Hardfork.toString));
console.log("Sorted:", sorted.map(Hardfork.toString));
