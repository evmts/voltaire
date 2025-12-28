import { Chain } from "voltaire";
import type { Hardfork } from "voltaire/primitives/Chain";

// Example: Hardfork detection and EIP support

const eth = Chain.fromId(1)!; // Ethereum Mainnet

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

for (const hardfork of majorHardforks) {
	const supported = Chain.supportsHardfork(eth, hardfork);
	const block = Chain.getHardforkBlock(eth, hardfork);
	const blockStr = block !== undefined ? block.toLocaleString() : "N/A";
	const supportStr = supported ? "✓" : "✗";
}

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
	if (block !== undefined) {
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
const testBlocks = [
	1000000, // Pre-DAO
	12965000, // London
	15537394, // Paris (The Merge)
	17034870, // Shanghai
	19426587, // Cancun
];

for (const block of testBlocks) {
	const hardfork = getHardforkAtBlock(eth, block);
}
const chains = [
	{ chain: Chain.fromId(1)!, name: "Mainnet" },
	{ chain: Chain.fromId(11155111)!, name: "Sepolia" },
	{ chain: Chain.fromId(10)!, name: "Optimism" },
	{ chain: Chain.fromId(42161)!, name: "Arbitrum" },
];

const hardforks: Hardfork[] = ["london", "paris", "shanghai", "cancun"];

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
for (const { chain, name } of chains) {
	const c = Chain.from(chain);
}
