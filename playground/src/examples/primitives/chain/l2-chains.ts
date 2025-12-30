import { Chain } from "@tevm/voltaire";

// Example: Layer 2 and sidechain configurations

// biome-ignore lint/style/noNonNullAssertion: example code with known valid IDs
const opChain = Chain.fromId(10)!; // Optimism
// biome-ignore lint/style/noNonNullAssertion: example code with known valid IDs
const arbChain = Chain.fromId(42161)!; // Arbitrum One
// biome-ignore lint/style/noNonNullAssertion: example code with known valid IDs
const baseChain = Chain.fromId(8453)!; // Base
// biome-ignore lint/style/noNonNullAssertion: example code with known valid IDs
const polyChain = Chain.fromId(137)!; // Polygon

const opParent = Chain.getL1Chain(opChain);

const arbParent = Chain.getL1Chain(arbChain);

const baseParent = Chain.getL1Chain(baseChain);
const chains = [
	{ chain: opChain, name: "Optimism" },
	{ chain: arbChain, name: "Arbitrum" },
	{ chain: baseChain, name: "Base" },
	{ chain: polyChain, name: "Polygon" },
];
for (const { chain, name } of chains) {
}
for (const { chain, name } of chains) {
}
for (const { chain, name } of chains) {
	const isL2 = Chain.isL2(chain);
	const parent = isL2 ? Chain.getL1Chain(chain) : null;
	const parentName = parent ? Chain.getName(parent) : "none";
}
