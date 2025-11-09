// Real-world example: Event indexing system using bloom filters
import {
	BloomFilter,
	BITS,
	DEFAULT_HASH_COUNT,
} from "../../../src/primitives/BloomFilter/index.js";

console.log("Event Indexing System with Bloom Filters\n");

// Simulate event types
type EventType = "Transfer" | "Approval" | "Swap" | "Mint" | "Burn" | "Sync";

interface Event {
	type: EventType;
	address: string;
	blockNumber: number;
	txHash: string;
}

// Event index with bloom filters per event type
class EventIndex {
	private filters = new Map<EventType, typeof BloomFilter.prototype>();
	private encoder = new TextEncoder();

	constructor() {
		// Create a filter for each event type
		const eventTypes: EventType[] = [
			"Transfer",
			"Approval",
			"Swap",
			"Mint",
			"Burn",
			"Sync",
		];
		for (const type of eventTypes) {
			this.filters.set(type, BloomFilter.create(BITS, DEFAULT_HASH_COUNT));
		}
	}

	addEvent(event: Event): void {
		const filter = this.filters.get(event.type);
		if (!filter) return;

		// Add address to event type filter
		filter.add(this.encoder.encode(event.address));
	}

	mightContainAddress(eventType: EventType, address: string): boolean {
		const filter = this.filters.get(eventType);
		if (!filter) return false;
		return filter.contains(this.encoder.encode(address));
	}

	getFilterStats(eventType: EventType): {
		bits: number;
		k: number;
		density: number;
	} {
		const filter = this.filters.get(eventType);
		if (!filter) return { bits: 0, k: 0, density: 0 };

		let setBits = 0;
		for (let i = 0; i < filter.length; i++) {
			const byte = filter[i];
			for (let bit = 0; bit < 8; bit++) {
				if (byte & (1 << bit)) setBits++;
			}
		}

		return {
			bits: filter.m,
			k: filter.k,
			density: (setBits / filter.m) * 100,
		};
	}

	exportFilters(): Map<EventType, string> {
		const exported = new Map<EventType, string>();
		for (const [type, filter] of this.filters) {
			exported.set(type, filter.toHex());
		}
		return exported;
	}
}

// Simulate events
const events: Event[] = [
	{ type: "Transfer", address: "USDC", blockNumber: 1000, txHash: "0x01" },
	{ type: "Transfer", address: "DAI", blockNumber: 1001, txHash: "0x02" },
	{ type: "Approval", address: "USDC", blockNumber: 1002, txHash: "0x03" },
	{ type: "Swap", address: "UniswapV2", blockNumber: 1003, txHash: "0x04" },
	{ type: "Swap", address: "UniswapV3", blockNumber: 1004, txHash: "0x05" },
	{ type: "Mint", address: "UniswapV2", blockNumber: 1005, txHash: "0x06" },
	{ type: "Burn", address: "UniswapV2", blockNumber: 1006, txHash: "0x07" },
	{ type: "Transfer", address: "WETH", blockNumber: 1007, txHash: "0x08" },
	{ type: "Swap", address: "SushiSwap", blockNumber: 1008, txHash: "0x09" },
	{ type: "Transfer", address: "USDT", blockNumber: 1009, txHash: "0x0a" },
];

// Build index
console.log("Building event index...");
const index = new EventIndex();

for (const event of events) {
	index.addEvent(event);
}

console.log(`Indexed ${events.length} events\n`);

// Query the index
console.log("Query 1: Find Transfer events for USDC");
if (index.mightContainAddress("Transfer", "USDC")) {
	console.log("  ✓ USDC might have Transfer events");
	console.log("  Action: Scan Transfer events for USDC");
} else {
	console.log("  ✗ USDC definitely has no Transfer events");
}

console.log("\nQuery 2: Find Swap events for USDC");
if (index.mightContainAddress("Swap", "USDC")) {
	console.log("  ✓ USDC might have Swap events (likely false positive)");
	console.log("  Action: Scan Swap events for USDC");
} else {
	console.log("  ✗ USDC definitely has no Swap events");
}

console.log("\nQuery 3: Find all event types for UniswapV2");
const eventTypes: EventType[] = [
	"Transfer",
	"Approval",
	"Swap",
	"Mint",
	"Burn",
	"Sync",
];
console.log("  UniswapV2 might appear in:");
for (const type of eventTypes) {
	if (index.mightContainAddress(type, "UniswapV2")) {
		console.log(`    - ${type} events`);
	}
}

console.log("\nQuery 4: Find Transfer events for addresses");
const addresses = ["USDC", "DAI", "WETH", "LINK"];
console.log("  Addresses with Transfer events:");
for (const addr of addresses) {
	if (index.mightContainAddress("Transfer", addr)) {
		console.log(`    - ${addr} ✓`);
	}
}

// Show filter statistics
console.log("\nFilter statistics:");
for (const type of eventTypes) {
	const stats = index.getFilterStats(type);
	if (stats.bits > 0) {
		console.log(
			`  ${type}: ${stats.density.toFixed(2)}% density (${stats.bits} bits, ${stats.k} hash functions)`,
		);
	}
}

// Export for storage
console.log("\nExporting filters for persistent storage...");
const exported = index.exportFilters();
console.log(`Exported ${exported.size} filters`);
console.log("Sample (Transfer filter):");
const transferHex = exported.get("Transfer")!;
console.log(`  ${transferHex.slice(0, 40)}...${transferHex.slice(-40)}`);

// Demonstrate efficiency
console.log("\nEfficiency analysis:");
const totalEvents = events.length;
const transferEvents = events.filter((e) => e.type === "Transfer").length;
const swapEvents = events.filter((e) => e.type === "Swap").length;

console.log(`  Total events indexed: ${totalEvents}`);
console.log(`  Transfer events: ${transferEvents}`);
console.log(`  Swap events: ${swapEvents}`);
console.log("\nBloom filter benefits:");
console.log("  - Constant O(1) lookup time per event type");
console.log("  - Fixed memory: 256 bytes per event type");
console.log("  - Quick rejection of non-matching addresses");
console.log("  - Enable efficient multi-criteria filtering");
