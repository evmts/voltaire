import { Chain } from "@tevm/voltaire";

// Example: Chain basics - configuration, properties, and utilities

// Create chain instances by ID
// biome-ignore lint/style/noNonNullAssertion: example code with known valid IDs
const eth = Chain.fromId(1)!; // Ethereum Mainnet
// biome-ignore lint/style/noNonNullAssertion: example code with known valid IDs
const test = Chain.fromId(11155111)!; // Sepolia
// biome-ignore lint/style/noNonNullAssertion: example code with known valid IDs
const l2 = Chain.fromId(10)!; // Optimism
// biome-ignore lint/style/noNonNullAssertion: example code with known valid IDs
const sidechain = Chain.fromId(137)!; // Polygon

// L2 parent chain
if (Chain.isL2(l2)) {
	const parent = Chain.getL1Chain(l2);
}
const mainnetRpc = Chain.getRpcUrl(eth);

const mainnetWs = Chain.getWebsocketUrl(eth);

const explorer = Chain.getExplorerUrl(eth);
const latestHardfork = Chain.getLatestHardfork(eth);

const londonBlock = Chain.getHardforkBlock(eth, "london");

const cancunBlock = Chain.getHardforkBlock(eth, "cancun");
// Access chain data by ID without creating instance
const chainData = Chain.byId[1];
