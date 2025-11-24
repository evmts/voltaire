import * as Hardfork from "../../../primitives/Hardfork/index.js";

// Feature availability across hardforks

console.log("=== FEATURE AVAILABILITY BY HARDFORK ===\n");

// Define feature sets
interface FeatureSet {
	fork: string;
	opcodes: string[];
	transactionTypes: string[];
	specialFeatures: string[];
}

const features: FeatureSet[] = [
	{
		fork: "Frontier",
		opcodes: ["Basic EVM opcodes"],
		transactionTypes: ["Type 0 (Legacy)"],
		specialFeatures: ["Original EVM"],
	},
	{
		fork: "Homestead",
		opcodes: ["DELEGATECALL (0xf4)"],
		transactionTypes: ["Type 0 (Legacy)"],
		specialFeatures: ["EIP-2, EIP-7, EIP-8"],
	},
	{
		fork: "Byzantium",
		opcodes: [
			"REVERT (0xfd)",
			"RETURNDATASIZE (0x3d)",
			"RETURNDATACOPY (0x3e)",
			"STATICCALL (0xfa)",
		],
		transactionTypes: ["Type 0 (Legacy)"],
		specialFeatures: ["Return data", "Static calls"],
	},
	{
		fork: "Constantinople",
		opcodes: [
			"CREATE2 (0xf5)",
			"SHL (0x1b)",
			"SHR (0x1c)",
			"SAR (0x1d)",
			"EXTCODEHASH (0x3f)",
		],
		transactionTypes: ["Type 0 (Legacy)"],
		specialFeatures: ["Deterministic addresses", "Bitwise shifts"],
	},
	{
		fork: "Istanbul",
		opcodes: ["CHAINID (0x46)", "SELFBALANCE (0x47)"],
		transactionTypes: ["Type 0 (Legacy)"],
		specialFeatures: ["Chain identification", "Gas optimizations"],
	},
	{
		fork: "Berlin",
		opcodes: [],
		transactionTypes: ["Type 0 (Legacy)", "Type 1 (EIP-2930 Access Lists)"],
		specialFeatures: ["Cold/warm access", "Access lists"],
	},
	{
		fork: "London",
		opcodes: ["BASEFEE (0x48)"],
		transactionTypes: [
			"Type 0 (Legacy)",
			"Type 1 (Access Lists)",
			"Type 2 (EIP-1559)",
		],
		specialFeatures: ["EIP-1559 fee market", "Base fee mechanism"],
	},
	{
		fork: "Merge",
		opcodes: ["PREVRANDAO (0x44 repurposed)"],
		transactionTypes: [
			"Type 0 (Legacy)",
			"Type 1 (Access Lists)",
			"Type 2 (EIP-1559)",
		],
		specialFeatures: ["Proof of Stake", "Beacon Chain integration"],
	},
	{
		fork: "Shanghai",
		opcodes: ["PUSH0 (0x5f)"],
		transactionTypes: [
			"Type 0 (Legacy)",
			"Type 1 (Access Lists)",
			"Type 2 (EIP-1559)",
		],
		specialFeatures: ["Withdrawals", "Warm COINBASE"],
	},
	{
		fork: "Cancun",
		opcodes: [
			"TLOAD (0x5c)",
			"TSTORE (0x5d)",
			"MCOPY (0x5e)",
			"BLOBHASH (0x49)",
			"BLOBBASEFEE (0x4a)",
		],
		transactionTypes: [
			"Type 0 (Legacy)",
			"Type 1 (Access Lists)",
			"Type 2 (EIP-1559)",
			"Type 3 (Blob transactions)",
		],
		specialFeatures: [
			"Proto-danksharding",
			"Transient storage",
			"Blob transactions",
		],
	},
];

// Display features
features.forEach(({ fork, opcodes, transactionTypes, specialFeatures }) => {
	console.log(`${fork}:`);
	if (opcodes.length > 0) {
		console.log("  New opcodes:");
		opcodes.forEach((op) => console.log(`    - ${op}`));
	}
	console.log("  Transaction types:");
	transactionTypes.forEach((type) => console.log(`    - ${type}`));
	console.log("  Special features:");
	specialFeatures.forEach((feat) => console.log(`    - ${feat}`));
	console.log("");
});

// Feature detection matrix
console.log("=== FEATURE DETECTION MATRIX ===\n");

const forks = [
	Hardfork.BERLIN,
	Hardfork.LONDON,
	Hardfork.MERGE,
	Hardfork.SHANGHAI,
	Hardfork.CANCUN,
	Hardfork.PRAGUE,
];

const forkNames = forks.map((f) => Hardfork.toString(f));

console.log("Feature Support:");
console.log(
	`Fork${" ".repeat(12)} | EIP-1559 | PUSH0 | Blobs | Transient | PoS`,
);
console.log("-".repeat(70));

forks.forEach((fork) => {
	const name = Hardfork.toString(fork).padEnd(15);
	const eip1559 = Hardfork.hasEIP1559(fork) ? "✓" : "✗";
	const push0 = Hardfork.hasEIP3855(fork) ? "✓" : "✗";
	const blobs = Hardfork.hasEIP4844(fork) ? "✓" : "✗";
	const transient = Hardfork.hasEIP1153(fork) ? "✓" : "✗";
	const pos = Hardfork.isPostMerge(fork) ? "✓" : "✗";

	console.log(
		`${name} | ${eip1559}       | ${push0}     | ${blobs}     | ${transient}         | ${pos}`,
	);
});

// Check feature introduction
console.log("\n=== FEATURE INTRODUCTION ===\n");

const featureChecks = [
	{
		name: "EIP-1559 (Fee market)",
		check: (f: string) => Hardfork.hasEIP1559(f),
	},
	{
		name: "PUSH0 opcode",
		check: (f: string) => Hardfork.hasEIP3855(f),
	},
	{
		name: "Blob transactions",
		check: (f: string) => Hardfork.hasEIP4844(f),
	},
	{
		name: "Transient storage",
		check: (f: string) => Hardfork.hasEIP1153(f),
	},
	{
		name: "Proof of Stake",
		check: (f: string) => Hardfork.isPostMerge(f),
	},
];

featureChecks.forEach(({ name, check }) => {
	const allForks = Hardfork.allNames();
	let introduced = "Unknown";

	for (const forkName of allForks) {
		const fork = Hardfork.fromString(forkName);
		if (fork && check(fork)) {
			introduced = forkName.charAt(0).toUpperCase() + forkName.slice(1);
			break;
		}
	}

	console.log(`${name}: Introduced in ${introduced}`);
});

// Gas cost changes
console.log("\n=== NOTABLE GAS COST CHANGES ===\n");

console.log("Tangerine Whistle (EIP-150):");
console.log("  EXTCODESIZE: 20 → 700 gas");
console.log("  BALANCE: 20 → 400 gas");
console.log("  CALL: 40 → 700 gas\n");

console.log("Istanbul (EIP-2200):");
console.log("  SSTORE: New pricing model");
console.log("  Net gas metering\n");

console.log("Berlin (EIP-2929):");
console.log("  Cold SLOAD: 800 → 2,100 gas");
console.log("  Cold account access: 700 → 2,600 gas");
console.log("  Warm access: 100 gas\n");

console.log("Cancun:");
console.log("  TLOAD: 100 gas (vs SLOAD 2,100)");
console.log("  TSTORE: 100 gas (vs SSTORE 2,900-20,000)");
