import { Hardfork } from "@tevm/voltaire";
// Create some hardforks for comparison
const frontier = Hardfork.FRONTIER;
const london = Hardfork.LONDON;
const merge = Hardfork.MERGE;
const shanghai = Hardfork.SHANGHAI;
const cancun = Hardfork.CANCUN;
const londonToCancun = Hardfork.range(london, cancun);

const mergeToShanghai = Hardfork.range(merge, shanghai);

function checkCompatibility(
	targetFork: string,
	requiredFeatures: {
		name: string;
		check: (f: string) => boolean;
	}[],
) {
	let compatible = true;
	for (const { name, check } of requiredFeatures) {
		const supported = check(targetFork);
		if (!supported) compatible = false;
	}
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

const userFork = Hardfork.fromString("london");
const requiredFork = Hardfork.SHANGHAI;

if (userFork && Hardfork.isAtLeast(userFork, requiredFork)) {
} else {
}

const unsorted = [
	Hardfork.CANCUN,
	Hardfork.FRONTIER,
	Hardfork.LONDON,
	Hardfork.MERGE,
	Hardfork.SHANGHAI,
];

const sorted = [...unsorted].sort(Hardfork.compare);
