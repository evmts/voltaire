// Real-world example: Event indexing system using bloom filters
import {
	BITS,
	BloomFilter,
	DEFAULT_HASH_COUNT,
} from "../../../src/primitives/BloomFilter/index.js";

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
const index = new EventIndex();

for (const event of events) {
	index.addEvent(event);
}
if (index.mightContainAddress("Transfer", "USDC")) {
} else {
}
if (index.mightContainAddress("Swap", "USDC")) {
} else {
}
const eventTypes: EventType[] = [
	"Transfer",
	"Approval",
	"Swap",
	"Mint",
	"Burn",
	"Sync",
];
for (const type of eventTypes) {
	if (index.mightContainAddress(type, "UniswapV2")) {
	}
}
const addresses = ["USDC", "DAI", "WETH", "LINK"];
for (const addr of addresses) {
	if (index.mightContainAddress("Transfer", addr)) {
	}
}
for (const type of eventTypes) {
	const stats = index.getFilterStats(type);
	if (stats.bits > 0) {
	}
}
const exported = index.exportFilters();
const transferHex = exported.get("Transfer")!;
const totalEvents = events.length;
const transferEvents = events.filter((e) => e.type === "Transfer").length;
const swapEvents = events.filter((e) => e.type === "Swap").length;
