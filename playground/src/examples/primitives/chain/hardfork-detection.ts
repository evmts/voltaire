import * as Chain from "voltaire/primitives/Chain";
import type { Hardfork } from "voltaire/primitives/Chain";

// Example: Hardfork detection and EIP support

const eth = Chain.fromId(1)!; // Ethereum Mainnet

console.log("\n=== Current Hardfork Status ===");
console.log("Chain:", Chain.getName(eth));
console.log("Latest hardfork:", Chain.getLatestHardfork(eth));

// Check major hardfork support
const majorHardforks: Hardfork[] = [
	"homestead",
	"byzantium",
	"constantinople",
	"istanbul",
	"berlin",
	"london",
	"paris",
	"shanghai",
	"cancun",
	"prague",
];

console.log("\n=== Hardfork Support Matrix ===");
console.log("Hardfork | Supported | Block Number");
console.log("---------|-----------|-------------");

for (const hardfork of majorHardforks) {
	const supported = Chain.supportsHardfork(eth, hardfork);
	const block = Chain.getHardforkBlock(eth, hardfork);
	const blockStr = block !== undefined ? block.toLocaleString() : "N/A";
	const supportStr = supported ? "✓" : "✗";

	console.log(`${hardfork.padEnd(20)} | ${supportStr.padEnd(9)} | ${blockStr}`);
}

// EIP support detection (based on hardforks)
console.log("\n=== EIP Support Detection ===");

interface EIP {
	number: number;
	name: string;
	hardfork: Hardfork;
}

const eips: EIP[] = [
	{ number: 1559, name: "Fee Market", hardfork: "london" },
	{ number: 2930, name: "Access Lists", hardfork: "berlin" },
	{ number: 3529, name: "Gas Refund Reduction", hardfork: "london" },
	{
		number: 3541,
		name: "Reject New Contracts Starting with 0xEF",
		hardfork: "london",
	},
	{ number: 3554, name: "Difficulty Bomb Delay", hardfork: "london" },
	{ number: 3675, name: "The Merge (Proof of Stake)", hardfork: "paris" },
	{ number: 4895, name: "Beacon Chain Withdrawals", hardfork: "shanghai" },
	{ number: 4844, name: "Shard Blob Transactions", hardfork: "cancun" },
];

for (const eip of eips) {
	const supported = Chain.supportsHardfork(eth, eip.hardfork);
	const block = Chain.getHardforkBlock(eth, eip.hardfork);

	console.log(`EIP-${eip.number} (${eip.name}):`);
	console.log(`  Hardfork: ${eip.hardfork}`);
	console.log(`  Supported: ${supported ? "✓" : "✗"}`);
	if (block !== undefined) {
		console.log(`  Active since block: ${block.toLocaleString()}`);
	}
}

// Check block for hardfork support
function getHardforkAtBlock(
	chain: ReturnType<typeof Chain.from>,
	blockNumber: number,
): Hardfork {
	const forks: Hardfork[] = [
		"cancun",
		"shanghai",
		"paris",
		"london",
		"berlin",
		"istanbul",
		"constantinople",
		"byzantium",
		"homestead",
		"chainstart",
	];

	for (const fork of forks) {
		const forkBlock = Chain.getHardforkBlock(chain, fork);
		if (forkBlock !== undefined && blockNumber >= forkBlock) {
			return fork;
		}
	}

	return "chainstart";
}

console.log("\n=== Hardfork at Specific Blocks ===");
const testBlocks = [
	1000000, // Pre-DAO
	12965000, // London
	15537394, // Paris (The Merge)
	17034870, // Shanghai
	19426587, // Cancun
];

for (const block of testBlocks) {
	const hardfork = getHardforkAtBlock(eth, block);
	console.log(`Block ${block.toLocaleString()}: ${hardfork}`);
}

// Multi-chain hardfork comparison
console.log("\n=== Multi-Chain Hardfork Status ===");
const chains = [
	{ chain: Chain.fromId(1)!, name: "Mainnet" },
	{ chain: Chain.fromId(11155111)!, name: "Sepolia" },
	{ chain: Chain.fromId(10)!, name: "Optimism" },
	{ chain: Chain.fromId(42161)!, name: "Arbitrum" },
];

const hardforks: Hardfork[] = ["london", "paris", "shanghai", "cancun"];

console.log("\nChain | Latest | London | Paris | Shanghai | Cancun");
console.log("------|--------|--------|-------|----------|-------");

for (const { chain, name } of chains) {
	const c = Chain.from(chain);
	const latest = Chain.getLatestHardfork(c);
	const row = [name.padEnd(10), latest.padEnd(8)];

	for (const fork of hardforks) {
		const block = Chain.getHardforkBlock(c, fork);
		row.push(
			block !== undefined ? block.toString().padEnd(10) : "N/A".padEnd(10),
		);
	}

	console.log(row.join(" | "));
}

// Feature detection helper
function supportsEIP1559(chain: ReturnType<typeof Chain.from>): boolean {
	return Chain.supportsHardfork(chain, "london");
}

function supportsEIP4844(chain: ReturnType<typeof Chain.from>): boolean {
	return Chain.supportsHardfork(chain, "cancun");
}

function supportsPoS(chain: ReturnType<typeof Chain.from>): boolean {
	return Chain.supportsHardfork(chain, "paris");
}

console.log("\n=== Feature Detection ===");
for (const { chain, name } of chains) {
	const c = Chain.from(chain);
	console.log(`${name}:`);
	console.log(`  EIP-1559 (Fee Market): ${supportsEIP1559(c) ? "✓" : "✗"}`);
	console.log(`  EIP-4844 (Blob Txs): ${supportsEIP4844(c) ? "✓" : "✗"}`);
	console.log(`  Proof of Stake: ${supportsPoS(c) ? "✓" : "✗"}`);
}
