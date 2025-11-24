import * as Chain from "voltaire/primitives/Chain";

// Example: Ethereum Mainnet chain configuration and properties

const eth = Chain.fromId(1)!; // Ethereum Mainnet

console.log("\n=== Ethereum Mainnet ===");
console.log("Chain ID:", eth.chainId);
console.log("Name:", Chain.getName(eth));
console.log("Short name:", Chain.getShortName(eth));
console.log("Symbol:", Chain.getSymbol(eth));

console.log("\n=== Network Info ===");
console.log("RPC URL:", Chain.getRpcUrl(eth));
console.log("WebSocket URL:", Chain.getWebsocketUrl(eth));
console.log("Explorer URL:", Chain.getExplorerUrl(eth));

console.log("\n=== Chain Properties ===");
console.log("Average block time:", Chain.getBlockTime(eth), "seconds");
console.log("Block gas limit:", Chain.getGasLimit(eth).toLocaleString());
console.log("Is testnet:", Chain.isTestnet(eth));
console.log("Is L2:", Chain.isL2(eth));

console.log("\n=== Hardfork History ===");
const hardforks = [
	"homestead",
	"byzantium",
	"constantinople",
	"istanbul",
	"berlin",
	"london",
	"paris",
	"shanghai",
	"cancun",
] as const;

for (const fork of hardforks) {
	const block = Chain.getHardforkBlock(eth, fork);
	if (block !== undefined) {
		console.log(
			`${fork.charAt(0).toUpperCase() + fork.slice(1)}:`,
			block.toLocaleString(),
		);
	}
}

console.log("\n=== Latest Hardfork ===");
console.log("Current hardfork:", Chain.getLatestHardfork(eth));

console.log("\n=== Hardfork Support Check ===");
console.log(
	"Supports EIP-1559 (London):",
	Chain.supportsHardfork(eth, "london"),
);
console.log("Supports Merge (Paris):", Chain.supportsHardfork(eth, "paris"));
console.log("Supports Dencun (Cancun):", Chain.supportsHardfork(eth, "cancun"));
console.log("Supports Prague:", Chain.supportsHardfork(eth, "prague"));
