import { Hex } from "@tevm/voltaire";

// FilterId: Ethereum event filter identifiers
// Used with eth_newFilter, eth_getFilterChanges, eth_uninstallFilter

// Filter IDs are returned by the node when creating filters
const filterId = "0x1a2b3c4d5e6f";
console.log("Filter ID:", filterId);

// Types of filters
const filterTypes = {
	newBlockFilter: "Notifies on new block headers",
	newPendingTransactionFilter: "Notifies on pending transactions",
	logFilter: "Notifies on matching event logs",
};

console.log("\nFilter types:");
Object.entries(filterTypes).forEach(([type, desc]) => {
	console.log(`  ${type}: ${desc}`);
});

// Example: Create log filter params
const logFilterParams = {
	fromBlock: "latest",
	toBlock: "latest",
	address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
	topics: [
		// Transfer(address,address,uint256) topic0
		"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
		null, // any from address
		null, // any to address
	],
};

console.log("\nLog filter params:");
console.log("  Address:", logFilterParams.address);
console.log("  Topic0:", logFilterParams.topics[0]?.slice(0, 20) + "...");

// Filter lifecycle
const filterLifecycle = [
	"1. eth_newFilter - Create filter, get ID",
	"2. eth_getFilterChanges - Poll for updates",
	"3. eth_uninstallFilter - Remove filter",
];

console.log("\nFilter lifecycle:");
filterLifecycle.forEach((step) => console.log(`  ${step}`));

// Alternative: eth_getLogs (no filter management)
const getLogsParams = {
	fromBlock: "0x" + (19000000).toString(16),
	toBlock: "0x" + (19000100).toString(16),
	address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
	topics: [
		"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
	],
};

console.log("\neth_getLogs params:");
console.log("  Block range:", parseInt(getLogsParams.fromBlock, 16), "-", parseInt(getLogsParams.toBlock, 16));

// WebSocket subscription alternative
const subscriptionTypes = {
	newHeads: "New block headers",
	logs: "Event logs with filter",
	newPendingTransactions: "Pending tx hashes",
	syncing: "Sync status changes",
};

console.log("\nWebSocket subscriptions (eth_subscribe):");
Object.entries(subscriptionTypes).forEach(([type, desc]) => {
	console.log(`  ${type}: ${desc}`);
});
